// ローカル開発用サーバー（簡易版）
import express from 'express';
import cors from 'cors';
import { getSupabase } from '../lib/supabase.js';
import { corsMiddleware } from '../middleware/cors.js';
import logger from '../lib/logger.js';
import authRouter from './routes/auth.js';
import imagesRouter from './routes/images.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:43000',
  credentials: true
}));
app.use(express.json());

// リクエストログ
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Query: ${JSON.stringify(req.query)}`);
  next();
});

// 認証ルート
app.use('/api/auth', authRouter);

// 画像ルート
app.use('/api/images', imagesRouter);

// ヘルスチェック
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    if (req.query.detailed === 'true') {
      const supabase = getSupabase();
      const { error: dbError } = await supabase.from('exams').select('count').limit(1);
      health.database = { status: dbError ? 'unhealthy' : 'healthy' };
    }

    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 試験一覧
app.get('/api/exams', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('exams')
      .select('id, year, season, exam_date, created_at')
      .order('year', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 問題一覧
app.get('/api/questions', authenticateToken, async (req, res) => {
  try {
    logger.info(`問題一覧API呼び出し - year: ${req.query.year}, season: ${req.query.season}, limit: ${req.query.limit}`);
    const supabase = getSupabase();
    const { year, page = 1, limit = 20 } = req.query;
    
    // URLパラメータの英語を日本語に変換
    let season = req.query.season;
    if (season === 'spring') season = '春期';
    if (season === 'autumn') season = '秋期';

    let query = supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, created_at,
        exam_id,
        choices(id, choice_label, choice_text, has_image, is_table_format, table_headers, table_data),
        categories(id, name)
      `);

    // year, seasonで絞り込む場合は、まずexamのIDを取得
    if (year && season) {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id')
        .eq('year', year)
        .eq('season', season)
        .single();
      
      if (examError) throw new Error(`試験が見つかりません: ${examError.message}`);
      
      query = query.eq('exam_id', examData.id);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.order('question_number').range(offset, offset + parseInt(limit) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`クエリエラー: ${error.message}`);

    logger.info(`問題一覧取得完了 - 件数: ${data?.length || 0}`);
    
    res.json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: data.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 問題詳細
app.get('/api/questions/:id', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *, exam:exams(year, season, exam_date),
        choices(id, choice_label, choice_text, is_correct),
        answer:answers(correct_choice, explanation)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false, 
        error: { message: '問題が見つかりません' } 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`ローカルAPIサーバー起動 - http://localhost:${PORT}`);
});