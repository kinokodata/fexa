import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import logger from '../lib/logger.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(error('メールアドレスとパスワードが必要です'));
    }

    // 簡易認証（開発用）
    if (email && password) {
      const user = {
        userId: 'cec212cd-b9b2-4daa-88bc-3279bceb4a42',
        email: email,
        role: 'admin'
      };

      // JWTトークンを生成
      const token = jwt.sign(
        { 
          userId: user.userId, 
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.userId },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      res.json(success({
        token,
        refreshToken
      }));
    } else {
      res.status(401).json(error('メールアドレスまたはパスワードが正しくありません'));
    }

  } catch (err) {
    logger.error('ログインエラー:', err);
    res.status(500).json(error('ログイン処理中にエラーが発生しました'));
  }
});

// トークンリフレッシュ
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json(error('リフレッシュトークンが必要です'));
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: 'user@example.com',
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json(success({
      token: newToken
    }));

  } catch (err) {
    logger.error('トークンリフレッシュエラー:', err);
    res.status(401).json(error('無効なリフレッシュトークンです'));
  }
});

// ログアウト
router.post('/logout', (req, res) => {
  res.json(success({ message: 'ログアウトしました' }));
});

export default router;