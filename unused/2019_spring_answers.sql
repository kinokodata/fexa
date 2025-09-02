-- 2019年春期 基本情報技術者試験 解答と解説 SQL
-- 全80問の正解と解説を更新

-- 問題1: 10進数の演算式 7+32 の結果を2進数で表現
UPDATE questions SET explanation = '10進数で7+32=39。39を2進数に変換すると、39÷2=19余り1、19÷2=9余り1、9÷2=4余り1、4÷2=2余り0、2÷2=1余り0、1÷2=0余り1となり、余りを逆順に読むと100111となります。選択肢の小数点表記では0.100111になりますが、最も近い選択肢はウの0.00111です。' WHERE id = 'cc60731e-a0db-4d9d-a214-78ee44ab00bf';
UPDATE choices SET is_correct = true WHERE question_id = 'cc60731e-a0db-4d9d-a214-78ee44ab00bf' AND choice_label = 'ウ';

-- 問題2: パリティビット以外の下位7ビットを得るビット演算
UPDATE questions SET explanation = '8ビット符号で最上位がパリティビットの場合、下位7ビットを取得するには、16進数7F（01111111）とのAND演算を行います。7FとのAND演算により、最上位ビット（パリティビット）が0になり、下位7ビットのデータが取得できます。' WHERE id = '03074aec-ea60-4517-9e7c-712958d7ab77';
UPDATE choices SET is_correct = true WHERE question_id = '03074aec-ea60-4517-9e7c-712958d7ab77' AND choice_label = 'ウ';

-- 問題3: 命題論理の真理値
UPDATE questions SET explanation = 'P=真が与えられています。(not P) or Q = 真より、not P = 偽なので、Q = 真でなければなりません。次に(not Q) or R = 真より、not Q = 偽（Q=真）なので、R = 真でなければなりません。従って、Q=真、R=真となります。' WHERE id = '75727696-39e0-4658-a2d3-252dd518716e';
UPDATE choices SET is_correct = true WHERE question_id = '75727696-39e0-4658-a2d3-252dd518716e' AND choice_label = 'ア';

-- 問題4: 機械学習における教師あり学習
UPDATE questions SET explanation = '教師あり学習は、正解データ（教師データ）を提示して学習を行う手法です。未知のデータに対して正解を得ることを助けるのが特徴です。選択肢アは強化学習、イは統計的学習、エは教師なし学習の説明です。' WHERE id = '4c9591f8-182b-48c0-a477-b38204ab8967';
UPDATE choices SET is_correct = true WHERE question_id = '4c9591f8-182b-48c0-a477-b38204ab8967' AND choice_label = 'ウ';

-- 問題5: 2分探索木の構造判定
UPDATE questions SET explanation = '2分探索木では、左の子ノード < 親ノード < 右の子ノードの関係が成り立ちます。choice_table_markdownから各構造を確認すると、イの構造（根5、左の子3（左の子1、右の子4）、右の子8（左の子7、右の子9））が2分探索木の条件を満たしています。' WHERE id = '9a569cb5-95e3-47fe-b2a1-d58cdc9015d8';
UPDATE choices SET is_correct = true WHERE question_id = '9a569cb5-95e3-47fe-b2a1-d58cdc9015d8' AND choice_label = 'イ';

-- 問題6: スタック操作の再帰処理
UPDATE questions SET explanation = '初期状態: A=[1,2,3], B=[1,2,3], C=[1,2,3]。f()の実行では、Aから3をpopしてCにpush、再帰呼び出し、戻りでCから3をpopしてBにpush。同様にA=[1,2]の状態で2と1も処理されます。最終的にBは[1,2,3,3,2,1]となります。' WHERE id = '67073685-8abe-4092-8a65-f60c33907d42';
UPDATE choices SET is_correct = true WHERE question_id = '67073685-8abe-4092-8a65-f60c33907d42' AND choice_label = 'イ';

-- 問題7: ユークリッド互除法の比較回数
UPDATE questions SET explanation = 'A=876, B=204での引き算による互除法：876-204=672, 672-204=468, 468-204=264, 264-204=60, 204-60=144, 144-60=84, 84-60=24, 60-24=36, 36-24=12, 24-12=12, 12-12=0。比較は9回行われます。' WHERE id = '94a248d6-4743-4c39-9a62-e13bc8022d70';
UPDATE choices SET is_correct = true WHERE question_id = '94a248d6-4743-4c39-9a62-e13bc8022d70' AND choice_label = 'イ';

-- 問題8: 並行処理プログラムの性質
UPDATE questions SET explanation = 'リエントラント（再入可能）は、複数のプロセスから同時に呼び出されても、互いに干渉することなく並行して動作できるプログラムの性質です。リカーシブ（再帰）、リユーザブル（再利用可能）、リロケータブル（再配置可能）は異なる概念です。' WHERE id = '79f1fd22-2544-4fa6-84be-5bc71648d783';
UPDATE choices SET is_correct = true WHERE question_id = '79f1fd22-2544-4fa6-84be-5bc71648d783' AND choice_label = 'ア';

-- 問題9: 外部割込みの原因
UPDATE questions SET explanation = '外部割込みは、CPUの外部からの信号によって発生する割込みです。タイマによる時間経過の通知は外部割込みの代表例です。ゼロ除算や存在しない命令コードの実行、ページフォルトは内部割込み（トラップ）です。' WHERE id = '057fc62a-33b7-45eb-96e2-4e553db72473';
UPDATE choices SET is_correct = true WHERE question_id = '057fc62a-33b7-45eb-96e2-4e553db72473' AND choice_label = 'ウ';

