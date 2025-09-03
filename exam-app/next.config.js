/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // App Routerを使用
  },
  env: {
    // 本番環境でのAPI URLを設定
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  // Supabase画像URL許可
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig