import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pw from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const aboutDir = fs.existsSync(path.resolve(__dirname, '../../About-Skyc-Downloader'))
  ? path.resolve(__dirname, '../../About-Skyc-Downloader/assets/snapshots')
  : path.resolve(__dirname, '../../About-Skyc/assets/snapshots');
const landingDir = path.resolve(__dirname, '../landing/assets/snapshots');

fs.mkdirSync(aboutDir, { recursive: true });
fs.mkdirSync(landingDir, { recursive: true });

const server = http.createServer((req, res) => {
  let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  res.end(fs.readFileSync(filePath));
});

server.listen(4892, async () => {
  console.log('Server started on port 4892');
  try {
    const browser = await pw.chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true
    });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2
    });

    const snapshots = [
      {
        base: 'home-dark',
        setup: async () => {
          await page.goto('http://localhost:4892');
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
            const input = document.getElementById('composerUrlInput');
            if (input) input.value = 'https://www.tiktok.com/@creator/video/7391823901';
          });
        }
      },
      {
        base: 'home-light',
        setup: async () => {
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'light');
            const input = document.getElementById('composerUrlInput');
            if (input) input.value = 'https://open.spotify.com/track/4cOdK2wGUT';
          });
        }
      },
      {
        base: 'batch',
        setup: async () => {
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
            const v = document.getElementById('view-batch');
            if (v) v.classList.add('active');
          });
        }
      },
      {
        base: 'platforms',
        setup: async () => {
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
            const v = document.getElementById('view-platforms');
            if (v) v.classList.add('active');
          });
        }
      },
      {
        base: 'settings',
        setup: async () => {
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
            const v = document.getElementById('view-settings');
            if (v) v.classList.add('active');
          });
        }
      },
      {
        base: 'downloads',
        setup: async () => {
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
            const v = document.getElementById('view-downloads');
            if (v) v.classList.add('active');
          });
        }
      }
    ];

    for (const snap of snapshots) {
      await snap.setup();
      await page.waitForTimeout(600);

      const skycFull = `skyc-downloader-${snap.base}.png`;
      const skycShort = `skyc-${snap.base}.png`;

      const primaryPath = path.join(landingDir, skycFull);
      await page.screenshot({ path: primaryPath });

      // Mirror to landingDir
      fs.copyFileSync(primaryPath, path.join(landingDir, skycShort));

      // Mirror to aboutDir
      fs.copyFileSync(primaryPath, path.join(aboutDir, skycFull));
      fs.copyFileSync(primaryPath, path.join(aboutDir, skycShort));

      console.log(`Saved snapshot: ${skycFull} and ${skycShort}`);
    }

    await browser.close();
    console.log('All snapshots captured successfully!');
  } catch (err) {
    console.error('Error taking snapshots:', err);
  } finally {
    server.close();
  }
});
