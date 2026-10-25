from pathlib import Path

dirs_to_update = [
    Path("components/ui"),
    Path(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc\components\ui")
]

for d in dirs_to_update:
    if not d.exists():
        continue
    for p in d.glob("*.tsx"):
        txt = p.read_text(encoding="utf-8")
        if "skyc" in txt.lower():
            txt = txt.replace("Skyc Downloader", "Zennx Downloader")
            txt = txt.replace("Skyc", "Zennx")
            txt = txt.replace("skyc", "zennx")
            p.write_text(txt, encoding="utf-8")
            print(f"Updated {p}")