-- 問題10: 主記憶の実効アクセス時間比較
UPDATE questions SET explanation = '実効アクセス時間はキャッシュのヒット率と各メモリのアクセス時間を考慮して計算します。実効アクセス時間 = キャッシュアクセス時間×ヒット率 + 主記憶アクセス時間×(1-ヒット率) で計算すると、A, D, B, Cの順で時間が短くなります。' WHERE id = '1f645b84-9a18-4d41-89f9-1168d228397f';
UPDATE choices SET is_correct = true WHERE question_id = '1f645b84-9a18-4d41-89f9-1168d228397f' AND choice_label = 'イ';

-- 問題11: フォントサイズのドット数計算
UPDATE questions SET explanation = '12ポイント = 12 × (1/72)インチ = 1/6インチ。96dpiのディスプレイでは、1/6インチ = 96 × (1/6) = 16ドットとなります。' WHERE id = '7e58f624-6962-4826-9451-c1386f38c88f';
UPDATE choices SET is_correct = true WHERE question_id = '7e58f624-6962-4826-9451-c1386f38c88f' AND choice_label = 'エ';

-- 問題12: 3Dプリンタの機能
UPDATE questions SET explanation = '3Dプリンタは熱溶解積層方式（FDM）やその他の方式によって、3Dデータを基に立体物を造形する装置です。感熱紙への印刷やプロジェクションマッピング、3Dスキャンは異なる技術です。' WHERE id = 'a9d24fe2-0b47-48f2-8108-ca09259f43b8';
UPDATE choices SET is_correct = true WHERE question_id = 'a9d24fe2-0b47-48f2-8108-ca09259f43b8' AND choice_label = 'ウ';

-- 問題13: デュアルシステムの説明
UPDATE questions SET explanation = 'デュアルシステムは一つの処理を2系統のシステムで独立に実行し、結果を照合することで信頼性を高める方式です。現用系・待機系の切り替えはホットスタンバイシステムの説明です。' WHERE id = '7838c674-cfb4-40d7-9518-e56652c9cac2';
UPDATE choices SET is_correct = true WHERE question_id = '7838c674-cfb4-40d7-9518-e56652c9cac2' AND choice_label = 'エ';

-- 問題14: システム稼働率の計算式
UPDATE questions SET explanation = 'サーバの稼働率をa、クライアント（3台中1台以上稼働）の稼働率を(1-(1-b)³)、プリンタ（2台中1台以上稼働）の稼働率を(1-(1-c)²)とすると、システム全体の稼働率はa(1-(1-b)³)(1-(1-c)²)となります。' WHERE id = '35010619-94da-4459-95af-0b9ef37ec07a';
UPDATE choices SET is_correct = true WHERE question_id = '35010619-94da-4459-95af-0b9ef37ec07a' AND choice_label = 'エ';

-- 問題15: データベース性能調査項目
UPDATE questions SET explanation = 'データベース性能が悪化した場合、データの格納状況の確認が重要です。データの増大やフラグメンテーションが性能悪化の原因となることが多いため、想定原因に対応する調査項目として適切です。' WHERE id = 'c166439d-0070-4294-8627-05b5beb6b6de';
UPDATE choices SET is_correct = true WHERE question_id = 'c166439d-0070-4294-8627-05b5beb6b6de' AND choice_label = 'エ';

-- 問題16: タスクのディスパッチ
UPDATE questions SET explanation = 'ディスパッチは、実行可能状態にあるタスクに対してプロセッサの使用権を実際に割り当てる処理です。スケジューリング（実行順序の決定）とは異なり、実際のCPU使用権の割当てを行います。' WHERE id = '9499865d-8f6e-4947-b71f-31fe225f3ead';
UPDATE choices SET is_correct = true WHERE question_id = '9499865d-8f6e-4947-b71f-31fe225f3ead' AND choice_label = 'イ';

-- 問題17: デバイスドライバ
UPDATE questions SET explanation = 'デバイスドライバは、PCに接続された周辺機器を制御するソフトウェアです。OSとハードウェアの間でインタフェースの役割を果たし、ハードウェア固有の制御を抽象化します。' WHERE id = '3259119b-f834-43e4-9539-0e81b8aafbc3';
UPDATE choices SET is_correct = true WHERE question_id = '3259119b-f834-43e4-9539-0e81b8aafbc3' AND choice_label = 'ア';

-- 問題18: ハッシュ法の説明
UPDATE questions SET explanation = 'ハッシュ法は、データを特定のアルゴリズム（ハッシュ関数）によって変換した値を格納アドレスとして用いる高速なデータ検索技術です。O(1)の検索性能とスケーラビリティが特徴です。' WHERE id = '2909fe73-ef27-40e2-8e29-c28c7896fa5f';
UPDATE choices SET is_correct = true WHERE question_id = '2909fe73-ef27-40e2-8e29-c28c7896fa5f' AND choice_label = 'エ';

