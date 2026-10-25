import urllib.request
import re

u = "https://raw.githubusercontent.com/coflyn/Mori/main/public/index.html"
req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8")

# Find bottom-nav
m = re.search(r'(<nav class="bottom-nav".*?</nav>)', html, re.DOTALL)
if m:
    print("--- BOTTOM NAV ---")
    print(m.group(1))

# Find CSS home.css and components.css from Mori
for css_file in ["components.css", "base.css"]:
    u_css = f"https://raw.githubusercontent.com/coflyn/Mori/main/public/css/{css_file}"
    req_css = urllib.request.Request(u_css, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req_css) as resp_css:
        css_text = resp_css.read().decode("utf-8")
        print(f"\n--- {css_file} (First 800 chars) ---")
        print(css_text[:800])
