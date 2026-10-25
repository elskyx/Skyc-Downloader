import os
from pathlib import Path

target_dirs = [
    Path("package.json"),
    Path("capacitor.config.json"),
    Path("README.md"),
    Path("cli"),
    Path("src-tauri"),
    Path("public"),
    Path("landing"),
    Path("components"),
    Path("scripts"),
    Path("tests"),
    Path("android/app/build.gradle"),
    Path("android/app/src/main/res/values/strings.xml"),
    Path("android/app/src/main/AndroidManifest.xml"),
    Path(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc"),
]

results = []

def check_file(p):
    if p.suffix.lower() in {".png", ".ico", ".bmp", ".jpg", ".webp", ".lock"}:
        return
    try:
        txt = p.read_text(encoding="utf-8")
        if "skyc" in txt.lower():
            count = txt.lower().count("skyc")
            results.append((str(p), count))
    except Exception:
        pass

for t in target_dirs:
    if t.is_file():
        check_file(t)
    elif t.is_dir():
        for root, dirs, files in os.walk(t):
            if any(x in root for x in ["node_modules", ".git", "target", "dist"]):
                continue
            for f in files:
                check_file(Path(root) / f)

print(f"Total matching files: {len(results)}")
for f, c in sorted(results, key=lambda x: -x[1]):
    print(f"{f}: {c} occurrences")