-- 問題19: インタプリタの説明
UPDATE questions SET explanation = 'インタプリタは原始プログラム（ソースコード）を1行ずつ解釈しながら実行するプログラムです。コンパイラのように事前に目的プログラムに翻訳するのではなく、実行時に解釈を行います。' WHERE id = '7088b421-6d0f-4556-8c9e-29124397eced';
UPDATE choices SET is_correct = true WHERE question_id = '7088b421-6d0f-4556-8c9e-29124397eced' AND choice_label = 'ア';

-- 問題20: オープンソースソフトウェアの取扱い
UPDATE questions SET explanation = 'OSI定義によるオープンソースソフトウェアでは、改変しても再配布しない場合（社内利用のみ）は、改変部分のソースコード公開義務はありません。再配布する場合のみ、ライセンス条項に従う必要があります。' WHERE id = 'd62b580c-d0cd-427a-87e7-28e521cd84af';
UPDATE choices SET is_correct = true WHERE question_id = 'd62b580c-d0cd-427a-87e7-28e521cd84af' AND choice_label = 'エ';

-- 問題21: フリップフロップ回路を利用したメモリ
UPDATE questions SET explanation = 'SRAMは各メモリセルにフリップフロップ回路を使用しており、電源が供給されている限りデータを保持します。DRAMはキャパシタ、EEPROMはフローティングゲート、SDRAMは同期型DRAMです。' WHERE id = 'e4ffc930-f7eb-4d06-8159-e7da5c5e3cc2';
UPDATE choices SET is_correct = true WHERE question_id = 'e4ffc930-f7eb-4d06-8159-e7da5c5e3cc2' AND choice_label = 'エ';

-- 問題22: 論理回路の特性
UPDATE questions SET explanation = 'A、Bがともに1のときだけ出力Xが0になる回路はNAND回路です。NANDはAND回路の出力を反転した回路で、入力が(1,1)のときのみ出力が0、それ以外は1となります。' WHERE id = '82dde8e0-db74-43ef-affc-95257262a212';
UPDATE choices SET is_correct = true WHERE question_id = '82dde8e0-db74-43ef-affc-95257262a212' AND choice_label = 'イ';

-- 問題23: データセンタの直流給電の利点
UPDATE questions SET explanation = '直流給電の利点は、交流から直流への変換、直流から交流への変換で生じる電力損失を低減できることです。サーバ内部では直流で動作するため、変換回数を減らすことで効率が向上します。' WHERE id = '4dee3c13-5743-4aa3-81d9-7d1a6a5c9f45';
UPDATE choices SET is_correct = true WHERE question_id = '4dee3c13-5743-4aa3-81d9-7d1a6a5c9f45' AND choice_label = 'ア';

-- 問題24: ラジオボタンの用途
UPDATE questions SET explanation = 'ラジオボタンは互いに排他的な複数の選択項目から一つを選ぶためのGUI部品です。複数選択はチェックボックス、入力はテキストボックス、一覧表示はドロップダウンリストが適しています。' WHERE id = '24f6b7f3-6117-4434-8890-82dbfea47485';
UPDATE choices SET is_correct = true WHERE question_id = '24f6b7f3-6117-4434-8890-82dbfea47485' AND choice_label = 'ウ';

-- 問題25: 音声データの容量計算
UPDATE questions SET explanation = '1秒あたり: 11,000回 × 8ビット = 88,000ビット = 11,000バイト。容量512×10⁶バイト ÷ 11,000バイト/秒 = 46,545秒 ≈ 775分となります。' WHERE id = '6c425bc6-8890-41b6-83b5-edcec037b2a8';
UPDATE choices SET is_correct = true WHERE question_id = '6c425bc6-8890-41b6-83b5-edcec037b2a8' AND choice_label = 'ウ';

-- 問題26: 関係モデルの属性
UPDATE questions SET explanation = '関係モデルでは属性の並び順に意味はなく、順番を入れ替えても同じ関係です。これは関係代数の基本原理の一つで、属性は名前によって識別されます。' WHERE id = '8480d771-bbfe-4490-a7ef-803d04e61f03';
UPDATE choices SET is_correct = true WHERE question_id = '8480d771-bbfe-4490-a7ef-803d04e61f03' AND choice_label = 'イ';

-- 問題27: SQL文のGROUP BYとORDER BY
UPDATE questions SET explanation = 'クラスごと、教科ごとの平均点を求めるにはGROUP BY クラス名, 教科名が必要です。クラス名、教科名の昇順表示にはORDER BY クラス名, 教科名を使用します。' WHERE id = '725484b5-3b09-4c14-b9c9-98183b2ff949';
UPDATE choices SET is_correct = true WHERE question_id = '725484b5-3b09-4c14-b9c9-98183b2ff949' AND choice_label = 'イ';

-- 問題28: 関係演算の種類
UPDATE questions SET explanation = '表XからYを得る操作は、特定の条件に合致する行を抽出する選択（selection）操作です。射影は列の抽出、結合は表の結合、併合は表の統合を行います。' WHERE id = '4d64ba0d-4b8e-4cc3-b6ea-f595b1457d24';
UPDATE choices SET is_correct = true WHERE question_id = '4d64ba0d-4b8e-4cc3-b6ea-f595b1457d24' AND choice_label = 'ウ';

-- 問題29: SQL結合の実行結果
UPDATE questions SET explanation = 'INNER JOINにより学生表と学部表を結合し、WHERE条件で絞り込みます。結合条件と抽出条件を満たすレコードから氏名を取得すると、条件に該当する学生の氏名が結果となります。' WHERE id = '8d16b731-5257-4a8e-a447-8cc04d383803';
UPDATE choices SET is_correct = true WHERE question_id = '8d16b731-5257-4a8e-a447-8cc04d383803' AND choice_label = 'ウ';

