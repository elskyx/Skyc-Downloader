"""
Tier 2: Version Consistency Test Suite
Verifies that all 13 critical project declaration files specify 1.8.67 / v1.8.67:
1. package.json
2. cli/package.json
3. cli/index.js
4. src-tauri/tauri.conf.json
5. src-tauri/Cargo.toml
6. public/index.html
7. public/js/modules/update.js
8. landing/index.html
9. landing/script.js
10. components/ui/demo.tsx
11. components/ui/navigation-menu-4.tsx
12. README.md
13. android/app/build.gradle
"""

import os
import re
import json
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TARGET_VERSION = "1.6.7"
TARGET_TAG = "v1.6.7"

class TestTier2Versions(unittest.TestCase):
    """Verifies that every project component declares target version 1.6.7 / v1.6.7."""

    def test_01_root_package_json(self):
        """Verifies root package.json specifies version 1.6.7."""
        path = PROJECT_ROOT / "package.json"
        self.assertTrue(path.exists(), f"Missing {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data.get("version"), TARGET_VERSION,
                         f"package.json version is '{data.get('version')}', expected '{TARGET_VERSION}'")

    def test_02_cli_package_json(self):
        """Verifies cli/package.json specifies version 1.7.67."""
        path = PROJECT_ROOT / "cli" / "package.json"
        self.assertTrue(path.exists(), f"Missing {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data.get("version"), TARGET_VERSION,
                         f"cli/package.json version is '{data.get('version')}', expected '{TARGET_VERSION}'")

    def test_03_cli_index_js(self):
        """Verifies cli/index.js defines CLI_VERSION = '1.7.67'."""
        path = PROJECT_ROOT / "cli" / "index.js"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")
        match = re.search(r'const\s+CLI_VERSION\s*=\s*["\']([^"\']+)["\']', content)
        self.assertIsNotNone(match, "Could not find CLI_VERSION declaration in cli/index.js")
        self.assertEqual(match.group(1), TARGET_VERSION,
                         f"cli/index.js CLI_VERSION is '{match.group(1)}', expected '{TARGET_VERSION}'")

    def test_04_tauri_conf_json(self):
        """Verifies src-tauri/tauri.conf.json specifies version 1.7.67."""
        path = PROJECT_ROOT / "src-tauri" / "tauri.conf.json"
        self.assertTrue(path.exists(), f"Missing {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        version = data.get("version") or data.get("package", {}).get("version")
        self.assertEqual(version, TARGET_VERSION,
                         f"src-tauri/tauri.conf.json version is '{version}', expected '{TARGET_VERSION}'")

    def test_05_cargo_toml(self):
        """Verifies src-tauri/Cargo.toml specifies version 1.7.67."""
        path = PROJECT_ROOT / "src-tauri" / "Cargo.toml"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")
        match = re.search(r'\[package\][\s\S]*?version\s*=\s*"([^"]+)"', content)
        self.assertIsNotNone(match, "Could not find package version in src-tauri/Cargo.toml")
        self.assertEqual(match.group(1), TARGET_VERSION,
                         f"src-tauri/Cargo.toml version is '{match.group(1)}', expected '{TARGET_VERSION}'")

    def test_06_public_index_html(self):
        """Verifies public/index.html header OTA status, settings modal, and update tag reflect v1.7.67."""
        path = PROJECT_ROOT / "public" / "index.html"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")

        # Header OTA status
        ota_match = re.search(r'id="headerOtaStatus"[^>]*>Core\s+v([^<]+)<', content)
        self.assertIsNotNone(ota_match, "headerOtaStatus element not found in public/index.html")
        self.assertEqual(ota_match.group(1), TARGET_VERSION,
                         f"public/index.html headerOtaStatus is 'v{ota_match.group(1)}', expected '{TARGET_TAG}'")

        # Settings modal version
        settings_match = re.search(r'id="settingsAppVersion"[^>]*>v([0-9.]+)', content)
        self.assertIsNotNone(settings_match, "settingsAppVersion element not found in public/index.html")
        self.assertEqual(settings_match.group(1), TARGET_VERSION,
                         f"public/index.html settingsAppVersion is 'v{settings_match.group(1)}', expected '{TARGET_TAG}'")

        # Update current version pill
        update_match = re.search(r'id="updateCurrentVersionTag"[^>]*>[^<]*v([0-9.]+)', content)
        self.assertIsNotNone(update_match, "updateCurrentVersionTag element not found in public/index.html")
        self.assertEqual(update_match.group(1), TARGET_VERSION,
                         f"public/index.html updateCurrentVersionTag is 'v{update_match.group(1)}', expected '{TARGET_TAG}'")

    def test_07_public_update_module_js(self):
        """Verifies public/js/modules/update.js exports APP_CURRENT_VERSION = '1.7.67'."""
        path = PROJECT_ROOT / "public" / "js" / "modules" / "update.js"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")
        match = re.search(r'APP_CURRENT_VERSION\s*=\s*["\']([^"\']+)["\']', content)
        self.assertIsNotNone(match, "APP_CURRENT_VERSION not found in public/js/modules/update.js")
        self.assertEqual(match.group(1), TARGET_VERSION,
                         f"update.js APP_CURRENT_VERSION is '{match.group(1)}', expected '{TARGET_VERSION}'")

    def test_08_landing_index_html(self):
        """Verifies landing/index.html softwareVersion, badges, and release links reflect v1.7.67."""
        path = PROJECT_ROOT / "landing" / "index.html"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")

        # softwareVersion schema
        schema_match = re.search(r'"softwareVersion":\s*"([^"]+)"', content)
        self.assertIsNotNone(schema_match, "softwareVersion schema not found in landing/index.html")
        self.assertEqual(schema_match.group(1), TARGET_VERSION,
                         f"landing/index.html softwareVersion is '{schema_match.group(1)}', expected '{TARGET_VERSION}'")

        # Brand badges
        self.assertIn(f"v{TARGET_VERSION}", content, f"landing/index.html does not contain 'v{TARGET_VERSION}'")

        # Download filenames
        self.assertIn(f"Skyc-v{TARGET_VERSION}.apk", content,
                      f"landing/index.html missing download link for Skyc-v{TARGET_VERSION}.apk")
        self.assertIn(f"Skyc_{TARGET_VERSION}_x64-setup.exe", content,
                      f"landing/index.html missing download link for Skyc_{TARGET_VERSION}_x64-setup.exe")

    def test_09_landing_script_js(self):
        """Verifies landing/script.js defines currentVersion = '1.6.7'."""
        path = PROJECT_ROOT / "landing" / "script.js"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")
        match = re.search(r'currentVersion\s*=\s*["\']([^"\']+)["\']', content)
        self.assertIsNotNone(match, "currentVersion variable not found in landing/script.js")
        self.assertEqual(match.group(1), TARGET_VERSION,
                         f"landing/script.js currentVersion is '{match.group(1)}', expected '{TARGET_VERSION}'")

    def test_10_components_ui(self):
        """Verifies components/ui/demo.tsx and components/ui/navigation-menu-4.tsx reflect v1.6.7."""
        demo_path = PROJECT_ROOT / "components" / "ui" / "demo.tsx"
        self.assertTrue(demo_path.exists(), f"Missing {demo_path}")
        demo_content = demo_path.read_text(encoding="utf-8")
        self.assertIn(f"v{TARGET_VERSION}", demo_content,
                      f"components/ui/demo.tsx does not contain 'v{TARGET_VERSION}'")

        nav_path = PROJECT_ROOT / "components" / "ui" / "navigation-menu-4.tsx"
        self.assertTrue(nav_path.exists(), f"Missing {nav_path}")
        nav_content = nav_path.read_text(encoding="utf-8")
        self.assertIn(f"v{TARGET_VERSION}", nav_content,
                      f"components/ui/navigation-menu-4.tsx does not contain 'v{TARGET_VERSION}'")

    def test_11_readme_md(self):
        """Verifies README.md version badge and download tables specify v1.6.7."""
        path = PROJECT_ROOT / "README.md"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")
        self.assertIn(f"Version-v{TARGET_VERSION}", content,
                      f"README.md does not contain Version-v{TARGET_VERSION} badge")
        self.assertIn(f"Skyc-v{TARGET_VERSION}.apk", content,
                      f"README.md does not contain Skyc-v{TARGET_VERSION}.apk")
        self.assertIn(f"Skyc_{TARGET_VERSION}_x64-setup.exe", content,
                      f"README.md does not contain Skyc_{TARGET_VERSION}_x64-setup.exe")

    def test_12_android_build_gradle(self):
        """Verifies android/app/build.gradle specifies versionName '1.7.67'."""
        path = PROJECT_ROOT / "android" / "app" / "build.gradle"
        self.assertTrue(path.exists(), f"Missing {path}")
        content = path.read_text(encoding="utf-8")
        match = re.search(r'versionName\s+["\']([^"\']+)["\']', content)
        self.assertIsNotNone(match, "versionName not found in android/app/build.gradle")
        self.assertEqual(match.group(1), TARGET_VERSION,
                         f"android/app/build.gradle versionName is '{match.group(1)}', expected '{TARGET_VERSION}'")

if __name__ == "__main__":
    unittest.main()
