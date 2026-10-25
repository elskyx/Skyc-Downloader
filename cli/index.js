#!/usr/bin/env node
// cli/index.js
import path from "path";
import readline from "readline";
import { parseArgs } from "node:util";
import {
  scrapeUrl,
  downloadMediaFile,
  compileImagesToPdf,
  sanitizeFilename,
  getHistory,
  addToHistory,
  clearHistory,
  getStats,
  getSavedConfig,
  saveConfig,
  DEFAULT_DOWNLOAD_DIR,
} from "./engine.js";

const CLI_VERSION = "1.6.7";

// Dynamic clack and picocolors with graceful fallback
let p = null;
let pc = null;

try {
  p = await import("@clack/prompts");
} catch (_) {
  p = {
    intro: (msg) => console.log(`\n${msg}\n`),
    outro: (msg) => console.log(`\n${msg}\n`),
    note: (msg, title) => console.log(`\n--- ${title || "Note"} ---\n${msg}\n-----------------`),
    cancel: (msg) => console.log(`\n✖ ${msg}\n`),
    isCancel: (val) => val === null || val === undefined,
    spinner: () => ({
      start: (msg) => console.log(`⠋ ${msg}`),
      stop: (msg) => console.log(`✔ ${msg}`),
      message: (msg) => console.log(`  ${msg}`),
    }),
    text: async ({ message, placeholder }) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      return new Promise((resolve) => {
        rl.question(`${message} `, (ans) => {
          rl.close();
          resolve(ans.trim());
        });
      });
    },
    select: async ({ message, options }) => {
      console.log(`\n${message}`);
      options.forEach((opt, idx) => console.log(`  [${idx + 1}] ${opt.label}`));
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      return new Promise((resolve) => {
        rl.question(`Select option (1-${options.length}): `, (ans) => {
          rl.close();
          const num = parseInt(ans.trim(), 10) - 1;
          resolve(num >= 0 && num < options.length ? options[num].value : options[0].value);
        });
      });
    },
  };
}

try {
  pc = await import("picocolors");
  pc = pc.default || pc;
} catch (_) {
  pc = {
    bold: (s) => `\x1b[1m${s}\x1b[22m`,
    dim: (s) => `\x1b[2m${s}\x1b[22m`,
    green: (s) => `\x1b[32m${s}\x1b[39m`,
    red: (s) => `\x1b[31m${s}\x1b[39m`,
    white: (s) => `\x1b[37m${s}\x1b[39m`,
    bgHex: () => (s) => `\x1b[43m\x1b[30m${s}\x1b[0m`,
    hex: () => (s) => s,
  };
}

function printBanner() {
  const brand = pc.bold(pc.bgHex ? pc.bgHex("#1A1917")(pc.white(" SKYC ")) : "[SKYC]") + " " + pc.bold(`v${CLI_VERSION}`);
  const sub = pc.dim("Save anything, from anywhere. Client-side media downloader.");
  p.intro(`${brand}\n  ${sub}`);
}

function printHelp() {
  console.log(`
${pc.bold("[SKYC CLI]")} ${pc.bold(`v${CLI_VERSION}`)}

${pc.bold("USAGE:")}
  ${pc.white("npx @elskyx/skyc")} ${pc.dim("[URL]")} ${pc.dim("[OPTIONS]")}
  ${pc.white("skyc")} ${pc.dim("[URL]")} ${pc.dim("[OPTIONS]")}

${pc.bold("OPTIONS:")}
  ${pc.white("-o, --output <dir>")}   Destination folder (default: ${pc.dim("~/Downloads/Skyc")})
  ${pc.white("-a, --audio")}          Download audio-only stream (MP3/FLAC/M4A)
  ${pc.white("-p, --pdf")}            Compile photo album into a single PDF
  ${pc.white("-y, --yes")}            Automatically pick the highest quality format
  ${pc.white("-h, --help")}           Show documentation
  ${pc.white("-v, --version")}        Display version number

${pc.bold("SUPPORTED PLATFORMS (16+):")}
  ${pc.dim("TikTok • Instagram • YouTube • Twitter/X • Spotify • Apple Music • Pinterest • Facebook")}
  ${pc.dim("Threads • Bandcamp • Pixiv • Bilibili • Douyin • RedNote • Reddit • TeraBox")}

${pc.bold("EXAMPLES:")}
  ${pc.dim("# Interactive REPL")}
  skyc

  ${pc.dim("# Direct link")}
  skyc https://www.tiktok.com/@user/video/123456789

  ${pc.dim("# Extract MP3/FLAC audio")}
  skyc https://youtu.be/dQw4w9WgXcQ -a
`);
}

