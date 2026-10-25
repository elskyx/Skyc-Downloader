#!/usr/bin/env python3
"""
Skyc Downloader v1.7.67 — Automated Master Verification Suite

Usage:
    py -3.14 tests/verify_all.py
    py -3.14 tests/verify_all.py --tier 1
    py -3.14 tests/verify_all.py --tier 2
    py -3.14 tests/verify_all.py --tier 3
    py -3.14 tests/verify_all.py --tier 4
    py -3.14 tests/verify_all.py --verbose
    py -3.14 tests/verify_all.py --json

Tiers:
    Tier 1: Asset Quality & Dimensions (Master icon, Desktop ICO/PNG/BMP, Android mipmaps/drawables/splash, PWA suite, SVGs)
    Tier 2: Version Consistency (1.7.67 / v1.7.67 declarations across 13 project files)
    Tier 3: Zero Old Versions (Grep audit ensuring 0 occurrences of '1.6.7' linger in active codebase)
    Tier 4: Cross-Platform Parity & Sync (Public vs Landing vs About-Skyc vs Android assets)
"""

import sys
import os
import io
import time
import json
import argparse
import unittest
from pathlib import Path

# Reconfigure stdout/stderr to UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Enable ANSI escape sequences on Windows console
if os.name == "nt":
    os.system("")

# Safe terminal symbols
MARK_PASS = "[OK]"
MARK_FAIL = "[X]"
MARK_SKIP = "[-]"

# ANSI Color Codes
COLOR_RESET = "\033[0m"
COLOR_BOLD = "\033[1m"
COLOR_DIM = "\033[2m"
COLOR_RED = "\033[31m"
COLOR_GREEN = "\033[32m"
COLOR_YELLOW = "\033[33m"
COLOR_BLUE = "\033[34m"
COLOR_MAGENTA = "\033[35m"
COLOR_CYAN = "\033[36m"
COLOR_WHITE = "\033[37m"
COLOR_BG_RED = "\033[41m"
COLOR_BG_GREEN = "\033[42m"

# Ensure tests package can be imported
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tests.test_tier1_assets import TestTier1Assets
from tests.test_tier2_versions import TestTier2Versions
from tests.test_tier3_zero_old import TestTier3ZeroOldVersions
from tests.test_tier4_parity import TestTier4CrossPlatformParity

TIER_MAP = {
    1: ("Tier 1: Asset Quality & Dimensions", TestTier1Assets),
    2: ("Tier 2: Version Consistency (v1.7.67)", TestTier2Versions),
    3: ("Tier 3: Zero Old Versions (1.6.7 Audit)", TestTier3ZeroOldVersions),
    4: ("Tier 4: Cross-Platform Parity & Sync", TestTier4CrossPlatformParity),
}

class DetailedTestResult(unittest.TestResult):
    """Custom TestResult collecting detailed execution records and diagnostics."""

    def __init__(self, verbose=False):
        super().__init__()
        self.verbose = verbose
        self.records = []

    def startTest(self, test):
        super().startTest(test)
        self._test_start_time = time.perf_counter()

    def addSuccess(self, test):
        super().addSuccess(test)
        duration = time.perf_counter() - self._test_start_time
        doc = test.shortDescription() or test._testMethodName
        self.records.append({
            "name": test._testMethodName,
            "doc": doc,
            "status": "PASS",
            "duration": duration,
            "error": None
        })

    def addFailure(self, test, err):
        super().addFailure(test, err)
        duration = time.perf_counter() - self._test_start_time
        doc = test.shortDescription() or test._testMethodName
        self.records.append({
            "name": test._testMethodName,
            "doc": doc,
            "status": "FAIL",
            "duration": duration,
            "error": self._format_err(err)
        })

    def addError(self, test, err):
        super().addError(test, err)
        duration = time.perf_counter() - self._test_start_time
        doc = test.shortDescription() or test._testMethodName
        self.records.append({
            "name": test._testMethodName,
            "doc": doc,
            "status": "ERROR",
            "duration": duration,
            "error": self._format_err(err)
        })

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        duration = time.perf_counter() - self._test_start_time
        doc = test.shortDescription() or test._testMethodName
        self.records.append({
            "name": test._testMethodName,
            "doc": doc,
            "status": "SKIP",
            "duration": duration,
            "error": reason
        })

    def _format_err(self, err):
        exctype, value, tb = err
        import traceback
        lines = traceback.format_exception(exctype, value, tb)
        return "".join(lines)


def run_tier(tier_num, title, test_case_cls, verbose=False):
    """Runs a single test tier and returns structured metrics."""
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(test_case_cls)
    result = DetailedTestResult(verbose=verbose)
    start_time = time.perf_counter()
    suite.run(result)
    total_time = time.perf_counter() - start_time

    passed = len([r for r in result.records if r["status"] == "PASS"])
    failed = len([r for r in result.records if r["status"] in ("FAIL", "ERROR")])
    skipped = len([r for r in result.records if r["status"] == "SKIP"])
    total = len(result.records)

    return {
        "tier": tier_num,
        "title": title,
        "total": total,
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "duration": total_time,
        "records": result.records,
    }


def print_banner():
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'=' * 78}{COLOR_RESET}")
    print(f"{COLOR_BOLD}{COLOR_WHITE}  SKYC DOWNLOADER — AUTOMATED VERIFICATION SUITE (v1.7.67){COLOR_RESET}")
    print(f"{COLOR_DIM}  Authoritative Multi-Tier Quality & Release Gate{COLOR_RESET}")
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'=' * 78}{COLOR_RESET}\n")


