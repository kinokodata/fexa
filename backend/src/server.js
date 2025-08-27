// ローカル開発用サーバー（簡易版）
import express from 'express';
import cors from 'cors';
import { getSupabase } from '../lib/supabase.js';
import { corsMiddleware } from '../middleware/cors.js';
import logger from '../lib/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:43000',
  credentials: true
}));
app.use(express.json());

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
app.get('/api/exams', async (req, res) => {
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
app.get('/api/questions', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { year, season, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, created_at,
        exam:exams!inner(year, season),
        choices(id, choice_label, choice_text)
      `);

    if (year && season) {
      query = query.eq('exam.year', year).eq('exam.season', season);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.order('question_number').range(offset, offset + parseInt(limit) - 1);

    const { data, error } = await query;
    if (error) throw error;

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
app.get('/api/questions/:id', async (req, res) => {
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