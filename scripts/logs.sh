#!/bin/bash

# Docker Compose ログ表示スクリプト

if [ $# -eq 0 ]; then
    echo "📋 Showing logs for all services..."
    docker compose logs -f
else
    SERVICE=$1
    echo "📋 Showing logs for ${SERVICE}..."
    docker compose logs -f "${SERVICE}"
fi