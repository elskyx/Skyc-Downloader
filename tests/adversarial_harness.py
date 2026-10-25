"""
Adversarial Verification & Stress Test Harness
Authored by Challenger 1 (Automated Test Execution & Empirical Verification)
"""

import os
import struct
import base64
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ABOUT_SKYC = Path(r"c:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc")

def run_adversarial_suite():
    errors = []
    checks_passed = 0

    print("======================================================================")
    print(" ADVERSARIAL VERIFICATION & STRESS TEST HARNESS")
    print("======================================================================")

    # 1. Collect all image files
    image_paths = []
    
    # Tauri icons
    tauri_icons = PROJECT_ROOT / "src-tauri" / "icons"
    if tauri_icons.exists():
        for p in tauri_icons.glob("*"):
            if p.suffix.lower() in {".png", ".ico", ".bmp"}:
                image_paths.append(p)
                
    # Android mipmaps & drawables
    android_res = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
    if android_res.exists():
        for p in android_res.rglob("*.png"):
            image_paths.append(p)
            
    # Web & PWA
    public_dir = PROJECT_ROOT / "public"
    if public_dir.exists():
        for p in public_dir.glob("*.png"):
            image_paths.append(p)
        for p in public_dir.glob("*.ico"):
            image_paths.append(p)
        logo_pngs = public_dir / "assets" / "logos" / "png"
        if logo_pngs.exists():
            for p in logo_pngs.glob("*.png"):
                image_paths.append(p)

    # Landing
    landing_dir = PROJECT_ROOT / "landing"
    if landing_dir.exists():
        for p in landing_dir.glob("*.png"):
            image_paths.append(p)
        for p in landing_dir.glob("*.ico"):
            image_paths.append(p)

    # About-Skyc mirror
    if ABOUT_SKYC.exists():
        for p in ABOUT_SKYC.glob("*.png"):
            image_paths.append(p)
        for p in ABOUT_SKYC.glob("*.ico"):
            image_paths.append(p)

    print(f"\n[PHASE 1] Discovered {len(image_paths)} image assets across repository.")

    # 2. Test Pillow verify() and load() on every image
    corrupted_images = []
    for img_path in image_paths:
        try:
            # First pass: verify()
            with Image.open(img_path) as im:
                im.verify()
            
            # Second pass: re-open and load() full pixel buffer
            with Image.open(img_path) as im:
                px = im.load()
                assert px is not None, "load() returned None"
                w, h = im.size
                assert w > 0 and h > 0, f"Invalid dimensions {w}x{h}"
            checks_passed += 1
        except Exception as e:
            err = f"Corruption/Load error on {img_path}: {e}"
            corrupted_images.append(err)
            errors.append(err)

    if not corrupted_images:
        print(f"  [OK] All {len(image_paths)} images successfully verified and loaded with Pillow.")
    else:
        print(f"  [FAIL] {len(corrupted_images)} images failed Pillow verify/load!")

    # 3. Adversarial Test: NSIS & WiX BMP Binary Struct Headers
    print("\n[PHASE 2] Adversarial BMP Binary Struct Validation (24-bit uncompressed RGB)")
    bmp_specs = {
        "header.bmp": (150, 57),
        "sidebar.bmp": (164, 314),
        "banner.bmp": (493, 58),
        "dialog.bmp": (493, 312),
    }

    for bmp_name, (expected_w, expected_h) in bmp_specs.items():
        bmp_path = tauri_icons / bmp_name
        if not bmp_path.exists():
            errors.append(f"Missing BMP: {bmp_path}")
            continue

        raw = bmp_path.read_bytes()
        file_len = len(raw)

        # BMP Header: 14 bytes
        # DIB Header: at least 40 bytes (BITMAPINFOHEADER)
        if len(raw) < 54:
            errors.append(f"{bmp_name}: File too short ({len(raw)} bytes)")
            continue

        magic = raw[:2]
        if magic != b"BM":
            errors.append(f"{bmp_name}: Invalid BMP magic: {magic} (expected b'BM')")
            continue

        bfSize, bfReserved1, bfReserved2, bfOffBits = struct.unpack_from("<IHHI", raw, 2)
        biSize, biWidth, biHeight, biPlanes, biBitCount, biCompression, biSizeImage, biXPelsPerMeter, biYPelsPerMeter, biClrUsed, biClrImportant = struct.unpack_from("<IIIHHIIIIII", raw, 14)

        # Assertions
        if biSize != 40:
            errors.append(f"{bmp_name}: Non-standard DIB header size {biSize} (expected 40 for BITMAPINFOHEADER)")
        if biWidth != expected_w or biHeight != expected_h:
            errors.append(f"{bmp_name}: Dimension mismatch ({biWidth}x{biHeight}) != expected ({expected_w}x{expected_h})")
        if biPlanes != 1:
            errors.append(f"{bmp_name}: biPlanes={biPlanes} != 1")
        if biBitCount != 24:
            errors.append(f"{bmp_name}: biBitCount={biBitCount} != 24 (NSIS/WiX requires 24-bit RGB)")
        if biCompression != 0:
            errors.append(f"{bmp_name}: biCompression={biCompression} != 0 (BI_RGB uncompressed required)")
        
        # Row padding check (each row must be multiple of 4 bytes)
        row_size = ((24 * expected_w + 31) // 32) * 4
        expected_pixel_bytes = row_size * expected_h
        expected_total_size = 54 + expected_pixel_bytes
        if file_len != expected_total_size:
            errors.append(f"{bmp_name}: File length {file_len} != calculated {expected_total_size}")
        if bfSize != expected_total_size:
            errors.append(f"{bmp_name}: bfSize header {bfSize} != {expected_total_size}")

        print(f"  [OK] {bmp_name}: {biWidth}x{biHeight}, {biBitCount}-bit, compression={biCompression}, size={file_len}B (row_stride={row_size})")
        checks_passed += 1

    # 4. Adversarial Test: ICO Multi-Resolution Frames & Sub-Image Extraction
    print("\n[PHASE 3] Adversarial ICO Multi-Resolution Extraction (Pillow IcoFile)")
    ico_specs = {
        tauri_icons / "icon.ico": [16, 24, 32, 48, 64, 128, 256],
        public_dir / "favicon.ico": [16, 24, 32, 48, 64],
        landing_dir / "favicon.ico": [16, 24, 32, 48, 64],
    }
    if ABOUT_SKYC.exists():
        ico_specs[ABOUT_SKYC / "favicon.ico"] = [16, 24, 32, 48, 64]

    for ico_path, expected_sizes in ico_specs.items():
        if not ico_path.exists():
            errors.append(f"Missing ICO: {ico_path}")
            continue

        with Image.open(ico_path) as im:
            available_sizes = im.info.get("sizes", set())
            extracted_sizes = []
            for sz in sorted(available_sizes):
                sub_img = im.ico.getimage(sz)
                assert sub_img.size == sz, f"Extracted sub-image size mismatch: {sub_img.size} != {sz}"
                px = sub_img.load()
                assert px is not None
                extracted_sizes.append(sz[0])

            # Check sub-image presence
            for exp in expected_sizes:
                if exp not in extracted_sizes:
                    errors.append(f"{ico_path.name}: Missing expected sub-image resolution {exp}x{exp}. Available: {extracted_sizes}")

        print(f"  [OK] {ico_path.name} ({ico_path.parent.name}): All {len(extracted_sizes)} sub-images extracted and loaded -> {extracted_sizes}")
        checks_passed += 1

    # 5. Adversarial Color Analysis: Dominant Terracotta Verification
    print("\n[PHASE 4] Adversarial Color Identity Analysis (Terracotta vs Legacy Blue)")
    color_targets = [
        tauri_icons / "icon.png",
        tauri_icons / "128x128@2x.png",
        tauri_icons / "128x128.png",
        tauri_icons / "32x32.png",
        android_res / "mipmap-xxxhdpi" / "ic_launcher.png",
        android_res / "mipmap-xxhdpi" / "ic_launcher.png",
        android_res / "mipmap-xhdpi" / "ic_launcher.png",
        android_res / "mipmap-hdpi" / "ic_launcher.png",
        android_res / "mipmap-mdpi" / "ic_launcher.png",
        android_res / "drawable-xxxhdpi" / "ic_launcher_foreground.png",
        public_dir / "favicon.png",
        landing_dir / "favicon.png",
    ]

    for target in color_targets:
        if not target.exists():
            errors.append(f"Missing color target: {target}")
            continue

        with Image.open(target) as im:
            rgba = im.convert("RGBA")
            # Pillow 14 forward compatible
            data = rgba.getdata()
            pixels = list(data)
            opaque = [p for p in pixels if p[3] > 128]
            if not opaque:
                errors.append(f"{target.name}: Has no opaque pixels!")
                continue

            # Average R, G, B
            avg_r = sum(p[0] for p in opaque) / len(opaque)
            avg_g = sum(p[1] for p in opaque) / len(opaque)
            avg_b = sum(p[2] for p in opaque) / len(opaque)

            most_freq, count = Counter(p[:3] for p in opaque).most_common(1)[0]

            # Specific check for adaptive foreground (Warm Parchment #FAF9F5 / Deep Obsidian #141413 / Soft Peach #F0D2BF)
            if "foreground" in target.name.lower():
                is_parchment = (abs(most_freq[0]-250) < 10 and abs(most_freq[1]-249) < 10 and abs(most_freq[2]-245) < 10)
                if not is_parchment:
                    errors.append(f"{target.name}: Foreground glyph dominant color {most_freq} is not Warm Parchment (#FAF9F5)")
                print(f"  [OK] {target.name} ({target.parent.name}): Foreground glyph Parchment Mode={most_freq} ({count}/{len(opaque)} px)")
            else:
                # Tile icon: Terracotta requirement: Red must dominate Blue significantly (R > B + 50)
                if avg_r <= avg_b:
                    errors.append(f"{target}: Blue channel ({avg_b:.1f}) exceeds or equals Red ({avg_r:.1f})! Legacy blue detected!")
                elif avg_r < 180 or avg_b > 130:
                    errors.append(f"{target}: Suspicious color profile (R={avg_r:.1f}, G={avg_g:.1f}, B={avg_b:.1f})")

                # #D97757 is (217, 119, 87)
                r_diff = abs(most_freq[0] - 217)
                g_diff = abs(most_freq[1] - 119)
                b_diff = abs(most_freq[2] - 87)
                is_terracotta = (r_diff < 15 and g_diff < 15 and b_diff < 15)

                if not is_terracotta:
                    errors.append(f"{target.name}: Dominant color {most_freq} is not Terracotta (#D97757)")

                print(f"  [OK] {target.name} ({target.parent.name}): Terracotta Mode={most_freq} ({count}/{len(opaque)} px), Avg RGB=({avg_r:.1f}, {avg_g:.1f}, {avg_b:.1f})")

            checks_passed += 1

    # 6. SVG Validity & Embedded Data URI Verification
    print("\n[PHASE 5] Scalable SVG & Embedded Image Integrity")
    svg_paths = [
        public_dir / "logo.svg",
        public_dir / "assets" / "logos" / "skyc-logo.svg",
        landing_dir / "logo.svg",
    ]
    if ABOUT_SKYC.exists():
        svg_paths.append(ABOUT_SKYC / "logo.svg")

    for svg_path in svg_paths:
        if not svg_path.exists():
            errors.append(f"Missing SVG: {svg_path}")
            continue

        raw = svg_path.read_text(encoding="utf-8")
        try:
            tree = ET.fromstring(raw)
            # Find embedded images
            images = tree.findall('.//{http://www.w3.org/2000/svg}image') + tree.findall('.//image')
            
            for img_elem in images:
                href = img_elem.attrib.get('{http://www.w3.org/1999/xlink}href') or img_elem.attrib.get('href')
                if href and href.startswith("data:image/png;base64,"):
                    b64_data = href.split(",", 1)[1]
                    decoded = base64.b64decode(b64_data)
                    import io
                    with Image.open(io.BytesIO(decoded)) as im:
                        im.verify()
                        w, h = im.size
                        assert w >= 128 and h >= 128
                    print(f"  [OK] {svg_path.name} ({svg_path.parent.name}) contains valid embedded PNG ({w}x{h}, {len(decoded)} bytes)")
            
            checks_passed += 1
        except Exception as e:
            errors.append(f"{svg_path}: XML parse or embedded image failure: {e}")

    # Summary
    print("\n======================================================================")
    print(f" ADVERSARIAL SUITE SUMMARY: {checks_passed} checks passed, {len(errors)} failures.")
    print("======================================================================")
    if errors:
        print("\nFAILURES:")
        for e in errors:
            print(f"  [X] {e}")
        return False
    else:
        print("\nALL ADVERSARIAL TESTS PASSED WITHOUT DEFECT.")
        return True

if __name__ == "__main__":
    import sys
    success = run_adversarial_suite()
    sys.exit(0 if success else 1)
