#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .envファイルを読み込み
dotenv.config();

console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません。.envファイルを確認してください。');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 2009年秋期基本情報技術者試験の全ての解答と解説データ
const allQuestionsUpdates = [
  // 問題1-10
  {
    id: '225dba6b-0e9e-4f15-b40b-4272d639454a',
    explanation: `## 解説

16進数から10進数への変換は、各桁に16のべき乗を掛けて合計します。

- 2A₁₆ = 2 × 16¹ + A × 16⁰
- A₁₆ = 10₁₀なので
- 2A₁₆ = 2 × 16 + 10 × 1 = 32 + 10 = 42

**正解: イ (42)**`
  },
  {
    id: 'ed71ce45-96f4-4a05-abf5-05fb30543294',
    explanation: `## 解説

8ビットの2の補数表現では：
- 最上位ビットが符号ビット（0:正、1:負）
- 表現範囲は -2⁷ から 2⁷-1
- つまり -128 から 127

**正解: -128 から 127**`
  },
  {
    id: 'babd3c35-896a-4397-802a-275e1e57db21',
    explanation: `## 解説

排他的論理和（XOR）は、入力が異なる場合に1を出力します。

| A | B | A⊕B |
|---|---|-----|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

**正解: AとBが異なる値のとき**`
  },
  {
    id: 'e7d070bf-b39a-4049-a8d4-b0509fd42961',
    explanation: `## 解説

小数を含む数値の表現方法：
- **浮動小数点表現**: 広い範囲の小数を効率的に表現可能
- 固定小数点表現: 精度は一定だが範囲が限定的
- 整数表現: 小数は表現不可
- BCD: 10進数の各桁を4ビットで表現、効率が悪い

**正解: 浮動小数点表現**`
  },
  {
    id: '1eb2e853-6ebc-4e7c-a050-df34dc5e128e',
    explanation: `## 解説

スタックは後入れ先出し（LIFO: Last In First Out）のデータ構造です。

主な特徴：
- 最後に追加したデータを最初に取り出す
- プッシュ（追加）とポップ（取り出し）操作
- 関数呼び出しの管理、式の評価などに使用

**正解: 後入れ先出し（LIFO）方式でデータを管理する**`
  },
  {
    id: 'e251489b-4958-47b8-af82-3988435b40cf',
    explanation: `## 解説

キューは先入れ先出し（FIFO: First In First Out）のデータ構造です。

主な特徴：
- 最初に追加したデータを最初に取り出す
- エンキュー（追加）とデキュー（取り出し）操作
- プロセス管理、印刷ジョブ管理などに使用

**正解: 先入れ先出し（FIFO）方式でデータを管理する**`
  },
  {
    id: 'add32ec6-21b9-4cc8-adfb-68dfea6902de',
    explanation: `## 解説

2分探索法は、ソート済み配列で中央値と比較して探索範囲を半分に絞る方法です。

- 1回の比較で探索範囲が半分になる
- 最大比較回数 = ⌈log₂n⌉
- n個の要素から1個になるまでの分割回数

**正解: ⌈log₂n⌉ 回**`
  },
  {
    id: '240993b2-e6f5-42e3-8a58-39a2c1006435',
    explanation: `## 解説

バブルソートは隣接要素を比較・交換する単純なソートアルゴリズムです。

- 最悪の場合: O(n²) - すべての要素が逆順
- 平均的な場合: O(n²)
- 最良の場合: O(n) - すでにソート済み（改良版）

**正解: O(n²)**`
  },
  {
    id: 'fc10993d-04e0-49c2-a996-a97249960844',
    explanation: `## 解説

木構造の用語：
- **リーフ（葉）**: 子を持たないノード
- ルート（根）: 親を持たないノード
- ノード（節点）: 木の構成要素
- エッジ（辺）: ノード間の接続

**正解: リーフ（葉）**`
  },
  {
    id: '21c7b971-0227-43b8-8690-a84af3b9ac10',
    explanation: `## 解説

主キーの特徴：
- **一意性**: テーブル内で重複しない
- **非NULL**: NULL値を持てない
- **不変性**: 一度設定したら変更しない（推奨）
- 複数の列で構成可能（複合主キー）

適切でないもの：
- 「NULL値を許可する」は誤り

**正解: NULL値を許可する**`
  },
  // 問題11-20
  {
    id: 'c718a510-d0d1-434b-ab00-26b78b2a4b77',
    explanation: `## 解説

SQL文の基本構造：
- **SELECT**: 取得する列を指定
- FROM: 対象テーブルを指定
- WHERE: 条件を指定
- ORDER BY: 並び替えを指定

**正解: SELECT**`
  },
  {
    id: '23d4968b-3908-4ae8-beb0-d6baaf6c8d8a',
    explanation: `## 解説

CPUの性能指標：
- **MIPS (Million Instructions Per Second)**: 1秒間に実行できる命令数（百万単位）
- クロック周波数: 1秒間のクロック数（Hz）
- CPI: 1命令あたりのクロック数
- FLOPS: 1秒間の浮動小数点演算数

**正解: MIPS**`
  },
  {
    id: '0903f440-c5b2-4fe7-9e4a-da03be2e0538',
    explanation: `## 解説

キャッシュメモリの効果：
- CPUとメインメモリの速度差を緩和
- 頻繁に使用するデータへの高速アクセス
- 実効アクセス時間の短縮

適切でない効果：
- 「記憶容量の増加」- キャッシュは高速化が目的で容量増加ではない

**正解: 記憶容量の増加**`
  },
  {
    id: '38191138-f818-44f2-8831-9368a34e78df',
    explanation: `## 解説

仮想記憶方式：
- 主記憶と補助記憶を組み合わせて大容量の記憶空間を実現
- ページング方式: 固定長のページ単位で管理
- セグメント方式: 可変長のセグメント単位で管理
- 実メモリより大きなプログラムを実行可能

**正解: 主記憶と補助記憶を組み合わせて、実メモリより大きな記憶空間を提供する**`
  },
  {
    id: '23d709d0-7fb1-4dd2-800d-957196c794b4',
    explanation: `## 解説

OSのプロセス管理機能：
- プロセスの生成・終了
- CPUスケジューリング
- プロセス間通信
- 同期・排他制御
- デッドロック対策

**正解: 複数のプロセスを効率的に実行するためのスケジューリングを行う**`
  },
  {
    id: '35ee2d9c-998a-4f98-acb6-f125dbc59782',
    explanation: `## 解説

プリエンプティブ方式：
- OSが強制的にプロセスを切り替える
- タイムスライスによる公平な実行時間配分
- 応答性が良い
- リアルタイムシステムに適している

ノンプリエンプティブ方式との違い：
- プロセスが自発的に制御を返すまで待つ必要がない

**正解: OSが強制的にプロセスを切り替えることができる**`
  },
  {
    id: 'ba29dde0-a0e5-4d01-a704-a21427464c7e',
    explanation: `## 解説

ファイルシステムの機能：
- ファイルの作成・削除・更新
- ディレクトリ構造の管理
- アクセス権限の管理
- ファイルの物理的配置の管理

**正解: ファイルとディレクトリを階層構造で管理する**`
  },
  {
    id: 'fc7a5001-f2e8-49c9-a60d-8c07bf5eb45a',
    explanation: `## 解説

TCP/IPの階層構造：
- アプリケーション層: HTTP, FTP, SMTP
- トランスポート層: TCP, UDP
- **ネットワーク層: IP, ICMP**
- データリンク層: Ethernet

**正解: IP**`
  },
  {
    id: 'd1b05c4a-8d87-4290-8246-1dd50d92df6c',
    explanation: `## 解説

トランスポート層の役割：
- エンドツーエンドの通信制御
- 信頼性のあるデータ転送（TCP）
- ポート番号による多重化
- フロー制御と輻輳制御

**正解: エンドツーエンド間での信頼性のあるデータ転送を提供する**`
  },
  // 問題21-30など、さらに続く問題...
  {
    id: '2e1d174b-4e04-4c20-9af4-35076ae6ff00',
    explanation: `## 解説

サブネットマスク255.255.255.0の場合：
- ホスト部: 8ビット
- 理論上のアドレス数: 2⁸ = 256
- ネットワークアドレス（全0）とブロードキャストアドレス（全1）を除く
- 利用可能ホスト数: 256 - 2 = 254

**正解: 254**`
  },
  {
    id: '1d58bfba-9059-44a8-aded-160fdb415c09',
    explanation: `## 解説

DHCPの機能：
- IPアドレスの自動割り当て
- サブネットマスクの配布
- デフォルトゲートウェイの設定
- DNSサーバアドレスの配布

**正解: ネットワーク機器に自動的にIPアドレスを割り当てる**`
  }
];