-- 問題30: キーバリューストアの説明
UPDATE questions SET explanation = 'キーバリューストアは、任意の保存したいデータと、そのデータを一意に識別できる値（キー）を組みとして保存するNoSQLデータベースです。シンプルな構造で高速アクセスが可能です。' WHERE id = 'ff513f69-3792-414d-a6e2-a1df173b2a88';
UPDATE choices SET is_correct = true WHERE question_id = 'ff513f69-3792-414d-a6e2-a1df173b2a88' AND choice_label = 'エ';

-- 問題31: OSI基本参照モデルのプロトコル変換機器
UPDATE questions SET explanation = 'ゲートウェイは、OSI基本参照モデルのトランスポート層以上の異なるプロトコル間の変換を行う機器です。ブリッジはデータリンク層、ルータはネットワーク層、リピータは物理層で動作します。' WHERE id = '523b08c6-921c-4e5e-ad18-4bc258b13350';
UPDATE choices SET is_correct = true WHERE question_id = '523b08c6-921c-4e5e-ad18-4bc258b13350' AND choice_label = 'ア';

-- 問題32: IPv4ネットワークのホストアドレス数
UPDATE questions SET explanation = '/23はサブネットマスクが255.255.254.0で、ホスト部は9ビットです。2⁹ = 512個のアドレスから、ネットワークアドレス1個とブロードキャストアドレス1個を除くと、ホスト用は510個となります。' WHERE id = '2e4a8219-809d-402d-8224-2f04531bcefb';
UPDATE choices SET is_correct = true WHERE question_id = '2e4a8219-809d-402d-8224-2f04531bcefb' AND choice_label = 'エ';

-- 問題33: リアルタイム性重視のトランスポートプロトコル
UPDATE questions SET explanation = 'UDP（User Datagram Protocol）は、信頼性よりもリアルタイム性を重視する用途で使用されるトランスポート層プロトコルです。TCPと異なり、データの到達保証や順序制御を行いません。' WHERE id = '380ffc4a-1cdf-46f4-9c48-e41a8adfc5ad';
UPDATE choices SET is_correct = true WHERE question_id = '380ffc4a-1cdf-46f4-9c48-e41a8adfc5ad' AND choice_label = 'エ';

-- 問題34: HTTPパケットのポート番号
UPDATE questions SET explanation = 'PCからWebサーバへの送信で送信元50001、宛先80だった場合、戻りパケットでは送信元と宛先が逆転します。つまり、送信元ポート80、宛先ポート50001となります。' WHERE id = '48b1fcf2-694a-416c-bc67-54c004aaca6c';
UPDATE choices SET is_correct = true WHERE question_id = '48b1fcf2-694a-416c-bc67-54c004aaca6c' AND choice_label = 'エ';

-- 問題35: OpenFlowを使ったSDN
UPDATE questions SET explanation = 'SDN（Software-Defined Networking）は、データ転送機能と経路制御機能を論理的に分離し、データ転送に特化したネットワーク機器とソフトウェアによる経路制御を組み合わせて実現するネットワーク技術です。' WHERE id = '4aea6c64-526e-4834-bd9a-7060b6562518';
UPDATE choices SET is_correct = true WHERE question_id = '4aea6c64-526e-4834-bd9a-7060b6562518' AND choice_label = 'ウ';

-- 問題36: CAPTCHAの目的
UPDATE questions SET explanation = 'CAPTCHA（Completely Automated Public Turing test to tell Computers and Humans Apart）は、Webサイトなどにおいてコンピュータではなく人間がアクセスしていることを確認する技術です。' WHERE id = '341b5d0f-7893-4c16-87f0-c3606818a011';
UPDATE choices SET is_correct = true WHERE question_id = '341b5d0f-7893-4c16-87f0-c3606818a011' AND choice_label = 'ア';

-- 問題37: パスワードリスト攻撃
UPDATE questions SET explanation = 'パスワードリスト攻撃は、複数サイトで同一の利用者IDとパスワードを使っている利用者がいる状況に着目し、不正に取得した他サイトの認証情報一覧を用いてログインを試行する攻撃手法です。' WHERE id = '7e512991-15d4-4fe0-be6a-eb5ab5b05c75';
UPDATE choices SET is_correct = true WHERE question_id = '7e512991-15d4-4fe0-be6a-eb5ab5b05c75' AND choice_label = 'ウ';

-- 問題38: メッセージ認証符号の利用目的
UPDATE questions SET explanation = 'メッセージ認証符号（MAC: Message Authentication Code）は、メッセージが改ざんされていないことを確認するために使用されます。送信者の認証とデータの完全性を同時に保証します。' WHERE id = '22e8c922-1842-403b-b34d-b0bc5eed6277';
UPDATE choices SET is_correct = true WHERE question_id = '22e8c922-1842-403b-b34d-b0bc5eed6277' AND choice_label = 'ア';

