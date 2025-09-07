#!/usr/bin/env node

// dotenvで.env.localを読み込み
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env.local');
console.error(`[DEBUG] Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

import { createClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// 環境変数の取得
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectName = process.env.PROJECT_NAME || 'current-project';

// デバッグ情報
console.error(`[DEBUG] SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Not set'}`);
console.error(`[DEBUG] SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Set' : 'Not set'}`);
console.error(`[DEBUG] PROJECT_NAME: ${projectName}`);

if (!supabaseUrl || !supabaseKey) {
  console.error(`[${projectName}] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required`);
  process.exit(1);
}

console.error(`[${projectName}] Starting Supabase MCP Server...`);

const supabase = createClient(supabaseUrl, supabaseKey);

// MCPサーバーを作成
const server = new McpServer({
  name: `supabase-${projectName}`,
  version: "1.0.0"
});

// テーブル検索ツール
server.registerTool(
    "query_table",
    {
      title: "Query Table",
      description: `Query data from ${projectName} Supabase tables`,
      inputSchema: z.object({
        table: z.string().describe("Table name"),
        select: z.string().optional().describe("Columns to select (default: *)"),
        filter: z.record(z.any()).optional().describe("Filter conditions"),
        limit: z.number().optional().default(10).describe("Limit results")
      })
    },
    async ({ table, select, filter, limit }) => {
      console.error(`[${projectName}] Executing query_table: ${table}`);

      try {
        let query = supabase.from(table).select(select || '*');

        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              // 複雑なフィルター処理
              if ('eq' in value) query = query.eq(key, value.eq);
              if ('neq' in value) query = query.neq(key, value.neq);
              if ('gt' in value) query = query.gt(key, value.gt);
              if ('gte' in value) query = query.gte(key, value.gte);
              if ('lt' in value) query = query.lt(key, value.lt);
              if ('lte' in value) query = query.lte(key, value.lte);
              if ('like' in value) query = query.like(key, value.like);
              if ('ilike' in value) query = query.ilike(key, value.ilike);
              if ('in' in value) query = query.in(key, value.in);
              if ('not' in value) query = query.not(key, value.not);
              if ('is' in value) query = query.is(key, value.is);
            } else {
              // 単純なequal比較
              query = query.eq(key, value);
            }
          });
        }

        query = query.limit(limit || 10);

        const { data, error } = await query;
        if (error) throw error;

        return {
          content: [{
            type: "text",
            text: `Found ${data.length} records in ${table}:\n${JSON.stringify(data, null, 2)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in query_table:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error querying ${table}: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// テーブル一覧ツール
server.registerTool(
    "list_tables",
    {
      title: "List Tables",
      description: `List all tables in ${projectName} database`,
      inputSchema: z.object({})
    },
    async () => {
      console.error(`[${projectName}] Executing list_tables`);

      // Supabaseではよく知られているテーブル名のリストを提供
      // または実際のテーブルに対してクエリを試行して存在を確認
      const commonTables = ['exams', 'questions', 'choices', 'categories', 'answers'];
      const existingTables = [];

      try {
        for (const table of commonTables) {
          try {
            // 各テーブルに対して簡単なクエリを実行して存在確認
            await supabase.from(table).select('*').limit(0);
            existingTables.push(table);
          } catch (error) {
            // テーブルが存在しない場合はスキップ
            console.error(`[${projectName}] Table ${table} not accessible:`, error.message);
          }
        }

        return {
          content: [{
            type: "text",
            text: `Available tables in ${projectName}:\n${existingTables.map(t => `- ${t}`).join('\n')}\n\nNote: This list shows confirmed accessible tables.`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in list_tables:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error listing tables: ${error.message}\n\nKnown tables: ${commonTables.join(', ')}`
          }],
          isError: true
        };
      }
    }
);

