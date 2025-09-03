-- 基本情報技術者試験シラバスデータの挿入
-- fe_exam_syllabus_correct.jsonの内容をcategoriesテーブルに直接挿入

-- 一時的にIDを固定するための変数（実際のUUIDは自動生成される）
DO $$
DECLARE
    -- 分野レベルのID
    tech_field_id UUID;
    mgmt_field_id UUID;
    strategy_field_id UUID;
    
    -- 大分類レベルのID
    basic_theory_id UUID;
    algorithm_prog_id UUID;
    computer_system_id UUID;
    tech_elements_id UUID;
    dev_tech_id UUID;
    project_mgmt_id UUID;
    service_mgmt_id UUID;
    system_strategy_id UUID;
    business_strategy_id UUID;
    corporate_legal_id UUID;
    
    -- 中分類レベルのID（主要なもののみ定義）
    basic_theory_medium_id UUID;
    algorithm_prog_medium_id UUID;
    computer_components_id UUID;
    system_components_id UUID;
    software_id UUID;
    hardware_id UUID;
    ui_id UUID;
    multimedia_id UUID;
    database_id UUID;
    network_id UUID;
    security_id UUID;
    system_dev_tech_id UUID;
    sw_dev_mgmt_tech_id UUID;
    project_mgmt_medium_id UUID;
    service_mgmt_medium_id UUID;
    system_audit_id UUID;
    system_strategy_medium_id UUID;
    system_planning_id UUID;
    business_strategy_mgmt_id UUID;
    tech_strategy_mgmt_id UUID;
    business_industry_id UUID;
    corporate_activity_id UUID;
    legal_id UUID;
    
    -- 小分類レベルのID
    discrete_math_id UUID;
    applied_math_id UUID;
    info_theory_id UUID;
    comm_theory_id UUID;
    control_theory_id UUID;
    data_structure_id UUID;
    algorithm_id UUID;
    programming_id UUID;
    prog_lang_id UUID;
    other_lang_id UUID;
    processor_id UUID;
    memory_id UUID;
    bus_id UUID;
    io_device_id UUID;
    io_equipment_id UUID;
    
BEGIN

-- 1. 分野レベルの挿入
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (NULL, 'FE', 1, 'field', 'テクノロジ系', 1) RETURNING id INTO tech_field_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (NULL, 'FE', 1, 'field', 'マネジメント系', 2) RETURNING id INTO mgmt_field_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (NULL, 'FE', 1, 'field', 'ストラテジ系', 3) RETURNING id INTO strategy_field_id;

-- 2. テクノロジ系の大分類
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_field_id, 'FE', 2, 'major', '基礎理論', 1) RETURNING id INTO basic_theory_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_field_id, 'FE', 2, 'major', 'アルゴリズムとプログラミング', 2) RETURNING id INTO algorithm_prog_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_field_id, 'FE', 2, 'major', 'コンピュータシステム', 3) RETURNING id INTO computer_system_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_field_id, 'FE', 2, 'major', '技術要素', 4) RETURNING id INTO tech_elements_id;

-- 3. マネジメント系の大分類
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (mgmt_field_id, 'FE', 2, 'major', '開発技術', 1) RETURNING id INTO dev_tech_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (mgmt_field_id, 'FE', 2, 'major', 'プロジェクトマネジメント', 2) RETURNING id INTO project_mgmt_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (mgmt_field_id, 'FE', 2, 'major', 'サービスマネジメント', 3) RETURNING id INTO service_mgmt_id;

-- 4. ストラテジ系の大分類
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (strategy_field_id, 'FE', 2, 'major', 'システム戦略', 1) RETURNING id INTO system_strategy_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (strategy_field_id, 'FE', 2, 'major', '経営戦略', 2) RETURNING id INTO business_strategy_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (strategy_field_id, 'FE', 2, 'major', '企業と法務', 3) RETURNING id INTO corporate_legal_id;

-- 5. 基礎理論の中分類・小分類・知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (basic_theory_id, 'FE', 3, 'medium', '基礎理論', 1) RETURNING id INTO basic_theory_medium_id;

