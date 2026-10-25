"""
Tier 3: Zero Old Versions Test Suite
Verifies that no occurrences of the legacy version string '1.6.7' linger across
the codebase (excluding impeccable_repo, .git, .agents, node_modules, and tests).
"""

import os
import re
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

EXCLUDED_DIRS = {
    ".git",
    ".agents",
    "node_modules",
    "impeccable_repo",
    "tests",
    "__pycache__",
    ".idea",
    ".vscode",
    "target",
    "build",
    "dist",
}

BINARY_EXTENSIONS = {
    ".png", ".ico", ".bmp", ".jpg", ".jpeg", ".gif", ".webp",
    ".exe", ".apk", ".jar", ".zip", ".tar", ".gz", ".7z",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".pyc", ".pyd", ".dll", ".so", ".dylib",
    ".tsbuildinfo", ".pdf"
}

DEFAULT_EXCLUDES = {
    "TEST_READY.md",
}

BOGUS_VERSION_PATTERN = re.compile(r'(?<![0-9])1\.8\.67(?!\.\d)(?![0-9])')
ZENNX_PATTERN = re.compile(r'\bzennx\b', re.IGNORECASE)

class TestTier3ZeroOldVersions(unittest.TestCase):
    """Audits the entire active codebase for lingering 'zennx' or fake '1.8.67' references."""

    def test_zero_occurrences_of_zennx(self):
        """Scans all non-binary active project files and asserts 0 occurrences of 'zennx'."""
        violations = []

        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for file in files:
                if file in DEFAULT_EXCLUDES:
                    continue
                ext = os.path.splitext(file)[1].lower()
                if ext in BINARY_EXTENSIONS:
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(PROJECT_ROOT)

                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        for lineno, line in enumerate(f, start=1):
                            if ZENNX_PATTERN.search(line):
                                violations.append(f"{rel_path}:{lineno}: {line.strip()}")
                except Exception as e:
                    pass

        violation_report = "\n".join(violations)
        self.assertEqual(len(violations), 0,
                         f"Found {len(violations)} lingering occurrences of 'zennx':\n{violation_report}")

    def test_zero_occurrences_of_1_8_67(self):
        """Scans all non-binary active project files and asserts 0 occurrences of fake version '1.8.67'."""
        violations = []

        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for file in files:
                if file in DEFAULT_EXCLUDES:
                    continue
                ext = os.path.splitext(file)[1].lower()
                if ext in BINARY_EXTENSIONS:
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(PROJECT_ROOT)

                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        for lineno, line in enumerate(f, start=1):
                            if BOGUS_VERSION_PATTERN.search(line):
                                violations.append(f"{rel_path}:{lineno}: {line.strip()}")
                except Exception as e:
                    pass

        violation_report = "\n".join(violations)
        self.assertEqual(len(violations), 0,
                         f"Found {len(violations)} lingering occurrences of '1.8.67':\n{violation_report}")

if __name__ == "__main__":
    unittest.main()
