import os
from PIL import Image

def optimize_png(src_path, dst_path, max_dim=None, to_palette=False):
    with Image.open(src_path) as img:
        # Resize if max_dim is specified
        if max_dim:
            w, h = img.size
            if max(w, h) > max_dim:
                ratio = max_dim / max(w, h)
                new_w = int(w * ratio)
                new_h = int(h * ratio)
                # For pixel art, use nearest neighbor or box to keep it crisp.
                # For photo-like PNGs, use Resampling.LANCZOS.
                # Let's check if it's pixel art based on name.
                is_pixel_art = any(x in os.path.basename(src_path) for x in ['pixel', 'icon', 'avatar', 'studio', 'desk', 'archive'])
                resample = Image.Resampling.NEAREST if is_pixel_art else Image.Resampling.LANCZOS
                img = img.resize((new_w, new_h), resample=resample)
        
        # Convert to palette if specified (great for pixel art)
        if to_palette:
            # Keep alpha channel if present
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img = img.convert('RGBA')
                # Quantize with alpha support
                img = img.quantize(colors=256)
            else:
                img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
        
        img.save(dst_path, format='PNG', optimize=True)

def optimize_jpg(src_path, dst_path, max_dim=None, quality=82):
    with Image.open(src_path) as img:
        if max_dim:
            w, h = img.size
            if max(w, h) > max_dim:
                ratio = max_dim / max(w, h)
                new_w = int(w * ratio)
                new_h = int(h * ratio)
                img = img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
        
        img.save(dst_path, format='JPEG', optimize=True, quality=quality)

def run_optimization(dry_run=True):
    directory = "public/assets"
    total_saved = 0
    print("=" * 80)
    print(f"{'DRY RUN' if dry_run else 'OPTIMIZING'} IMAGE ASSETS")
    print("=" * 80)
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            path = os.path.join(root, file)
            ext = os.path.splitext(file)[1].lower()
            rel_path = os.path.relpath(path, directory)
            orig_size = os.path.getsize(path)
            
            # Temporary target path for dry run
            temp_dst = path + ".tmp" if dry_run else path
            
            try:
                if file == "avatar.png":
                    optimize_png(path, temp_dst, max_dim=256)
                elif file == "search-icon.png":
                    optimize_png(path, temp_dst, max_dim=36)
                elif file in ["content-studio-pixel.png", "research-archive-pixel.png", "writing-desk-pixel.png"]:
                    optimize_png(path, temp_dst, to_palette=True)
                elif file == "ascend-310-atlas-200i-dk-a2.png":
                    # Let's resize this 19MB image to max_dim 1200 and also convert to palette
                    # to make it super compact, since it's a diagram/screenshot.
                    # Or keep it as RGB PNG but optimized. Let's do max_dim=1200 and optimize.
                    optimize_png(path, temp_dst, max_dim=1200, to_palette=True)
                elif ext == ".png":
                    # General PNGs
                    optimize_png(path, temp_dst)
                elif ext in [".jpg", ".jpeg"]:
                    optimize_jpg(path, temp_dst, quality=82)
                else:
                    continue
                
                new_size = os.path.getsize(temp_dst)
                saved = orig_size - new_size
                total_saved += saved
                reduction = (saved / orig_size) * 100
                print(f"{rel_path:<40} | {orig_size/1024:7.2f} KB -> {new_size/1024:7.2f} KB | -{reduction:5.2f}% ({saved/1024:.2f} KB saved)")
                
                if dry_run and os.path.exists(temp_dst):
                    os.remove(temp_dst)
                    
            except Exception as e:
                print(f"Error optimizing {rel_path}: {e}")
                
    print("=" * 80)
    print(f"Total potential savings: {total_saved / (1024*1024):.2f} MB")
    print("=" * 80)

if __name__ == '__main__':
    import sys
    dry_run = True
    if len(sys.argv) > 1 and sys.argv[1] == '--execute':
        dry_run = False
    run_optimization(dry_run)
