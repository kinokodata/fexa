import cors from 'cors';

export const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:43000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});