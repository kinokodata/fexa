import { createClient } from '@supabase/supabase-js';
import Logger from './logger.js';

const logger = new Logger();

class SupabaseClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (!process.env.SUPABASE_URL) {
        throw new Error('SUPABASE_URL environment variable is required');
      }
      if (!process.env.SUPABASE_SERVICE_KEY) {
        throw new Error('SUPABASE_SERVICE_KEY environment variable is required');
      }

      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data, error } = await this.client.from('exams').select('count').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.isConnected = true;
      logger.success('Supabase接続成功');
      return this.client;
    } catch (error) {
      logger.error('Supabase接続失敗:', error.message);
      throw error;
    }
  }

  async retryOperation(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`操作失敗 (${attempt}/${maxRetries}), ${delay}ms後にリトライ...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async upsertExam(year, season) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('exams')
        .upsert({ year, season }, { onConflict: 'year,season' })
        .select()
        .single();

      if (error) {
        throw new Error(`試験情報の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async findExistingQuestion(examId, questionNumber) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('questions')
        .select('id')
        .eq('exam_id', examId)
        .eq('question_number', questionNumber)
        .maybeSingle();

      if (error) {
        throw new Error(`既存問題の検索に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async insertQuestion(questionData) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('questions')
        .insert(questionData)
        .select()
        .single();

      if (error) {
        throw new Error(`問題の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async insertChoices(choicesData) {
    if (choicesData.length === 0) return [];

    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('choices')
        .insert(choicesData)
        .select();

      if (error) {
        throw new Error(`選択肢の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async insertQuestionImages(imageData) {
    if (imageData.length === 0) return [];

    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('question_images')
        .insert(imageData)
        .select();

      if (error) {
        throw new Error(`画像情報の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async insertImportHistory(historyData) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('import_history')
        .insert(historyData)
        .select()
        .single();

      if (error) {
        throw new Error(`インポート履歴の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }
}

export default SupabaseClient;