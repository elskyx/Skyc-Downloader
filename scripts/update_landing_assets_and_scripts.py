import os
from pathlib import Path

def update_file(path, replacements):
    p = Path(path)
    if not p.exists():
        print(f"Skipping {path} (not found)")
        return
    content = p.read_text(encoding="utf-8")
    for old, new in replacements:
        content = content.replace(old, new)
    p.write_text(content, encoding="utf-8")
    print(f"Successfully updated {path}")

# Common replacements for Landing & About-Skyc HTML
html_replacements = [
    ("Skyc Downloader", "Zennx Downloader"),
    ("About Skyc Downloader", "About Zennx Downloader"),
    ("About Skyc", "About Zennx"),
    ("About-Skyc-Downloader", "About-Zennx-Downloader"),
    ("About-Skyc", "About-Zennx"),
    ("Skyc-Downloader", "Zennx-Downloader"),
    ("Skyc-v1.8.67.apk", "Zennx-v1.8.67.apk"),
    ("Skyc_1.8.67_x64-setup.exe", "Zennx_1.8.67_x64-setup.exe"),
    ("Skyc_1.8.67_x64_en-US.msi", "Zennx_1.8.67_x64_en-US.msi"),
    ("Skyc_1.8.67_x86-setup.exe", "Zennx_1.8.67_x86-setup.exe"),
    ("@elskyx/skyc", "@elskyx/zennx"),
    ("skyc-downloader-", "zennx-downloader-"),
    ("skyc-home-dark.png", "zennx-home-dark.png"),
    ("skyc-home-light.png", "zennx-home-light.png"),
    ("skyc-batch.png", "zennx-batch.png"),
    ("skyc-platforms.png", "zennx-platforms.png"),
    ("skyc-downloads.png", "zennx-downloads.png"),
    ("skyc-settings.png", "zennx-settings.png"),
    ("Get Skyc", "Get Zennx"),
    ("Download Skyc", "Download Zennx"),
    ("Contribute to Skyc", "Contribute to Zennx"),
    ("SKYC DOWNLOADER", "ZENNX DOWNLOADER"),
    ("Skyc Suite", "Zennx Suite"),
    ("Skyc Desktop", "Zennx Desktop"),
    ("Skyc CLI", "Zennx CLI"),
    ("Skyc Project", "Zennx Project"),
    ("Skyc Logo", "Zennx Logo"),
    ("Claude Obsidian", "Deep Obsidian"),
    ("Warm Parchment", "Warm Linen"),
    ("Claude Editorial", "Mori-Inspired"),
    ("Claude-inspired", "Mori-inspired"),
    ("wordmark=\"skyc\"", "wordmark=\"zennx\""),
    ("wordmark = 'skyc'", "wordmark = 'zennx'"),
    ("<span class=\"hwf-sr\">skyc</span>", "<span class=\"hwf-sr\">zennx</span>"),
    ("skyc.vercel.app", "zennx.vercel.app"),
]

# Common replacements for Landing & About-Skyc JS
js_replacements = [
    ("Skyc Downloader", "Zennx Downloader"),
    ("Skyc Landing Page", "Zennx Landing Page"),
    ("About-Skyc-Downloader", "About-Zennx-Downloader"),
    ("About-Skyc", "About-Zennx"),
    ("Skyc-Downloader", "Zennx-Downloader"),
    ("Skyc-v1.8.67", "Zennx-v1.8.67"),
    ("Skyc_1.8.67", "Zennx_1.8.67"),
    ("@elskyx/skyc", "@elskyx/zennx"),
    ("skyc-downloader-", "zennx-downloader-"),
    ("skyc-home-dark", "zennx-home-dark"),
    ("skyc-home-light", "zennx-home-light"),
    ("skyc-batch", "zennx-batch"),
    ("skyc-platforms", "zennx-platforms"),
    ("skyc-downloads", "zennx-downloads"),
    ("skyc-settings", "zennx-settings"),
    ("wordmark = 'skyc'", "wordmark = 'zennx'"),
    ("Claude Obsidian", "Deep Obsidian"),
    ("Warm Parchment", "Warm Linen"),
    ("Claude-inspired", "Mori-inspired"),
]

update_file("landing/index.html", html_replacements)
update_file("landing/script.js", js_replacements)
update_file(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc\index.html", html_replacements)
update_file(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc\script.js", js_replacements)

# Update robots and sitemaps
robots_replacements = [
    ("Skyc", "Zennx"),
    ("skyc.vercel.app", "zennx.vercel.app"),
]
update_file("landing/robots.txt", robots_replacements)
update_file("landing/sitemap.xml", robots_replacements)
update_file(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc\robots.txt", robots_replacements)
update_file(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc\sitemap.xml", robots_replacements)
