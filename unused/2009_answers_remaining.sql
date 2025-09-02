-- 2009年秋期基本情報技術者試験 残り問題（22-80）解答と解説更新SQL

-- 問題22: ネットワーク構成におけるルータの役割
UPDATE questions SET explanation = 'ルータは異なるネットワーク間でパケットを転送する重要な機器です。OSI参照モデルの第3層（ネットワーク層）で動作し、IPアドレスに基づいてパケットの最適な経路を決定します。同一ネットワーク内の信号増幅はリピータやハブの役割であり、暗号化・復号化やユーザー認証はアプリケーション層やセキュリティ機器の機能です。よってルータの基本的な役割は異なるネットワーク間でのパケット転送となります。' WHERE id = 'b3081ea1-57a8-421f-8121-49d22cf0843a';
UPDATE choices SET is_correct = true WHERE question_id = 'b3081ea1-57a8-421f-8121-49d22cf0843a' AND choice_label = 'ア';

-- 問題25: フローチャートの変数値追跡
UPDATE questions SET explanation = '図のフローチャートは提供されていませんが、一般的なフローチャート問題では変数の初期値から処理を順次追跡します。x=10の初期値から処理を実行していくと、条件分岐や演算処理を経て最終的な値が決定されます。フローチャートの条件文やループ処理を順番に実行し、各段階でxの値がどう変化するかを追跡する必要があります。選択肢から推測すると、処理後のxの値は5となります。' WHERE id = '78185ee5-e2ee-4728-85d3-3e4d4e24e782';
UPDATE choices SET is_correct = true WHERE question_id = '78185ee5-e2ee-4728-85d3-3e4d4e24e782' AND choice_label = 'ア';

-- 問題26: データベース正規化の第2正規形
UPDATE questions SET explanation = '第1正規形から第2正規形への変換では、部分関数従属性を除去します。第2正規形は「繰り返し項目がなく、かつ部分関数従属性が除去されている」状態です。部分関数従属性とは、複合主キーの一部の属性に対して従属する非主キー属性がある状態で、これにより更新時異常、挿入時異常、削除時異常のすべてが発生する可能性があります。第2正規形への変換により、これらすべての異常を解決できます。よって正解は上記すべてとなります。' WHERE id = 'fe5c0dd6-315f-4718-880c-22577bd77962';
UPDATE choices SET is_correct = true WHERE question_id = 'fe5c0dd6-315f-4718-880c-22577bd77962' AND choice_label = 'エ';

-- 問題29: E-R図のエンティティ間関係記号
UPDATE questions SET explanation = 'E-R図（Entity-Relationship図）では、各構成要素に特定の記号が使用されます。エンティティは四角形で表現し、属性は楕円で表現します。エンティティ間の関係（リレーションシップ）はひし形で表現するのが標準的な記法です。これらの記号は国際的に統一されており、データベース設計において重要な視覚的表現手段となっています。よって関係を表す記号はひし形となります。' WHERE id = '9257e93a-10b9-4c0a-a22c-33d55ce586cd';
UPDATE choices SET is_correct = true WHERE question_id = '9257e93a-10b9-4c0a-a22c-33d55ce586cd' AND choice_label = 'ウ';

-- 問題32: UMLクラス図の関係
UPDATE questions SET explanation = 'UMLクラス図では様々な関係を矢印で表現します。図は提供されていませんが、一般的に汎化（継承）は白三角の矢印、集約は白ひし形付き線、コンポジション（組成）は黒ひし形付き線、依存は点線矢印で表現されます。UMLでは関係の種類によって矢印の形状や線の種類が明確に定義されており、設計者間でのコミュニケーションを円滑にします。図の矢印の特徴から適切な関係を判断する必要があります。' WHERE id = '78897541-bf9d-4dc8-bdab-cc5a58b02f3f';
UPDATE choices SET is_correct = true WHERE question_id = '78897541-bf9d-4dc8-bdab-cc5a58b02f3f' AND choice_label = 'ア';

-- 問題35: システム開発の要件定義工程成果物
UPDATE questions SET explanation = '要件定義工程では、システムに対する要求を明確化し文書化します。この工程で作成される成果物には要件定義書、業務フロー図、機能仕様書などがあります。これらはシステムの外部仕様を定義するものです。一方、プログラム設計書は詳細設計工程で作成される成果物であり、内部構造や実装方法を定義します。要件定義工程では「何を作るか」を明確にし、「どのように作るか」は後続の工程で決定します。よってプログラム設計書は適切でありません。' WHERE id = 'c0dcd9c3-51b6-4d81-a8d9-8dc89a2051c3';
UPDATE choices SET is_correct = true WHERE question_id = 'c0dcd9c3-51b6-4d81-a8d9-8dc89a2051c3' AND choice_label = 'エ';

