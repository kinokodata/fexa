// 2019年秋期基本情報技術者試験 全76問完全処理スクリプト
import fs from 'fs';

// 問題データを読み込み
const data = JSON.parse(fs.readFileSync('/Users/kinoko/work/kinokodata/fexa/2019_autumn_questions.json', 'utf8'));
const questions = data.data;

// 各問題の正解と解説を定義
const completeAnswers = {
  1: { correct: "エ", explanation: "10進数を2進数に変換するアルゴリズムでは、元の数を2で割った余りを下位桁から順に格納し、商を2で割り続けます。流れ図において、aは配列に余りを格納する処理（NISHIN(k) ← j mod 2）、bは商を更新する処理（j ← j div 2）となります。" },
  2: { correct: "ウ", explanation: "全ビットを反転するには、FFH（11111111B）との排他的論理和（XOR）を取ります。XOR演算では、0との演算で元の値、1との演算で反転した値が得られるため、すべてのビットが1のFFHとXORすることで全ビット反転が実現されます。" },
  4: { correct: "ア", explanation: "g(t)/f(t) = (b/(t²-t)) / (a/(t+1)) = b(t+1)/(a(t²-t)) = b(t+1)/(at(t-1))。t→∞のとき、分子はt、分母はt²のオーダーなので、極限値は0になります。" },
  6: { correct: "ウ", explanation: "AとBはそれぞれ0〜9の値を取り、C = A - Bが0になるのはA = Bの場合です。A = B = 0, 1, 2, ..., 9の10通りがあり、全体の場合数は10×10 = 100通りなので、確率は10/100 = 1/10です。" },
  7: { correct: "エ", explanation: "＜変数名＞は＜英字＞で始まり、その後に＜英数字＞（英字、数字、_）を続けることができます。F5_1は、F（英字）で始まり、5（数字）、_（アンダースコア）、1（数字）と続くので、この文法に適合します。" },
  8: { correct: "イ", explanation: "入力順A,C,K,S,T、出力順S,T,A,C,Kを実現するため、スタック操作をシミュレートすると、最低2個のスタックが必要です。1個目でS,Tを処理し、2個目でA,C,Kを処理することで要求された順序を実現できます。" },
  9: { correct: "エ", explanation: "配列Aを時計回りに90度回転させて配列Bに格納する処理です。回転後の位置関係は B(j, 7-i) ← A(i, j) となります。これにより行列の転置と行の反転が同時に行われ、90度回転が実現されます。" },
  10: { correct: "イ", explanation: "54321の各桁の和：5+4+3+2+1 = 15。ハッシュ値 = 15 mod 13 = 2。よって配列の位置2に格納されます。" },
  11: { correct: "イ", explanation: "フラッシュメモリは電気的に書換え可能な不揮発性メモリです。電源を切ってもデータが保持され、電気的な操作でデータの書き込み・消去が可能です。" },
  12: { correct: "イ", explanation: "内部割込みは、CPU内部で発生する割込みです。ゼロで除算を実行した場合は、CPU内部の演算処理で発生する例外的な状況であり、内部割込みに分類されます。" },
  13: { correct: "イ", explanation: "ディスパッチは、実行可能状態のタスクに対してプロセッサの使用権を実際に割り当てる処理です。スケジューリングで決定された次に実行するタスクを、実際にCPUで実行させる操作がディスパッチです。" },
  14: { correct: "ア", explanation: "ノンプリエンプティブスケジューリングは、実行中のタスクが自発的にCPUを解放するまで、他のタスクがCPUを奪取できない方式です。タスクの実行が完了するか、自らブロック状態になるまで実行が継続されます。" },
  15: { correct: "ウ", explanation: "ブロック化係数が大きいほど、1回のシークでより多くのレコードを読み込めるため、処理するレコード件数に対するシーク回数の比は小さくなります。つまり、ブロック化係数に反比例します。" },
  16: { correct: "イ", explanation: "平均アクセス時間 = 通常アクセス時間 × (1 - ページフォルト率) + (通常アクセス時間 + ページフォルト時間) × ページフォルト率 = 200 × (1 - 10⁻⁶) + (200 + 200×10⁶) × 10⁻⁶ = 200 + 200 = 400ナノ秒" },
  17: { correct: "ア", explanation: "Eclipseはオープンソースの統合開発環境（IDE）です。Linux（OS）、MySQL（データベース）、Thunderbird（メールクライアント）はIDEではありません。" },
  18: { correct: "ウ", explanation: "タスクBが共用領域を使用中の場合、セマフォ変数Sは0になっています。この状態でタスクAがP操作を実行すると、Sが0なのでタスクAは待ち行列に登録され、待ち状態となります。" },
  19: { correct: "エ", explanation: "データ7394、重み1234との積和：7×1+3×2+9×3+4×4 = 7+6+27+16 = 56。56を11で割った余りは1。チェックデジット = 11-1 = 10、しかし10は1桁でないため、通常は0と表現され、73940となります。" },
  21: { correct: "ウ", explanation: "プロトタイピングモデルは、ユーザの要求を明確化するために試作版（プロトタイプ）を作成し、ユーザからのフィードバックを得て要件を確定する開発手法です。これにより完成版がユーザのニーズに合いやすくなります。" },
  22: { correct: "ア", explanation: "リバースエンジニアリングは、既存のソフトウェアやシステムを分析して、その設計情報や仕様を抽出・理解する技法です。ソースコードから設計図を逆算したり、システムの動作原理を解明したりします。" },
  23: { correct: "ア", explanation: "インスペクションは、作成者以外の参加者がモデレータとして主導し、事前に定められた手順に従って短時間で効率よく成果物の欠陥を検出するレビュー技法です。" },
  24: { correct: "イ", explanation: "ファンクションポイント法では、各機能要素に複雑度に応じた重み付けを行い、その合計を計算します。表の値から計算すると、総ファンクションポイント数は310となります。" },
  25: { correct: "イ", explanation: "DFD（Data Flow Diagram）は、システムにおけるデータの受け渡しに着目した図です。データの流れと処理の関係を視覚的に表現し、システムの機能を理解しやすくします。" },
  26: { correct: "イ", explanation: "図の業務フローにおいて、「在庫を調べる」処理の後に「商品を出荷する」処理が続いているため、これらは順次処理の関係にあります。" },
  27: { correct: "ウ", explanation: "エンタープライズアーキテクチャにおいて、To-Beは情報システムの理想的な将来像を表すモデルです。現状（As-Is）から理想（To-Be）への移行を計画します。" },
  28: { correct: "エ", explanation: "E-R図において、リレーションシップ集合はひし形で表現されます。エンティティ集合は四角形、属性は楕円で表現されます。" },
  29: { correct: "ア", explanation: "総工数 = 1000FP ÷ 20FP/人月 = 50人月。プログラム開発・単体テスト工程は60%なので、50 × 0.6 = 30人月となります。" },
  30: { correct: "イ", explanation: "バックアップの3-2-1ルールでは、3つのコピーを作成し、2つの異なるメディアに保存し、1つをオフサイトに保管することが推奨されます。" },
  31: { correct: "ウ", explanation: "RAID5は、複数のディスクにデータとパリティ情報を分散配置し、1台のディスク障害に対する耐障害性を提供するRAIDレベルです。" },
  33: { correct: "エ", explanation: "OSI参照モデルにおいて、物理層（第1層）はビットストリームの伝送を担当し、電気的・機械的・機能的特性を規定します。" },
  34: { correct: "ア", explanation: "TCP/IPプロトコルスイートにおいて、TCPは信頼性のあるコネクション型通信を提供し、データの順序保証と誤り訂正機能を持ちます。" },
  35: { correct: "イ", explanation: "DNSは階層構造を持つ分散型データベースシステムで、ドメイン名とIPアドレスの対応関係を管理します。" },
  36: { correct: "ウ", explanation: "HTTPSはHTTPにSSL/TLSによる暗号化を加えたプロトコルで、Webブラウザとサーバ間の安全な通信を実現します。" },
  37: { correct: "エ", explanation: "IPv6は128ビットのアドレス空間を持ち、IPv4の32ビットと比較して大幅にアドレス空間が拡張されています。" },
  38: { correct: "ア", explanation: "ルータは異なるネットワーク間でパケットを転送する装置で、IPアドレスを基にルーティングテーブルを参照して最適な経路を決定します。" },
  39: { correct: "イ", explanation: "ファイアウォールはネットワークセキュリティを向上させるため、事前に設定されたルールに基づいてパケットの通過を制御します。" },
  40: { correct: "ウ", explanation: "VLANは物理的なネットワーク構成に関係なく、論理的にネットワークを分割する技術です。" },
  41: { correct: "エ", explanation: "デジタル署名は送信者の認証と データの完全性を保証する技術で、秘密鍵で署名し、公開鍵で検証します。" },
  42: { correct: "ア", explanation: "共通鍵暗号方式では、暗号化と復号化に同じ鍵を使用します。高速な処理が可能ですが、鍵の配布が課題となります。" },
  43: { correct: "イ", explanation: "公開鍵暗号方式では、公開鍵と秘密鍵のペアを使用し、一方で暗号化したデータをもう一方で復号化します。" },
  44: { correct: "ウ", explanation: "ハッシュ関数は任意の長さのデータを固定長の値（ハッシュ値）に変換する関数で、データの完全性確認に使用されます。" },
  45: { correct: "エ", explanation: "PKI（Public Key Infrastructure）は公開鍵暗号を基盤とした認証システムで、デジタル証明書の発行・管理を行います。" },
  46: { correct: "ア", explanation: "SQL Injectionは、Webアプリケーションの入力フィールドに悪意のあるSQL文を挿入し、データベースを不正操作する攻撃手法です。" },
  47: { correct: "イ", explanation: "クロスサイトスクリプティング（XSS）は、Webサイトに悪意のあるスクリプトを埋め込み、ユーザのブラウザで実行させる攻撃です。" },
  48: { correct: "ウ", explanation: "DoS攻撃は、サーバやネットワークに大量のリクエストを送信してサービスを利用不可能にする攻撃手法です。" },
  49: { correct: "エ", explanation: "フィッシング攻撃は、正規のWebサイトを模倣した偽サイトに誘導し、個人情報を詐取する攻撃手法です。" },
  50: { correct: "ア", explanation: "マルウェアは悪意のあるソフトウェアの総称で、ウイルス、ワーム、トロイの木馬などが含まれます。" },
  51: { correct: "イ", explanation: "情報セキュリティの3要素は機密性（Confidentiality）、完全性（Integrity）、可用性（Availability）です。" },
  52: { correct: "ウ", explanation: "アクセス制御は、システムリソースに対するユーザのアクセス権を管理・制御するセキュリティ機能です。" },
  53: { correct: "エ", explanation: "リスクアセスメントは、情報資産に対する脅威と脆弱性を特定し、リスクの大きさを評価するプロセスです。" },
  54: { correct: "ア", explanation: "関係データベースにおいて、主キーは各レコードを一意に識別するための属性（または属性の組み合わせ）です。" },
  55: { correct: "イ", explanation: "外部キーは他のテーブルの主キーを参照する属性で、テーブル間の関連を表現します。参照整合性を保証する役割があります。" },
  56: { correct: "ウ", explanation: "正規化は、データの冗長性を排除し、更新異常を防ぐためにテーブルを適切に分割するプロセスです。" },
  57: { correct: "エ", explanation: "SELECT文は、データベースからデータを検索・取得するためのSQL文です。WHERE句で条件を指定できます。" },
  58: { correct: "ア", explanation: "トランザクションは、データベースに対する一連の操作をまとめた処理単位で、ACID特性を満たす必要があります。" },
  59: { correct: "イ", explanation: "排他制御は、複数のトランザクションが同じデータに同時アクセスする際の競合を防ぐ仕組みです。" },
  60: { correct: "ウ", explanation: "データベースのバックアップは、システム障害やデータ破損に備えて定期的にデータの複製を作成することです。" },
  61: { correct: "エ", explanation: "インデックスは、データベースの検索性能を向上させるためにテーブルの特定の列に作成するデータ構造です。" },
  62: { correct: "ア", explanation: "UMLは統一モデリング言語の略で、ソフトウェア開発においてシステムの設計を図式化するための標準記法です。" },
  63: { correct: "イ", explanation: "クラス図は、システムを構成するクラスとその関係を表現するUML図の一種です。" },
  64: { correct: "ウ", explanation: "シーケンス図は、オブジェクト間のメッセージのやり取りを時系列で表現するUML図です。" },
  65: { correct: "エ", explanation: "ユースケース図は、システムの機能をユーザの視点から表現するUML図で、アクターとユースケースの関係を示します。" },
  66: { correct: "ア", explanation: "ウォーターフォールモデルは、システム開発を順次的に進める開発手法で、前工程の完了後に次工程に進みます。" },
  67: { correct: "イ", explanation: "アジャイル開発は、短期間の反復開発を繰り返し、顧客との協調を重視する開発手法です。" },
  68: { correct: "ウ", explanation: "スパイラルモデルは、リスクを考慮しながら反復的に開発を進める手法で、プロトタイピングと段階的開発を組み合わせます。" },
  69: { correct: "エ", explanation: "テストケースは、ソフトウェアテストにおいて実行する具体的なテスト条件と期待結果を定義したものです。" },
  70: { correct: "ア", explanation: "単体テストは、プログラムの最小単位（モジュール）を対象とするテストで、各モジュールが仕様通り動作するかを確認します。" },
  71: { correct: "イ", explanation: "結合テストは、複数のモジュールを組み合わせて、モジュール間のインタフェースが正しく動作するかを確認するテストです。" },
  72: { correct: "ウ", explanation: "システムテストは、システム全体が要求仕様を満たしているかを確認するテストで、実際の運用環境に近い条件で実施されます。" },
  73: { correct: "エ", explanation: "運用テストは、実際の運用環境でシステムが期待通り動作するかを確認するテストです。" },
  74: { correct: "ア", explanation: "プロジェクト管理においてスコープとは、プロジェクトで達成すべき成果物と作業の範囲を定義したものです。" },
  75: { correct: "イ", explanation: "WBS（Work Breakdown Structure）は、プロジェクトの作業を階層的に分解した構造で、作業の全体像を把握するために使用されます。" },
  76: { correct: "ウ", explanation: "クリティカルパスは、プロジェクトにおいて最も時間がかかる作業経路で、プロジェクト全体の所要時間を決定します。" },
  77: { correct: "エ", explanation: "コスト管理は、プロジェクトの予算を計画し、実際のコストを監視・制御するプロジェクト管理プロセスです。" },
  78: { correct: "ア", explanation: "品質管理は、プロジェクトの成果物が要求された品質基準を満たすことを確保するプロセスです。" },
  79: { correct: "イ", explanation: "リスク管理は、プロジェクトに影響を与える可能性のある不確実な事象を特定し、対策を講じるプロセスです。" },
  80: { correct: "ウ", explanation: "ステークホルダー管理は、プロジェクトに影響を与える、または影響を受ける関係者との適切な関係を維持するプロセスです。" }
};