async function run() {
  const { values, positionals } = parseArgs({
    options: {
      output: { type: "string", short: "o" },
      audio: { type: "boolean", short: "a", default: false },
      pdf: { type: "boolean", short: "p", default: false },
      yes: { type: "boolean", short: "y", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
    allowPositionals: true,
  });

  if (values.version) {
    console.log(`Skyc CLI v${CLI_VERSION}`);
    return;
  }

  if (values.help) {
    printHelp();
    return;
  }

  printBanner();

  let targetUrl = positionals[0];
  const config = getSavedConfig();
  const outputDir = values.output || config.downloadDir || DEFAULT_DOWNLOAD_DIR;

  // Interactive Prompt if no URL passed
  if (!targetUrl) {
    const input = await p.text({
      message: "Enter media URL or command (/history, /stats, /clear, /exit):",
      placeholder: "https://...",
      validate: (val) => {
        if (!val.trim()) return "Please enter a valid link or command";
      },
    });

    if (p.isCancel(input)) {
      p.cancel("Operation cancelled.");
      return;
    }

    const command = input.trim();
    if (command === "/exit") {
      p.outro("Goodbye!");
      return;
    }
    if (command === "/history") {
      const history = getHistory();
      if (history.length === 0) {
        p.note("No download history yet.", "History");
      } else {
        const lines = history.slice(0, 10).map((h, i) => `${i + 1}. [${h.platform}] ${h.title} (${(h.size / (1024 * 1024)).toFixed(1)} MB)`);
        p.note(lines.join("\n"), `Recent Downloads (${history.length} total)`);
      }
      return;
    }
    if (command === "/stats") {
      const stats = getStats();
      p.note(`Total Files: ${stats.count}\nTotal Storage: ${(stats.totalBytes / (1024 * 1024)).toFixed(2)} MB`, "Statistics");
      return;
    }
    if (command === "/clear") {
      clearHistory();
      p.note("Download history cleared.", "Done");
      return;
    }

    targetUrl = command;
  }

  const s = p.spinner();
  s.start("Analyzing media stream...");

  try {
    const data = await scrapeUrl(targetUrl);
    s.stop(`Extracted: ${pc.bold(data.title)} [${data.platform.toUpperCase()}]`);

    // Handle PDF compilation option
    if (values.pdf && data.photos && data.photos.length > 0) {
      s.start(`Compiling ${data.photos.length} photos into PDF...`);
      const destPdf = path.join(outputDir, `${sanitizeFilename(data.title)}.pdf`);
      const res = await compileImagesToPdf(data.photos.map((p) => p.url), destPdf, (pct) => {
        s.message(`Compiling PDF (${pct}%)...`);
      });
      s.stop(`PDF compiled to ${pc.green(destPdf)}`);
      addToHistory({ title: data.title, platform: data.platform, size: res.size, path: destPdf, timestamp: Date.now() });
      p.outro("All tasks complete!");
      return;
    }

    // Select format
    let selectedFormat = null;
    const formats = data.formats || [];

    if (values.audio) {
      selectedFormat = formats.find((f) => f.type === "audio") || formats[0];
    } else if (values.yes || formats.length === 1) {
      selectedFormat = formats[0];
    } else if (formats.length > 1) {
      const choice = await p.select({
        message: "Choose format to download:",
        options: formats.map((f, i) => ({
          value: i,
          label: `${f.label || f.quality} [${(f.ext || "mp4").toUpperCase()}]`,
        })),
      });

      if (p.isCancel(choice)) {
        p.cancel("Download cancelled.");
        return;
      }
      selectedFormat = formats[choice];
    }

    if (!selectedFormat) {
      p.cancel("No downloadable stream available.");
      return;
    }

    // Download stream
    const ext = selectedFormat.ext || "mp4";
    const destPath = path.join(outputDir, `${sanitizeFilename(data.title)}.${ext}`);

    s.start(`Downloading ${selectedFormat.label}...`);
    const dlResult = await downloadMediaFile(selectedFormat.url, destPath, (pct) => {
      s.message(`Downloading: ${pct}%`);
    });
    s.stop(`Saved to: ${pc.green(destPath)}`);

    addToHistory({
      title: data.title,
      platform: data.platform,
      size: dlResult.size,
      path: destPath,
      timestamp: Date.now(),
    });

    p.outro(pc.green("✔ Download complete!"));
  } catch (err) {
    s.stop(pc.red(`Error: ${err.message}`));
    p.cancel("Extraction failed.");
  }
}

run();
