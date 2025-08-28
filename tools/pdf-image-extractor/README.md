# PDF画像抽出ツール

text-data.mdファイルから画像情報を解析し、PDFから指定座標の画像を抽出してimagesディレクトリに保存し、Markdownリンクに置き換えるツールです。

## 機能

1. **画像情報解析**: text-data.md内の`[IMAGE: x-y]`形式の画像情報を解析
2. **画像抽出**: PDFから指定座標の画像を高解像度で抽出
3. **画像保存**: imagesディレクトリに画像を保存（1_1.png等の形式）
4. **Markdown置換**: 画像情報を`![alt](./images/xxx.png)`リンクに自動置換

## 使用方法

### Docker Compose での実行（推奨）

```bash
# プロジェクトルートから実行
docker compose --profile tools run --rm pdf-extractor /work/pdfs/2017_h
```

### 直接実行

```bash
cd tools/pdf-image-extractor
python extract_images.py /path/to/target/directory
```

## 対象ディレクトリの構造

処理対象のディレクトリには以下のファイルが必要です：

```
target_directory/
├── *.pdf              # PDFファイル（自動検出）
└── text-data.md        # 画像情報が記述されたMarkdownファイル
```

## 処理後の構造

```
target_directory/
├── *.pdf
├── text-data.md        # 画像情報がMarkdownリンクに置換済み
└── images/             # 抽出された画像
    ├── 1_1.png
    ├── 1_2.png
    └── ...
```

## 画像情報の形式

text-data.md内で以下の形式で記述された画像情報を処理します：

```markdown
[IMAGE: 1-1] 図表タイトル
位置情報: (x,y,width,height)
内容説明: 図表の詳細な説明
```

これが以下のMarkdownリンクに置換されます：

```markdown
![図表タイトル](./images/1_1.png)
```

## 依存関係

- Python 3.11
- PyMuPDF (fitz): PDF処理
- Pillow: 画像処理

## エラーハンドリング

- PDFファイルが見つからない場合はエラー終了
- text-data.mdファイルが見つからない場合はエラー終了
- 座標情報が不正な場合は警告を出力してスキップ
- 画像抽出に失敗した場合は警告を出力してスキップ

## 注意事項

- 座標系はPDFの左上を原点とした座標系を使用
- 高解像度（3倍スケール）で画像を抽出するため、処理時間がかかる場合があります
- 既存のimagesディレクトリは上書きされます