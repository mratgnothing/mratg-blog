import os
from PIL import Image

def inspect_images(directory):
    print(f"{'Filename':<30} | {'Format':<6} | {'Dimensions':<12} | {'Size (KB)':<10}")
    print("-" * 65)
    for root, dirs, files in os.walk(directory):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.png', '.jpg', '.jpeg']:
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, directory)
                size_kb = os.path.getsize(path) / 1024
                try:
                    with Image.open(path) as img:
                        print(f"{rel_path:<30} | {img.format:<6} | {f'{img.width}x{img.height}':<12} | {size_kb:.2f}")
                except Exception as e:
                    print(f"{rel_path:<30} | Error  | {'N/A':<12} | {size_kb:.2f} ({e})")

if __name__ == '__main__':
    inspect_images("public/assets")
