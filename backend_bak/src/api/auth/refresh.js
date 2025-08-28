import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: { message: 'リフレッシュトークンが必要です' }
    });
  }

  try {
    // リフレッシュトークンを検証
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // 新しいアクセストークンを生成
    const tokenPayload = {
      userId: decoded.userId,
      role: 'admin'
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: { message: 'リフレッシュトークンが無効です' }
    });
  }
}