-- 基礎理論の小分類
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (basic_theory_medium_id, 'FE', 4, 'minor', '離散数学', 1) RETURNING id INTO discrete_math_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (basic_theory_medium_id, 'FE', 4, 'minor', '応用数学', 2) RETURNING id INTO applied_math_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (basic_theory_medium_id, 'FE', 4, 'minor', '情報に関する理論', 3) RETURNING id INTO info_theory_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (basic_theory_medium_id, 'FE', 4, 'minor', '通信に関する理論', 4) RETURNING id INTO comm_theory_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (basic_theory_medium_id, 'FE', 4, 'minor', '計測・制御に関する理論', 5) RETURNING id INTO control_theory_id;

-- 離散数学の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '2進数', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '基数', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '数値表現', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '演算精度', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '集合', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', 'ベン図', 6);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '論理演算', 7);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (discrete_math_id, 'FE', 5, 'knowledge', '命題', 8);

-- 応用数学の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (applied_math_id, 'FE', 5, 'knowledge', '確率・統計', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (applied_math_id, 'FE', 5, 'knowledge', '数値解析', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (applied_math_id, 'FE', 5, 'knowledge', '数式処理', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (applied_math_id, 'FE', 5, 'knowledge', 'グラフ理論', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (applied_math_id, 'FE', 5, 'knowledge', '待ち行列理論', 5);

-- 情報に関する理論の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', '符号理論', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', '述語論理', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', 'オートマトン', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', '形式言語', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', '計算量', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', 'AI（人工知能）', 6);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', '機械学習', 7);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', 'ディープラーニング（深層学習）', 8);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', 'ディープラーニングの応用', 9);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', 'コンパイラ理論', 10);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_theory_id, 'FE', 5, 'knowledge', 'プログラミング言語論・意味論', 11);

-- 通信に関する理論の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (comm_theory_id, 'FE', 5, 'knowledge', '伝送理論（伝送路，変復調方式，多重化方式，誤り検出・訂正，信号同期方式ほか）', 1);

-- 計測・制御に関する理論の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', '信号処理', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', 'フィードバック制御', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', 'フィードフォワード制御', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', '応答特性', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', '制御安定性', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', '各種制御', 6);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (control_theory_id, 'FE', 5, 'knowledge', 'センサー・アクチュエーターの種類と動作特性', 7);

-- 6. アルゴリズムとプログラミングの詳細展開
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (algorithm_prog_id, 'FE', 3, 'medium', 'アルゴリズムとプログラミング', 1) RETURNING id INTO algorithm_prog_medium_id;

-- アルゴリズムとプログラミングの小分類
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (algorithm_prog_medium_id, 'FE', 4, 'minor', 'データ構造', 1) RETURNING id INTO data_structure_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (algorithm_prog_medium_id, 'FE', 4, 'minor', 'アルゴリズム', 2) RETURNING id INTO algorithm_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (algorithm_prog_medium_id, 'FE', 4, 'minor', 'プログラミング', 3) RETURNING id INTO programming_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (algorithm_prog_medium_id, 'FE', 4, 'minor', 'プログラム言語', 4) RETURNING id INTO prog_lang_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (algorithm_prog_medium_id, 'FE', 4, 'minor', 'その他の言語', 5) RETURNING id INTO other_lang_id;

