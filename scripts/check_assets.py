import os
import hashlib
from pathlib import Path
from PIL import Image

project_root = Path(".")
master_icon = Path(r"C:\Users\ADVAN\.gemini\antigravity\brain\3bccece5-81d0-49c6-bbfe-5e501c5c5873\new_icon.png")
master_bytes = master_icon.read_bytes()
master_sha = hashlib.sha256(master_bytes).hexdigest()

print("Master Icon:", master_icon, master_sha)

# Check all images in src-tauri/icons
print("\n--- SRC-TAURI/ICONS ---")
for p in (project_root / "src-tauri" / "icons").iterdir():
    if p.is_file():
        sha = hashlib.sha256(p.read_bytes()).hexdigest()
        try:
            im = Image.open(p)
            print(f"{p.name}: size={im.size}, mode={im.mode}, sha={sha[:8]}")
        except Exception as e:
            print(f"{p.name}: not an image or {e}, sha={sha[:8]}")

# Check Android res icons
print("\n--- ANDROID LAUNCHER & SPLASH ICONS ---")
res_dir = project_root / "android" / "app" / "src" / "main" / "res"
for root, dirs, files in os.walk(res_dir):
    for f in files:
        if f.endswith((".png", ".webp", ".jpg")):
            fp = Path(root) / f
            rel = fp.relative_to(res_dir)
            sha = hashlib.sha256(fp.read_bytes()).hexdigest()
            try:
                im = Image.open(fp)
                print(f"{rel}: size={im.size}, sha={sha[:8]}")
            except Exception as e:
                print(f"{rel}: {e}")

# Check public assets
print("\n--- PUBLIC & LANDING LOGOS & ICONS ---")
for p in [
    project_root / "public" / "favicon.ico",
    project_root / "public" / "favicon.png",
    project_root / "public" / "logo.svg",
    project_root / "public" / "assets" / "logos" / "skyc-logo.svg",
    project_root / "public" / "assets" / "logos" / "concept-4-sky-capsule.svg",
    project_root / "landing" / "favicon.ico",
    project_root / "landing" / "favicon.png",
    project_root / "landing" / "logo.svg",
]:
    if p.exists():
        sha = hashlib.sha256(p.read_bytes()).hexdigest()
        print(f"{p.relative_to(project_root)}: sha={sha[:8]}")
    else:
        print(f"{p.relative_to(project_root)}: MISSING")

# Check PWA PNGs
pwa_dir = project_root / "public" / "assets" / "logos" / "png"
if pwa_dir.exists():
    for p in sorted(pwa_dir.glob("*.png")):
        sha = hashlib.sha256(p.read_bytes()).hexdigest()
        im = Image.open(p)
        print(f"PWA {p.name}: size={im.size}, sha={sha[:8]}")
