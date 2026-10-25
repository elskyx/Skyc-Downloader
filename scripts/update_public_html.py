import re

path = "public/index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace titles, headings, and brands
content = content.replace("Skyc Downloader", "Zennx Downloader")
content = content.replace("Skyc has a new version", "Zennx has a new version")
content = content.replace("Skyc Supported Extractors", "Zennx Supported Extractors")
content = content.replace("Skyc Version", "Zennx Version")
content = content.replace("Skyc Update Available", "Zennx Update Available")
content = content.replace("Skyc Core Engine", "Zennx Core Engine")
content = content.replace("Skyc Logo", "Zennx Logo")
content = content.replace("Skyc App Logo", "Zennx App Logo")
content = content.replace("Skyc will queue", "Zennx will queue")
content = content.replace("Skyc-Downloader", "Zennx-Downloader")
content = content.replace("Claude-inspired", "Mori-inspired")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated public/index.html successfully!")