-- データ構造の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (data_structure_id, 'FE', 5, 'knowledge', 'スタックとキュー', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (data_structure_id, 'FE', 5, 'knowledge', 'リスト', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (data_structure_id, 'FE', 5, 'knowledge', '配列', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (data_structure_id, 'FE', 5, 'knowledge', '木構造', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (data_structure_id, 'FE', 5, 'knowledge', '2分木', 5);

-- アルゴリズムの知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '整列', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '併合', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '探索', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '再帰', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '文字列処理', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '自然言語処理', 6);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', '流れ図の理解', 7);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (algorithm_id, 'FE', 5, 'knowledge', 'アルゴリズム設計', 8);

-- プログラミングの知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (programming_id, 'FE', 5, 'knowledge', '既存言語を用いたプログラミング（プログラミング作法，プログラム構造，データ型，文法の表記法ほか）', 1);

-- プログラム言語の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (prog_lang_id, 'FE', 5, 'knowledge', 'プログラム言語（アセンブラ言語，C，C++，COBOL，Java，ECMAScript，Ruby，Perl，PHP，Pythonほか）の種類と特徴', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (prog_lang_id, 'FE', 5, 'knowledge', '共通言語基盤（CLI）', 2);

-- その他の言語の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (other_lang_id, 'FE', 5, 'knowledge', 'マークアップ言語（HTML，XMLほか）の種類と特徴', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (other_lang_id, 'FE', 5, 'knowledge', 'データ記述言語（DDL）', 2);

-- 7. コンピュータシステムの展開
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_system_id, 'FE', 3, 'medium', 'コンピュータ構成要素', 1) RETURNING id INTO computer_components_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_system_id, 'FE', 3, 'medium', 'システム構成要素', 2) RETURNING id INTO system_components_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_system_id, 'FE', 3, 'medium', 'ソフトウェア', 3) RETURNING id INTO software_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_system_id, 'FE', 3, 'medium', 'ハードウェア', 4) RETURNING id INTO hardware_id;

-- コンピュータ構成要素の小分類
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_components_id, 'FE', 4, 'minor', 'プロセッサ', 1) RETURNING id INTO processor_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_components_id, 'FE', 4, 'minor', 'メモリ', 2) RETURNING id INTO memory_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_components_id, 'FE', 4, 'minor', 'バス', 3) RETURNING id INTO bus_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_components_id, 'FE', 4, 'minor', '入出力デバイス', 4) RETURNING id INTO io_device_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (computer_components_id, 'FE', 4, 'minor', '入出力装置', 5) RETURNING id INTO io_equipment_id;

-- プロセッサの知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', 'コンピュータ及びプロセッサの種類', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', '構成・動作原理', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', '割込み', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', '性能と特性', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', '構造と方式', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', 'RISCとCISC', 6);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', '命令とアドレッシング', 7);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (processor_id, 'FE', 5, 'knowledge', 'マルチコアプロセッサ', 8);

-- メモリの知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (memory_id, 'FE', 5, 'knowledge', 'メモリの種類と特徴', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (memory_id, 'FE', 5, 'knowledge', 'メモリシステムの構成と記憶階層（キャッシュ，主記憶，補助記憶ほか）', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (memory_id, 'FE', 5, 'knowledge', 'アクセス方式', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (memory_id, 'FE', 5, 'knowledge', 'RAMファイル', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (memory_id, 'FE', 5, 'knowledge', 'メモリの容量と性能', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (memory_id, 'FE', 5, 'knowledge', '記録媒体の種類と特徴', 6);

-- バスの知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (bus_id, 'FE', 5, 'knowledge', 'バスの種類と特徴', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (bus_id, 'FE', 5, 'knowledge', 'バスのシステムの構成', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (bus_id, 'FE', 5, 'knowledge', 'バスの制御方式', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (bus_id, 'FE', 5, 'knowledge', 'バスのアクセスモード', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (bus_id, 'FE', 5, 'knowledge', 'バスの容量と性能', 5);

-- 入出力デバイスの知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_device_id, 'FE', 5, 'knowledge', '入出力デバイスの種類と特徴', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_device_id, 'FE', 5, 'knowledge', '入出力インタフェース', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_device_id, 'FE', 5, 'knowledge', 'デバイスドライバ', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_device_id, 'FE', 5, 'knowledge', 'デバイスとの同期', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_device_id, 'FE', 5, 'knowledge', 'アナログ・デジタル変換', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_device_id, 'FE', 5, 'knowledge', 'DMA', 6);

-- 入出力装置の知識項目
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '入力装置', 1);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '出力装置', 2);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '表示装置', 3);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '補助記憶装置・記憶媒体', 4);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '通信制御装置', 5);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '駆動装置', 6);
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (io_equipment_id, 'FE', 5, 'knowledge', '撮像装置', 7);

-- 8. 技術要素の詳細展開（主要部分のみ）
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_elements_id, 'FE', 3, 'medium', 'ユーザーインタフェース', 1) RETURNING id INTO ui_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_elements_id, 'FE', 3, 'medium', 'マルチメディア', 2) RETURNING id INTO multimedia_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_elements_id, 'FE', 3, 'medium', 'データベース', 3) RETURNING id INTO database_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_elements_id, 'FE', 3, 'medium', 'ネットワーク', 4) RETURNING id INTO network_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (tech_elements_id, 'FE', 3, 'medium', 'セキュリティ', 5) RETURNING id INTO security_id;