def print_tier_results(res, verbose=False):
    tier_num = res["tier"]
    title = res["title"]
    passed = res["passed"]
    failed = res["failed"]
    total = res["total"]
    duration = res["duration"]

    if failed == 0:
        badge = f"{COLOR_BG_GREEN}{COLOR_WHITE}{COLOR_BOLD} PASS {COLOR_RESET}"
        status_color = COLOR_GREEN
    else:
        badge = f"{COLOR_BG_RED}{COLOR_WHITE}{COLOR_BOLD} FAIL {COLOR_RESET}"
        status_color = COLOR_RED

    print(f"{badge} {COLOR_BOLD}[Tier {tier_num}] {title}{COLOR_RESET}")
    print(f"       Result: {status_color}{passed}/{total} passed{COLOR_RESET} ({failed} failed, {res['skipped']} skipped) in {duration:.3f}s\n")

    for rec in res["records"]:
        name = rec["name"]
        doc = rec["doc"]
        st = rec["status"]
        dur = rec["duration"]

        if st == "PASS":
            mark = f"{COLOR_GREEN}{MARK_PASS}{COLOR_RESET}"
            detail = f"{COLOR_DIM}({dur:.3f}s){COLOR_RESET}"
        elif st == "SKIP":
            mark = f"{COLOR_YELLOW}{MARK_SKIP}{COLOR_RESET}"
            detail = f"{COLOR_YELLOW}[SKIPPED: {rec['error']}]{COLOR_RESET}"
        else:
            mark = f"{COLOR_RED}{MARK_FAIL}{COLOR_RESET}"
            detail = f"{COLOR_RED}[{st}]{COLOR_RESET}"

        if verbose or st in ("FAIL", "ERROR"):
            print(f"       {mark} {name}: {doc} {detail}")
            if rec["error"] and st in ("FAIL", "ERROR"):
                indent_err = "\n".join("         " + l for l in rec["error"].strip().splitlines())
                print(f"{COLOR_RED}{indent_err}{COLOR_RESET}\n")
        elif not verbose and st == "PASS":
            pass

    if not verbose:
        print()


def main():
    parser = argparse.ArgumentParser(description="Skyc Automated Verification Suite")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4], help="Run specific tier only")
    parser.add_argument("-v", "--verbose", action="store_true", help="Display all passing tests in detail")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()

    selected_tiers = [args.tier] if args.tier else [1, 2, 3, 4]

    tier_results = []
    overall_start = time.perf_counter()

    if not args.json:
        print_banner()

    for t_num in selected_tiers:
        title, test_cls = TIER_MAP[t_num]
        res = run_tier(t_num, title, test_case_cls=test_cls, verbose=args.verbose)
        tier_results.append(res)
        if not args.json:
            print_tier_results(res, verbose=args.verbose)

    overall_duration = time.perf_counter() - overall_start
    total_tests = sum(r["total"] for r in tier_results)
    total_passed = sum(r["passed"] for r in tier_results)
    total_failed = sum(r["failed"] for r in tier_results)
    total_skipped = sum(r["skipped"] for r in tier_results)

    all_passed = (total_failed == 0)

    if args.json:
        output_data = {
            "all_passed": all_passed,
            "total_tests": total_tests,
            "total_passed": total_passed,
            "total_failed": total_failed,
            "total_skipped": total_skipped,
            "duration": overall_duration,
            "tiers": tier_results,
        }
        print(json.dumps(output_data, indent=2))
        sys.exit(0 if all_passed else 1)

    # Print Summary Table
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'=' * 78}{COLOR_RESET}")
    print(f"{COLOR_BOLD}{COLOR_WHITE}  FINAL SUMMARY TABLE{COLOR_RESET}")
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'=' * 78}{COLOR_RESET}")
    print(f"{'Tier':<8}{'Suite Title':<44}{'Result':<12}{'Score':<10}")
    print(f"{'-' * 78}")

    for r in tier_results:
        t_id = f"Tier {r['tier']}"
        t_title = r["title"][:42]
        if r["failed"] == 0:
            res_str = f"{COLOR_GREEN}PASS{COLOR_RESET}"
        else:
            res_str = f"{COLOR_RED}FAIL ({r['failed']}){COLOR_RESET}"
        score = f"{r['passed']}/{r['total']}"
        print(f"{t_id:<8}{t_title:<44}{res_str:<21}{score:<10}")

    print(f"{'-' * 78}")
    if all_passed:
        overall_badge = f"{COLOR_BG_GREEN}{COLOR_WHITE}{COLOR_BOLD}  ALL TIERS PASSED  {COLOR_RESET}"
        status_msg = f"{COLOR_GREEN}All {total_passed} tests passed successfully in {overall_duration:.3f}s.{COLOR_RESET}"
    else:
        overall_badge = f"{COLOR_BG_RED}{COLOR_WHITE}{COLOR_BOLD}  VERIFICATION FAILED  {COLOR_RESET}"
        status_msg = f"{COLOR_RED}{total_failed} test(s) failed out of {total_tests} in {overall_duration:.3f}s.{COLOR_RESET}"

    print(f"\n{overall_badge} — {status_msg}\n")
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'=' * 78}{COLOR_RESET}\n")

    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