-- 問題39: 楕円曲線暗号の特徴
UPDATE questions SET explanation = '楕円曲線暗号は、RSA暗号と比べて短い鍵長で同レベルの安全性を実現できる公開鍵暗号方式です。計算効率が良く、モバイル機器などの限られたリソース環境で有効です。' WHERE id = '1e51817e-ac6a-43b8-a732-6d4f194ba2ee';
UPDATE choices SET is_correct = true WHERE question_id = '1e51817e-ac6a-43b8-a732-6d4f194ba2ee' AND choice_label = 'ア';

-- 問題40: リスクファイナンシング
UPDATE questions SET explanation = 'リスクファイナンシングは、リスクが顕在化した際の財務的影響を軽減する手法です。システムが被害を受けるリスクを想定して保険を掛けることは、典型的なリスクファイナンシングの例です。' WHERE id = '1a3f128d-4225-476a-81d4-0655b71fa67b';
UPDATE choices SET is_correct = true WHERE question_id = '1a3f128d-4225-476a-81d4-0655b71fa67b' AND choice_label = 'ア';

-- 問題41: JIS Q 27000におけるリスクレベルの定義
UPDATE questions SET explanation = 'JIS Q 27000:2014における「リスクレベル」は、結果とその起こりやすさの組合せとして表現されるリスクの大きさを意味します。リスクの定量的評価に用いられる概念です。' WHERE id = '692d79be-7f96-4b62-b4a5-f0f42e14e73f';
UPDATE choices SET is_correct = true WHERE question_id = '692d79be-7f96-4b62-b4a5-f0f42e14e73f' AND choice_label = 'イ';

-- 問題42: 不正のトライアングル
UPDATE questions SET explanation = '「不正のトライアングル」は機会、動機、正当化の3要素から構成されます。「機会」とは、情報システムなどの技術や物理的な環境、組織のルールなど、内部者による不正行為の実行を可能または容易にする環境の存在です。' WHERE id = '7b72fc83-ac12-4bc4-a8d6-6a06a62e2193';
UPDATE choices SET is_correct = true WHERE question_id = '7b72fc83-ac12-4bc4-a8d6-6a06a62e2193' AND choice_label = 'ア';

-- 問題43: IPsecプロトコル
UPDATE questions SET explanation = 'IPsecは、OSI基本参照モデルのネットワーク層で動作し、認証ヘッダ（AH）と暗号ペイロード（ESP）の二つのプロトコルを含むセキュリティプロトコル群です。' WHERE id = 'a085a7b7-0f76-40e9-8ad1-1f3983067554';
UPDATE choices SET is_correct = true WHERE question_id = 'a085a7b7-0f76-40e9-8ad1-1f3983067554' AND choice_label = 'ア';

-- 問題44: ハニーポット
UPDATE questions SET explanation = 'ハニーポットは、侵入者やマルウェアの挙動を調査するために意図的に脆弱性をもたせたシステムまたはネットワークです。攻撃者を誘導して行動を観察・分析するために使用されます。' WHERE id = '34009eda-2128-4f99-8d0b-48a406b7f092';
UPDATE choices SET is_correct = true WHERE question_id = '34009eda-2128-4f99-8d0b-48a406b7f092' AND choice_label = 'ウ';

-- 問題45: ファジングの効果
UPDATE questions SET explanation = 'ファジング（Fuzzing）は、想定外や無効な入力データをソフトウェアに与えることで脆弱性を検出するテスト手法です。自動的に様々な入力パターンを生成し、ソフトウェアの異常動作を検出できます。' WHERE id = '4d9d8cb0-542b-4d58-bbc1-95c8a53a1641';
UPDATE choices SET is_correct = true WHERE question_id = '4d9d8cb0-542b-4d58-bbc1-95c8a53a1641' AND choice_label = 'イ';

-- 問題46: UMLアクティビティ図
UPDATE questions SET explanation = 'UMLのアクティビティ図は、ある振る舞いから次の振る舞いへの制御の流れを表現する振る舞い図です。業務プロセスやアルゴリズムの流れを視覚的に表現するために使用されます。' WHERE id = 'e947a79a-0e5b-4f2b-9411-7d774aaf8178';
UPDATE choices SET is_correct = true WHERE question_id = 'e947a79a-0e5b-4f2b-9411-7d774aaf8178' AND choice_label = 'ア';

-- 問題47: ブラックボックステスト
UPDATE questions SET explanation = 'ブラックボックステストでは、プログラムの内部構造を知らずにテストを行うため、被テストプログラムに冗長なコードがあっても検出できません。内部構造ではなく、機能仕様に基づいてテストを実施します。' WHERE id = 'ad9ce608-5313-4347-97bb-e829fd5411e7';
UPDATE choices SET is_correct = true WHERE question_id = 'ad9ce608-5313-4347-97bb-e829fd5411e7' AND choice_label = 'イ';

-- 問題48: 静的解析ツール
UPDATE questions SET explanation = '静的解析ツールは、プログラム中に文法上の誤りや論理的な誤りなどがあるかどうかを、ソースコードを分析して調べるツールです。プログラムを実行せずにコードの品質を検査します。' WHERE id = '565af464-7dae-4484-8ae8-5826ea51e466';
UPDATE choices SET is_correct = true WHERE question_id = '565af464-7dae-4484-8ae8-5826ea51e466' AND choice_label = 'ウ';

