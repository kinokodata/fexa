/**
 * Vercel用CORSミドルウェア
 */
export const corsMiddleware = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://fexa.vercel.app',
    process.env.CORS_ORIGIN
  ].filter(Boolean);

  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // プリフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
};