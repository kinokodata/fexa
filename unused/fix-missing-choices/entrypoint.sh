#!/bin/sh

# 引数チェック
if [ $# -lt 2 ]; then
  echo "使用方法: docker compose run --rm fix-choices <年度> <季節> [問題番号]"
  echo "例: docker compose run --rm fix-choices 2009 秋期"
  echo "例: docker compose run --rm fix-choices 2009 秋期 48"
  echo "例: docker compose run --rm fix-choices 2009 秋期 48-50"
  exit 1
fi

# Node.jsスクリプトを実行
exec node fix-missing-choices-from-md.cjs "$@"