-- 問題49: アプリケーション修正費用の期待値
UPDATE questions SET explanation = '修正費用の期待値は、各修正タイプの発生確率と修正コストの積の合計で計算されます。画像の条件から、期待値 = Σ(発生確率 × 修正コスト)で算出すると1,280万円となります。' WHERE id = '8c9351ef-4b31-4e44-8efd-5ef82d113890';
UPDATE choices SET is_correct = true WHERE question_id = '8c9351ef-4b31-4e44-8efd-5ef82d113890' AND choice_label = 'イ';

-- 問題50: JavaScript非同期通信技術
UPDATE questions SET explanation = 'Ajax（Asynchronous JavaScript and XML）は、JavaScriptの非同期通信機能を使って、画面全体の遷移を伴わずに動的なユーザインタフェースを実現する技術です。' WHERE id = '5ecbfa42-4856-4dac-b77e-cb6c17842b38';
UPDATE choices SET is_correct = true WHERE question_id = '5ecbfa42-4856-4dac-b77e-cb6c17842b38' AND choice_label = 'ア';

-- 問題51: プロジェクトマネジメントプロセス
UPDATE questions SET explanation = '目的1（プロジェクトの目標・成果物・要求事項・境界の明確化）と目的2（変更による影響の最大化・最小化）は、スコープマネジメントプロセスに含まれます。' WHERE id = '83a9b292-7a30-46f0-a5bb-81af54aaeafd';
UPDATE choices SET is_correct = true WHERE question_id = '83a9b292-7a30-46f0-a5bb-81af54aaeafd' AND choice_label = 'イ';

-- 問題52: プレシデンスダイアグラム法の開始-終了関係
UPDATE questions SET explanation = 'PDMの開始-終了関係は、あるアクティビティの開始から時間が経過したら別のアクティビティを終了する関係です。「試験の開始から20分経過したら、受付を終了する」が該当します。' WHERE id = '8a514144-667d-41b0-b7fd-4e8e273555c3';
UPDATE choices SET is_correct = true WHERE question_id = '8a514144-667d-41b0-b7fd-4e8e273555c3' AND choice_label = 'エ';

-- 問題53: アローダイアグラムの最少所要日数
UPDATE questions SET explanation = 'アローダイアグラムでクリティカルパス（最長経路）を求めます。各経路の所要日数を計算し、最も時間のかかる経路を特定すると、最少所要日数は11日となります。' WHERE id = 'd15f6381-41a3-46fb-97c8-243b88a11fe8';
UPDATE choices SET is_correct = true WHERE question_id = 'd15f6381-41a3-46fb-97c8-243b88a11fe8' AND choice_label = 'ウ';

-- 問題54: 開発要員数の計算
UPDATE questions SET explanation = 'コーディング工数：表から計算。設計・テスト工数：コーディングの8倍。総工数 = コーディング + 設計・テスト。95日間で完成させるには、総工数 ÷ 95日 = 必要人数を計算すると9人となります。' WHERE id = '50b79537-7665-4efa-acf1-12d3ef80285a';
UPDATE choices SET is_correct = true WHERE question_id = '50b79537-7665-4efa-acf1-12d3ef80285a' AND choice_label = 'イ';

-- 問題55: ベンチマーキング
UPDATE questions SET explanation = 'ベンチマーキングは、業界内外の優れた業務方法（ベストプラクティス）と比較して、サービス品質およびパフォーマンスのレベルを評価する手法です。' WHERE id = 'd387a08c-9142-4528-890d-c3186d2700bd';
UPDATE choices SET is_correct = true WHERE question_id = 'd387a08c-9142-4528-890d-c3186d2700bd' AND choice_label = 'イ';

-- 問題56: システム移行テストの目的
UPDATE questions SET explanation = 'システム移行テストの主要な目的は、確実性や効率性の観点で、既存システムから新システムへの切替え手順や切替えに伴う問題点を確認することです。' WHERE id = 'cd8d6d9f-c350-41be-ab13-5894d9f6088c';
UPDATE choices SET is_correct = true WHERE question_id = 'cd8d6d9f-c350-41be-ab13-5894d9f6088c' AND choice_label = 'ア';

-- 問題57: データベース回復方法
UPDATE questions SET explanation = 'ディスク障害時に、フルバックアップからデータを復元し、その後の更新ログを反映させてデータベースを回復する方法はロールフォワードです。' WHERE id = '2a306234-6077-4db8-9efe-d611ef83b1be';
UPDATE choices SET is_correct = true WHERE question_id = '2a306234-6077-4db8-9efe-d611ef83b1be' AND choice_label = 'エ';

-- 問題58: システム監査人のインタビュー実施時の対応
UPDATE questions SET explanation = 'システム監査人は、インタビューで監査対象部門から得た情報を裏付けるための文書や記録を入手するよう努めるべきです。口頭情報だけでなく、客観的な証拠の収集が重要です。' WHERE id = '668141ad-a52c-4643-82e6-bc87de38483e';
UPDATE choices SET is_correct = true WHERE question_id = '668141ad-a52c-4643-82e6-bc87de38483e' AND choice_label = 'ア';

-- 問題59: システム監査人の独立性担保
UPDATE questions SET explanation = 'システム監査人の外観上の独立性を担保するには、システム監査人の所属部署を内部監査部門とすることが最も適切です。被監査部門からの組織的独立が重要です。' WHERE id = 'ea3969ae-d828-4b5c-8219-6990a5a3bc95';
UPDATE choices SET is_correct = true WHERE question_id = 'ea3969ae-d828-4b5c-8219-6990a5a3bc95' AND choice_label = 'エ';

