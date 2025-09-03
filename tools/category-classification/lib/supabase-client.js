import { createClient } from '@supabase/supabase-js';

class SupabaseClient {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are required');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  // 未分類問題を取得
  async getUnclassifiedQuestions(options = {}) {
    const { year, season, limit = 100 } = options;
    
    let query = this.client
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, 
        exam_id,
        exams(year, season),
        choices(id, choice_label, choice_text)
      `)
      .is('category_id', null); // カテゴリ未設定の問題
    
    if (year || season) {
      const { data: examData } = await this.client
        .from('exams')
        .select('id')
        .eq('year', year)
        .eq('season', season);
      
      if (examData && examData.length > 0) {
        query = query.eq('exam_id', examData[0].id);
      }
    }
    
    query = query.limit(limit);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  }

  // 全カテゴリ階層を取得
  async getCategoryHierarchy() {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('exam_code', 'FE')
      .order('level')
      .order('field_name')
      .order('major_category')
      .order('medium_category')
      .order('minor_category')
      .order('knowledge_item');
    
    if (error) throw error;
    
    // 階層構造に整理
    const hierarchy = {};
    
    data.forEach(category => {
      const field = category.field_name;
      if (!hierarchy[field]) hierarchy[field] = {};
      
      const major = category.major_category;
      if (major && !hierarchy[field][major]) hierarchy[field][major] = {};
      
      const medium = category.medium_category;
      if (medium && major && !hierarchy[field][major][medium]) hierarchy[field][major][medium] = {};
      
      const minor = category.minor_category;
      if (minor && medium && !hierarchy[field][major][medium][minor]) hierarchy[field][major][medium][minor] = {};
      
      const knowledge = category.knowledge_item;
      if (knowledge && minor) {
        if (!hierarchy[field][major][medium][minor].knowledge) {
          hierarchy[field][major][medium][minor].knowledge = [];
        }
        hierarchy[field][major][medium][minor].knowledge.push({
          id: category.id,
          name: knowledge,
          description: category.description
        });
      }
    });
    
    return hierarchy;
  }

  // 新規ナレッジを作成
  async createKnowledge(proposal) {
    const { data, error } = await this.client
      .from('categories')
      .insert({
        exam_code: 'FE',
        level: 5,
        category_type: 'knowledge',
        field_name: proposal.field,
        major_category: proposal.major,
        medium_category: proposal.medium,
        minor_category: proposal.minor,
        knowledge_item: proposal.knowledge_name,
        name: proposal.knowledge_name,
        description: `LLM提案: ${proposal.reason}`
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // 問題にカテゴリを関連付け
  async assignCategoryToQuestion(questionId, categoryId, options = {}) {
    const { relevanceScore = 0.8, isPrimary = false } = options;
    
    const { data, error } = await this.client
      .from('question_categories')
      .insert({
        question_id: questionId,
        category_id: categoryId,
        relevance_score: relevanceScore,
        is_primary: isPrimary
      });
    
    if (error) throw error;
    return data;
  }

  // ナレッジが既に存在するかチェック
  async knowledgeExists(field, major, medium, minor, knowledgeName) {
    const { data, error } = await this.client
      .from('categories')
      .select('id')
      .eq('field_name', field)
      .eq('major_category', major)
      .eq('medium_category', medium)
      .eq('minor_category', minor)
      .eq('knowledge_item', knowledgeName)
      .single();
    
    return !error && data;
  }

  // カテゴリIDを取得
  async getCategoryId(field, major, medium, minor, knowledge) {
    const { data, error } = await this.client
      .from('categories')
      .select('id')
      .eq('field_name', field)
      .eq('major_category', major)
      .eq('medium_category', medium)
      .eq('minor_category', minor)
      .eq('knowledge_item', knowledge)
      .single();
    
    if (error) return null;
    return data?.id;
  }
}

export default SupabaseClient;