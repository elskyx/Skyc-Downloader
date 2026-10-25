// scripts/compile-scrapers.mjs
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function build() {
  console.log("⚡ Compiling Zennx Scrapers...");

  const outPublic = path.join(rootDir, "public", "js", "scrapers", "bundle.js");
  const outCli = path.join(rootDir, "cli", "bundle.js");

  fs.mkdirSync(path.dirname(outPublic), { recursive: true });
  fs.mkdirSync(path.dirname(outCli), { recursive: true });

  let compiledCode = "";

  // 1. Try esbuild if available
  try {
    const esbuild = await import("esbuild");
    await esbuild.build({
      entryPoints: [path.join(rootDir, "src-scrapers", "index.js")],
      bundle: true,
      format: "iife",
      globalName: "__ZennxScraperEngine",
      outfile: outPublic,
      minify: false,
      sourcemap: false,
      platform: "neutral",
      footer: {
        js: "\nconst __SkycScraperEngine = __ZennxScraperEngine;\nif (typeof module !== 'undefined' && module.exports) { module.exports = __ZennxScraperEngine; }\nif (typeof window !== 'undefined') { window.__ZennxScraperEngine = __ZennxScraperEngine; window.__SkycScraperEngine = __ZennxScraperEngine; }\nif (typeof globalThis !== 'undefined') { globalThis.__ZennxScraperEngine = __ZennxScraperEngine; globalThis.__SkycScraperEngine = __ZennxScraperEngine; }\n",
      },
    });
    compiledCode = fs.readFileSync(outPublic, "utf-8");
  } catch (err) {
    console.log("ℹ️  esbuild not found, using built-in high-fidelity compiler...");

    // Built-in compiler: bundles all platform modules into single IIFE
    const platformsDir = path.join(rootDir, "src-scrapers", "platforms");
    const platformFiles = fs.readdirSync(platformsDir).filter((f) => f.endsWith(".js"));

    let combinedModules = `
var __ZennxScraperEngine = (function() {
  "use strict";
`;

    // Include platform functions
    for (const file of platformFiles) {
      let content = fs.readFileSync(path.join(platformsDir, file), "utf-8");
      // Strip ES6 export and import statements
      content = content.replace(/import\s+[^;]+;/g, "");
      content = content.replace(/export\s+async\s+function\s+/g, "async function ");
      content = content.replace(/export\s+function\s+/g, "function ");
      content = content.replace(/export\s+const\s+/g, "const ");
      combinedModules += `\n  // Platform: ${file}\n${content}\n`;
    }

    // Read index.js logic
    let indexContent = fs.readFileSync(path.join(rootDir, "src-scrapers", "index.js"), "utf-8");
    indexContent = indexContent.replace(/import\s+[^;]+;/g, "");
    indexContent = indexContent.replace(/export\s+const\s+/g, "const ");
    indexContent = indexContent.replace(/export\s+async\s+function\s+/g, "async function ");

    combinedModules += `\n  // Master Registry\n${indexContent}\n`;
    combinedModules += `
  return {
    SCRAPER_VERSION,
    PLATFORM_REGISTRY,
    extractMedia
  };
})();
var __SkycScraperEngine = __ZennxScraperEngine;
if (typeof window !== "undefined") {
  window.__ZennxScraperEngine = __ZennxScraperEngine;
  window.__SkycScraperEngine = __ZennxScraperEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = __ZennxScraperEngine;
}
`;

    fs.writeFileSync(outPublic, combinedModules, "utf-8");
    compiledCode = combinedModules;
  }

  // Copy bundle to CLI
  fs.writeFileSync(outCli, compiledCode, "utf-8");

  // Compute SHA-256
  const hash = crypto.createHash("sha256").update(compiledCode).digest("hex");
  const manifest = {
    version: 2,
    sha256: hash,
    size: Buffer.byteLength(compiledCode, "utf-8"),
    updatedAt: Date.now(),
  };

  const manifestStr = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(path.join(rootDir, "public", "scrapers-version.json"), manifestStr);
  fs.writeFileSync(path.join(rootDir, "cli", "scrapers-version.json"), manifestStr);

  console.log(`✅ Scraper bundle and manifest created successfully!`);
  console.log(`📦 SHA256: ${hash}`);
  console.log(`📊 Size: ${(manifest.size / 1024).toFixed(2)} KB`);
}

build().catch((err) => {
  console.error("❌ Failed to compile scrapers:", err);
  process.exit(1);
});