// データ挿入ツール
server.registerTool(
    "insert_data",
    {
      title: "Insert Data",
      description: `Insert data into ${projectName} Supabase table`,
      inputSchema: z.object({
        table: z.string().describe("Table name"),
        data: z.record(z.any()).describe("Data to insert")
      })
    },
    async ({ table, data }) => {
      console.error(`[${projectName}] Executing insert_data: ${table}`);

      try {
        const { data: insertData, error } = await supabase
            .from(table)
            .insert(data)
            .select();

        if (error) throw error;

        return {
          content: [{
            type: "text",
            text: `Successfully inserted into ${table}:\n${JSON.stringify(insertData, null, 2)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in insert_data:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error inserting into ${table}: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// データ更新ツール
server.registerTool(
    "update_data",
    {
      title: "Update Data",
      description: `Update data in ${projectName} Supabase table`,
      inputSchema: z.object({
        table: z.string().describe("Table name"),
        data: z.record(z.any()).describe("Data to update"),
        filter: z.record(z.any()).describe("Filter conditions for which records to update")
      })
    },
    async ({ table, data, filter }) => {
      console.error(`[${projectName}] Executing update_data: ${table}`);

      try {
        let query = supabase.from(table).update(data);

        // フィルター適用
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              if ('eq' in value) query = query.eq(key, value.eq);
              if ('neq' in value) query = query.neq(key, value.neq);
              if ('gt' in value) query = query.gt(key, value.gt);
              if ('gte' in value) query = query.gte(key, value.gte);
              if ('lt' in value) query = query.lt(key, value.lt);
              if ('lte' in value) query = query.lte(key, value.lte);
              if ('in' in value) query = query.in(key, value.in);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        const { data: updateData, error } = await query.select();

        if (error) throw error;

        return {
          content: [{
            type: "text",
            text: `Successfully updated ${updateData.length} records in ${table}:\n${JSON.stringify(updateData, null, 2)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in update_data:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error updating ${table}: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// データ削除ツール
server.registerTool(
    "delete_data",
    {
      title: "Delete Data",
      description: `Delete data from ${projectName} Supabase table`,
      inputSchema: z.object({
        table: z.string().describe("Table name"),
        filter: z.record(z.any()).describe("Filter conditions for which records to delete")
      })
    },
    async ({ table, filter }) => {
      console.error(`[${projectName}] Executing delete_data: ${table}`);

      try {
        let query = supabase.from(table).delete();

        // フィルター適用
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              if ('eq' in value) query = query.eq(key, value.eq);
              if ('neq' in value) query = query.neq(key, value.neq);
              if ('gt' in value) query = query.gt(key, value.gt);
              if ('gte' in value) query = query.gte(key, value.gte);
              if ('lt' in value) query = query.lt(key, value.lt);
              if ('lte' in value) query = query.lte(key, value.lte);
              if ('in' in value) query = query.in(key, value.in);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        const { data: deleteData, error } = await query.select();

        if (error) throw error;

        return {
          content: [{
            type: "text",
            text: `Successfully deleted ${deleteData.length} records from ${table}:\n${JSON.stringify(deleteData, null, 2)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in delete_data:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error deleting from ${table}: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// バルクデータ操作ツール
server.registerTool(
    "bulk_update",
    {
      title: "Bulk Update Data",
      description: `Bulk update multiple records with different conditions`,
      inputSchema: z.object({
        table: z.string().describe("Table name"),
        updates: z.array(z.object({
          data: z.record(z.any()).describe("Data to update"),
          filter: z.record(z.any()).describe("Filter conditions")
        })).describe("Array of update operations")
      })
    },
    async ({ table, updates }) => {
      console.error(`[${projectName}] Executing bulk_update: ${table}`);

      try {
        const results = [];
        for (const update of updates) {
          let query = supabase.from(table).update(update.data);
          
          // フィルター適用
          if (update.filter) {
            Object.entries(update.filter).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                if ('eq' in value) query = query.eq(key, value.eq);
                if ('in' in value) query = query.in(key, value.in);
              } else {
                query = query.eq(key, value);
              }
            });
          }

          const { data, error } = await query.select();
          if (error) throw error;
          results.push(...data);
        }

        return {
          content: [{
            type: "text",
            text: `Successfully bulk updated ${results.length} records in ${table}:\n${JSON.stringify(results, null, 2)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in bulk_update:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error bulk updating ${table}: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// テーブルスキーマ取得ツール
server.registerTool(
    "get_table_schema",
    {
      title: "Get Table Schema",
      description: `Get schema information for a specific table`,
      inputSchema: z.object({
        table: z.string().describe("Table name")
      })
    },
    async ({ table }) => {
      console.error(`[${projectName}] Executing get_table_schema: ${table}`);

      try {
        const { data: columns, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_schema', 'public')
            .eq('table_name', table);

        if (error) throw error;

        return {
          content: [{
            type: "text",
            text: `Schema for table ${table}:\n${JSON.stringify(columns, null, 2)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in get_table_schema:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error getting schema for ${table}: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// タグとカテゴリを紐付けるツール
server.registerTool(
    "link_tags_to_category",
    {
      title: "Link Tags to Category",
      description: `Link multiple tags to a specific category`,
      inputSchema: z.object({
        category_id: z.string().describe("Category ID to link tags to"),
        tag_names: z.array(z.string()).describe("Array of tag names to link")
      })
    },
    async ({ category_id, tag_names }) => {
      console.error(`[${projectName}] Executing link_tags_to_category`);

      try {
        // タグ名からタグIDを取得
        const { data: tags, error: tagError } = await supabase
            .from('tags')
            .select('id, name')
            .in('name', tag_names);

        if (tagError) throw tagError;

        // category_idを更新
        const { data: updatedTags, error: updateError } = await supabase
            .from('tags')
            .update({ category_id })
            .in('id', tags.map(t => t.id))
            .select();

        if (updateError) throw updateError;

        return {
          content: [{
            type: "text",
            text: `Successfully linked ${updatedTags.length} tags to category ${category_id}:\n${updatedTags.map(t => t.name).join(', ')}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in link_tags_to_category:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error linking tags to category: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// カテゴリに基づくタグの自動紐付けツール
server.registerTool(
    "auto_link_tags_by_keywords",
    {
      title: "Auto Link Tags by Keywords",
      description: `Automatically link tags to categories based on keyword matching`,
      inputSchema: z.object({
        category_name: z.string().describe("Category name to match tags"),
        category_id: z.string().describe("Category ID to link matching tags"),
        keywords: z.array(z.string()).optional().describe("Additional keywords for matching")
      })
    },
    async ({ category_name, category_id, keywords = [] }) => {
      console.error(`[${projectName}] Executing auto_link_tags_by_keywords`);

      try {
        // カテゴリ名と追加キーワードを組み合わせて検索
        const searchTerms = [category_name, ...keywords];
        
        // タグを検索
        let matchedTags = [];
        for (const term of searchTerms) {
          const { data: tags, error } = await supabase
              .from('tags')
              .select('id, name, display_name')
              .or(`name.ilike.%${term}%,display_name.ilike.%${term}%`)
              .is('category_id', null); // まだカテゴリが設定されていないタグのみ
          
          if (error) throw error;
          if (tags) matchedTags.push(...tags);
        }

        // 重複を除去
        const uniqueTags = Array.from(new Map(matchedTags.map(t => [t.id, t])).values());

        if (uniqueTags.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No unlinked tags found matching "${category_name}" or keywords: ${keywords.join(', ')}`
            }]
          };
        }

        // タグを更新
        const { data: updatedTags, error: updateError } = await supabase
            .from('tags')
            .update({ category_id })
            .in('id', uniqueTags.map(t => t.id))
            .select();

        if (updateError) throw updateError;

        return {
          content: [{
            type: "text",
            text: `Successfully linked ${updatedTags.length} tags to category "${category_name}":\n${updatedTags.map(t => t.name).join(', ')}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in auto_link_tags_by_keywords:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error auto-linking tags: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// カテゴリ統計情報取得ツール
server.registerTool(
    "get_category_stats",
    {
      title: "Get Category Statistics",
      description: `Get statistics about categories, tags, and questions`,
      inputSchema: z.object({})
    },
    async () => {
      console.error(`[${projectName}] Executing get_category_stats`);

      try {
        // カテゴリごとのタグ数
        const { data: tagStats, error: tagError } = await supabase
            .from('tags')
            .select('category_id')
            .not('category_id', 'is', null);

        if (tagError) throw tagError;

        // category_idごとにグループ化
        const tagCounts = {};
        tagStats.forEach(t => {
          tagCounts[t.category_id] = (tagCounts[t.category_id] || 0) + 1;
        });

        // カテゴリごとの問題数（タグ経由）
        const { data: questionStats, error: qError } = await supabase
            .from('question_tags')
            .select('tag_id, tags!inner(category_id)');

        if (qError) throw qError;

        // category_idごとに問題数をカウント
        const questionCounts = {};
        const uniqueQuestions = new Set();
        questionStats.forEach(qt => {
          if (qt.tags?.category_id) {
            if (!questionCounts[qt.tags.category_id]) {
              questionCounts[qt.tags.category_id] = new Set();
            }
            questionCounts[qt.tags.category_id].add(qt.question_id);
          }
        });

        // SetをカウントにArray
        Object.keys(questionCounts).forEach(categoryId => {
          questionCounts[categoryId] = questionCounts[categoryId].size;
        });

        // カテゴリ情報と統計を結合
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, name, level');

        if (catError) throw catError;

        const stats = categories.map(cat => ({
          category: cat.name,
          level: cat.level,
          tag_count: tagCounts[cat.id] || 0,
          question_count: questionCounts[cat.id] || 0
        }));

        return {
          content: [{
            type: "text",
            text: `Category Statistics:\n${JSON.stringify(stats, null, 2)}\n\nTotal tags with categories: ${Object.values(tagCounts).reduce((a, b) => a + b, 0)}`
          }]
        };
      } catch (error) {
        console.error(`[${projectName}] Error in get_category_stats:`, error.message);
        return {
          content: [{
            type: "text",
            text: `Error getting category stats: ${error.message}`
          }],
          isError: true
        };
      }
    }
);

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${projectName}] Supabase MCP Server running on stdio`);
}

main().catch((error) => {
  console.error(`[${projectName}] Server error:`, error);
  process.exit(1);
});