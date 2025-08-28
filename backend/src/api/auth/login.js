import jwt from 'jsonwebtoken';
import { getSupabase } from '../../../lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'メールアドレスとパスワードが必要です' }
    });
  }

  try {
    const supabase = getSupabase();
    
    // Supabaseで認証を試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'メールアドレスまたはパスワードが正しくありません' }
      });
    }

    // JWTトークンを生成
    const tokenPayload = {
      userId: data.user.id,
      email: data.user.email,
      role: 'admin'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(
      { userId: data.user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'ログイン処理中にエラーが発生しました' }
    });
  }
}