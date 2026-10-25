"""
Tier 1: Asset Quality & Dimensions Test Suite
Verifies:
1. Master source icon (dimensions, RGBA, SHA256, uncorrupted)
2. Windows Desktop icons in src-tauri/icons/ (PNG dimensions, ICO sub-images, 24-bit BMP dimensions, color fidelity)
3. Android launcher mipmaps (ic_launcher.png, ic_launcher_round.png across all densities)
4. Android adaptive foregrounds (108px to 432px)
5. Android splash screens (default 1024x1024, landscape 1280x720, portrait 720x1280)
6. Web/PWA favicons and PNG suite (16px to 512px)
7. Valid SVG vector representations
"""

import os
import struct
import hashlib
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MASTER_ICON_PATH = Path(r"C:\Users\ADVAN\.gemini\antigravity\brain\3bccece5-81d0-49c6-bbfe-5e501c5c5873\new_icon.png")
EXPECTED_MASTER_SHA256 = "d96f0d840bb690d0e067533b2fb45c23bfd7769248da0860a3d1132e9eecac57"

def read_ico_sub_images(filepath):
    """Parses binary ICO header to extract list of (width, height) sub-images."""
    with open(filepath, "rb") as f:
        data = f.read(6)
        if len(data) < 6 or data[:4] != b"\x00\x00\x01\x00":
            raise ValueError(f"Not a valid ICO file: {filepath}")
        count = struct.unpack("<H", data[4:6])[0]
        sizes = set()
        for _ in range(count):
            entry = f.read(16)
            if len(entry) < 16:
                break
            w, h = entry[0], entry[1]
            w = 256 if w == 0 else w
            h = 256 if h == 0 else h
            sizes.add((w, h))
        return sizes

def read_bmp_info(filepath):
    """Parses binary BMP header to extract (width, height, planes, bpp)."""
    with open(filepath, "rb") as f:
        sig = f.read(2)
        if sig != b"BM":
            raise ValueError(f"Not a valid BMP file: {filepath}")
        f.seek(18)
        header_data = f.read(12)
        w, h, planes, bpp = struct.unpack("<iiHH", header_data)
        return abs(w), abs(h), planes, bpp

def read_png_info(filepath):
    """Parses binary PNG IHDR chunk to extract (width, height, bit_depth, color_type)."""
    with open(filepath, "rb") as f:
        sig = f.read(8)
        if sig != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"Not a valid PNG file: {filepath}")
        length_type = f.read(8)
        length, chunk_type = struct.unpack(">I4s", length_type)
        if chunk_type != b"IHDR":
            raise ValueError(f"Missing IHDR chunk in PNG: {filepath}")
        ihdr = f.read(13)
        w, h, depth, color_type = struct.unpack(">IIBB", ihdr[:10])
        return w, h, depth, color_type