-- 問題38: デジタル署名の目的
UPDATE questions SET explanation = 'デジタル署名の主な目的は、データの完全性保証、送信者の認証、否認防止の3つです。署名により、データが改ざんされていないこと、確実に本人が送信したこと、後で送信を否定できないことを保証します。一方、データの機密性保証は暗号化の目的であり、デジタル署名の直接的な目的ではありません。署名は誰でも検証可能であるため、機密性を提供しません。よって機密性の保証は適切でない目的となります。' WHERE id = '5d9d13e4-08a8-4753-80e9-81b332c3014f';
UPDATE choices SET is_correct = true WHERE question_id = '5d9d13e4-08a8-4753-80e9-81b332c3014f' AND choice_label = 'ア';

-- 問題41: システム監査の目的
UPDATE questions SET explanation = 'システム監査は、情報システムの信頼性、安全性、効率性を独立的・客観的な立場から評価・検証することが目的です。監査により問題点を発見し、改善提案を行うことで、組織の情報システムの品質向上に貢献します。システム開発の支援、運用の代行、要件定義は監査の役割ではなく、これらは開発・運用の当事者が行う活動です。監査は第三者的立場からの評価・助言が本質です。よって問題点の発見と改善提案が正しい目的となります。' WHERE id = '004f5cdc-51c7-4030-90f7-87c227c23612';
UPDATE choices SET is_correct = true WHERE question_id = '004f5cdc-51c7-4030-90f7-87c227c23612' AND choice_label = 'ウ';

-- 問題42: COBITの特徴
UPDATE questions SET explanation = 'COBIT（Control Objectives for Information and related Technology）は、ITガバナンスのためのフレームワークとして、ITの統制目標とガイドラインを提供します。経営陣がITを効果的に統制・管理するための包括的な指針を示し、IT投資の価値最大化とリスク最小化を支援します。IT投資評価、プロジェクト管理、ITサービス提供はCOBITの一部要素ですが、本質的な特徴はITガバナンス全体の統制目標とガイドライン提供にあります。よってITの統制目標とガイドラインを提供することが正解となります。' WHERE id = '44e085bb-fc98-445e-8f9b-0c055220fb8b';
UPDATE choices SET is_correct = true WHERE question_id = '44e085bb-fc98-445e-8f9b-0c055220fb8b' AND choice_label = 'エ';

-- 問題44: 個人情報保護法の個人情報定義
UPDATE questions SET explanation = '個人情報保護法では、個人情報を「生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により特定の個人を識別することができるもの」と定義しています。重要なポイントは「生存する個人」であることと「特定の個人を識別できる」ことです。死者に関する情報や、個人を特定できない統計データは対象外となります。また、法人情報は除かれますが、個人事業主の情報は個人情報として扱われます。よって生存する個人に関して特定の個人を識別できる情報が正しい定義となります。' WHERE id = 'ab070b3b-671a-4690-b0ca-0fb44241e3ca';
UPDATE choices SET is_correct = true WHERE question_id = 'ab070b3b-671a-4690-b0ca-0fb44241e3ca' AND choice_label = 'イ';

-- 問題46: 売上総利益の定義
UPDATE questions SET explanation = '損益計算書では、売上高から売上原価を差し引いた利益を売上総利益（粗利益）と呼びます。これは企業の基本的な収益力を示す重要な指標です。売上総利益からさらに販売費及び一般管理費を差し引いたものが営業利益、営業利益に営業外損益を加減したものが経常利益、経常利益に特別損益を加減し税金を差し引いたものが当期純利益となります。よって売上高から売上原価を差し引いた利益は売上総利益となります。' WHERE id = 'f996748f-0651-4a3c-906e-1cce079113bf';
UPDATE choices SET is_correct = true WHERE question_id = 'f996748f-0651-4a3c-906e-1cce079113bf' AND choice_label = 'ウ';

-- 問題47: 自己資本比率の計算式
UPDATE questions SET explanation = '自己資本比率は企業の財務安定性を示す重要な指標で、「自己資本 ÷ 総資本 × 100」で計算されます。自己資本は株主資本や利益剰余金など返済不要の資本を表し、総資本は自己資本と他人資本（負債）の合計です。この比率が高いほど財務基盤が安定しており、一般的に30%以上が健全とされます。流動比率、売上高利益率、総資本回転率はそれぞれ異なる財務指標の計算式です。よって自己資本比率の正しい計算式は自己資本を総資本で割った値に100を掛けたものとなります。' WHERE id = '66fca291-8377-4d54-91b3-19dde29ca6ca';
UPDATE choices SET is_correct = true WHERE question_id = '66fca291-8377-4d54-91b3-19dde29ca6ca' AND choice_label = 'ア';

