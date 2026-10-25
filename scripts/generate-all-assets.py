#!/usr/bin/env py -3.14
# scripts/generate-all-assets.py
"""
Skyc Master Asset & Icon Generation Pipeline
============================================
Authoritative Single Source of Truth:
  C:\\Users\\ADVAN\\.gemini\\antigravity\\brain\\3bccece5-81d0-49c6-bbfe-5e501c5c5873\\new_icon.png

Generates 100% genuine studio-grade assets across all platforms:
1. Windows Desktop (src-tauri/icons/):
   - Multi-resolution icon.ico (16, 24, 32, 48, 64, 128, 256) using 32bpp PNG compression.
   - Standard Tauri PNGs (icon.png 512px, 128x128@2x.png 256px, 128x128.png, 32x32.png).
   - AppX / MSIX Store icons (StoreLogo.png, Square*.png).
   - NSIS and WiX installer bitmaps in 24-bit uncompressed RGB:
     header.bmp (150x57), sidebar.bmp (164x314), banner.bmp (493x58), dialog.bmp (493x312).
2. Android APK (android/app/src/main/res/):
   - Standard mipmaps (ic_launcher.png) across mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi.
   - Round mipmaps (ic_launcher_round.png) with antialiased circular mask.
   - Adaptive foreground (ic_launcher_foreground.png) across all drawable densities (108–432px).
   - Splash screens for default (1024x1024), landscape (1280x720), and portrait (720x1280).
   - Android colors.xml with #D97757 (ic_launcher_background) and #191918 (splash_background).
3. Web App & PWA (public/):
   - Multi-resolution public/favicon.ico (16, 24, 32, 48, 64px).
   - public/favicon.png (256x256).
   - 6-tier PWA suite in public/assets/logos/png/ (16, 32, 64, 128, 256, 512px).
   - Clean SVG wrappers for public/logo.svg, public/assets/logos/skyc-logo.svg, and
     public/assets/logos/concept-4-sky-capsule.svg.
4. Landing Page & About-Skyc Twin Repository:
   - landing/ (favicon.ico, favicon.png, logo.svg).
   - Mirror to c:\\Users\\ADVAN\\OneDrive\\Desktop\\morirecreate\\About-Skyc\\ (favicon.ico, favicon.png, logo.svg).

Built-in verification validates all dimensions, color depths, channels, headers, and file integrity.
"""

import os
import sys
import io
import math
import base64
import struct
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Master Icon Location
SOURCE_ICON_PATH = r"C:\Users\ADVAN\.gemini\antigravity\brain\3bccece5-81d0-49c6-bbfe-5e501c5c5873\new_icon.png"

# Color Palette Definitions
OBSIDIAN_RGB = (25, 25, 24)           # #191918
OBSIDIAN_RGBA = (25, 25, 24, 255)
OBSIDIAN_DEEP = (20, 20, 19)          # #141413
BORDER_SUBTLE_RGB = (51, 51, 48)      # #333330
TERRACOTTA_RGB = (217, 119, 87)       # #D97757
TERRACOTTA_RGBA = (217, 119, 87, 255)
TERRACOTTA_LIGHT = (226, 132, 102)    # #E28466
PARCHMENT_RGB = (244, 243, 238)       # #F4F3EE
PARCHMENT_RGBA = (244, 243, 238, 255)
TEXT_MUTED_RGB = (161, 161, 170)      # #A1A1AA

# External Twin Repository
ABOUT_SKYC_DIR = r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc"

def load_master_icon():
    """Validates and loads the 512x512 RGBA master squircle icon."""
    if not os.path.isfile(SOURCE_ICON_PATH):
        raise FileNotFoundError(f"Master icon not found at: {SOURCE_ICON_PATH}")
    
    img = Image.open(SOURCE_ICON_PATH)
    img.load()
    if img.size != (512, 512) or img.mode != 'RGBA':
        raise ValueError(f"Master icon must be 512x512 RGBA, got {img.size} {img.mode}")
    print(f"[OK] Master icon loaded: {SOURCE_ICON_PATH} ({img.size[0]}x{img.size[1]}, {img.mode})")
    return img