class TestTier1Assets(unittest.TestCase):
    """Comprehensive test suite for asset quality, dimensions, format, and corruption checks."""

    def test_01_master_source_icon(self):
        """Verifies master icon exists, is 512x512 RGBA PNG, has exact sha256, and is uncorrupted."""
        self.assertTrue(MASTER_ICON_PATH.exists(), f"Master icon not found at {MASTER_ICON_PATH}")
        data = MASTER_ICON_PATH.read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(), EXPECTED_MASTER_SHA256,
                         "Master icon SHA256 mismatch")
        w, h, depth, colortype = read_png_info(MASTER_ICON_PATH)
        self.assertEqual((w, h), (512, 512), "Master icon must be 512x512")
        self.assertEqual(colortype, 6, "Master icon must be RGBA (color type 6)")

        if HAS_PIL:
            with Image.open(MASTER_ICON_PATH) as im:
                im.verify()
            with Image.open(MASTER_ICON_PATH) as im:
                self.assertEqual(im.size, (512, 512))
                self.assertEqual(im.mode, "RGBA")

    def test_02_windows_tauri_png_dimensions(self):
        """Verifies all required Tauri PNG icons exist, are uncorrupted, and have exact dimensions."""
        tauri_icons_dir = PROJECT_ROOT / "src-tauri" / "icons"
        expected_pngs = {
            "icon.png": (512, 512),
            "128x128@2x.png": (256, 256),
            "128x128.png": (128, 128),
            "32x32.png": (32, 32),
        }
        for filename, expected_size in expected_pngs.items():
            path = tauri_icons_dir / filename
            self.assertTrue(path.exists(), f"Missing Tauri icon: {path}")
            w, h, depth, color = read_png_info(path)
            self.assertEqual((w, h), expected_size, f"{filename} dimensions mismatch: got ({w}, {h}), expected {expected_size}")
            if HAS_PIL:
                with Image.open(path) as im:
                    im.verify()

    def test_03_windows_tauri_ico_sub_images(self):
        """Verifies src-tauri/icons/icon.ico contains all 7 sub-images from 16x16 to 256x256."""
        ico_path = PROJECT_ROOT / "src-tauri" / "icons" / "icon.ico"
        self.assertTrue(ico_path.exists(), f"Missing Tauri icon.ico at {ico_path}")
        sub_images = read_ico_sub_images(ico_path)
        required_sizes = {(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)}
        missing = required_sizes - sub_images
        self.assertFalse(missing, f"icon.ico is missing required sub-image sizes: {missing}")

    def test_04_windows_installer_bmps(self):
        """Verifies NSIS and WiX installer BMPs exist with exact uncompressed dimensions."""
        tauri_icons_dir = PROJECT_ROOT / "src-tauri" / "icons"
        expected_bmps = {
            "header.bmp": (150, 57),
            "sidebar.bmp": (164, 314),
            "banner.bmp": (493, 58),
            "dialog.bmp": (493, 312),
        }
        for filename, expected_size in expected_bmps.items():
            path = tauri_icons_dir / filename
            self.assertTrue(path.exists(), f"Missing installer BMP: {path}")
            w, h, planes, bpp = read_bmp_info(path)
            self.assertEqual((w, h), expected_size, f"{filename} dimension mismatch: got ({w}, {h}), expected {expected_size}")
            self.assertEqual(planes, 1, f"{filename} planes must be 1")
            self.assertIn(bpp, (24, 32), f"{filename} bpp must be 24 or 32, got {bpp}")

    def test_05_windows_icon_color_identity(self):
        """Verifies src-tauri/icons/icon.png uses new terracotta theme rather than old dark blue mascot."""
        if not HAS_PIL:
            self.skipTest("PIL not available for color identity testing")
        icon_path = PROJECT_ROOT / "src-tauri" / "icons" / "icon.png"
        self.assertTrue(icon_path.exists(), f"Missing {icon_path}")
        with Image.open(icon_path) as im:
            rgba = im.convert("RGBA")
            pixel = rgba.getpixel((100, 100))
            # Old mascot color at (100, 100) is (15, 18, 23, 192) - predominantly dark blue/obsidian
            # New terracotta squircle at (100, 100) is (217, 119, 87, 255)
            is_old_blue = pixel[0] < 50 and pixel[1] < 50 and pixel[2] < 50
            self.assertFalse(is_old_blue, f"src-tauri/icons/icon.png still depicts old mascot color: {pixel}")
            # Ensure strong terracotta red/orange presence: R > G > B
            self.assertTrue(pixel[0] > 180 and pixel[1] > 90 and pixel[2] < 120,
                            f"src-tauri/icons/icon.png squircle pixel at (100, 100) is not terracotta: {pixel}")

    def test_06_android_launcher_mipmaps(self):
        """Verifies all Android launcher mipmap densities exist and have exact resolutions."""
        res_dir = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
        densities = {
            "mipmap-mdpi": (48, 48),
            "mipmap-hdpi": (72, 72),
            "mipmap-xhdpi": (96, 96),
            "mipmap-xxhdpi": (144, 144),
            "mipmap-xxxhdpi": (192, 192),
        }
        for density, expected_size in densities.items():
            for icon_type in ["ic_launcher.png", "ic_launcher_round.png"]:
                path = res_dir / density / icon_type
                self.assertTrue(path.exists(), f"Missing Android icon: {path}")
                w, h, depth, color = read_png_info(path)
                self.assertEqual((w, h), expected_size, f"{path} dimensions mismatch: got ({w}, {h}), expected {expected_size}")

    def test_06b_android_icon_color_identity(self):
        """Verifies Android launcher icons use new terracotta theme rather than old dark blue mascot."""
        if not HAS_PIL:
            self.skipTest("PIL not available for color identity testing")
        res_dir = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
        icon_path = res_dir / "mipmap-xxxhdpi" / "ic_launcher.png"
        self.assertTrue(icon_path.exists(), f"Missing {icon_path}")
        with Image.open(icon_path) as im:
            rgba = im.convert("RGBA")
            pixel = rgba.getpixel((40, 40))
            is_old_blue = pixel[0] < 50 and pixel[1] < 50 and pixel[2] < 50
            self.assertFalse(is_old_blue, f"mipmap-xxxhdpi/ic_launcher.png still depicts old mascot color: {pixel}")
            self.assertTrue(pixel[0] > 180 and pixel[1] > 90 and pixel[2] < 120,
                            f"mipmap-xxxhdpi/ic_launcher.png pixel at (40, 40) is not terracotta: {pixel}")

    def test_07_android_adaptive_foregrounds(self):
        """Verifies all Android adaptive launcher foreground densities exist with exact resolutions."""
        res_dir = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
        expected_foregrounds = {
            "drawable-mdpi/ic_launcher_foreground.png": (108, 108),
            "drawable-hdpi/ic_launcher_foreground.png": (162, 162),
            "drawable-xhdpi/ic_launcher_foreground.png": (216, 216),
            "drawable-xxhdpi/ic_launcher_foreground.png": (324, 324),
            "drawable-xxxhdpi/ic_launcher_foreground.png": (432, 432),
            "drawable/ic_launcher_foreground.png": (432, 432),
        }
        for rel_path, expected_size in expected_foregrounds.items():
            path = res_dir / rel_path
            self.assertTrue(path.exists(), f"Missing foreground icon: {path}")
            w, h, depth, color = read_png_info(path)
            self.assertEqual((w, h), expected_size, f"{path} dimensions mismatch: got ({w}, {h}), expected {expected_size}")

    def test_08_android_splash_screens(self):
        """Verifies Android splash screens exist for default, landscape, and portrait."""
        res_dir = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
        expected_splashes = {
            "drawable/splash.png": (1024, 1024),
            "drawable-land/splash.png": (1280, 720),
            "drawable-port/splash.png": (720, 1280),
        }
        for rel_path, expected_size in expected_splashes.items():
            path = res_dir / rel_path
            self.assertTrue(path.exists(), f"Missing splash screen: {path}")
            w, h, depth, color = read_png_info(path)
            self.assertEqual((w, h), expected_size, f"{path} dimensions mismatch: got ({w}, {h}), expected {expected_size}")

    def test_09_web_and_pwa_icons(self):
        """Verifies Web and PWA icons in public/ and landing/ exist with exact dimensions."""
        # Favicons
        pub_ico = PROJECT_ROOT / "public" / "favicon.ico"
        land_ico = PROJECT_ROOT / "landing" / "favicon.ico"
        self.assertTrue(pub_ico.exists(), f"Missing {pub_ico}")
        self.assertTrue(land_ico.exists(), f"Missing {land_ico}")
        ico_sizes = read_ico_sub_images(pub_ico)
        self.assertTrue({(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)}.issubset(ico_sizes),
                        f"public/favicon.ico missing required sub-images: {ico_sizes}")

        # PNG favicons
        pub_png = PROJECT_ROOT / "public" / "favicon.png"
        land_png = PROJECT_ROOT / "landing" / "favicon.png"
        self.assertTrue(pub_png.exists(), f"Missing {pub_png}")
        self.assertTrue(land_png.exists(), f"Missing {land_png}")
        w, h, _, _ = read_png_info(pub_png)
        self.assertEqual((w, h), (256, 256), f"public/favicon.png size mismatch: got ({w}, {h})")

        # 6-tier PWA suite
        pwa_dir = PROJECT_ROOT / "public" / "assets" / "logos" / "png"
        pwa_sizes = {
            "skyc-app-icon-16.png": (16, 16),
            "skyc-app-icon-32.png": (32, 32),
            "skyc-app-icon-64.png": (64, 64),
            "skyc-app-icon-128.png": (128, 128),
            "skyc-app-icon-256.png": (256, 256),
            "skyc-app-icon-512.png": (512, 512),
        }
        for filename, expected_size in pwa_sizes.items():
            path = pwa_dir / filename
            self.assertTrue(path.exists(), f"Missing PWA icon: {path}")
            w, h, _, _ = read_png_info(path)
            self.assertEqual((w, h), expected_size, f"{filename} dimension mismatch: got ({w}, {h}), expected {expected_size}")

    def test_10_svg_validity(self):
        """Verifies SVG logo files are well-formed XML and contain an svg root element."""
        svg_paths = [
            PROJECT_ROOT / "public" / "logo.svg",
            PROJECT_ROOT / "public" / "assets" / "logos" / "skyc-logo.svg",
            PROJECT_ROOT / "landing" / "logo.svg",
        ]
        for path in svg_paths:
            self.assertTrue(path.exists(), f"Missing SVG file: {path}")
            self.assertGreater(path.stat().st_size, 0, f"SVG file is empty: {path}")
            tree = ET.parse(path)
            root = tree.getroot()
            tag = root.tag.split("}")[-1] if "}" in root.tag else root.tag
            self.assertEqual(tag, "svg", f"Root element of {path} is not <svg>, got <{root.tag}>")

if __name__ == "__main__":
    unittest.main()
