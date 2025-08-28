// JWT設定の統一管理
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'fexa-default-secret-key-2024',
  REFRESH_SECRET: process.env.REFRESH_TOKEN_SECRET || 'fexa-refresh-secret-key-2024',
  EXPIRES_IN: '1h',
  REFRESH_EXPIRES_IN: '7d'
};

export default JWT_CONFIG;