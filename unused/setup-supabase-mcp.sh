#!/bin/bash

# Supabase MCP Server Setup Script
# このスクリプトは.env.localから環境変数を読み込んでClaude CodeにSupabase MCPサーバーを追加します

set -e  # エラーが発生したら終了

echo "🚀 Supabase MCP Server Setup Starting..."

# .env.localファイルの存在確認
if [ ! -f ".env.local" ]; then
    echo "❌ .env.localファイルが見つかりません"
    echo "プロジェクトルートに以下の内容で.env.localを作成してください："
    echo ""
    echo "SUPABASE_URL=https://your-project-id.supabase.co"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here"
    echo "PROJECT_NAME=fexa"
    exit 1
fi

echo "📄 .env.localファイルを読み込み中..."

# .env.localから環境変数を読み込み
source .env.local

# 必要な環境変数の確認
echo "🔍 環境変数の確認中..."
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URLが設定されていません"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEYが設定されていません"
    exit 1
fi

if [ -z "$PROJECT_NAME" ]; then
    echo "⚠️  PROJECT_NAMEが設定されていません。デフォルト値'current-project'を使用します"
    PROJECT_NAME="current-project"
fi

echo "✅ 環境変数確認完了:"
echo "   SUPABASE_URL: $SUPABASE_URL"
echo "   PROJECT_NAME: $PROJECT_NAME"
echo "   SUPABASE_SERVICE_ROLE_KEY: [設定済み]"

# MCPサーバーファイルの存在確認
MCP_SERVER_PATH="./mcp-servers/supabase/supabase-mcp-server.js"
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "❌ MCPサーバーファイルが見つかりません: $MCP_SERVER_PATH"
    echo "先にMCPサーバーファイルを作成してください"
    exit 1
fi

echo "✅ MCPサーバーファイル確認完了: $MCP_SERVER_PATH"

# 既存のsupabase MCPサーバーを削除（エラーを無視）
echo "🗑️  既存のsupabase MCPサーバーを削除中..."
claude mcp remove -s project supabase 2>/dev/null || echo "   (既存サーバーなし)"

# MCPサーバーをClaude Codeに追加
echo "➕ Supabase MCPサーバーをClaude Codeに追加中..."

claude mcp add-json -s project supabase '{
  "command": "node",
  "args": ["./mcp-servers/supabase/supabase-mcp-server.js"],
  "env": {
    "SUPABASE_URL": "'"$SUPABASE_URL"'",
    "SUPABASE_SERVICE_ROLE_KEY": "'"$SUPABASE_SERVICE_ROLE_KEY"'",
    "PROJECT_NAME": "'"$PROJECT_NAME"'"
  }
}'

if [ $? -eq 0 ]; then
    echo "✅ Supabase MCPサーバーの追加が完了しました！"
else
    echo "❌ MCPサーバーの追加に失敗しました"
    exit 1
fi

# 設定確認
echo ""
echo "📋 設定確認中..."
echo "=== MCPサーバー一覧 ==="
claude mcp list

echo ""
echo "=== Supabaseサーバー詳細 ==="
claude mcp get supabase

echo ""
echo "=== .mcp.jsonファイル内容 ==="
if [ -f ".mcp.json" ]; then
    cat .mcp.json
else
    echo "⚠️  .mcp.jsonファイルが作成されていません"
fi

echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "次の手順:"
echo "1. 'claude' コマンドでClaude Codeを起動"
echo "2. '/mcp' コマンドでMCPサーバーの状態を確認"
echo "3. 'Can you list all tables in the Supabase database?' などでテスト"
echo ""