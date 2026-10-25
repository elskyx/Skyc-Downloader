import re
from pathlib import Path
import shutil

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ABOUT_DIR = Path(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc")

def clean_file(path: Path):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    
    # Specific targeted replacements
    replacements = [
        (r'\bSkyc\b', 'Zennx'),
        (r'\bskyc\b', 'zennx'),
        (r'SKYC\b', 'ZENNX'),
        (r'Videos\\Skyc', r'Videos\\Zennx'),
        (r'Music\\Skyc', r'Music\\Zennx'),
        (r'Pictures\\Skyc', r'Pictures\\Zennx'),
        (r'Movies/Skyc', 'Movies/Zennx'),
        (r'Music/Skyc', 'Music/Zennx'),
        (r'Pictures/Skyc', 'Pictures/Zennx'),
    ]
    for pattern, rep in replacements:
        text = re.sub(pattern, rep, text)
        
    path.write_text(text, encoding="utf-8")
    print(f"Updated {path}")

clean_file(PROJECT_ROOT / "landing" / "index.html")

# Also copy index.html to About-Skyc/index.html to ensure 100% parity
if ABOUT_DIR.exists():
    shutil.copy2(PROJECT_ROOT / "landing" / "index.html", ABOUT_DIR / "index.html")
    print(f"Synchronized landing/index.html to {ABOUT_DIR / 'index.html'}")
    clean_file(ABOUT_DIR / "index.html")
