import express from 'express';
import loginHandler from '../api/auth/login.js';
import refreshHandler from '../api/auth/refresh.js';

const router = express.Router();

// ログインエンドポイント
router.post('/login', loginHandler);

// トークンリフレッシュエンドポイント
router.post('/refresh', refreshHandler);

export default router;