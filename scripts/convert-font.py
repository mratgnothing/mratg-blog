import os
import sys
from fontTools.ttLib import TTFont

def convert_ttf_to_woff2(ttf_path, woff2_path):
    print(f"Loading {ttf_path}...")
    font = TTFont(ttf_path)
    print(f"Converting to WOFF2 and saving to {woff2_path}...")
    font.flavor = 'woff2'
    font.save(woff2_path)
    print("Conversion complete!")
    
    orig_size = os.path.getsize(ttf_path)
    new_size = os.path.getsize(woff2_path)
    reduction = (orig_size - new_size) / orig_size * 100
    print(f"Original size: {orig_size:,} bytes")
    print(f"New size: {new_size:,} bytes")
    print(f"Reduction: {reduction:.2f}%")

if __name__ == '__main__':
    src = "public/fonts/IdeaFonts-XiangSuZhiCheng.ttf"
    dst = "public/fonts/IdeaFonts-XiangSuZhiCheng.woff2"
    if os.path.exists(src):
        convert_ttf_to_woff2(src, dst)
    else:
        print(f"Source file {src} not found!")
