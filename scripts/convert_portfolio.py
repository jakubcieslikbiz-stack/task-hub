import os
import sys
from pathlib import Path
from PIL import Image

def convert_portfolio_images():
    source_dir = Path(r"C:\Users\jakub\OneDrive\Dokumenty\rózne\portfolio")
    target_dir = Path(r"C:\Users\jakub\OneDrive\Dokumenty\rózne\task-hub\public\portfolio")
    target_dir.mkdir(parents=True, exist_ok=True)

    supported_exts = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}
    files = [f for f in source_dir.iterdir() if f.is_file() and f.suffix.lower() in supported_exts]

    if not files:
        print(f"Folder {source_dir} jest pusty. Wrzuc tam swoje rendery i uruchom ponownie.")
        return []

    converted = []
    for file in sorted(files):
        out_name = f"{file.stem}.webp"
        out_path = target_dir / out_name

        try:
            with Image.open(file) as img:
                # Convert RGBA or RGB
                if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                    img = img.convert("RGBA")
                else:
                    img = img.convert("RGB")

                # Save as optimized webp
                img.save(out_path, format="WEBP", quality=88, method=6)
                orig_size_kb = file.stat().st_size / 1024
                new_size_kb = out_path.stat().st_size / 1024
                print(f"[OK] {file.name} ({orig_size_kb:.1f} KB) -> {out_name} ({new_size_kb:.1f} KB) [{img.width}x{img.height}]")
                converted.append({
                    "name": file.stem,
                    "filename": out_name,
                    "rel_path": f"/portfolio/{out_name}",
                    "width": img.width,
                    "height": img.height
                })
        except Exception as e:
            print(f"[ERROR] Blad przy {file.name}: {e}")

    print(f"\nUkonczono! Przekonwertowano {len(converted)} plikow do {target_dir}")
    return converted

if __name__ == "__main__":
    convert_portfolio_images()
