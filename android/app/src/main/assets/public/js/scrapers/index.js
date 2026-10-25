// public/js/scrapers/index.js
import { scraperFetch } from "./httpHelper.js";

export const BUNDLED_SCRAPER_VERSION = 2;
if (typeof window !== "undefined") {
  window.__SKYC_BUNDLED_SCRAPER_VERSION__ = BUNDLED_SCRAPER_VERSION;
}

let _engineInstance = null;

/**
 * Loads the active scraper engine (either from bundled engine or OTA hot-patch)
 */
export async function getScraperEngine() {
  if (_engineInstance) return _engineInstance;

  const globalObj = typeof window !== "undefined" ? window : globalThis;

  // 1. Check if bundle.js was loaded as global script
  const foundGlobal = globalObj.__SkycScraperEngine || globalObj.__SkycScraperEngine;
  if (foundGlobal?.extractMedia) {
    _engineInstance = foundGlobal;
    return _engineInstance;
  }

  // 2. Check for OTA Hot-Patch in localStorage
  if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
    try {
      const activeVer = parseInt(localStorage.getItem("skyc_active_scraper_version") || localStorage.getItem("skyc_active_scraper_version") || "0", 10);
      if (activeVer < BUNDLED_SCRAPER_VERSION) {
        // Clear stale cached scraper hot-patches
        localStorage.removeItem("skyc_patched_scraper_bin");
        localStorage.removeItem("skyc_active_scraper_version");
        localStorage.removeItem("skyc_active_scraper_hash");
        localStorage.removeItem("skyc_patched_scraper_bin");
        localStorage.removeItem("skyc_active_scraper_version");
        localStorage.removeItem("skyc_active_scraper_hash");
      } else {
        const patchedScript = localStorage.getItem("skyc_patched_scraper_bin") || localStorage.getItem("skyc_patched_scraper_bin");
        if (patchedScript && activeVer >= BUNDLED_SCRAPER_VERSION) {
          console.log(`[Skyc] Executing OTA Hot-Patched Scraper Core v${activeVer}`);
          const otaFunction = new Function("exports", patchedScript);
          const otaExports = {};
          otaFunction(otaExports);
          const otaFound = otaExports.__SkycScraperEngine || otaExports.__SkycScraperEngine || globalObj.__SkycScraperEngine || globalObj.__SkycScraperEngine;
          if (otaFound?.extractMedia) {
            _engineInstance = otaFound;
            return _engineInstance;
          }
        }
      }
    } catch (otaErr) {
      console.warn("[Skyc] OTA Patch loader error:", otaErr);
    }
  }

  // 3. Fallback: dynamically load bundle.js
  try {
    const mod = await import("./bundle.js");
    const engine = mod?.default || mod?.__SkycScraperEngine || mod?.__SkycScraperEngine || globalObj.__SkycScraperEngine || globalObj.__SkycScraperEngine;
    if (engine?.extractMedia) {
      _engineInstance = engine;
      return _engineInstance;
    }
  } catch (loadErr) {
    console.warn("[Skyc] Dynamic bundle load error:", loadErr);
  }

  // 4. In Node environment, dynamically load directly from bundle.js
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const url = await import("url");
      const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
      const bundlePath = path.join(currentDir, "bundle.js");
      if (fs.existsSync(bundlePath)) {
        const code = fs.readFileSync(bundlePath, "utf-8");
        const fn = new Function("module", "exports", "globalThis", `${code}\nreturn globalThis.__SkycScraperEngine || globalThis.__SkycScraperEngine;`);
        const exports = {};
        const engine = fn({ exports }, exports, globalObj);
        if (engine?.extractMedia) {
          _engineInstance = engine;
          return _engineInstance;
        }
      }
    } catch (nodeErr) {
      console.warn("[Skyc] Node loader error:", nodeErr);
    }
  }

  throw new Error("Skyc Scraper Engine not loaded. Please restart the app.");
}

/**
 * Public wrapper for media extraction
 */
export async function analyzeUrl(url) {
  const engine = await getScraperEngine();
  return await engine.extractMedia(url, scraperFetch);
}
