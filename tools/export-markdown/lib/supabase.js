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

  async retryOperation(operation, maxRetries = 1) {
    try {
      return await operation();
    } catch (error) {
      throw error;
    }
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

  async findExistingQuestion(examId, questionNumber, questionType = '午前') {
    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('questions')
        .select('id')
        .eq('exam_id', examId)
        .eq('question_number', questionNumber)
        .eq('question_type', questionType)
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

  async updateQuestion(questionId, questionData) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('questions')
        .update(questionData)
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        throw new Error(`問題の更新に失敗: ${error.message}`);
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

  async updateChoices(questionId, choicesData) {
    if (choicesData.length === 0) return [];

    return this.retryOperation(async () => {
      // 既存の選択肢を取得
      const { data: existingChoices, error: selectError } = await this.client
        .from('choices')
        .select('*')
        .eq('question_id', questionId)
        .order('choice_label');

      if (selectError) {
        throw new Error(`既存選択肢の取得に失敗: ${selectError.message}`);
      }

      // 各選択肢を更新
      const updatedChoices = [];
      for (let i = 0; i < choicesData.length && i < existingChoices.length; i++) {
        const { data, error } = await this.client
          .from('choices')
          .update(choicesData[i])
          .eq('id', existingChoices[i].id)
          .select()
          .single();

        if (error) {
          throw new Error(`選択肢の更新に失敗: ${error.message}`);
        }
        updatedChoices.push(data);
      }

      return updatedChoices;
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
        throw new Error(`問題画像の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async deleteQuestionImages(questionId) {
    return this.retryOperation(async () => {
      const { error } = await this.client
        .from('question_images')
        .delete()
        .eq('question_id', questionId);

      if (error) {
        throw new Error(`問題画像の削除に失敗: ${error.message}`);
      }

      return true;
    });
  }

  async insertChoiceImages(imageData) {
    if (imageData.length === 0) return [];

    return this.retryOperation(async () => {
      const { data, error } = await this.client
        .from('choice_images')
        .insert(imageData)
        .select();

      if (error) {
        throw new Error(`選択肢画像の保存に失敗: ${error.message}`);
      }

      return data;
    });
  }

  async deleteChoiceImagesByQuestionId(questionId) {
    return this.retryOperation(async () => {
      // まず question_id に関連する choice_id を取得
      const { data: choices, error: choicesError } = await this.client
        .from('choices')
        .select('id')
        .eq('question_id', questionId);

      if (choicesError) {
        throw new Error(`選択肢の取得に失敗: ${choicesError.message}`);
      }

      if (choices.length === 0) return true;

      const choiceIds = choices.map(choice => choice.id);

      // 選択肢画像を削除
      const { error } = await this.client
        .from('choice_images')
        .delete()
        .in('choice_id', choiceIds);

      if (error) {
        throw new Error(`選択肢画像の削除に失敗: ${error.message}`);
      }

      return true;
    });
  }

  async checkQuestionHasChoices(questionId) {
    return this.retryOperation(async () => {
      const { data, error, count } = await this.client
        .from('choices')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', questionId);

      if (error) {
        throw new Error(`選択肢の確認に失敗: ${error.message}`);
      }

      // 通常4つの選択肢があるはずなので、4つあれば完全とみなす
      return count >= 4;
    });
  }

  async deleteQuestion(questionId) {
    return this.retryOperation(async () => {
      const { error } = await this.client
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        throw new Error(`問題の削除に失敗: ${error.message}`);
      }

      logger.info(`問題ID ${questionId} を削除しました`);
      return true;
    });
  }

}

export default SupabaseClient;