-- ========================================
-- fe_exam_syllabus.jsonデータをcategoriesテーブルに投入
-- 階層構造：分野 → 大分類 → 中分類 → 小分類
-- 知識項目は小分類のknowledgesカラムにカンマ区切りで格納
-- ========================================


-- データ投入
-- 1. テクノロジ系
INSERT INTO categories (parent_id, level, name, display_order) VALUES 
(NULL, 1, 'テクノロジ系', 1);

-- テクノロジ系のIDを取得（後で使用）
DO $$
DECLARE
    technology_id UUID;
    basic_theory_id UUID;
    computer_system_id UUID;
    technology_elements_id UUID;
    development_technology_id UUID;
    
    -- 基礎理論の中分類ID
    basic_theory_medium_id UUID;
    algorithm_medium_id UUID;
    
    -- コンピュータシステムの中分類ID
    computer_components_id UUID;
    system_components_id UUID;
    software_id UUID;
    hardware_id UUID;
    
    -- 技術要素の中分類ID
    ui_id UUID;
    info_media_id UUID;
    database_id UUID;
    network_id UUID;
    security_id UUID;
    
    -- 開発技術の中分類ID
    system_dev_id UUID;
    software_dev_id UUID;
    
BEGIN
    -- テクノロジ系のIDを取得
    SELECT id INTO technology_id FROM categories WHERE name = 'テクノロジ系';
    
    -- 基礎理論
    INSERT INTO categories (parent_id, level, name, display_order) VALUES 
    (technology_id, 2, '基礎理論', 1) RETURNING id INTO basic_theory_id;
    
        -- 基礎理論 → 基礎理論
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (basic_theory_id, 3, '基礎理論', 1) RETURNING id INTO basic_theory_medium_id;
        
            -- 小分類
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (basic_theory_medium_id, 4, '離散数学', 1, '2進数, 基数, 数値表現, 演算精度, 集合, ベン図, 論理演算, 命題'),
            (basic_theory_medium_id, 4, '応用数学', 2, '確率・統計, 数値解析, 数式処理, グラフ理論, 待ち行列理論'),
            (basic_theory_medium_id, 4, '情報に関する理論', 3, '符号理論, 述語論理, オートマトン, 形式言語, 計算量, AI（人工知能）, 機械学習, ディープラーニング（深層学習）, ディープラーニングの応用, コンパイラ理論, プログラミング言語論・意味論'),
            (basic_theory_medium_id, 4, '通信に関する理論', 4, '伝送理論（伝送路，変復調方式，多重化方式，誤り検出・訂正，信号同期方式ほか）'),
            (basic_theory_medium_id, 4, '計測・制御に関する理論', 5, '信号処理, フィードバック制御, フィードフォワード制御, 応答特性, 制御安定性, 各種制御, センサー・アクチュエーターの種類と動作特性');
        
        -- 基礎理論 → アルゴリズムとプログラミング
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (basic_theory_id, 3, 'アルゴリズムとプログラミング', 2) RETURNING id INTO algorithm_medium_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (algorithm_medium_id, 4, 'データ構造', 1, 'スタックとキュー, リスト, 配列, 木構造, 2分木'),
            (algorithm_medium_id, 4, 'アルゴリズム', 2, '整列, 併合, 探索, 再帰, 文字列処理, 自然言語処理, 流れ図の理解, アルゴリズム設計'),
            (algorithm_medium_id, 4, 'プログラミング', 3, '既存言語を用いたプログラミング（プログラミング作法，プログラム構造，データ型，文法の表記法ほか）'),
            (algorithm_medium_id, 4, 'プログラム言語', 4, 'プログラム言語（アセンブラ言語，C，C++，COBOL，Java，ECMAScript，Ruby，Perl，PHP，Pythonほか）の種類と特徴, 共通言語基盤（CLI）'),
            (algorithm_medium_id, 4, 'その他の言語', 5, 'マークアップ言語（HTML，XMLほか）の種類と特徴, データ記述言語（DDL）');
    
    -- コンピュータシステム
    INSERT INTO categories (parent_id, level, name, display_order) VALUES 
    (technology_id, 2, 'コンピュータシステム', 2) RETURNING id INTO computer_system_id;
    
        -- コンピュータ構成要素
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (computer_system_id, 3, 'コンピュータ構成要素', 1) RETURNING id INTO computer_components_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (computer_components_id, 4, 'プロセッサ', 1, 'コンピュータ及びプロセッサの種類, 構成・動作原理, 割込み, 性能と特性, 構造と方式, RISCとCISC, 命令とアドレッシング, マルチコアプロセッサ'),
            (computer_components_id, 4, 'メモリ', 2, 'メモリの種類と特徴, メモリシステムの構成と記憶階層（キャッシュ，主記憶，補助記憶ほか）, アクセス方式, RAMファイル, メモリの容量と性能, 記録媒体の種類と特徴'),
            (computer_components_id, 4, 'バス', 3, 'バスの種類と特徴, バスのシステムの構成, バスの制御方式, バスのアクセスモード, バスの容量と性能'),
            (computer_components_id, 4, '入出力デバイス', 4, '入出力デバイスの種類と特徴, 入出力インタフェース, デバイスドライバ, デバイスとの同期, アナログ・デジタル変換, DMA'),
            (computer_components_id, 4, '入出力装置', 5, '入力装置, 出力装置, 表示装置, 補助記憶装置・記憶媒体, 通信制御装置, 駆動装置, 撮像装置');
        
        -- システム構成要素
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (computer_system_id, 3, 'システム構成要素', 2) RETURNING id INTO system_components_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (system_components_id, 4, 'システムの構成', 1, 'システムの処理形態, システムの利用形態, システムの適用領域, 仮想化, クライアントサーバシステム, Webシステム, シンクライアントシステム, フォールトトレラントシステム, RAID, NAS, SAN, ハイパフォーマンスコンピューティング（HPC）, クラウドコンピューティング, クラスタ'),
            (system_components_id, 4, 'システムの評価指標', 2, 'システムの性能指標, システムの性能特性と評価, システムの信頼性・経済性の意義と目的, 信頼性計算, 信頼性指標, 信頼性特性と評価, 経済性の評価, キャパシティプランニング');
        
        -- ソフトウェア
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (computer_system_id, 3, 'ソフトウェア', 3) RETURNING id INTO software_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (software_id, 4, 'オペレーティングシステム', 1, 'OSの種類と特徴, OSの機能, 多重プログラミング, 仮想記憶, ジョブ管理, プロセス/タスク管理, データ管理, 入出力管理, 記憶管理, 割込み, ブートストラップ'),
            (software_id, 4, 'ミドルウェア', 2, '各種ミドルウェア（OSなどのAPI，Web API，各種ライブラリ，コンポーネントウェア，シェル，開発フレームワークほか）の役割と機能, ミドルウェアの選択と利用'),
            (software_id, 4, 'ファイルシステム', 3, 'ファイルシステムの種類と特徴, アクセス手法, 検索手法, ディレクトリ管理, バックアップ, ファイル編成'),
            (software_id, 4, '開発ツール', 4, '設計ツール, 構築ツール, ローコード/ノーコードツール, テストツール, 言語処理ツール（コンパイラ，インタプリタ，リンカ，ローダほか）, エミュレーター，シミュレーター, インサーキットエミュレーター（ICE）, ツールチェーン, 統合開発環境'),
            (software_id, 4, 'オープンソースソフトウェア', 5, 'OSSの種類と特徴, UNIX系OS, オープンソースコミュニティ, LAMP/LAPP, オープンソースライブラリ, OSSの利用・活用と考慮点（安全性，信頼性ほか）, 動向');
        
        -- ハードウェア
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (computer_system_id, 3, 'ハードウェア', 4) RETURNING id INTO hardware_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (hardware_id, 4, 'ハードウェア', 1, '電気・電子回路, 機械・制御, 論理設計, 構成部品及び要素と実装, 半導体素子, システムLSI, SoC（System on a Chip）, FPGA, MEMS, 診断プログラム, 消費電力');
    
    -- 技術要素
    INSERT INTO categories (parent_id, level, name, display_order) VALUES 
    (technology_id, 2, '技術要素', 3) RETURNING id INTO technology_elements_id;
    
        -- ユーザーインタフェース
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (technology_elements_id, 3, 'ユーザーインタフェース', 1) RETURNING id INTO ui_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (ui_id, 4, 'ユーザーインタフェース技術', 1, '情報アーキテクチャ, GUI, 音声認識, 画像認識, 動画認識, 特徴抽出, 学習機能, インタラクティブシステム, ユーザビリティ, アクセシビリティ'),
            (ui_id, 4, 'UX/UIデザイン', 2, 'UXデザイン, 情報デザイン, 帳票設計, 画面設計, コード設計, Webデザイン, 人間中心設計, ユニバーサルデザイン, ユーザビリティ評価');
        
        -- 情報メディア
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (technology_elements_id, 3, '情報メディア', 2) RETURNING id INTO info_media_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (info_media_id, 4, 'マルチメディア技術', 1, 'オーサリング環境, 音声処理, 静止画処理, 動画処理, メディア統合, 圧縮・伸長, MPEG'),
            (info_media_id, 4, 'マルチメディア応用', 2, '色の表現（色相，明度，彩度ほか）, 画像の品質（画素，解像度ほか）, グラフィックスソフトウェア, CG（Computer Graphics）, XR（クロスリアリティ）, メタバース, メディア応用, モーションキャプチャ');
        
        -- データベース
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (technology_elements_id, 3, 'データベース', 3) RETURNING id INTO database_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (database_id, 4, 'データベース方式', 1, 'データベースの種類と特徴, データベースのモデル, DBMS'),
            (database_id, 4, 'データベース設計', 2, 'データ分析, メタデータ, データベースの論理設計, データの正規化, データベースのパフォーマンス設計, データベースの物理設計'),
            (database_id, 4, 'データ操作', 3, 'データベースの操作, データベースを操作するための言語（SQLほか）, 関係代数'),
            (database_id, 4, 'トランザクション処理', 4, '排他制御, リカバリ処理, トランザクション管理, データベースの性能向上, データへのアクセス制御'),
            (database_id, 4, 'データベース応用', 5, 'データウェアハウス, データマイニング, 分散データベース, リポジトリ, ビッグデータ');
        
        -- ネットワーク
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (technology_elements_id, 3, 'ネットワーク', 4) RETURNING id INTO network_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (network_id, 4, 'ネットワーク方式', 1, 'ネットワークの種類と特徴（WAN/LAN，有線･無線，センサーネットワークほか）, インターネット技術, 回線に関する計算, パケット交換網, QoS, RADIUS'),
            (network_id, 4, 'データ通信と制御', 2, '伝送方式と回線, LAN間接続装置, 回線接続装置, 電力線通信（PLC）, OSI基本参照モデル, メディアアクセス制御（MAC）, データリンク制御, ルーティング制御, フロー制御'),
            (network_id, 4, '通信プロトコル', 3, 'プロトコルとインタフェース, TCP/IP, HDLC, CORBA, HTTP, DNS, SOAP, IPv6'),
            (network_id, 4, 'ネットワーク管理', 4, 'ネットワーク仮想化（SDN，NFVほか）, ネットワーク運用管理（SNMP）, 障害管理, 性能管理, トラフィック監視'),
            (network_id, 4, 'ネットワーク応用', 5, 'インターネット, イントラネット, エクストラネット, ネットワークOS, 通信サービス, LTE, 5G, モバイル通信技術');
        
        -- セキュリティ
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (technology_elements_id, 3, 'セキュリティ', 5) RETURNING id INTO security_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (security_id, 4, '情報セキュリティ', 1, '情報の機密性・完全性・可用性, 多層防御, 脅威, マルウェア・不正プログラム, 脆弱性, 不正のメカニズム, 攻撃者の種類・動機, サイバー攻撃（SQLインジェクション，クロスサイトスクリプティング，DoS攻撃，フィッシング，パスワードリスト攻撃，標的型攻撃，AIを悪用した攻撃ほか）, 暗号技術（共通鍵，公開鍵，秘密鍵，RSA，AES，ハイブリッド暗号，ハッシュ関数ほか）, 認証技術（デジタル署名，メッセージ認証，タイムスタンプほか）, 利用者認証（利用者ID・パスワード，多要素認証，パスワードレス認証，アイデンティティ連携（OpenID，SAML）ほか）, 生体認証技術, 公開鍵基盤（PKI，認証局，デジタル証明書ほか）, 政府認証基盤（GPKI，ブリッジ認証局ほか）'),
            (security_id, 4, '情報セキュリティ管理', 2, '情報資産とリスクの概要, 情報資産の調査・分類, リスクの種類, 情報セキュリティリスクアセスメント及びリスク対応, 情報セキュリティ継続, 情報セキュリティ諸規程（情報セキュリティポリシーを含む組織内規程）, ISMS, 情報セキュリティ管理策（組織的管理策，人的管理策，物理的管理策，技術的管理策）, 情報セキュリティ組織・機関（CSIRT，SOC（Security Operation Center），エシカルハッカーほか）, コンピュータ不正アクセス対策基準, コンピュータウイルス対策基準, PCI DSS'),
            (security_id, 4, 'セキュリティ技術評価', 3, 'ISO/IEC 15408（コモンクライテリア）, JISEC（ITセキュリティ評価及び認証制度）, JCMVP（暗号モジュール試験及び認証制度）, CVSS, 脆弱性検査, ペネトレーションテスト'),
            (security_id, 4, '情報セキュリティ対策', 4, '情報セキュリティ啓発（教育，訓練ほか）, 組織における内部不正防止ガイドライン, マルウェア・不正プログラム対策, ランサムウェア対策, 不正アクセス対策, 情報漏えい対策, アカウント管理, ログ管理, 脆弱性管理, 入退室管理, アクセス制御, 侵入検知/侵入防止, 検疫ネットワーク, 携帯端末（携帯電話，スマートフォン，タブレット端末ほか）のセキュリティ, クラウドサービスのセキュリティ, IoTのセキュリティ, AIを使ったセキュリティ技術, AIそのものを守るセキュリティ技術, セキュリティ製品・サービス（ファイアウォール，WAF，DLP，SIEMほか）, デジタルフォレンジックス'),
            (security_id, 4, 'セキュリティ実装技術', 5, 'セキュアプロトコル（IPsec，SSL/TLS，SSH，WPA3ほか）, 認証・認可技術（SPF，DKIM，SMTP-AUTH，OAuth，DNSSECほか）, セキュアOS, ネットワークセキュリティ, データベースセキュリティ, アプリケーションセキュリティ, コンテナセキュリティ, セキュアプログラミング');
    
    -- 開発技術
    INSERT INTO categories (parent_id, level, name, display_order) VALUES 
    (technology_id, 2, '開発技術', 4) RETURNING id INTO development_technology_id;
    
        -- システム開発技術
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (development_technology_id, 3, 'システム開発技術', 1) RETURNING id INTO system_dev_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (system_dev_id, 4, 'システム要件定義・ソフトウェア要件定義', 1, 'システム要件定義（機能，境界，能力，業務・組織及び利用者の要件，設計及び実装の制約条件，適格性確認要件ほか）, システム要件の評価, ソフトウェア要件定義（機能，境界，能力，インタフェース，業務モデル，データモデルほか）, ソフトウェア要件の評価, UXを考慮した要件の定義'),
            (system_dev_id, 4, '設計', 2, 'システム設計（ハードウェア・ソフトウェア・サービス・手作業の機能分割，ハードウェア構成決定，ソフトウェア構成決定，システム処理方式決定，データベース方式決定ほか）, システム統合テストの設計, アーキテクチャ及びシステム要素の評価, ソフトウェア設計（ソフトウェア構造とソフトウェア要素の設計ほか）, インタフェース設計, UXデザイン, ソフトウェアユニットのテストの設計, ソフトウェア統合テストの設計, ソフトウェア要素の評価, ソフトウェア品質, レビュー, ソフトウェア設計手法（プロセス中心設計，データ中心設計，構造化設計，オブジェクト指向設計ほか）, モジュールの設計, 部品化と再利用, アーキテクチャパターン, デザインパターン'),
            (system_dev_id, 4, '実装・構築', 3, 'ソフトウェアユニットの作成, コーディング標準, コーディング支援手法, コードレビュー, メトリクス計測, デバッグ, テスト手法, テスト準備（テスト環境，テストデータほか）, テストの実施, テスト結果の評価'),
            (system_dev_id, 4, '統合・テスト', 4, '統合テスト計画, 統合テストの準備（テスト環境，テストデータほか）, 統合テストの実施, 検証テストの実施, 統合及び検証テスト結果の評価, チューニング, テストの種類（機能テスト，非機能要件テスト，性能テスト，負荷テスト，セキュリティテスト，回帰テストほか）'),
            (system_dev_id, 4, '導入・受入れ支援', 5, '導入計画の作成, 導入の実施, 受入れレビューと受入れテスト, 納入と受入れ, 教育訓練, 利用者用文書類, 妥当性確認テストの実施, 妥当性確認テストの結果の管理'),
            (system_dev_id, 4, '保守・廃棄', 6, '保守の形態, 保守の手順, 廃棄');
        
        -- ソフトウェア開発管理技術
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (development_technology_id, 3, 'ソフトウェア開発管理技術', 2) RETURNING id INTO software_dev_id;
        
            INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
            (software_dev_id, 4, '開発プロセス・手法', 1, 'ソフトウェア開発モデル, アジャイル開発, DevOps, ローコード/ノーコード開発, ソフトウェア再利用, リバースエンジニアリング, マッシュアップ, 構造化手法, 形式手法, ソフトウェアライフサイクルプロセス（SLCP）, プロセス成熟度'),
            (software_dev_id, 4, '知的財産適用管理', 2, '著作権管理, 特許管理, 保管管理, 技術的保護（コピーガード，DRM，アクティベーションほか）'),
            (software_dev_id, 4, '開発環境管理', 3, '開発環境稼働状況管理, 開発環境構築, 設計データ管理, ツール管理, ライセンス管理'),
            (software_dev_id, 4, '構成管理・変更管理', 4, '構成識別体系の確立, 変更管理, 構成状況の記録, 品目の完全性保証, リリース管理及び出荷');

END $$;