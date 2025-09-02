#!/bin/bash

# Docker環境クリーンアップスクリプト

set -e

echo "🧹 Cleaning up Docker environment..."

# コンテナを停止
echo "⏹️  Stopping containers..."
docker compose down

# 未使用のイメージとボリュームをクリーンアップ
echo "🗑️  Cleaning unused Docker resources..."
docker system prune -f

# orphanコンテナの削除
echo "🔍 Removing orphan containers..."
docker compose down --remove-orphans

echo "✅ Cleanup completed!"