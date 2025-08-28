import jwt from 'jsonwebtoken';
import logger from '../../lib/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  logger.info('Debug - Auth header:', authHeader ? 'exists' : 'missing');
  logger.info('Debug - Token:', token ? 'exists' : 'missing');

  if (!token) {
    logger.warn('認証失敗: トークンがありません');
    return res.status(401).json({
      success: false,
      error: { message: '認証トークンが必要です' }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info('認証成功:', { userId: decoded.userId, email: decoded.email });
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('トークン検証エラー:', error);
    return res.status(401).json({
      success: false,
      error: { message: '無効なトークンです' }
    });
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // トークンが無効でも処理を続行
      logger.warn('オプション認証でトークン検証に失敗:', error);
    }
  }
  
  next();
};