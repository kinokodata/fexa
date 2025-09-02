#!/bin/bash

# 試験解答エクスポートスクリプト

set -e

if [ $# -ne 2 ]; then
    echo "Usage: $0 <year> <season>"
    echo "Example: $0 2019 春期"
    echo "Example: $0 2018 秋期"
    exit 1
fi

YEAR=$1
SEASON=$2

echo "📝 Exporting answers for ${YEAR} ${SEASON} exam..."

# export-answerツールを実行
docker compose run --rm export-answer node index.js "${YEAR}" "${SEASON}"

echo "✅ Export completed!"
echo "📁 Check: pdfs/${YEAR}_*/answers.json"