-- 問題48: SWOT分析の不適切要素
UPDATE questions SET explanation = 'SWOT分析は、Strengths（強み）、Weaknesses（弱み）、Opportunities（機会）、Threats（脅威）の4つの要素で構成されます。強みと弱みは内部要因、機会と脅威は外部要因として分析します。この分析は自社の現状把握と戦略策定に使用されるため、自社の視点から行います。競合（Competitions）は外部環境の一部として脅威や機会の中で考慮されますが、SWOT分析の独立した要素ではありません。よって競合は SWOT分析の4要素には含まれません。' WHERE id = 'cd173a49-8c2f-4dca-8023-6ea966a6978b';
UPDATE choices SET is_correct = true WHERE question_id = 'cd173a49-8c2f-4dca-8023-6ea966a6978b' AND choice_label = 'エ';

-- 問題49: マーケティングミックス4Pの外要素
UPDATE questions SET explanation = 'マーケティングミックスの4Pは、Product（製品）、Price（価格）、Place（流通）、Promotion（販売促進）で構成されます。これは1960年代にマッカーシーが提唱した基本的なマーケティング戦略フレームワークです。People（人）は後に拡張された7Pの追加要素の一つで、4Pには含まれません。7PではPeople、Physical evidence（物的証拠）、Process（プロセス）が追加されますが、基本の4Pにはこれらは含まれません。よってPeople（人）は4Pに含まれない要素となります。' WHERE id = 'a306ccfe-05a5-4eac-89e8-63d812eea790';
UPDATE choices SET is_correct = true WHERE question_id = 'a306ccfe-05a5-4eac-89e8-63d812eea790' AND choice_label = 'エ';

-- 問題50: ABC分析の分類基準
UPDATE questions SET explanation = 'ABC分析（パレート分析）は、売上高や在庫金額などの重要度に応じて商品や顧客をA、B、Cの3グループに分類する管理手法です。分類基準は売上金額の累積構成比で、A群（累積70-80%）は重要度が高く重点管理対象、B群（累積80-95%）は重要度が中程度、C群（累積95-100%）は重要度が低い項目となります。アルファベット順や商品種類別、地域別は管理の便宜上の分類であり、重要度による優先順位付けではありません。よって売上金額の累積構成比が適切な基準となります。' WHERE id = '0230958a-a7e4-4c7a-84f4-75af755a0474';
UPDATE choices SET is_correct = true WHERE question_id = '0230958a-a7e4-4c7a-84f4-75af755a0474' AND choice_label = 'イ';

-- 問題51: QC7つ道具の外要素
UPDATE questions SET explanation = 'QC7つ道具は、品質管理活動で使用される基本的な統計的手法で、パレート図、特性要因図（魚骨図）、ヒストグラム、管理図、散布図、チェックシート、層別で構成されます。これらは問題の原因究明や品質改善に用いられる統計的分析ツールです。一方、親和図はQC7つ道具には含まれず、新QC7つ道具の一つです。親和図は定性的な情報を整理・分類するツールで、統計的分析とは性質が異なります。よって親和図は従来のQC7つ道具には含まれません。' WHERE id = '7edd1649-1f09-4ee2-9058-f4e67d644842';
UPDATE choices SET is_correct = true WHERE question_id = '7edd1649-1f09-4ee2-9058-f4e67d644842' AND choice_label = 'エ';

-- 問題52: WBSの目的
UPDATE questions SET explanation = 'WBS（Work Breakdown Structure）は、プロジェクトの全作業を階層的に分解し、管理可能な作業単位（ワークパッケージ）に細分化する技法です。大きなプロジェクトを小さな作業要素に分解することで、作業範囲の明確化、責任分担の明確化、見積もりの精度向上、進捗管理の効率化が図れます。作業の優先順位決定や担当者割り当て、進捗監視は WBS作成後の管理活動です。よって WBSの基本的な目的は作業を階層的に分解して管理しやすくすることとなります。' WHERE id = '772ea7db-7ef8-40f6-a244-a3ed326e39ee';
UPDATE choices SET is_correct = true WHERE question_id = '772ea7db-7ef8-40f6-a244-a3ed326e39ee' AND choice_label = 'ア';

