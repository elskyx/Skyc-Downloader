"""
Tier 4: Cross-Platform Parity & Sync Test Suite
Verifies:
1. Hash equality between public/ and landing/ favicons and SVG logo
2. Synchronization of favicons and logo.svg to external About-Skyc repository
3. Synchronization of public/ web assets into android/app/src/main/assets/public/ (via Capacitor sync)
"""

import hashlib
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ABOUT_SKYC_DIR = Path(r"C:\Users\ADVAN\OneDrive\Desktop\morirecreate\About-Skyc")

def file_sha256(path: Path) -> str:
    """Calculates SHA256 hex digest of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()

class TestTier4CrossPlatformParity(unittest.TestCase):
    """Verifies cryptographic and semantic parity across Web, Landing, About-Skyc, and Android mirrors."""

    def test_01_public_and_landing_favicon_ico_parity(self):
        """Verifies public/favicon.ico and landing/favicon.ico are bit-identical."""
        pub = PROJECT_ROOT / "public" / "favicon.ico"
        land = PROJECT_ROOT / "landing" / "favicon.ico"
        self.assertTrue(pub.exists(), f"Missing {pub}")
        self.assertTrue(land.exists(), f"Missing {land}")
        self.assertEqual(file_sha256(pub), file_sha256(land),
                         f"SHA256 mismatch between {pub} and {land}")

    def test_02_public_and_landing_favicon_png_parity(self):
        """Verifies public/favicon.png and landing/favicon.png are bit-identical."""
        pub = PROJECT_ROOT / "public" / "favicon.png"
        land = PROJECT_ROOT / "landing" / "favicon.png"
        self.assertTrue(pub.exists(), f"Missing {pub}")
        self.assertTrue(land.exists(), f"Missing {land}")
        self.assertEqual(file_sha256(pub), file_sha256(land),
                         f"SHA256 mismatch between {pub} and {land}")

    def test_03_svg_logo_parity(self):
        """Verifies public/logo.svg, public/assets/logos/skyc-logo.svg, and landing/logo.svg are identical."""
        pub_logo = PROJECT_ROOT / "public" / "logo.svg"
        pub_asset_logo = PROJECT_ROOT / "public" / "assets" / "logos" / "skyc-logo.svg"
        land_logo = PROJECT_ROOT / "landing" / "logo.svg"

        self.assertTrue(pub_logo.exists(), f"Missing {pub_logo}")
        self.assertTrue(pub_asset_logo.exists(), f"Missing {pub_asset_logo}")
        self.assertTrue(land_logo.exists(), f"Missing {land_logo}")

        h_pub = file_sha256(pub_logo)
        h_pub_asset = file_sha256(pub_asset_logo)
        h_land = file_sha256(land_logo)

        self.assertEqual(h_pub, h_land, f"SHA256 mismatch between {pub_logo} and {land_logo}")
        self.assertEqual(h_pub, h_pub_asset, f"SHA256 mismatch between {pub_logo} and {pub_asset_logo}")

    def test_04_about_skyc_repo_asset_parity(self):
        """Verifies About-Skyc external repository has synchronized favicon.ico, favicon.png, and logo.svg."""
        if not ABOUT_SKYC_DIR.exists():
            self.skipTest(f"External About-Skyc repository not found at {ABOUT_SKYC_DIR}")

        land_ico = PROJECT_ROOT / "landing" / "favicon.ico"
        land_png = PROJECT_ROOT / "landing" / "favicon.png"
        land_svg = PROJECT_ROOT / "landing" / "logo.svg"

        about_ico = ABOUT_SKYC_DIR / "favicon.ico"
        about_png = ABOUT_SKYC_DIR / "favicon.png"
        about_svg = ABOUT_SKYC_DIR / "logo.svg"

        self.assertTrue(about_ico.exists(), f"Missing {about_ico}")
        self.assertTrue(about_png.exists(), f"Missing {about_png}")
        self.assertTrue(about_svg.exists(), f"Missing {about_svg}")

        self.assertEqual(file_sha256(land_ico), file_sha256(about_ico),
                         f"About-Skyc/favicon.ico mismatch with landing/favicon.ico")
        self.assertEqual(file_sha256(land_png), file_sha256(about_png),
                         f"About-Skyc/favicon.png mismatch with landing/favicon.png")
        self.assertEqual(file_sha256(land_svg), file_sha256(about_svg),
                         f"About-Skyc/logo.svg mismatch with landing/logo.svg")

    def test_05_about_skyc_repo_version_parity(self):
        """Verifies About-Skyc external repository index.html and script.js reflect v1.8.67."""
        if not ABOUT_SKYC_DIR.exists():
            self.skipTest(f"External About-Skyc repository not found at {ABOUT_SKYC_DIR}")

        about_html = ABOUT_SKYC_DIR / "index.html"
        about_js = ABOUT_SKYC_DIR / "script.js"

        if about_html.exists():
            content = about_html.read_text(encoding="utf-8")
            self.assertIn("1.8.67", content, "About-Skyc/index.html does not contain target version '1.8.67'")

        if about_js.exists():
            content = about_js.read_text(encoding="utf-8")
            self.assertIn("1.8.67", content, "About-Skyc/script.js does not contain target version '1.8.67'")

    def test_06_android_capacitor_public_assets_sync(self):
        """Verifies android/app/src/main/assets/public/ mirrors public/ after npm run android:sync."""
        android_public = PROJECT_ROOT / "android" / "app" / "src" / "main" / "assets" / "public"
        if not android_public.exists():
            self.skipTest(f"Android assets directory not found at {android_public}")

        key_files = [
            "index.html",
            "favicon.png",
            "favicon.ico",
            "js/modules/update.js",
        ]

        for rel in key_files:
            source = PROJECT_ROOT / "public" / rel
            dest = android_public / rel
            self.assertTrue(source.exists(), f"Source file missing: {source}")
            self.assertTrue(dest.exists(), f"Android synced file missing: {dest}")
            self.assertEqual(file_sha256(source), file_sha256(dest),
                             f"Out-of-sync asset between {source} and {dest} (run npm run android:sync)")

if __name__ == "__main__":
    unittest.main()
