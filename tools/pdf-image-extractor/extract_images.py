#!/usr/bin/env python3
"""
PDF画像抽出・Markdown置換ツール

text-data.mdファイルから画像情報を解析し、PDFから指定座標の画像を抽出して
imagesディレクトリに保存し、Markdownリンクに置き換える。

使用方法:
    python extract_images.py [TARGET_DIR]
    
    TARGET_DIR: 処理対象のディレクトリ（デフォルト: /work/pdfs/2017_h）
"""

import os
import re
import sys
import fitz  # PyMuPDF
from pathlib import Path
import io


class PDFImageExtractor:
    def __init__(self, target_dir):
        self.target_dir = Path(target_dir)
        self.pdf_path = None
        self.markdown_path = self.target_dir / "text-data.md"
        self.images_dir = self.target_dir / "images"
        self.pdf_doc = None
        
        # PDFファイルを検索
        pdf_files = list(self.target_dir.glob("*.pdf"))
        if pdf_files:
            self.pdf_path = pdf_files[0]
        else:
            raise FileNotFoundError(f"No PDF files found in {target_dir}")
        
    def __enter__(self):
        self.pdf_doc = fitz.open(str(self.pdf_path))
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.pdf_doc:
            self.pdf_doc.close()
    
    def create_images_directory(self):
        """imagesディレクトリを作成"""
        self.images_dir.mkdir(exist_ok=True)
        print(f"Created directory: {self.images_dir}")
    
    def parse_image_info(self, markdown_content):
        """Markdownから画像情報を解析"""
        # 画像情報のパターン: [IMAGE: page-number] title\n位置情報: (x,y,width,height)\n内容説明: description
        pattern = r'\[IMAGE: ([^\]]+)\] ([^\n]+)\n位置情報: \(([^)]+)\)\n内容説明: ([^\n]+)'
        
        matches = re.findall(pattern, markdown_content)
        image_infos = []
        
        for match in matches:
            image_id = match[0]
            title = match[1]
            coords = match[2]
            description = match[3]
            
            # 座標を解析 (x,y,width,height)
            try:
                coord_values = [float(x.strip()) for x in coords.split(',')]
                if len(coord_values) == 4:
                    x, y, width, height = coord_values
                    
                    # ページ番号を抽出
                    page_num = int(image_id.split('-')[0]) - 1  # 0-indexed
                    
                    image_infos.append({
                        'id': image_id,
                        'title': title,
                        'page': page_num,
                        'x': x,
                        'y': y,
                        'width': width,
                        'height': height,
                        'description': description,
                        'filename': f"{image_id.replace('-', '_')}.png"
                    })
                else:
                    print(f"Warning: Invalid coordinates for {image_id}: {coords}")
            except (ValueError, IndexError) as e:
                print(f"Error parsing coordinates for {image_id}: {e}")
        
        return image_infos
    
    def extract_page_as_image(self, page_num, crop_rect=None):
        """ページ全体または指定領域を画像として抽出"""
        try:
            page = self.pdf_doc[page_num]
            
            # 高解像度でレンダリング
            mat = fitz.Matrix(3, 3)  # 3倍のスケール
            
            if crop_rect:
                # 指定領域をクロップ
                rect = fitz.Rect(crop_rect['x'], crop_rect['y'], 
                               crop_rect['x'] + crop_rect['width'], 
                               crop_rect['y'] + crop_rect['height'])
                pix = page.get_pixmap(matrix=mat, clip=rect)
            else:
                # ページ全体
                pix = page.get_pixmap(matrix=mat)
            
            if pix.width > 0 and pix.height > 0:
                # PNG形式で保存
                return pix.tobytes("png")
            else:
                print(f"Warning: Empty image at page {page_num+1}")
                return None
                
        except Exception as e:
            print(f"Error extracting page image {page_num+1}: {e}")
            return None
    
    def save_image(self, image_data, filename):
        """画像データをファイルに保存"""
        if image_data:
            filepath = self.images_dir / filename
            with open(filepath, 'wb') as f:
                f.write(image_data)
            print(f"Saved image: {filepath}")
            return True
        return False
    
    def replace_image_info_with_links(self, markdown_content, image_infos):
        """画像情報をMarkdownリンクに置換"""
        updated_content = markdown_content
        
        for info in image_infos:
            # 元のパターンを検索（改行とスペースを考慮）
            pattern = rf'\[IMAGE: {re.escape(info["id"])}\] {re.escape(info["title"])}\s*\n位置情報: \([^)]+\)\s*\n内容説明: [^\n]+'
            
            # Markdownリンクに置換
            replacement = f'![{info["title"]}](./images/{info["filename"]})'
            
            updated_content = re.sub(pattern, replacement, updated_content, flags=re.MULTILINE)
        
        return updated_content
    
    def process(self):
        """メイン処理"""
        print(f"Processing PDF: {self.pdf_path}")
        print(f"Processing Markdown: {self.markdown_path}")
        
        # ファイルの存在確認
        if not self.pdf_path.exists():
            print(f"Error: PDF file not found: {self.pdf_path}")
            return 0
            
        if not self.markdown_path.exists():
            print(f"Error: Markdown file not found: {self.markdown_path}")
            return 0
        
        # Markdownファイルを読み込み
        with open(self.markdown_path, 'r', encoding='utf-8') as f:
            markdown_content = f.read()
        
        # 画像情報を解析
        image_infos = self.parse_image_info(markdown_content)
        print(f"Found {len(image_infos)} images to extract")
        
        if not image_infos:
            print("No images found to extract.")
            return 0
        
        # imagesディレクトリを作成
        self.create_images_directory()
        
        # 画像を抽出・保存
        successful_extractions = []
        for info in image_infos:
            print(f"Extracting {info['id']}: {info['title']}")
            
            # PDFから画像を抽出
            image_data = self.extract_page_as_image(
                info['page'], 
                {
                    'x': info['x'], 
                    'y': info['y'], 
                    'width': info['width'], 
                    'height': info['height']
                }
            )
            
            # 画像を保存
            if self.save_image(image_data, info['filename']):
                successful_extractions.append(info)
        
        print(f"Successfully extracted {len(successful_extractions)} images")
        
        # Markdownの画像情報をリンクに置換
        if successful_extractions:
            updated_markdown = self.replace_image_info_with_links(markdown_content, successful_extractions)
            
            # 更新されたMarkdownを保存
            with open(self.markdown_path, 'w', encoding='utf-8') as f:
                f.write(updated_markdown)
            
            print(f"Updated markdown file: {self.markdown_path}")
        
        return len(successful_extractions)


def main():
    # コマンドライン引数の処理
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
    else:
        target_dir = "/work/pdfs/2017_h"
    
    print(f"Target directory: {target_dir}")
    
    # ディレクトリの存在確認
    if not Path(target_dir).exists():
        print(f"Error: Target directory not found: {target_dir}")
        return 1
    
    # 画像抽出処理を実行
    try:
        with PDFImageExtractor(target_dir) as extractor:
            extracted_count = extractor.process()
            print(f"\nProcessing completed. Extracted {extracted_count} images.")
            return 0 if extracted_count > 0 else 1
    except Exception as e:
        print(f"Error during processing: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())