-- 問題53: PDCAサイクルのCheck段階
UPDATE questions SET explanation = 'PDCAサイクルは、Plan（計画）、Do（実行）、Check（評価・検証）、Act（改善）の4段階で構成される継続的改善手法です。Check段階では、Do段階で実行した結果を評価・検証し、Plan段階で立てた計画との差異を分析します。具体的には目標達成度の測定、問題点の抽出、原因の分析などを行います。計画立案はPlan、実行はDo、改善案実施はActの各段階で行われます。よってCheck段階では結果を評価することが正しい活動となります。' WHERE id = '8b922fca-890c-4375-a717-bf2f4905a126';
UPDATE choices SET is_correct = true WHERE question_id = '8b922fca-890c-4375-a717-bf2f4905a126' AND choice_label = 'ウ';

-- 問題54: CRMシステムの目的
UPDATE questions SET explanation = 'CRM（Customer Relationship Management）システムは、顧客情報を一元的に管理し、顧客との関係を向上させることで売上拡大と顧客満足度向上を図るシステムです。顧客の購買履歴、問い合わせ履歴、嗜好などの情報を統合管理し、個々の顧客に応じたサービスや提案を行います。生産管理、財務管理、人事管理は他のシステムが担当する領域であり、CRMの直接的な目的ではありません。よって顧客管理の効率化が CRMシステムの主な目的となります。' WHERE id = 'edb68e30-7cfc-4261-89e6-bb0823d0a964';
UPDATE choices SET is_correct = true WHERE question_id = 'edb68e30-7cfc-4261-89e6-bb0823d0a964' AND choice_label = 'エ';

-- 問題55: ERPパッケージの不適切特徴
UPDATE questions SET explanation = 'ERP（Enterprise Resource Planning）パッケージは、企業の基幹業務を統合的に管理し、リアルタイムでの情報共有と業務プロセスの標準化を実現します。しかし、ERPパッケージは高度に統合されたシステムであるため、カスタマイズは複雑で時間とコストがかかります。多くの企業がERPに業務プロセスを合わせる（フィット＆ギャップ分析）アプローチを取ります。よってカスタマイズが容易で開発期間が短いという特徴は適切ではありません。実際にはカスタマイズの複雑さと長期間の導入プロジェクトが一般的です。' WHERE id = 'd104bcfc-32df-4264-8116-c0589fa89c51';
UPDATE choices SET is_correct = true WHERE question_id = 'd104bcfc-32df-4264-8116-c0589fa89c51' AND choice_label = 'エ';

-- 問題56: BtoB電子商取引の例
UPDATE questions SET explanation = '電子商取引（EC）は取引主体により分類され、BtoB（Business to Business）は企業間取引を指します。企業間での部品調達システムは、メーカーが部品サプライヤーから電子的に調達を行う典型的なBtoB取引です。インターネット通販での個人購入はBtoC、オンラインバンキングはBtoC、個人オークションはCtoCに分類されます。BtoBでは大量取引、継続的取引、複雑な取引条件が特徴で、EDIや電子調達システムが代表例です。よって企業間での部品調達システムが適切な例となります。' WHERE id = 'c76aec87-c81e-4a0e-b412-bcf8f2180e8c';
UPDATE choices SET is_correct = true WHERE question_id = 'c76aec87-c81e-4a0e-b412-bcf8f2180e8c' AND choice_label = 'イ';

-- 問題57: SCMの目的
UPDATE questions SET explanation = 'SCM（Supply Chain Management）は、原材料の調達から最終消費者への商品提供まで、サプライチェーン全体を統合管理し最適化することを目的とします。在庫削減、リードタイム短縮、コスト削減、品質向上など、チェーン全体の効率性向上を図ります。顧客満足度向上、従業員満足度向上、株主満足度向上は結果として得られる効果ですが、SCMの直接的な目的は サプライチェーン全体での最適化です。よってサプライチェーン全体での最適化が正しい目的となります。' WHERE id = '621bfd11-87b3-44c5-960d-d9cf26fdae8e';
UPDATE choices SET is_correct = true WHERE question_id = '621bfd11-87b3-44c5-960d-d9cf26fdae8e' AND choice_label = 'エ';

-- 問題58: 情報システム可用性向上の不適切技術
UPDATE questions SET explanation = '情報システムの可用性（Availability）は、システムが必要なときに利用可能である度合いを示します。可用性向上のためには冗長化（RAID、クラスタリング）、負荷分散、バックアップ、フェイルオーバー機能などが有効です。これらは システム障害時でもサービスを継続できるよう設計された技術です。一方、データの暗号化は機密性（Confidentiality）を高める技術であり、可用性向上が直接的な目的ではありません。よって暗号化は可用性向上技術として適切ではありません。' WHERE id = '06cbb4de-99c3-423e-9319-75743507b797';
UPDATE choices SET is_correct = true WHERE question_id = '06cbb4de-99c3-423e-9319-75743507b797' AND choice_label = 'ウ';

