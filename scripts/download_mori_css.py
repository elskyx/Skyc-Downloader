import urllib.request
import os

css_files = ["variables.css", "base.css", "home.css", "components.css", "settings.css", "gallery.css", "history.css"]
os.makedirs("scripts/mori_ref", exist_ok=True)

for cf in css_files:
    u = f"https://raw.githubusercontent.com/coflyn/Mori/main/public/css/{cf}"
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            with open(f"scripts/mori_ref/{cf}", "w", encoding="utf-8") as out:
                out.write(data)
            print(f"Downloaded {cf} ({len(data)} bytes)")
    except Exception as e:
        print(f"Error {cf}: {e}")
