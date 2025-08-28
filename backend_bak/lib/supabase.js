import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';

let supabaseClient = null;

/**
 * Supabaseクライアントの取得（Vercel環境用）
 */
export const getSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase接続情報が設定されていません');
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('Supabaseクライアントを初期化しました');
  }

  return supabaseClient;
};

/**
 * 問題内の画像をSupabase Storageにアップロード
 */
export const uploadQuestionImage = async (imageBuffer, fileName, contentType = 'image/png') => {
  const supabase = getSupabase();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-images';

  try {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      throw error;
    }

    // 公開URLの取得
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    logger.error('画像アップロードエラー:', error);
    throw error;
  }
};

export default getSupabase;