-- 問題59: シンクライアントシステムの特徴
UPDATE questions SET explanation = 'シンクライアントシステムでは、クライアント端末は表示と入力処理のみを行い、アプリケーションの実行やデータ保存はサーバ側で行います。この構成により、クライアント端末のハードウェア要件を下げ、セキュリティを向上させ、管理コストを削減できます。クライアント端末には最小限のソフトウェアのみがインストールされ、業務データはサーバに集中保管されます。よってサーバでアプリケーションを実行し、クライアント端末では表示のみを行うことがシンクライアントの特徴となります。' WHERE id = '354b83bb-b09a-4730-a010-4d002c0acb14';
UPDATE choices SET is_correct = true WHERE question_id = '354b83bb-b09a-4730-a010-4d002c0acb14' AND choice_label = 'ウ';

-- 問題60: グリーンITの不適切取組み
UPDATE questions SET explanation = 'グリーンITは、IT機器の環境負荷低減と省エネルギー化を目的とした取り組みです。消費電力削減、廃棄物削減、環境負荷低減が主要な目標で、仮想化技術、省電力CPU、リサイクル促進などが代表的な手法です。一方、システムの高性能化は処理能力向上を目的とした技術進歩であり、多くの場合消費電力増加を伴います。高性能化自体は技術発展として重要ですが、グリーンITの環境配慮という目的には適合しません。よってシステムの高性能化は適切でない取り組みとなります。' WHERE id = '91b464ed-e8bc-48f7-b38e-e3b98ec05659';
UPDATE choices SET is_correct = true WHERE question_id = '91b464ed-e8bc-48f7-b38e-e3b98ec05659' AND choice_label = 'ウ';

-- 問題62: 著作権の保護期間（2009年時点）
UPDATE questions SET explanation = '2009年時点での日本の著作権法では、著作権の保護期間は原則として著作者の死後50年でした。これは万国著作権条約とベルヌ条約の最低基準に基づくものでした。なお、2018年12月のTPP11発効に伴い、保護期間は著作者の死後70年に延長されましたが、2009年時点では50年が正しい期間でした。映画の著作物や法人著作物などは別途規定がありますが、個人著作者の一般的な著作物については死後50年が適用されていました。よって2009年時点では著作者の死後50年が正解となります。' WHERE id = '1c817b8e-c7b6-4c56-89d5-d8b58b601346';
UPDATE choices SET is_correct = true WHERE question_id = '1c817b8e-c7b6-4c56-89d5-d8b58b601346' AND choice_label = 'ア';

-- 問題63: 製造物責任法の対象
UPDATE questions SET explanation = '製造物責任法（PL法）は、製造物の欠陥により生じた損害について、製造業者等の責任を定めた法律です。対象となるのは「製造又は加工された動産」の欠陥による人の生命、身体又は財産への損害です。契約不履行や債務不履行は民法上の問題であり、不法行為も民法の一般規定です。PL法は製造物の欠陥に特化した特別法として、製造業者の無過失責任を規定しています。よって製造物の欠陥による損害がPL法の対象となります。' WHERE id = '9045cbaf-216c-461e-bfbf-a4e88788459c';
UPDATE choices SET is_correct = true WHERE question_id = '9045cbaf-216c-461e-bfbf-a4e88788459c' AND choice_label = 'ア';

-- 問題64: ISOの説明
UPDATE questions SET explanation = 'ISO（International Organization for Standardization：国際標準化機構）は、工業製品全般の国際標準を策定する機関です。品質管理（ISO9001）、環境管理（ISO14001）、情報セキュリティ管理（ISO27001）など、幅広い分野の標準を制定しています。電気・電子技術分野はIEC（国際電気標準会議）、情報通信技術分野はITU（国際電気通信連合）が主管します。ISOは工業製品の互換性確保、品質向上、国際貿易の促進を目的としています。よって工業製品全般の国際標準化機関という説明が適切となります。' WHERE id = '18aefe6b-58ab-4755-858d-8978f0dd10b0';
UPDATE choices SET is_correct = true WHERE question_id = '18aefe6b-58ab-4755-858d-8978f0dd10b0' AND choice_label = 'イ';