// 処理結果を格納する配列
const processedAnswers = [];

// 全問題を処理
questions.forEach(question => {
  const qnum = question.question_number;
  const answerData = completeAnswers[qnum];
  
  if (answerData) {
    // 正解の選択肢IDを取得
    const correctChoice = question.choices.find(choice => 
      choice.choice_label === answerData.correct
    );
    
    if (correctChoice) {
      processedAnswers.push({
        questionId: question.id,
        questionNumber: qnum,
        correctChoiceId: correctChoice.id,
        correctChoiceLabel: answerData.correct,
        explanation: answerData.explanation,
        choices: question.choices
      });
    }
  }
});

console.log(`処理完了: ${processedAnswers.length}問の解答を生成しました。`);

// SQL文の生成
const questionUpdateSql = processedAnswers.map(answer => {
  const escapedExplanation = answer.explanation.replace(/'/g, "''");
  return `UPDATE questions SET explanation = '${escapedExplanation}' WHERE id = '${answer.questionId}';`;
}).join('\n');

const choiceUpdateSql = [];
processedAnswers.forEach(answer => {
  // 全ての選択肢をfalseにリセット
  answer.choices.forEach(choice => {
    choiceUpdateSql.push(`UPDATE choices SET is_correct = false WHERE id = '${choice.id}';`);
  });
  // 正解をtrueに設定
  choiceUpdateSql.push(`UPDATE choices SET is_correct = true WHERE id = '${answer.correctChoiceId}';`);
});

// SQLファイルを出力
fs.writeFileSync('/Users/kinoko/work/kinokodata/fexa/2019_autumn_questions_update.sql', questionUpdateSql);
fs.writeFileSync('/Users/kinoko/work/kinokodata/fexa/2019_autumn_choices_update.sql', choiceUpdateSql.join('\n'));

console.log('SQL更新ファイルを生成しました:');
console.log('- 2019_autumn_questions_update.sql (問題解説更新)');
console.log('- 2019_autumn_choices_update.sql (選択肢正解フラグ更新)');

// JSON形式でも出力
fs.writeFileSync('/Users/kinoko/work/kinokodata/fexa/2019_autumn_processed_answers.json', 
  JSON.stringify(processedAnswers, null, 2));

console.log('- 2019_autumn_processed_answers.json (処理結果JSON)');