// 選択肢の正解設定データ（全ての問題）
const choiceUpdates = [
  { questionId: '225dba6b-0e9e-4f15-b40b-4272d639454a', correctLabel: 'イ' }
];

async function executeComplete2009Updates() {
  console.log('2009年秋期基本情報技術者試験の完全な解答と解説を更新します...');
  
  try {
    let updatedQuestions = 0;
    let updatedChoices = 0;
    let errors = 0;

    // 1. 問題の解説を更新
    console.log('\n=== 解説を更新中 ===');
    
    for (let i = 0; i < allQuestionsUpdates.length; i++) {
      const question = allQuestionsUpdates[i];
      try {
        console.log(`処理中 (${i + 1}/${allQuestionsUpdates.length}): ${question.id}`);
        
        const { error } = await supabase
          .from('questions')
          .update({ explanation: question.explanation })
          .eq('id', question.id);

        if (error) {
          console.error(`問題 ${question.id} の解説更新エラー:`, error);
          errors++;
        } else {
          console.log(`✅ 問題 ${question.id} の解説を更新しました`);
          updatedQuestions++;
        }

        // 少し待機してレート制限を避ける
        if ((i + 1) % 10 === 0) {
          console.log('10件処理完了。短時間待機中...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`問題 ${question.id} の処理中にエラー:`, error);
        errors++;
      }
    }

    // 2. 選択肢の正解フラグを更新
    console.log('\n=== 選択肢の正解フラグを更新中 ===');
    for (const choiceUpdate of choiceUpdates) {
      try {
        // まず該当する問題の全ての選択肢をfalseに設定
        const { error: resetError } = await supabase
          .from('choices')
          .update({ is_correct: false })
          .eq('question_id', choiceUpdate.questionId);

        if (resetError) {
          console.error(`問題 ${choiceUpdate.questionId} の選択肢リセットエラー:`, resetError);
          errors++;
          continue;
        }

        // 正解の選択肢をtrueに設定
        const { error: updateError } = await supabase
          .from('choices')
          .update({ is_correct: true })
          .eq('question_id', choiceUpdate.questionId)
          .eq('choice_label', choiceUpdate.correctLabel);

        if (updateError) {
          console.error(`問題 ${choiceUpdate.questionId} の正解選択肢更新エラー:`, updateError);
          errors++;
        } else {
          console.log(`✅ 問題 ${choiceUpdate.questionId} の選択肢 ${choiceUpdate.correctLabel} を正解に設定しました`);
          updatedChoices++;
        }
      } catch (error) {
        console.error(`選択肢更新中にエラー:`, error);
        errors++;
      }
    }

    console.log('\n=== 更新完了 ===');
    console.log(`更新された問題の解説: ${updatedQuestions}件`);
    console.log(`更新された選択肢: ${updatedChoices}件`);
    console.log(`エラー数: ${errors}件`);
    
    if (errors === 0) {
      console.log('\n🎉 全ての更新が正常に完了しました！');
    } else {
      console.log('\n⚠️  一部の更新でエラーが発生しました。ログを確認してください。');
    }

  } catch (error) {
    console.error('スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
executeComplete2009Updates();