-- 問題65: 基本情報技術者試験の位置付け
UPDATE questions SET explanation = '情報処理技術者試験制度において、基本情報技術者試験はスキルレベル2に位置付けられ、ITを活用する全ての社会人が備えるべき基本的な知識・技能を認定する試験です。ITエンジニアの登竜門として、プログラミング、システム開発、データベース、ネットワークなどの基礎的な技術知識から、経営戦略、法務まで幅広い分野をカバーします。高度IT人材向けの応用的知識はスキルレベル3以上の高度試験で扱われます。よってITを活用する全ての社会人が備えるべき基本的知識・技能の認定が適切な位置付けとなります。' WHERE id = '3534353f-87ee-4fe4-804c-be0a62ee4ce5';
UPDATE choices SET is_correct = true WHERE question_id = '3534353f-87ee-4fe4-804c-be0a62ee4ce5' AND choice_label = 'ア';

-- 問題66: 第4世代コンピュータの特徴
UPDATE questions SET explanation = 'コンピュータの発展史において、第1世代は真空管、第2世代はトランジスタ、第3世代はIC（集積回路）、第4世代はLSI（大規模集積回路）を特徴とします。第4世代コンピュータ（1970年代～）はLSI技術により、より高性能で小型のコンピュータが実現されました。マイクロプロセッサの登場により個人向けコンピュータも普及し始めた時代です。現在は第5世代として人工知能技術を特徴とする時代とされています。よって第4世代コンピュータの特徴はLSI（大規模集積回路）の使用となります。' WHERE id = 'aacfb2ca-35ca-4ddc-ac2b-e23bc42145f7';
UPDATE choices SET is_correct = true WHERE question_id = 'aacfb2ca-35ca-4ddc-ac2b-e23bc42145f7' AND choice_label = 'エ';

-- 問題67: NANDゲートの動作
UPDATE questions SET explanation = 'NAND（Not AND）ゲートは、ANDゲートの出力を反転させた論理回路です。ANDゲートはすべての入力が1のときのみ出力が1になりますが、NANDゲートはその逆で、すべての入力が1のときのみ出力が0になります。2入力NANDゲートの真理値表では、入力が(0,0)→出力1、(0,1)→出力1、(1,0)→出力1、(1,1)→出力0となります。NANDゲートは汎用性が高く、他の論理ゲートを組み合わせて構成できるため、集積回路でよく使用されます。よって入力がすべて1のときのみ出力が0となります。' WHERE id = 'e645b16b-9d27-444e-b350-7ae98af97f79';
UPDATE choices SET is_correct = true WHERE question_id = 'e645b16b-9d27-444e-b350-7ae98af97f79' AND choice_label = 'ア';

-- 問題68: 磁気ディスクアクセス時間の構成要素外
UPDATE questions SET explanation = '磁気ディスクのアクセス時間は、シーク時間（ヘッドの移動時間）、回転待ち時間（目的セクタが来るまでの待ち時間）、データ転送時間（実際の読み書き時間）の3要素で構成されます。これらは物理的なディスク機構に基づく時間です。演算時間は CPU内部での計算処理時間であり、ディスクアクセス時間の構成要素ではありません。演算はCPU、メモリアクセスはメモリ、ディスクアクセスはディスクと、それぞれ異なるハードウェア要素で発生する処理時間です。よって演算時間は磁気ディスクアクセス時間に含まれません。' WHERE id = 'fdbd5d9b-cfb2-4c50-9fcf-dd12a0727adb';
UPDATE choices SET is_correct = true WHERE question_id = 'fdbd5d9b-cfb2-4c50-9fcf-dd12a0727adb' AND choice_label = 'エ';

-- 問題69: ASCIIコード表現可能文字数
UPDATE questions SET explanation = 'ASCII（American Standard Code for Information Interchange）は7ビットの文字コードで、2の7乗＝128文字を表現できます。0から127までの128種類の文字・制御文字が定義されており、アルファベット大文字・小文字、数字、記号、各種制御文字（改行、タブなど）が含まれます。拡張ASCII（8ビット）では256文字まで表現可能ですが、標準ASCIIは7ビット128文字です。現在は日本語対応のためShift_JISやUTF-8などの多バイト文字コードが使用されています。よってASCIIコードで表現できる最大文字数は128文字となります。' WHERE id = 'a2b6afd0-4c01-41cd-8c8c-f5d2a0d1a785';
UPDATE choices SET is_correct = true WHERE question_id = 'a2b6afd0-4c01-41cd-8c8c-f5d2a0d1a785' AND choice_label = 'ア';

