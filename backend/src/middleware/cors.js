import cors from 'cors';

const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN || 'http://localhost:43000';
  return origins.split(',').map(origin => origin.trim());
};

export const corsMiddleware = cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});