def create_circular_icon(master_img, size):
    """
    Creates a studio-grade circular icon with supersampled anti-aliased circular mask.
    Used for Android legacy round launcher icons (ic_launcher_round.png).
    """
    # Supersample mask at 4x for perfectly smooth anti-aliased edge
    ss = 4
    mask_dim = size * ss
    mask = Image.new('L', (mask_dim, mask_dim), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse([0, 0, mask_dim - 1, mask_dim - 1], fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)

    # Scale master icon to target size
    icon_resized = master_img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Composite with circular alpha mask
    r, g, b, a = icon_resized.split()
    # Combine original alpha with circular mask
    combined_alpha = Image.new('L', (size, size), 0)
    for y in range(size):
        for x in range(size):
            orig_a = a.getpixel((x, y))
            circ_a = mask.getpixel((x, y))
            combined_alpha.putpixel((x, y), int((orig_a * circ_a) / 255.0))
            
    icon_resized.putalpha(combined_alpha)
    return icon_resized

def extract_adaptive_foreground_glyph(master_img):
    """
    Extracts the inner brand glyph (Warm Parchment download arrow, Deep Obsidian tray,
    Soft Peach accent dot) from the terracotta squircle background with sub-pixel
    anti-aliasing preservation.
    """
    w, h = master_img.size
    fg = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    tc = TERRACOTTA_RGB

    for y in range(h):
        for x in range(w):
            r, g, b, a = master_img.getpixel((x, y))
            if a < 255:
                continue
            dist = math.sqrt((r - tc[0])**2 + (g - tc[1])**2 + (b - tc[2])**2)
            if dist < 8:
                continue  # Background terracotta
            elif dist >= 25:
                # Fully opaque glyph pixel
                fg.putpixel((x, y), (r, g, b, 255))
            else:
                # Anti-aliased transition edge
                alpha = min(255, int((dist / 25.0) * 255))
                fg.putpixel((x, y), (r, g, b, alpha))

    return fg

def create_adaptive_foreground(master_img, target_size):
    """
    Renders the adaptive icon foreground for Android.
    Places the isolated glyph safely within the 72dp safe zone of the 108dp canvas (scale 0.72).
    """
    fg_glyph = extract_adaptive_foreground_glyph(master_img)
    
    # Android adaptive icons standard safe zone scale = 0.72
    glyph_scale = 0.72
    scaled_dim = int(target_size * glyph_scale)
    scaled_dim = (scaled_dim // 2) * 2  # Keep even
    
    glyph_resized = fg_glyph.resize((scaled_dim, scaled_dim), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    offset = (target_size - scaled_dim) // 2
    canvas.paste(glyph_resized, (offset, offset), glyph_resized)
    return canvas

def create_nsis_header(master_img):
    """
    Generates NSIS installer top header image: 150 x 57 (24-bit uncompressed RGB BMP).
    """
    w, h = 150, 57
    ss = 2
    img = Image.new('RGB', (w * ss, h * ss), OBSIDIAN_RGB)
    draw = ImageDraw.Draw(img)

    # Subtle bottom separator line
    draw.line([(0, h * ss - 2), (w * ss, h * ss - 2)], fill=BORDER_SUBTLE_RGB, width=2)

    # Terracotta squircle logo on the left (40x40)
    icon_sz = 40
    icon_ss = master_img.resize((icon_sz * ss, icon_sz * ss), Image.Resampling.LANCZOS)
    y_pos = int((h - icon_sz) / 2) * ss
    img.paste(icon_ss, (10 * ss, y_pos), icon_ss)

    # Clean Typography
    try:
        font_title = ImageFont.truetype("arial.ttf", 15 * ss)
        font_sub = ImageFont.truetype("arial.ttf", 9 * ss)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    draw.text((58 * ss, 12 * ss), "Zennx Downloader", fill=PARCHMENT_RGB, font=font_title)
    draw.text((58 * ss, 32 * ss), "Universal & Zero-Cloud", fill=TERRACOTTA_RGB, font=font_sub)

    return img.resize((w, h), Image.Resampling.LANCZOS)

def create_nsis_sidebar(master_img):
    """
    Generates NSIS installer welcome/finish page sidebar image: 164 x 314 (24-bit uncompressed RGB BMP).
    """
    w, h = 164, 314
    ss = 2
    img = Image.new('RGB', (w * ss, h * ss), OBSIDIAN_RGB)
    draw = ImageDraw.Draw(img)

    # Subtle vertical gradient background
    for y in range(h * ss):
        ratio = y / float(h * ss)
        r = int(25 + 10 * (1 - ratio))
        g = int(25 + 8 * (1 - ratio))
        b = int(24 + 6 * (1 - ratio))
        draw.line([(0, y), (w * ss, y)], fill=(r, g, b))

    # Accent decorative top bar
    draw.rectangle([0, 0, w * ss, 4 * ss], fill=TERRACOTTA_RGB)

    # Centered squircle logo tile (72x72)
    icon_sz = 72
    icon_ss = master_img.resize((icon_sz * ss, icon_sz * ss), Image.Resampling.LANCZOS)
    img.paste(icon_ss, (int((w - icon_sz) / 2) * ss, 38 * ss), icon_ss)

    # Typography
    try:
        font_title = ImageFont.truetype("arial.ttf", 22 * ss)
        font_tag = ImageFont.truetype("arial.ttf", 10 * ss)
        font_desc = ImageFont.truetype("arial.ttf", 9 * ss)
    except Exception:
        font_title = ImageFont.load_default()
        font_tag = ImageFont.load_default()
        font_desc = ImageFont.load_default()

    draw.text((w * ss / 2, 126 * ss), "Zennx", fill=PARCHMENT_RGB, font=font_title, anchor="mt")
    draw.text((w * ss / 2, 156 * ss), "Save anything, From anywhere.", fill=TERRACOTTA_RGB, font=font_tag, anchor="mt")

    # Divider line
    div_y = 186 * ss
    draw.line([(28 * ss, div_y), ((w - 28) * ss, div_y)], fill=BORDER_SUBTLE_RGB, width=2)

    # Feature bullet highlights
    bullets = [
        "100% Client-Side",
        "Zero-Cloud Privacy",
        "High-Speed Downloads",
        "No Tracking / No Ads"
    ]
    cur_y = 202 * ss
    for b in bullets:
        draw.ellipse([(26 * ss, cur_y + 3 * ss), (30 * ss, cur_y + 7 * ss)], fill=TERRACOTTA_RGB)
        draw.text((36 * ss, cur_y), b, fill=TEXT_MUTED_RGB, font=font_desc)
        cur_y += 18 * ss

    return img.resize((w, h), Image.Resampling.LANCZOS)

def create_wix_banner(master_img):
    """
    Generates WiX (MSI) top banner: 493 x 58 (24-bit uncompressed RGB BMP).
    """
    w, h = 493, 58
    ss = 2
    img = Image.new('RGB', (w * ss, h * ss), OBSIDIAN_RGB)
    draw = ImageDraw.Draw(img)

    # Bottom border
    draw.line([(0, h * ss - 2), (w * ss, h * ss - 2)], fill=BORDER_SUBTLE_RGB, width=2)

    # Logo on right side (42x42)
    icon_sz = 42
    icon_ss = master_img.resize((icon_sz * ss, icon_sz * ss), Image.Resampling.LANCZOS)
    img.paste(icon_ss, ((w - icon_sz - 16) * ss, int((h - icon_sz) / 2) * ss), icon_ss)

    # Title & subtitle on left
    try:
        font_title = ImageFont.truetype("arial.ttf", 15 * ss)
        font_sub = ImageFont.truetype("arial.ttf", 10 * ss)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    draw.text((20 * ss, 12 * ss), "Zennx Setup", fill=PARCHMENT_RGB, font=font_title)
    draw.text((20 * ss, 32 * ss), "Universal Zero-Cloud Media Downloader", fill=TERRACOTTA_RGB, font=font_sub)

    return img.resize((w, h), Image.Resampling.LANCZOS)

def create_wix_dialog(master_img):
    """
    Generates WiX (MSI) welcome/finish dialog: 493 x 312 (24-bit uncompressed RGB BMP).
    Left 164px is sidebar banner, right side is installer content background.
    """
    w, h = 493, 312
    # Right side warm parchment background
    img = Image.new('RGB', (w, h), (245, 244, 240))
    sidebar = create_nsis_sidebar(master_img)
    sidebar_resized = sidebar.resize((164, h), Image.Resampling.LANCZOS)
    img.paste(sidebar_resized, (0, 0))
    return img

def create_android_splash(master_img, width, height):
    """
    Generates Android high-resolution splash screen with centered terracotta squircle.
    """
    ss = 2
    canvas_w = width * ss
    canvas_h = height * ss
    img = Image.new('RGBA', (canvas_w, canvas_h), OBSIDIAN_RGBA)
    
    # Emblem size approx 28% of smaller dimension
    icon_sz = int(min(width, height) * 0.28)
    icon_ss = master_img.resize((icon_sz * ss, icon_sz * ss), Image.Resampling.LANCZOS)
    
    cx = int((width - icon_sz) / 2) * ss
    cy = int((height - icon_sz) / 2) * ss
    img.paste(icon_ss, (cx, cy), icon_ss)

    return img.resize((width, height), Image.Resampling.LANCZOS)

def generate_svg_wrapper(master_img_path, output_path):
    """
    Generates an optimized SVG wrapping the master terracotta brand mark.
    """
    with open(master_img_path, 'rb') as f:
        b64_data = base64.b64encode(f.read()).decode('ascii')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Zennx Official Terracotta Brand Mark -->
  <title>Zennx Downloader</title>
  <image width="512" height="512" href="data:image/png;base64,{b64_data}"/>
</svg>
'''
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"  [+] SVG created: {output_path} ({len(svg_content):,} bytes)")

def update_android_colors_xml():
    """Updates android/app/src/main/res/values/colors.xml with #D97757 and #191918."""
    colors_xml_path = "android/app/src/main/res/values/colors.xml"
    content = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#D97757</color>
    <color name="splash_background">#191918</color>
</resources>
"""
    os.makedirs(os.path.dirname(colors_xml_path), exist_ok=True)
    with open(colors_xml_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  [+] Android colors.xml updated: {colors_xml_path}")

def run_pipeline():
    print("=" * 70)
    print(" SKYC MASTER ASSET & ICON GENERATION PIPELINE")
    print("=" * 70)

    master = load_master_icon()

    # -------------------------------------------------------------
    # 1. WINDOWS DESKTOP ASSETS (src-tauri/icons/)
    # -------------------------------------------------------------
    print("\n--- [1/4] Generating Windows Desktop Assets (src-tauri/icons/) ---")
    tauri_dir = "src-tauri/icons"
    os.makedirs(tauri_dir, exist_ok=True)

    # PNG Icons
    shutil.copy2(SOURCE_ICON_PATH, os.path.join(tauri_dir, "icon.png"))
    print("  [+] icon.png (512x512 exact master copy)")
    
    icon_256 = master.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(os.path.join(tauri_dir, "128x128@2x.png"), "PNG")
    print("  [+] 128x128@2x.png (256x256)")

    icon_128 = master.resize((128, 128), Image.Resampling.LANCZOS)
    icon_128.save(os.path.join(tauri_dir, "128x128.png"), "PNG")
    print("  [+] 128x128.png (128x128)")

    icon_32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save(os.path.join(tauri_dir, "32x32.png"), "PNG")
    print("  [+] 32x32.png (32x32)")

    # AppX / Store Logos for Tauri
    store_sizes = {
        "StoreLogo.png": (50, 50),
        "Square30x30Logo.png": (30, 30),
        "Square44x44Logo.png": (44, 44),
        "Square71x71Logo.png": (71, 71),
        "Square89x89Logo.png": (89, 89),
        "Square107x107Logo.png": (107, 107),
        "Square142x142Logo.png": (142, 142),
        "Square150x150Logo.png": (150, 150),
        "Square284x284Logo.png": (284, 284),
        "Square310x310Logo.png": (310, 310)
    }
    for fname, sz in store_sizes.items():
        scaled = master.resize(sz, Image.Resampling.LANCZOS)
        scaled.save(os.path.join(tauri_dir, fname), "PNG")
    print(f"  [+] 10 AppX/Store logos created ({', '.join(store_sizes.keys())})")

    # Multi-resolution icon.ico (16 to 256px, 32bpp PNG compressed)
    ico_sizes_desktop = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    desktop_ico_path = os.path.join(tauri_dir, "icon.ico")
    master.save(desktop_ico_path, format="ICO", sizes=ico_sizes_desktop)
    print(f"  [+] icon.ico (7 multi-res frames: 16 to 256px, PNG-compressed)")

    # NSIS & WiX Installer Bitmaps (24-bit uncompressed RGB)
    header_bmp = create_nsis_header(master)
    header_bmp.save(os.path.join(tauri_dir, "header.bmp"), "BMP")
    print("  [+] header.bmp (150x57 24-bit RGB)")

    sidebar_bmp = create_nsis_sidebar(master)
    sidebar_bmp.save(os.path.join(tauri_dir, "sidebar.bmp"), "BMP")
    print("  [+] sidebar.bmp (164x314 24-bit RGB)")

    banner_bmp = create_wix_banner(master)
    banner_bmp.save(os.path.join(tauri_dir, "banner.bmp"), "BMP")
    print("  [+] banner.bmp (493x58 24-bit RGB)")

    dialog_bmp = create_wix_dialog(master)
    dialog_bmp.save(os.path.join(tauri_dir, "dialog.bmp"), "BMP")
    print("  [+] dialog.bmp (493x312 24-bit RGB)")

    # -------------------------------------------------------------
    # 2. ANDROID APK RESOURCES (android/app/src/main/res/)
    # -------------------------------------------------------------
    print("\n--- [2/4] Generating Android APK Resources (android/app/src/main/res/) ---")
    
    # Mipmap densities
    mipmap_densities = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192
    }
    for dens, sz in mipmap_densities.items():
        mdir = f"android/app/src/main/res/mipmap-{dens}"
        os.makedirs(mdir, exist_ok=True)

        # Standard squircle launcher
        sq = master.resize((sz, sz), Image.Resampling.LANCZOS)
        sq.save(os.path.join(mdir, "ic_launcher.png"), "PNG")

        # Round launcher with circular antialiased mask
        rnd = create_circular_icon(master, sz)
        rnd.save(os.path.join(mdir, "ic_launcher_round.png"), "PNG")
        print(f"  [+] mipmap-{dens}: ic_launcher.png ({sz}x{sz}), ic_launcher_round.png ({sz}x{sz})")

    # Adaptive foreground layers (safe zone 72dp out of 108dp)
    adaptive_densities = {
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432
    }
    for dens, sz in adaptive_densities.items():
        ddir = f"android/app/src/main/res/drawable-{dens}"
        os.makedirs(ddir, exist_ok=True)
        fg = create_adaptive_foreground(master, sz)
        fg.save(os.path.join(ddir, "ic_launcher_foreground.png"), "PNG")
        print(f"  [+] drawable-{dens}: ic_launcher_foreground.png ({sz}x{sz})")

    # Default fallback drawable/ic_launcher_foreground.png
    os.makedirs("android/app/src/main/res/drawable", exist_ok=True)
    fg_default = create_adaptive_foreground(master, 432)
    fg_default.save("android/app/src/main/res/drawable/ic_launcher_foreground.png", "PNG")
    print("  [+] drawable/ic_launcher_foreground.png (432x432 fallback)")

    # Splash screens
    splash_sq = create_android_splash(master, 1024, 1024)
    splash_sq.save("android/app/src/main/res/drawable/splash.png", "PNG")
    print("  [+] drawable/splash.png (1024x1024)")

    os.makedirs("android/app/src/main/res/drawable-land", exist_ok=True)
    splash_land = create_android_splash(master, 1280, 720)
    splash_land.save("android/app/src/main/res/drawable-land/splash.png", "PNG")
    print("  [+] drawable-land/splash.png (1280x720)")

    os.makedirs("android/app/src/main/res/drawable-port", exist_ok=True)
    splash_port = create_android_splash(master, 720, 1280)
    splash_port.save("android/app/src/main/res/drawable-port/splash.png", "PNG")
    print("  [+] drawable-port/splash.png (720x1280)")

    # Update colors.xml
    update_android_colors_xml()

    # -------------------------------------------------------------
    # 3. WEB & PWA ASSETS (public/)
    # -------------------------------------------------------------
    print("\n--- [3/4] Generating Web & PWA Assets (public/) ---")
    pwa_png_dir = "public/assets/logos/png"
    os.makedirs(pwa_png_dir, exist_ok=True)

    # 6-tier PWA PNG Suite
    pwa_sizes = [16, 32, 64, 128, 256, 512]
    for sz in pwa_sizes:
        out_path = os.path.join(pwa_png_dir, f"skyc-app-icon-{sz}.png")
        zennx_path = os.path.join(pwa_png_dir, f"zennx-app-icon-{sz}.png")
        if sz == 512:
            shutil.copy2(SOURCE_ICON_PATH, out_path)
            shutil.copy2(SOURCE_ICON_PATH, zennx_path)
        else:
            pwa_icon = master.resize((sz, sz), Image.Resampling.LANCZOS)
            pwa_icon.save(out_path, "PNG")
            pwa_icon.save(zennx_path, "PNG")
        print(f"  [+] {out_path} and {zennx_path} ({sz}x{sz})")

    # Favicon PNG (256x256)
    fav_png = master.resize((256, 256), Image.Resampling.LANCZOS)
    fav_png.save("public/favicon.png", "PNG")
    print("  [+] public/favicon.png (256x256)")

    # Favicon ICO (16, 24, 32, 48, 64px)
    ico_sizes_web = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]
    master.save("public/favicon.ico", format="ICO", sizes=ico_sizes_web)
    print("  [+] public/favicon.ico (5 multi-res frames: 16 to 64px)")

    # SVG brand marks
    generate_svg_wrapper(SOURCE_ICON_PATH, "public/logo.svg")
    generate_svg_wrapper(SOURCE_ICON_PATH, "public/assets/logos/skyc-logo.svg")
    generate_svg_wrapper(SOURCE_ICON_PATH, "public/assets/logos/concept-4-sky-capsule.svg")

    # -------------------------------------------------------------
    # 4. LANDING PAGE & TWIN REPOSITORY MIRRORING
    # -------------------------------------------------------------
    print("\n--- [4/4] Deploying Landing Page & Twin Repo Assets ---")
    # landing/
    os.makedirs("landing", exist_ok=True)
    fav_png.save("landing/favicon.png", "PNG")
    master.save("landing/favicon.ico", format="ICO", sizes=ico_sizes_web)
    generate_svg_wrapper(SOURCE_ICON_PATH, "landing/logo.svg")
    print("  [+] landing/favicon.png, favicon.ico, logo.svg deployed.")

    # About-Skyc twin repository
    if os.path.isdir(ABOUT_SKYC_DIR):
        fav_png.save(os.path.join(ABOUT_SKYC_DIR, "favicon.png"), "PNG")
        master.save(os.path.join(ABOUT_SKYC_DIR, "favicon.ico"), format="ICO", sizes=ico_sizes_web)
        generate_svg_wrapper(SOURCE_ICON_PATH, os.path.join(ABOUT_SKYC_DIR, "logo.svg"))
        print(f"  [+] Mirrored assets to {ABOUT_SKYC_DIR}")
    else:
        print(f"  [!] Note: {ABOUT_SKYC_DIR} not found; skipping external mirror.")

    print("\n" + "=" * 70)
    print(" ALL ASSETS SUCCESSFULLY GENERATED!")
    print("=" * 70)

def verify_all_assets():
    """
    Independent Verification Suite
    Checks dimensions, channels, non-empty files, ICO sub-images, and uncompressed BMP format.
    """
    print("\n" + "=" * 70)
    print(" RUNNING INTEGRITY & COMPLIANCE VERIFICATION")
    print("=" * 70)
    
    failures = []
    checks_passed = 0

    def check_file(path, expected_size, expected_mode=None, expected_format=None):
        nonlocal checks_passed
        if not os.path.isfile(path):
            failures.append(f"MISSING: {path}")
            return
        sz_bytes = os.path.getsize(path)
        if sz_bytes == 0:
            failures.append(f"EMPTY: {path}")
            return
        try:
            im = Image.open(path)
            im.load()
            if im.size != expected_size:
                failures.append(f"DIMENSION MISMATCH {path}: got {im.size}, expected {expected_size}")
                return
            if expected_mode and im.mode != expected_mode:
                failures.append(f"MODE MISMATCH {path}: got {im.mode}, expected {expected_mode}")
                return
            if expected_format and im.format != expected_format:
                failures.append(f"FORMAT MISMATCH {path}: got {im.format}, expected {expected_format}")
                return
            checks_passed += 1
            print(f"  [PASS] {path} -> {im.size[0]}x{im.size[1]} {im.mode} {im.format} ({sz_bytes:,} B)")
        except Exception as e:
            failures.append(f"CORRUPT {path}: {e}")

    def check_ico(path, expected_sizes):
        nonlocal checks_passed
        if not os.path.isfile(path):
            failures.append(f"MISSING: {path}")
            return
        try:
            with open(path, "rb") as f:
                data = f.read()
            idReserved, idType, idCount = struct.unpack('<HHH', data[:6])
            if idType != 1:
                failures.append(f"NOT AN ICO FILE: {path}")
                return
            found_sizes = set()
            offset = 6
            all_png = True
            for _ in range(idCount):
                w, h, colorCount, reserved, planes, bitCount, bytesInRes, imageOffset = struct.unpack('<BBBBHHII', data[offset:offset+16])
                offset += 16
                actual_w = 256 if w == 0 else w
                actual_h = 256 if h == 0 else h
                found_sizes.add((actual_w, actual_h))
                magic = data[imageOffset:imageOffset+8]
                if magic != b'\x89PNG\r\n\x1a\n':
                    all_png = False
            
            missing_sizes = set(expected_sizes) - found_sizes
            if missing_sizes:
                failures.append(f"ICO MISSING SIZES in {path}: {missing_sizes}")
                return
            if not all_png:
                failures.append(f"ICO CONTAINS NON-PNG FRAMES in {path}")
                return
            checks_passed += 1
            print(f"  [PASS] ICO {path} -> {len(found_sizes)} frames: {sorted(list(found_sizes))} (All 32bpp PNG)")
        except Exception as e:
            failures.append(f"ICO VERIFY FAILED {path}: {e}")

    def check_bmp_24bit_uncompressed(path, expected_size):
        nonlocal checks_passed
        if not os.path.isfile(path):
            failures.append(f"MISSING: {path}")
            return
        try:
            with open(path, "rb") as f:
                data = f.read()
            biSize, biWidth, biHeight, biPlanes, biBitCount, biCompression = struct.unpack('<IiiHHI', data[14:34])
            if (biWidth, biHeight) != expected_size:
                failures.append(f"BMP SIZE MISMATCH {path}: got {(biWidth, biHeight)}, expected {expected_size}")
                return
            if biBitCount != 24:
                failures.append(f"BMP BIT DEPTH MISMATCH {path}: got {biBitCount}, expected 24")
                return
            if biCompression != 0:
                failures.append(f"BMP COMPRESSED {path}: compression={biCompression}, expected 0 (uncompressed)")
                return
            checks_passed += 1
            print(f"  [PASS] BMP {path} -> {biWidth}x{biHeight} 24-bit BI_RGB uncompressed ({len(data):,} B)")
        except Exception as e:
            failures.append(f"BMP VERIFY FAILED {path}: {e}")

    # 1. Check Windows Desktop
    print("\nChecking Desktop Icons:")
    check_file("src-tauri/icons/icon.png", (512, 512), "RGBA", "PNG")
    check_file("src-tauri/icons/128x128@2x.png", (256, 256), "RGBA", "PNG")
    check_file("src-tauri/icons/128x128.png", (128, 128), "RGBA", "PNG")
    check_file("src-tauri/icons/32x32.png", (32, 32), "RGBA", "PNG")
    check_file("src-tauri/icons/StoreLogo.png", (50, 50), "RGBA", "PNG")
    check_file("src-tauri/icons/Square150x150Logo.png", (150, 150), "RGBA", "PNG")
    check_file("src-tauri/icons/Square310x310Logo.png", (310, 310), "RGBA", "PNG")
    check_ico("src-tauri/icons/icon.ico", [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    check_bmp_24bit_uncompressed("src-tauri/icons/header.bmp", (150, 57))
    check_bmp_24bit_uncompressed("src-tauri/icons/sidebar.bmp", (164, 314))
    check_bmp_24bit_uncompressed("src-tauri/icons/banner.bmp", (493, 58))
    check_bmp_24bit_uncompressed("src-tauri/icons/dialog.bmp", (493, 312))

    # 2. Check Android Mipmaps & Drawables
    print("\nChecking Android Assets:")
    for dens, sz in [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)]:
        check_file(f"android/app/src/main/res/mipmap-{dens}/ic_launcher.png", (sz, sz), "RGBA", "PNG")
        check_file(f"android/app/src/main/res/mipmap-{dens}/ic_launcher_round.png", (sz, sz), "RGBA", "PNG")
    
    for dens, sz in [("mdpi", 108), ("hdpi", 162), ("xhdpi", 216), ("xxhdpi", 324), ("xxxhdpi", 432)]:
        check_file(f"android/app/src/main/res/drawable-{dens}/ic_launcher_foreground.png", (sz, sz), "RGBA", "PNG")
    check_file("android/app/src/main/res/drawable/ic_launcher_foreground.png", (432, 432), "RGBA", "PNG")

    check_file("android/app/src/main/res/drawable/splash.png", (1024, 1024), "RGBA", "PNG")
    check_file("android/app/src/main/res/drawable-land/splash.png", (1280, 720), "RGBA", "PNG")
    check_file("android/app/src/main/res/drawable-port/splash.png", (720, 1280), "RGBA", "PNG")

    # 3. Check Web & PWA
    print("\nChecking Web & PWA Assets:")
    check_ico("public/favicon.ico", [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)])
    check_file("public/favicon.png", (256, 256), "RGBA", "PNG")
    for sz in [16, 32, 64, 128, 256, 512]:
        check_file(f"public/assets/logos/png/skyc-app-icon-{sz}.png", (sz, sz), "RGBA", "PNG")

    for svg_path in ["public/logo.svg", "public/assets/logos/skyc-logo.svg", "public/assets/logos/concept-4-sky-capsule.svg", "landing/logo.svg"]:
        if os.path.isfile(svg_path) and os.path.getsize(svg_path) > 1000:
            checks_passed += 1
            print(f"  [PASS] SVG {svg_path} ({os.path.getsize(svg_path):,} B)")
        else:
            failures.append(f"INVALID SVG: {svg_path}")

    # 4. Check Landing & About-Skyc
    print("\nChecking Landing & About-Skyc Mirrors:")
    check_ico("landing/favicon.ico", [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)])
    check_file("landing/favicon.png", (256, 256), "RGBA", "PNG")

    if os.path.isdir(ABOUT_SKYC_DIR):
        check_ico(os.path.join(ABOUT_SKYC_DIR, "favicon.ico"), [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)])
        check_file(os.path.join(ABOUT_SKYC_DIR, "favicon.png"), (256, 256), "RGBA", "PNG")
        about_svg = os.path.join(ABOUT_SKYC_DIR, "logo.svg")
        if os.path.isfile(about_svg) and os.path.getsize(about_svg) > 1000:
            checks_passed += 1
            print(f"  [PASS] SVG {about_svg} ({os.path.getsize(about_svg):,} B)")
        else:
            failures.append(f"INVALID SVG: {about_svg}")

    print("\n" + "-" * 70)
    print(f"VERIFICATION SUMMARY: {checks_passed} checks passed, {len(failures)} failures.")
    if failures:
        print("FAILURES DETECTED:")
        for f in failures:
            print(f"  - {f}")
        return False
    else:
        print("ALL AUDIT CHECKS PASSED WITH 100% SUCCESS!")
        print("-" * 70)
        return True

if __name__ == "__main__":
    run_pipeline()
    success = verify_all_assets()
    sys.exit(0 if success else 1)