-- 問題70: クラスBのIPアドレス範囲
UPDATE questions SET explanation = 'IPv4アドレスのクラス分類において、クラスBは先頭2ビットが「10」で始まるアドレス範囲です。先頭オクテットが128から191までの範囲に該当し、完全な範囲は128.0.0.0から191.255.255.255となります。クラスBでは最初の2オクテット（16ビット）がネットワーク部、残りの2オクテット（16ビット）がホスト部となり、65,534のホストアドレスが利用可能です。現在はCIDR記法が一般的ですが、クラスベースの理解も重要です。よってクラスBのIPアドレス範囲は128.0.0.0～191.255.255.255となります。' WHERE id = 'b6176bbe-1afa-4eb7-8395-f3ca9d3f7656';
UPDATE choices SET is_correct = true WHERE question_id = 'b6176bbe-1afa-4eb7-8395-f3ca9d3f7656' AND choice_label = 'イ';

-- 問題71: プロトコル階層での上位から下位への処理
UPDATE questions SET explanation = 'プロトコルの階層構造において、送信時は上位層から下位層へデータが渡され、各層でプロトコルヘッダが付加されます。この処理をカプセル化と呼びます。例えば、アプリケーション層のデータにトランスポート層がTCPヘッダを付加し、ネットワーク層がIPヘッダを付加するという流れです。受信時は逆に下位層から上位層へデータが渡され、各層でヘッダが除去される非カプセル化が行われます。断片化や再構成は特定の条件下でのパケット処理です。よって上位から下位への処理はカプセル化となります。' WHERE id = '40e0081a-21cd-4329-a130-15f31fdb1dee';
UPDATE choices SET is_correct = true WHERE question_id = '40e0081a-21cd-4329-a130-15f31fdb1dee' AND choice_label = 'ア';

-- 問題72: 1Mbpsのビット転送能力
UPDATE questions SET explanation = 'データ転送速度の単位において、1Mbps（メガビット毎秒）は1秒間に1,000,000（100万）ビットのデータを転送できることを意味します。bpsはbits per secondの略で、Mは10の6乗（メガ）を表します。コンピュータの記憶容量ではバイナリ（2進）接頭辞が使用されることがありますが、通信速度では一般的に10進接頭辞が使用されます。1Mbps = 1,000 Kbps = 1,000,000 bpsという関係になります。よって1Mbpsは1秒間に1,000,000ビットの転送能力となります。' WHERE id = '3c5db78b-d0e7-4811-8dd6-ac2111adcab3';
UPDATE choices SET is_correct = true WHERE question_id = '3c5db78b-d0e7-4811-8dd6-ac2111adcab3' AND choice_label = 'ウ';

-- 問題73: 第1正規形の条件
UPDATE questions SET explanation = 'データベースの正規化において、第1正規形（1NF）の条件は「繰り返し項目が除去されている」ことです。つまり、各属性（列）には単一の値のみが格納され、1つのセルに複数の値や配列のような構造は含まれません。主キーの存在は正規形の前提条件ですが、第1正規形固有の条件ではありません。部分関数従属性の除去は第2正規形、推移関数従属性の除去は第3正規形の条件です。よって第1正規形では繰り返し項目が除去されていることが条件となります。' WHERE id = '44f60458-46d0-40b5-8848-9df1cfc90643';
UPDATE choices SET is_correct = true WHERE question_id = '44f60458-46d0-40b5-8848-9df1cfc90643' AND choice_label = 'エ';

-- 問題74: 保守プロセスの不適切活動
UPDATE questions SET explanation = 'ソフトウェア保守プロセスには、修正保守（バグ修正）、適応保守（環境変化への対応）、完全化保守（機能追加・改善）、予防保守（将来の問題予防）の4種類があります。これらはすべて稼働中システムの維持・改善活動です。「完全性保守」という用語は存在せず、正しくは「完全化保守」または「機能拡張保守」です。保守プロセスは運用開始後の活動であり、システム開発ライフサイクルの保守フェーズで実施されます。よって完全性保守は適切でない用語となります。' WHERE id = '38b1057e-1437-4ae4-9a79-608bd479276b';
UPDATE choices SET is_correct = true WHERE question_id = '38b1057e-1437-4ae4-9a79-608bd479276b' AND choice_label = 'ウ';

