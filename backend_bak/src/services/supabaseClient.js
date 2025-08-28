import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

let supabaseClient = null;

/**
 * Supabaseクライアントの初期化
 */
export const initSupabase = async () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase接続情報が設定されていません。環境変数を確認してください。');
  }

  try {
    // Service Roleキーを使用（管理者権限）
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 接続テスト
    const { data, error } = await supabaseClient
      .from('exams')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // テーブルが空の場合のエラーは無視
      logger.warn('Supabase接続テストで警告:', error.message);
    } else {
      logger.info('Supabaseへの接続に成功しました');
    }

    return supabaseClient;
  } catch (error) {
    logger.error('Supabaseクライアントの初期化に失敗:', error);
    throw error;
  }
};

/**
 * Supabaseクライアントの取得
 */
export const getSupabase = () => {
  if (!supabaseClient) {
    throw new Error('Supabaseクライアントが初期化されていません');
  }
  return supabaseClient;
};

/**
 * ストレージバケットの初期化
 */
export const initStorageBucket = async () => {
  const supabase = getSupabase();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-pdfs';

  try {
    // バケットの存在確認
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      logger.error('バケット一覧取得エラー:', listError);
      return;
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      // バケットの作成
      const { data, error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });

      if (error) {
        logger.error('バケット作成エラー:', error);
      } else {
        logger.info(`ストレージバケット '${bucketName}' を作成しました`);
      }
    } else {
      logger.info(`ストレージバケット '${bucketName}' は既に存在します`);
    }
  } catch (error) {
    logger.error('ストレージバケット初期化エラー:', error);
  }
};

/**
 * ファイルをSupabase Storageにアップロード
 */
export const uploadFile = async (file, path) => {
  const supabase = getSupabase();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-pdfs';

  try {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(path, file, {
        contentType: file.mimetype || 'application/pdf',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // 公開URLの取得
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    logger.error('ファイルアップロードエラー:', error);
    throw error;
  }
};

export default getSupabase;