-- セキュリティの小分類と知識項目（重要度が高いため詳細に展開）
DECLARE
    info_security_id UUID;
    security_mgmt_id UUID;
    security_eval_id UUID;
    security_countermeasures_id UUID;
    security_impl_id UUID;
BEGIN
    -- セキュリティの小分類
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
    VALUES (security_id, 'FE', 4, 'minor', '情報セキュリティ', 1) RETURNING id INTO info_security_id;

    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
    VALUES (security_id, 'FE', 4, 'minor', '情報セキュリティ管理', 2) RETURNING id INTO security_mgmt_id;

    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
    VALUES (security_id, 'FE', 4, 'minor', 'セキュリティ技術評価', 3) RETURNING id INTO security_eval_id;

    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
    VALUES (security_id, 'FE', 4, 'minor', '情報セキュリティ対策', 4) RETURNING id INTO security_countermeasures_id;

    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
    VALUES (security_id, 'FE', 4, 'minor', 'セキュリティ実装技術', 5) RETURNING id INTO security_impl_id;

    -- 情報セキュリティの知識項目
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '情報の機密性・完全性・可用性', 1);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '多層防御', 2);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '脅威', 3);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', 'マルウェア・不正プログラム', 4);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '脆弱性', 5);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '不正のメカニズム', 6);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '攻撃者の種類・動機', 7);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', 'サイバー攻撃（SQLインジェクション，クロスサイトスクリプティング，DoS攻撃，フィッシング，パスワードリスト攻撃，標的型攻撃，AIを悪用した攻撃ほか）', 8);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '暗号技術（共通鍵，公開鍵，秘密鍵，RSA，AES，ハイブリッド暗号，ハッシュ関数ほか）', 9);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '認証技術（デジタル署名，メッセージ認証，タイムスタンプほか）', 10);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '利用者認証（利用者ID・パスワード，多要素認証，パスワードレス認証，アイデンティティ連携（OpenID，SAML）ほか）', 11);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '生体認証技術', 12);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '公開鍵基盤（PKI，認証局，デジタル証明書ほか）', 13);
    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) VALUES (info_security_id, 'FE', 5, 'knowledge', '政府認証基盤（GPKI，ブリッジ認証局ほか）', 14);

END;

-- 9. マネジメント系とストラテジ系は主要な構造のみ挿入
-- 開発技術
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (dev_tech_id, 'FE', 3, 'medium', 'システム開発技術', 1) RETURNING id INTO system_dev_tech_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (dev_tech_id, 'FE', 3, 'medium', 'ソフトウェア開発管理技術', 2) RETURNING id INTO sw_dev_mgmt_tech_id;

-- プロジェクトマネジメント
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (project_mgmt_id, 'FE', 3, 'medium', 'プロジェクトマネジメント', 1) RETURNING id INTO project_mgmt_medium_id;

-- サービスマネジメント
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (service_mgmt_id, 'FE', 3, 'medium', 'サービスマネジメント', 1) RETURNING id INTO service_mgmt_medium_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (service_mgmt_id, 'FE', 3, 'medium', 'システム監査', 2) RETURNING id INTO system_audit_id;

-- システム戦略
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (system_strategy_id, 'FE', 3, 'medium', 'システム戦略', 1) RETURNING id INTO system_strategy_medium_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (system_strategy_id, 'FE', 3, 'medium', 'システム企画', 2) RETURNING id INTO system_planning_id;

-- 経営戦略
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (business_strategy_id, 'FE', 3, 'medium', '経営戦略マネジメント', 1) RETURNING id INTO business_strategy_mgmt_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (business_strategy_id, 'FE', 3, 'medium', '技術戦略マネジメント', 2) RETURNING id INTO tech_strategy_mgmt_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (business_strategy_id, 'FE', 3, 'medium', 'ビジネスインダストリ', 3) RETURNING id INTO business_industry_id;

-- 企業と法務
INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (corporate_legal_id, 'FE', 3, 'medium', '企業活動', 1) RETURNING id INTO corporate_activity_id;

INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order) 
VALUES (corporate_legal_id, 'FE', 3, 'medium', '法務', 2) RETURNING id INTO legal_id;

END $$;