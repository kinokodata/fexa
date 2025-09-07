-- ========================================
-- マネジメント系・ストラテジ系データをcategoriesテーブルに追加
-- ========================================

DO $$
DECLARE
    management_id UUID;
    strategy_id UUID;
    
    -- マネジメント系の大分類ID
    project_mgmt_id UUID;
    service_mgmt_id UUID;
    
    -- マネジメント系の中分類ID
    project_mgmt_medium_id UUID;
    service_mgmt_medium_id UUID;
    system_audit_id UUID;
    
    -- ストラテジ系の大分類ID
    system_strategy_id UUID;
    business_strategy_id UUID;
    enterprise_law_id UUID;
    
    -- ストラテジ系の中分類ID
    system_strategy_medium_id UUID;
    system_planning_id UUID;
    business_strategy_mgmt_id UUID;
    tech_strategy_mgmt_id UUID;
    business_industry_id UUID;
    enterprise_activity_id UUID;
    law_id UUID;
    
BEGIN
    -- 2. マネジメント系
    INSERT INTO categories (parent_id, level, name, display_order) VALUES 
    (NULL, 1, 'マネジメント系', 2) RETURNING id INTO management_id;
    
        -- プロジェクトマネジメント
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (management_id, 2, 'プロジェクトマネジメント', 1) RETURNING id INTO project_mgmt_id;
        
            -- プロジェクトマネジメント
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (project_mgmt_id, 3, 'プロジェクトマネジメント', 1) RETURNING id INTO project_mgmt_medium_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (project_mgmt_medium_id, 4, 'プロジェクトマネジメント', 1, 'プロジェクト, プロジェクトマネジメント, プロジェクトの環境, プロジェクトガバナンス, プロジェクトライフサイクル, プロジェクトの制約, テーラリング'),
                (project_mgmt_medium_id, 4, 'プロジェクトの統合', 2, 'プロジェクト憲章の作成, プロジェクト全体計画（プロジェクト計画及びプロジェクトマネジメント計画）の作成, プロジェクト作業の指揮, プロジェクト作業の管理, 変更の管理, プロジェクトフェーズ又はプロジェクトの終結, 得た教訓の収集'),
                (project_mgmt_medium_id, 4, 'プロジェクトのステークホルダ', 3, 'ステークホルダの特定, ステークホルダのマネジメント'),
                (project_mgmt_medium_id, 4, 'プロジェクトのスコープ', 4, 'スコープの定義, WBSの作成, 活動の定義, スコープの管理'),
                (project_mgmt_medium_id, 4, 'プロジェクトの資源', 5, 'プロジェクトチームの編成, 資源の見積り, プロジェクト組織の定義, プロジェクトチームの開発, 資源の管理, プロジェクトチームのマネジメント'),
                (project_mgmt_medium_id, 4, 'プロジェクトの時間', 6, '活動の順序付け, 活動期間の見積り, スケジュールの作成, スケジュールの管理'),
                (project_mgmt_medium_id, 4, 'プロジェクトのコスト', 7, 'コストの見積り, 予算の作成, コストの管理'),
                (project_mgmt_medium_id, 4, 'プロジェクトのリスク', 8, 'リスクの特定, リスクの評価, リスクへの対応, リスクの管理'),
                (project_mgmt_medium_id, 4, 'プロジェクトの品質', 9, '品質の計画, 品質保証の遂行, 品質管理の遂行'),
                (project_mgmt_medium_id, 4, 'プロジェクトの調達', 10, '調達の計画, 供給者の選定, 調達の運営管理'),
                (project_mgmt_medium_id, 4, 'プロジェクトのコミュニケーション', 11, 'コミュニケーションの計画, 情報の配布, コミュニケーションのマネジメント');
        
        -- サービスマネジメント
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (management_id, 2, 'サービスマネジメント', 2) RETURNING id INTO service_mgmt_id;
        
            -- サービスマネジメント
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (service_mgmt_id, 3, 'サービスマネジメント', 1) RETURNING id INTO service_mgmt_medium_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (service_mgmt_medium_id, 4, 'サービスマネジメント', 1, 'サービスマネジメント, サービスマネジメントシステム, サービス, サービスライフサイクル, ITIL, サービスの要求事項, サービスレベル合意書（SLA）, サービス及びサービスマネジメントシステムのパフォーマンス, 顧客, サービス提供者'),
                (service_mgmt_medium_id, 4, 'サービスマネジメントシステムの計画及び運用', 2, 'サービスマネジメントシステムの計画, サービスマネジメントシステムの支援（文書化した情報，知識ほか）, サービスポートフォリオ（サービスの提供，サービスの計画，サービスライフサイクルに関与する関係者の管理，サービスカタログ管理，資産管理，構成管理）, 関係及び合意（事業関係管理，サービスレベル管理，供給者管理）, 供給及び需要（サービスの予算業務及び会計業務，需要管理，容量・能力管理）, サービスの設計・構築・移行（変更管理，サービスの設計及び移行，リリース及び展開管理）, 解決及び実現（インシデント管理，サービス要求管理，問題管理）, サービス保証（サービス可用性管理，サービス継続管理）'),
                (service_mgmt_medium_id, 4, 'パフォーマンス評価及び改善', 3, 'パフォーマンス評価（監視・測定・分析・評価，内部監査，マネジメントレビュー，サービスの報告）, 改善（不適合及び是正処置，継続的改善）'),
                (service_mgmt_medium_id, 4, 'サービスの運用', 4, 'システム運用管理, 運用オペレーション, サービスデスク, 運用の資源管理, システムの監視と操作, スケジュール設計, 運用支援ツール（監視ツール，診断ツールほか）'),
                (service_mgmt_medium_id, 4, 'ファシリティマネジメント', 5, '設備管理（電気設備・空調設備ほか）, 施設管理, 施設・設備の維持保全, 環境側面');
            
            -- システム監査
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (service_mgmt_id, 3, 'システム監査', 2) RETURNING id INTO system_audit_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (system_audit_id, 4, 'システム監査', 1, 'システム監査の体制整備, 監査人の倫理, 監査の独立性と客観性の保持, 監査の能力及び正当な注意と秘密の保持, システム監査の計画・実施・報告・フォローアップ, システム監査基準, システム監査技法, 監査証拠, 監査調書, 情報セキュリティ監査, 監査による保証又は助言'),
                (system_audit_id, 4, '内部統制', 2, '内部統制の意義と目的, 内部統制の限界, 内部統制報告制度, ITへの対応（IT環境への対応，ITの利用，ITに係る全般統制，ITに係る業務処理統制）, CSA（統制自己評価）');

    -- 3. ストラテジ系
    INSERT INTO categories (parent_id, level, name, display_order) VALUES 
    (NULL, 1, 'ストラテジ系', 3) RETURNING id INTO strategy_id;
    
        -- システム戦略
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (strategy_id, 2, 'システム戦略', 1) RETURNING id INTO system_strategy_id;
        
            -- システム戦略
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (system_strategy_id, 3, 'システム戦略', 1) RETURNING id INTO system_strategy_medium_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (system_strategy_medium_id, 4, '情報システム戦略', 1, '情報システム戦略の意義と目的, 情報システム戦略の方針及び目標設定, 情報システム化基本計画, 情報システム戦略遂行のための組織体制, 情報システム投資計画, ビジネスモデル, 業務モデル, 情報システムモデル, エンタープライズアーキテクチャ（EA）, プログラムマネジメント, システムオーナー, データオーナー, プロセスフレームワーク, コントロールフレームワーク, 品質統制（品質統制フレームワーク）, 情報システム戦略評価, 情報システム戦略実行マネジメント, IT投資マネジメント, IT経営力指標'),
                (system_strategy_medium_id, 4, '業務プロセス', 2, 'BPR, 業務分析, 業務改善, 業務設計, ビジネスプロセスマネジメント（BPM）, BPO, オフショア, SFA'),
                (system_strategy_medium_id, 4, 'ソリューションビジネス', 3, 'ソリューションビジネスの種類とサービス形態, 業務パッケージ, 問題解決支援, ASP, SOA, クラウドサービス（SaaS，PaaS，IaaSほか）'),
                (system_strategy_medium_id, 4, 'システム活用促進・評価', 4, 'デジタルリテラシー, 普及啓発, 人材育成計画, システム利用実態の評価・検証, デジタルディバイド, システム廃棄');
            
            -- システム企画
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (system_strategy_id, 3, 'システム企画', 2) RETURNING id INTO system_planning_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (system_planning_id, 4, 'システム化計画', 1, 'システム化構想, システム化基本方針, 全体開発スケジュール, プロジェクト推進体制, 要員教育計画, 開発投資対効果, 投資の意思決定法（PBP，DCF法ほか）, ITポートフォリオ, システムライフサイクル, 情報システム導入リスク分析'),
                (system_planning_id, 4, '要件定義', 2, '要求分析, ユーザーニーズ調査, 現状分析, 課題定義, 要件定義手法, 業務要件定義, 機能要件定義, 非機能要件定義, 利害関係者要件の確認, 情報システム戦略との整合性検証'),
                (system_planning_id, 4, '調達計画・実施', 3, '調達計画, 調達の要求事項, 調達の条件, 提案依頼書（RFP）, 提案評価基準, 見積書, 提案書, 調達選定, 調達リスク分析, 内外作基準, ソフトウェア資産管理, ソフトウェアのサプライチェーンマネジメント');
        
        -- 経営戦略
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (strategy_id, 2, '経営戦略', 2) RETURNING id INTO business_strategy_id;
        
            -- 経営戦略マネジメント
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (business_strategy_id, 3, '経営戦略マネジメント', 1) RETURNING id INTO business_strategy_mgmt_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (business_strategy_mgmt_id, 4, '経営戦略手法', 1, '競争戦略, 差別化戦略, ブルーオーシャン戦略, ESG投資, コアコンピタンス, M&A, エコシステム, アライアンス, グループ経営, 企業理念, SWOT分析, VRIO分析, PPM, バリューチェーン分析, 成長マトリクス, アウトソーシング, シェアードサービス, インキュベーター'),
                (business_strategy_mgmt_id, 4, 'マーケティング', 2, 'マーケティング理論, マーケティング手法, マーケティング分析, バリュープロポジション, マーケティングミックス, デザイン思考, CXデザイン, サービスデザイン, ライフタイムバリュー（LTV）, 消費者行動モデル, 製品戦略, 製品ライフサイクル, Webマーケティング戦略, ブランド戦略, 価格戦略'),
                (business_strategy_mgmt_id, 4, 'ビジネス戦略と目標・評価', 3, 'ビジネス戦略立案, ビジネス環境分析, ニーズ・ウォンツ分析, 競合分析, PEST分析, 戦略目標, CSF, KPI, KGI, バランススコアカード'),
                (business_strategy_mgmt_id, 4, '経営管理システム', 4, 'CRM, SCM, ERP, 意思決定支援, ナレッジマネジメント, 企業内情報ポータル（EIP）');
            
            -- 技術戦略マネジメント
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (business_strategy_id, 3, '技術戦略マネジメント', 2) RETURNING id INTO tech_strategy_mgmt_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (tech_strategy_mgmt_id, 4, '技術開発戦略の立案', 1, '製品動向, 技術動向, 成功事例, 発想法, コア技術, 技術研究, 技術獲得, 技術供与, 技術提携, 技術経営（MOT）, 産学官連携, 標準化戦略'),
                (tech_strategy_mgmt_id, 4, '技術開発計画', 2, '技術開発投資計画, 技術開発拠点計画, 人材計画, 技術ロードマップ, 製品応用ロードマップ, 特許取得ロードマップ');
            
            -- ビジネスインダストリ
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (business_strategy_id, 3, 'ビジネスインダストリ', 3) RETURNING id INTO business_industry_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (business_industry_id, 4, 'ビジネスシステム', 1, '流通情報システム, 物流情報システム, 公共情報システム, 医療情報システム, 金融情報システム, 電子政府, POSシステム, XBRL, スマートグリッド, Web会議システム, IoT, AI利活用の原則及び指針, 人間中心のAI社会原則, AIの活用領域及び活用目的, AIによる認識, AIによる自動化, 生成AI, AIを利活用する上での留意事項, 説明可能なAI, ハルシネーション'),
                (business_industry_id, 4, 'エンジニアリングシステム', 2, 'エンジニアリングシステムの意義と目的, 生産管理システム, MRP, PDM, CAE'),
                (business_industry_id, 4, 'e-ビジネス', 3, 'EC（BtoB，BtoCなどの電子商取引）, 電子商取引の留意事項, 電子決済システム, デジタル通貨, EDI, ICカード・RFID応用システム, ソーシャルメディア（SNS，ミニブログほか）, ロングテール'),
                (business_industry_id, 4, '民生機器', 4, 'AV機器, 家電機器, 個人用情報機器（携帯電話，スマートフォン，タブレット端末ほか）, 教育・娯楽機器, コンピュータ周辺/OA機器, 業務用端末機器, 民生用通信端末機器'),
                (business_industry_id, 4, '産業機器', 5, '通信設備機器, 運輸機器/建設機器, 工業制御/FA機器/産業機器, 設備機器, 医療機器, 分析機器・計測機器, スマートファクトリー, スマート農業, ロボット, MaaS, 自動車制御システム');
        
        -- 企業と法務
        INSERT INTO categories (parent_id, level, name, display_order) VALUES 
        (strategy_id, 2, '企業と法務', 3) RETURNING id INTO enterprise_law_id;
        
            -- 企業活動
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (enterprise_law_id, 3, '企業活動', 1) RETURNING id INTO enterprise_activity_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (enterprise_activity_id, 4, '経営・組織論', 1, '経営管理, PDCA, 経営組織（事業部制，カンパニー制，CIO，CEOほか）, コーポレートガバナンス, CSR, IR, コーポレートアイデンティティ, グリーンIT, ヒューマンリソース（OJT，目標管理，ケーススタディ，裁量労働制ほか）, 行動科学（リーダーシップ，コミュニケーション，テクニカルライティング，プレゼンテーション，ネゴシエーション，モチベーションほか）, TQM, リスクマネジメント, BCP, 株式公開（IPO）, 社会におけるIT利活用の動向（デジタルトランスフォーメーション（DX），カーボンニュートラル，データ駆動社会ほか）'),
                (enterprise_activity_id, 4, '業務分析・データ利活用', 2, '線形計画法, 在庫問題, PERT/CPM, ゲーム理論, IE分析手法, 検査手法, 品質管理手法, データ利活用, データの収集, データの種類・特徴, データの加工・分析, 特徴量エンジニアリング, データサイエンス, データ分析における統計的手法, データの可視化, モデル化, シミュレーション, データ同化, 統計的バイアス, 認知バイアス'),
                (enterprise_activity_id, 4, '会計・財務', 3, '財務会計, 管理会計, 会計基準, 財務諸表, 連結会計, 減価償却, 損益分岐点, 財務指標, 原価, リースとレンタル, 資金計画と資金管理, 資産管理, 経済性計算, IFRS');
            
            -- 法務
            INSERT INTO categories (parent_id, level, name, display_order) VALUES 
            (enterprise_law_id, 3, '法務', 2) RETURNING id INTO law_id;
            
                INSERT INTO categories (parent_id, level, name, display_order, knowledges) VALUES 
                (law_id, 4, '知的財産権', 1, '著作権法, 産業財産権法, 不正競争防止法（営業秘密ほか）'),
                (law_id, 4, 'セキュリティ関連法規', 2, 'サイバーセキュリティ基本法, 不正アクセス禁止法, 刑法（ウイルス作成罪ほか）, 個人情報保護法, 特定個人情報の適正な取扱いに関するガイドライン, 情報流通プラットフォーム対処法, 特定電子メール法'),
                (law_id, 4, '労働関連・取引関連法規', 3, '労働基準法, 労働関連法規, 外部委託契約, ソフトウェア契約, ライセンス契約, OSSライセンス（GPL，BSDライセンスほか）, パブリックドメイン, クリエイティブコモンズ, 守秘契約（NDA）, 下請法, 労働者派遣法, 民法, 商法, 公益通報者保護法, 特定商取引法'),
                (law_id, 4, 'その他の法律・ガイドライン・技術者倫理', 4, 'コンプライアンス, 情報公開, 電気通信事業法, ネットワーク関連法規, 会社法, 金融商品取引法, 環境関連法, 産業機器関連法, 各種税法, 輸出関連法規, システム管理基準, ソフトウェア管理ガイドライン, 情報倫理, 技術者倫理, プロフェッショナリズム'),
                (law_id, 4, '標準化関連', 5, 'JIS, ISO, IEEEなどの関連機構の役割, 標準化団体, 国際認証の枠組み（認定/認証/試験機関）, 各種コード（文字コードほか）, JIS Q 15001, ISO 9000, ISO 14000');

END $$;