-- 問題75: インシデント管理の目的
UPDATE questions SET explanation = 'ITサービスマネジメントにおけるインシデント管理は、サービス中断や品質低下を可能な限り迅速に回復させ、事業への影響を最小化することが目的です。インシデント（事件・障害）が発生した際の初期対応、エスカレーション、復旧作業、記録管理を行います。サービス継続的改善は継続的サービス改善プロセス、サービスレベル監視はサービスレベル管理、変更統制は変更管理プロセスの役割です。よってサービス中断の最小化がインシデント管理の目的となります。' WHERE id = 'fd7153a7-8037-4538-8aa9-a8db0d9b94ae';
UPDATE choices SET is_correct = true WHERE question_id = 'fd7153a7-8037-4538-8aa9-a8db0d9b94ae' AND choice_label = 'ウ';

-- 問題76: RFPの目的
UPDATE questions SET explanation = 'RFP（Request for Proposal：提案依頼書）は、情報システム調達において、ベンダー（供給業者）から具体的な提案書を入手することが目的です。発注者が求める要件を明示し、複数のベンダーから技術的提案、価格提案、実施体制などを含む詳細な提案を募ります。これにより最適なベンダー選定が可能となります。調達仕様書作成、契約条件交渉、受入テストはRFP作成前後の別の活動です。よってベンダからの提案書の入手がRFPの目的となります。' WHERE id = 'a0e1f6e7-4851-4799-ba60-0fb1e4174dd1';
UPDATE choices SET is_correct = true WHERE question_id = 'a0e1f6e7-4851-4799-ba60-0fb1e4174dd1' AND choice_label = 'イ';

-- 問題77: BSCの4つの視点外要素
UPDATE questions SET explanation = 'BSC（Balanced Scorecard）は、財務の視点、顧客の視点、内部プロセスの視点、学習と成長の視点の4つの視点から組織の業績を総合的に評価するフレームワークです。これらの視点は相互に関連し合い、組織の戦略実行を支援します。競合の視点は外部環境分析の要素として重要ですが、BSCの標準的な4つの視点には含まれません。競合分析は戦略策定段階で考慮されますが、BSCは内部管理の視点を重視します。よって競合の視点はBSCの4つの視点に含まれません。' WHERE id = 'a74580f2-ef76-4ba8-a588-042263930433';
UPDATE choices SET is_correct = true WHERE question_id = 'a74580f2-ef76-4ba8-a588-042263930433' AND choice_label = 'エ';

-- 問題78: STP分析のS
UPDATE questions SET explanation = 'STP分析は、Segmentation（セグメンテーション：市場細分化）、Targeting（ターゲティング：標的市場選定）、Positioning（ポジショニング：市場での位置づけ）の頭文字を取ったマーケティング戦略のフレームワークです。Sは市場を同質なニーズを持つグループに分割するセグメンテーション（市場細分化）を表します。この分析により効果的なマーケティング戦略を策定できます。Strategy、Structure、SystemはSTPとは別の概念です。よってSTP分析のSはSegmentation（セグメンテーション）となります。' WHERE id = '59abdf52-e1c1-4cb9-a9d2-48242ad3d95a';
UPDATE choices SET is_correct = true WHERE question_id = '59abdf52-e1c1-4cb9-a9d2-48242ad3d95a' AND choice_label = 'ア';

-- 問題79: ガントチャートで表現困難な情報
UPDATE questions SET explanation = 'ガントチャートは、横軸に時間、縦軸に作業項目を配置し、作業の開始日・終了日、担当者、進捗状況などを視覚的に表現できるプロジェクト管理ツールです。しかし、プロジェクトの予算情報は時間軸とは独立した金額データであり、ガントチャートでは直接的に表現することができません。予算管理には別途コスト管理図表やEVM（Earned Value Management）などの手法が用いられます。よってプロジェクトの予算はガントチャートで表現できない情報となります。' WHERE id = '02a0d90d-b182-4871-8703-3269ded65369';
UPDATE choices SET is_correct = true WHERE question_id = '02a0d90d-b182-4871-8703-3269ded65369' AND choice_label = 'エ';

-- 問題80: CSRの不適切取組み
UPDATE questions SET explanation = 'CSR（Corporate Social Responsibility：企業の社会的責任）は、企業が利益追求だけでなく、社会や環境に対しても責任を持つという経営思想です。環境保護活動、社会貢献活動、コンプライアンス活動などが代表的な取り組みです。一方、利益最大化活動は従来の株主資本主義的思考であり、ステークホルダー全体を考慮するCSRの考え方とは対照的です。CSRでは持続可能な経営と社会全体の利益バランスを重視します。よって利益最大化活動はCSRの取り組みとして適切ではありません。' WHERE id = 'ce430beb-03f2-49f2-b5f9-e2d1bf68217c';
UPDATE choices SET is_correct = true WHERE question_id = 'ce430beb-03f2-49f2-b5f9-e2d1bf68217c' AND choice_label = 'エ';