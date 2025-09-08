export function buildClassificationPrompt(question, categoryHierarchy) {
  const choices = question.choices
    .map(c => `${c.choice_label}. ${c.choice_text || '（表形式選択肢）'}`)
    .join('\n');

  return `# 基本情報技術者試験問題のカテゴリ分類

あなたは基本情報技術者試験の専門家です。問題を分析し、適切なカテゴリに分類してください。

## カテゴリ階層構造
${JSON.stringify(categoryHierarchy, null, 2)}

## 分類ルール
1. 最大3つのナレッジまで付与可能
2. 主要カテゴリは1つ（is_primary: true）
3. 関連度スコア（0.1-1.0）を適切に設定
4. 該当ナレッジがない場合は新規提案

## 分類対象問題
**年度・季節**: ${question.exams?.year}年${question.exams?.season}
**問題番号**: 問${question.question_number}
**問題種別**: ${question.question_type}

**問題文**:
${question.question_text}

**選択肢**:
${choices}

## 出力形式（JSON）
有効なJSONのみを出力してください。説明文は含めないでください。

\`\`\`json
{
  "categories": [
    {
      "field": "テクノロジ系",
      "major": "基礎理論", 
      "medium": "基礎理論",
      "minor": "離散数学",
      "knowledge": "集合・論理演算",
      "relevance_score": 0.9,
      "is_primary": true,
      "reasoning": "この問題は集合の演算について扱っているため"
    }
  ],
  "new_knowledge_proposals": [
    {
      "field": "テクノロジ系",
      "major": "基礎理論",
      "medium": "基礎理論", 
      "minor": "離散数学",
      "knowledge_name": "ベン図",
      "reason": "集合の関係をベン図で表現する問題が頻出するため",
      "confidence": 0.8
    }
  ],
  "overall_confidence": 0.9,
  "notes": "追加コメント（あれば）"
}
\`\`\``;
}

export const FEW_SHOT_EXAMPLES = [
  {
    question_text: "IPv4アドレスのクラスAの特徴として正しいものはどれか。",
    expected_classification: {
      categories: [{
        field: "テクノロジ系",
        major: "技術要素",
        medium: "ネットワーク",
        minor: "ネットワーク方式",
        knowledge: "インターネットプロトコル",
        relevance_score: 0.95,
        is_primary: true
      }]
    }
  }
];