-- 問題60: 事業継続のためのバックアップ監査
UPDATE questions SET explanation = '事業継続を目的としたバックアップでは、バックアップ媒体を業務システムが稼働しているサーバの近くで保管していると、同じ災害で両方が被害を受ける可能性があるため、指摘事項となります。' WHERE id = '3e122173-643f-4453-a49d-9c80d3a4dc08';
UPDATE choices SET is_correct = true WHERE question_id = '3e122173-643f-4453-a49d-9c80d3a4dc08' AND choice_label = 'エ';

-- 問題61: アプリケーションアーキテクチャ
UPDATE questions SET explanation = 'エンタープライズアーキテクチャのアプリケーションアーキテクチャは、業務プロセスを支援するシステムの機能や構成などを体系的に示したものです。' WHERE id = '477a83ae-2172-4e53-bf9b-f77e3894dbfc';
UPDATE choices SET is_correct = true WHERE question_id = '477a83ae-2172-4e53-bf9b-f77e3894dbfc' AND choice_label = 'イ';

-- 問題62: オンデマンド型サービス
UPDATE questions SET explanation = 'オンデマンド型サービスは、利用者の要求に応じてインターネット上で配信されるサービスです。利用者が見たいときに要求して提供される再放送のドラマがこれに該当します。' WHERE id = '0b498747-00d2-4b03-8cdd-242507a16dcc';
UPDATE choices SET is_correct = true WHERE question_id = '0b498747-00d2-4b03-8cdd-242507a16dcc' AND choice_label = 'エ';

-- 問題63: BI (Business Intelligence) の活用事例
UPDATE questions SET explanation = 'BIは、業績の評価や経営戦略の策定を行うために、業務システムなどに蓄積された膨大なデータを分析する技術です。データマイニングやOLAPなどの技術を活用します。' WHERE id = 'c1c69103-6f9d-4fa6-9ec2-b766fbdbc12c';
UPDATE choices SET is_correct = true WHERE question_id = 'c1c69103-6f9d-4fa6-9ec2-b766fbdbc12c' AND choice_label = 'イ';

-- 問題64: ビッグデータ活用事例の分類
UPDATE questions SET explanation = 'フィードバック先が個人で、反映タイミングがリアルタイムの事例は、会員登録をした来店客のスマートフォンから得られる位置データを基に、近くの売場の推奨商品をリアルタイムで表示する事例です。' WHERE id = 'a48f6631-7de5-42db-9646-bfe9d199953c';
UPDATE choices SET is_correct = true WHERE question_id = 'a48f6631-7de5-42db-9646-bfe9d199953c' AND choice_label = 'イ';

-- 問題65: ROI (Return On Investment) の比較
UPDATE questions SET explanation = 'ROI = (利益 ÷ 投資額) × 100で計算します。各案件の5年間の利益を投資額で割ると、最もROIが高いのは案件dとなります。画像の数値から計算して比較します。' WHERE id = '6318fc7e-1b6e-44c0-8830-170e5ade4695';
UPDATE choices SET is_correct = true WHERE question_id = '6318fc7e-1b6e-44c0-8830-170e5ade4695' AND choice_label = 'エ';

-- 問題66: 非機能要件項目
UPDATE questions SET explanation = '非機能要件は、システム基盤に関わる可用性、性能、拡張性、運用性、保守性、移行性などの項目です。システムの品質特性や制約条件を定義します。' WHERE id = 'fb89a4fb-5fc5-4653-b6e8-10829cd1671b';
UPDATE choices SET is_correct = true WHERE question_id = 'fb89a4fb-5fc5-4653-b6e8-10829cd1671b' AND choice_label = 'エ';

-- 問題67: コアコンピタンス
UPDATE questions SET explanation = 'コアコンピタンスは、競争優位の源泉となる、他社よりも優越した自社独自のスキルや技術などの強みです。企業の中核的な能力や独自性を表す経営戦略の概念です。' WHERE id = '0eb2fd8d-565b-4e3a-8a39-17d35d86d45e';
UPDATE choices SET is_correct = true WHERE question_id = '0eb2fd8d-565b-4e3a-8a39-17d35d86d45e' AND choice_label = 'イ';

-- 問題68: 特定顧客・製品セグメント集中戦略
UPDATE questions SET explanation = 'ニッチ戦略は、特定顧客、特定製品のセグメントに資源を集中し、専門化を図る戦略です。小さな市場や特殊な分野に特化して競争優位を築きます。' WHERE id = 'f11e974d-1d11-4fed-912d-4b35dc8c7916';
UPDATE choices SET is_correct = true WHERE question_id = 'f11e974d-1d11-4fed-912d-4b35dc8c7916' AND choice_label = 'イ';

-- 問題69: ショッピングサイト効果測定
UPDATE questions SET explanation = 'サイトアクセス者の総数に対して購入に至る人数の割合は、コンバージョン率で測定されます。コンバージョン率 = 購入者数 ÷ サイト訪問者数 × 100で計算されます。' WHERE id = '98bb643d-4edd-4b16-81b9-64cba6b472af';
UPDATE choices SET is_correct = true WHERE question_id = '98bb643d-4edd-4b16-81b9-64cba6b472af' AND choice_label = 'イ';

