#!/bin/bash

# Fexa 開発環境起動スクリプト

set -e

echo "🚀 Starting Fexa development environment..."

# Docker Composeで開発環境を起動
echo "📦 Starting containers..."
docker compose up -d

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Frontend: http://localhost:43000"
echo "🔧 Backend:  http://localhost:43001"
echo ""
echo "📝 Useful commands:"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down             # Stop containers"
echo "  docker compose exec backend sh  # Access backend container"
echo "  docker compose exec frontend sh # Access frontend container"
echo ""