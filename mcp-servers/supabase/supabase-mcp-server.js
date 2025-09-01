#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// 環境変数の取得
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectName = process.env.PROJECT_NAME || 'current-project';

if (!supabaseUrl || !supabaseKey) {
  console.error(`[${projectName}] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required`);
  process.exit(1);
}

console.error(`[${projectName}] Starting Supabase MCP Server...`);

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: `supabase-${projectName}`,
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// ツールの定義
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: "query_table",
        description: `Query data from ${projectName} Supabase tables`,
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            select: { type: "string", description: "Columns to select (default: *)" },
            filter: { type: "object", description: "Filter conditions" },
            limit: { type: "number", description: "Limit results (default: 10)", default: 10 }
          },
          required: ["table"]
        }
      },
      {
        name: "list_tables",
        description: `List all tables in ${projectName} database`,
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "insert_data",
        description: `Insert data into ${projectName} Supabase table`,
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            data: { 
              type: "object", 
              description: "Data to insert (single object or array of objects)" 
            }
          },
          required: ["table", "data"]
        }
      },
      {
        name: "update_data",
        description: `Update data in ${projectName} Supabase table`,
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            filter: { type: "object", description: "Filter conditions for update" },
            data: { type: "object", description: "Data to update" }
          },
          required: ["table", "filter", "data"]
        }
      },
      {
        name: "delete_data",
        description: `Delete data from ${projectName} Supabase table`,
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            filter: { type: "object", description: "Filter conditions for deletion" }
          },
          required: ["table", "filter"]
        }
      },
      {
        name: "get_table_schema",
        description: `Get schema information for a specific table`,
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" }
          },
          required: ["table"]
        }
      }
    ]
  };
});

// ツールの実行
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[${projectName}] Executing tool: ${name}`);

  try {
    switch (name) {
      case "query_table":
        let query = supabase.from(args.table).select(args.select || '*');
        
        if (args.filter) {
          Object.entries(args.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        const limit = args.limit || 10;
        query = query.limit(limit);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return {
          content: [{
            type: "text",
            text: `Found ${data.length} records in ${args.table}:\n${JSON.stringify(data, null, 2)}`
          }]
        };

      case "list_tables":
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name, table_type')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        if (tablesError) throw tablesError;
        
        return {
          content: [{
            type: "text",
            text: `Available tables in ${projectName}:\n${tables.map(t => `- ${t.table_name}`).join('\n')}`
          }]
        };

      case "insert_data":
        const { data: insertData, error: insertError } = await supabase
          .from(args.table)
          .insert(args.data)
          .select();
        
        if (insertError) throw insertError;
        
        return {
          content: [{
            type: "text",
            text: `Successfully inserted into ${args.table}:\n${JSON.stringify(insertData, null, 2)}`
          }]
        };

      case "update_data":
        let updateQuery = supabase.from(args.table).update(args.data);
        
        Object.entries(args.filter).forEach(([key, value]) => {
          updateQuery = updateQuery.eq(key, value);
        });
        
        const { data: updateData, error: updateError } = await updateQuery.select();
        if (updateError) throw updateError;
        
        return {
          content: [{
            type: "text",
            text: `Successfully updated ${updateData.length} records in ${args.table}:\n${JSON.stringify(updateData, null, 2)}`
          }]
        };

      case "delete_data":
        let deleteQuery = supabase.from(args.table);
        
        Object.entries(args.filter).forEach(([key, value]) => {
          deleteQuery = deleteQuery.eq(key, value);
        });
        
        const { data: deleteData, error: deleteError } = await deleteQuery.delete().select();
        if (deleteError) throw deleteError;
        
        return {
          content: [{
            type: "text",
            text: `Successfully deleted ${deleteData.length} records from ${args.table}:\n${JSON.stringify(deleteData, null, 2)}`
          }]
        };

      case "get_table_schema":
        const { data: columns, error: schemaError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', args.table);
        
        if (schemaError) throw schemaError;
        
        return {
          content: [{
            type: "text",
            text: `Schema for table ${args.table}:\n${JSON.stringify(columns, null, 2)}`
          }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`[${projectName}] Error in ${name}:`, error.message);
    return {
      content: [{
        type: "text",
        text: `Error in ${name}: ${error.message}`
      }],
      isError: true
    };
  }
});

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