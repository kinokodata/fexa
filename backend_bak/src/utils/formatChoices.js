/**
 * 選択肢データを表示用にフォーマット
 */
export function formatChoices(choices) {
  if (!choices || !Array.isArray(choices)) {
    return [];
  }

  return choices.map(choice => {
    // 表形式の場合、表示用のデータを構築
    if (choice.is_table_format && choice.table_headers && choice.table_data) {
      try {
        const headers = JSON.parse(choice.table_headers);
        const data = JSON.parse(choice.table_data);
        
        return {
          ...choice,
          table_headers: headers,
          table_data: data,
          display_type: 'table'
        };
      } catch (e) {
        // JSONパースエラーの場合は通常のテキストとして扱う
        return {
          ...choice,
          display_type: 'text'
        };
      }
    }
    
    // 画像選択肢の場合
    if (choice.has_image) {
      return {
        ...choice,
        display_type: 'image'
      };
    }
    
    // 通常のテキスト選択肢
    return {
      ...choice,
      display_type: 'text'
    };
  });
}

/**
 * 表形式選択肢をMarkdownテーブルとして出力
 */
export function choicesToMarkdownTable(choices) {
  const tableChoices = choices.filter(c => c.is_table_format);
  
  if (tableChoices.length === 0) {
    return null;
  }
  
  // 最初の選択肢からヘッダーを取得
  const firstChoice = tableChoices[0];
  const headers = firstChoice.table_headers || JSON.parse(firstChoice.table_headers);
  
  // Markdownテーブルを構築
  let markdown = '| ' + headers.join(' | ') + ' |\n';
  markdown += '|' + headers.map(() => '---').join('|') + '|\n';
  
  // 各選択肢の行を追加
  tableChoices.forEach(choice => {
    const data = choice.table_data || JSON.parse(choice.table_data);
    markdown += '| ' + data.join(' | ') + ' |\n';
  });
  
  return markdown;
}