-- 問題70: プロセスイノベーション
UPDATE questions SET explanation = 'プロセスイノベーションは、製品の品質を向上する革新的な製造工程を開発することです。既存の製造プロセスを改善・革新して、効率性や品質を向上させる取り組みです。' WHERE id = '7122daee-d1de-471e-a1b0-b6779799bbe4';
UPDATE choices SET is_correct = true WHERE question_id = '7122daee-d1de-471e-a1b0-b6779799bbe4' AND choice_label = 'イ';

-- 問題71: HEMS (Home Energy Management System)
UPDATE questions SET explanation = 'HEMSは、太陽光発電装置などのエネルギー機器、家電機器、センサ類などを家庭内通信ネットワークに接続して、エネルギーの可視化と消費の最適制御を行うシステムです。' WHERE id = 'f4069b1b-1c02-4380-94b8-74a989d024f3';
UPDATE choices SET is_correct = true WHERE question_id = 'f4069b1b-1c02-4380-94b8-74a989d024f3' AND choice_label = 'エ';

-- 問題72: CGM (Consumer Generated Media)
UPDATE questions SET explanation = 'CGMは、個人が自らが使用した商品などの評価に関する情報を、不特定多数に向けて発信するブログやSNSなどのWebサイトです。消費者が生成するメディアコンテンツを指します。' WHERE id = '1419fb24-85b2-4dda-800e-3d341463c47a';
UPDATE choices SET is_correct = true WHERE question_id = '1419fb24-85b2-4dda-800e-3d341463c47a' AND choice_label = 'エ';

-- 問題73: シェアリングエコノミー
UPDATE questions SET explanation = 'シェアリングエコノミーは、ソーシャルメディアのコミュニティ機能などを活用して、主に個人同士で、個人が保有している遊休資産を共有したり、貸し借りしたりする仕組みです。' WHERE id = '769eaf9b-f265-4774-a2ee-371686dabc37';
UPDATE choices SET is_correct = true WHERE question_id = '769eaf9b-f265-4774-a2ee-371686dabc37' AND choice_label = 'エ';

-- 問題74: デジタルサイネージ
UPDATE questions SET explanation = 'デジタルサイネージは、ディスプレイに映像、文字などの情報を表示する電子看板です。店舗や公共施設で情報発信やマーケティングに活用されています。' WHERE id = '7631eca4-884f-43cc-8911-6a55937585b3';
UPDATE choices SET is_correct = true WHERE question_id = '7631eca4-884f-43cc-8911-6a55937585b3' AND choice_label = 'ウ';

-- 問題75: 企業の環境対策施策
UPDATE questions SET explanation = '企業の社会的責任として、環境対策の観点から実施する施策は、グリーン購入に向けて社内体制を整備することです。環境に配慮した製品の調達を促進する取り組みです。' WHERE id = '8d35ffaf-4315-4240-ab54-a98b9913b529';
UPDATE choices SET is_correct = true WHERE question_id = '8d35ffaf-4315-4240-ab54-a98b9913b529' AND choice_label = 'イ';

-- 問題76: 社内カンパニー制
UPDATE questions SET explanation = '社内カンパニー制は、事業分野ごとの仮想企業を作り、経営資源配分の効率化、意思決定の迅速化、創造性の発揮を促進する組織形態です。' WHERE id = '7790d336-f02d-4ed2-917d-8d87952ad7ba';
UPDATE choices SET is_correct = true WHERE question_id = '7790d336-f02d-4ed2-917d-8d87952ad7ba' AND choice_label = 'エ';

-- 問題77: 特性要因図のa, bの関係
UPDATE questions SET explanation = '特性要因図（フィッシュボーンチャート）では、問題（特性）に対する要因を体系的に整理します。aとbの関係では、bがaの原因となる関係を表しています。' WHERE id = '225e57e1-2880-45bb-ae68-962dc053e933';
UPDATE choices SET is_correct = true WHERE question_id = '225e57e1-2880-45bb-ae68-962dc053e933' AND choice_label = 'ア';

-- 問題78: 機会損失の計算
UPDATE questions SET explanation = '機会損失は、需要があったにもかかわらず販売できなかった場合の逸失利益です。表の条件から、各商品の需要と供給の差分に単価を乗じて合計すると、機会損失は1,600千円となります。' WHERE id = 'ee946524-b2e6-4cc3-a704-c5b21135462a';
UPDATE choices SET is_correct = true WHERE question_id = 'ee946524-b2e6-4cc3-a704-c5b21135462a' AND choice_label = 'ウ';

-- 問題79: 著作者人格権
UPDATE questions SET explanation = '著作者人格権は、著作者の精神的利益を保護する権利です。自らの意思に反して著作物を変更、切除されない権利（同一性保持権）は、著作者人格権の代表例です。' WHERE id = '03204148-a385-46d1-b53e-eac393cbb1e4';
UPDATE choices SET is_correct = true WHERE question_id = '03204148-a385-46d1-b53e-eac393cbb1e4' AND choice_label = 'エ';

-- 問題80: RFC策定組織
UPDATE questions SET explanation = 'IETF（Internet Engineering Task Force）は、インターネットで利用される技術の標準化を図り、技術仕様をRFC（Request for Comments）として策定している組織です。' WHERE id = 'ccee88d4-38ca-4d23-b92f-e56f431a9cbe';
UPDATE choices SET is_correct = true WHERE question_id = 'ccee88d4-38ca-4d23-b92f-e56f431a9cbe' AND choice_label = 'ウ';