import fs from "fs";
import path from "path";
import os from "os";

export const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
export const DEFAULT_DOWNLOAD_DIR = path.join(os.homedir(), "Downloads", "Skyc");
export const SKYC_DIR = path.join(os.homedir(), ".skyc");
export const CONFIG_PATH = path.join(SKYC_DIR, "config.json");
export const HISTORY_PATH = path.join(SKYC_DIR, "history.json");

// Ensure .skyc config directory exists
if (!fs.existsSync(SKYC_DIR)) {
  fs.mkdirSync(SKYC_DIR, { recursive: true });
}

export function detectPlatform(url) {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com") || lower.includes("douyin.com")) return lower.includes("douyin.com") ? "douyin" : "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "twitter";
  if (lower.includes("spotify.com")) return "spotify";
  if (lower.includes("music.apple.com")) return "applemusic";
  if (lower.includes("pinterest.com") || lower.includes("pin.it")) return "pinterest";
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) return "facebook";
  if (lower.includes("threads.net")) return "threads";
  if (lower.includes("bandcamp.com")) return "bandcamp";
  if (lower.includes("pixiv.net")) return "pixiv";
  if (lower.includes("bilibili.com") || lower.includes("b23.tv")) return "bilibili";
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) return "rednote";
  if (lower.includes("reddit.com") || lower.includes("redd.it")) return "reddit";
  if (lower.includes("terabox.com") || lower.includes("1024tera.com")) return "terabox";
  return "generic";
}

export function sanitizeFilename(title, maxLength = 80) {
  if (!title) return `skyc_${Date.now()}`;
  let clean = title.replace(/[\\/:*?"<>|]/g, "_").replace(/[\x00-\x1f]/g, "").trim();
  clean = clean.replace(/\s+/g, " ");
  if (clean.length > maxLength) clean = clean.substring(0, maxLength).trim();
  return clean || `skyc_${Date.now()}`;
}

export async function cliFetch(options) {
  const method = (options.method || (options.data ? "POST" : "GET")).toUpperCase();
  const headers = { "User-Agent": CHROME_UA, ...options.headers };

  let body = options.data || null;
  if (typeof body === "object" && body !== null) {
    if (headers["Content-Type"]?.includes("application/json")) {
      body = JSON.stringify(body);
    } else if (headers["Content-Type"]?.includes("application/x-www-form-urlencoded")) {
      body = new URLSearchParams(body).toString();
    }
  }

  const res = await fetch(options.url, {
    method,
    headers,
    body: method !== "GET" ? body : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

export async function scrapeUrl(url) {
  const platform = detectPlatform(url);

  // TikTok
  if (platform === "tiktok" || platform === "douyin") {
    const res = await cliFetch({
      method: "POST",
      url: "https://www.tikwm.com/api/",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: { url, count: 12, cursor: 0, web: 1, hd: 1 },
    });
    if (res?.data) {
      const d = res.data;
      return {
        platform,
        title: d.title || "TikTok Video",
        author: d.author?.nickname || "TikTok User",
        thumbnail: d.cover || "",
        duration: d.duration || 0,
        formats: [
          {
            id: "hd_nowm",
            label: "HD Video (No Watermark)",
            quality: "1080p",
            type: "video",
            ext: "mp4",
            url: d.hdplay ? (d.hdplay.startsWith("http") ? d.hdplay : `https://www.tikwm.com${d.hdplay}`) : d.play,
          },
          ...(d.music ? [{
            id: "audio_mp3",
            label: "Audio MP3",
            quality: "128kbps",
            type: "audio",
            ext: "mp3",
            url: d.music.startsWith("http") ? d.music : `https://www.tikwm.com${d.music}`,
          }] : []),
        ],
        photos: (d.images || []).map((img, i) => ({ id: `p_${i + 1}`, label: `Photo ${i + 1}`, url: img, ext: "jpg" })),
      };
    }
  }

  // YouTube
  if (platform === "youtube") {
    const idMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i);
    const videoId = idMatch ? idMatch[1] : null;

    let title = `YouTube Video (${videoId || "Stream"})`;
    let author = "YouTube Creator";
    let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";

    if (videoId) {
      try {
        const oRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
          headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
        });
        if (oRes.ok) {
          const oData = await oRes.json();
          if (oData.title) title = oData.title;
          if (oData.author_name) author = oData.author_name;
          if (oData.thumbnail_url) thumbnail = oData.thumbnail_url;
        }
      } catch (_) {}
    }

    return {
      platform: "youtube",
      title,
      author,
      thumbnail,
      duration: 0,
      formats: [
        {
          id: "yt_video",
          label: "Video (720p HD MP4)",
          quality: "720p",
          type: "video",
          ext: "mp4",
          url: `youtube_resolve:mp4:${videoId}`,
        },
        {
          id: "yt_audio",
          label: "Audio Only (MP3 320kbps)",
          quality: "320kbps",
          type: "audio",
          ext: "mp3",
          url: `youtube_resolve:mp3:${videoId}`,
        },
      ],
      photos: [],
    };
  }

  // Instagram
  if (platform === "instagram") {
    const res = await cliFetch({
      method: "POST",
      url: "https://snapinsta.app/action2.php",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: { url, action: "post" },
    });
    const html = typeof res === "string" ? res : JSON.stringify(res);
    const match = html.match(/href="([^"]*(?:snapinsta\.app\/get\.php|\.mp4)[^"]*)"/i);
    if (match) {
      return {
        platform: "instagram",
        title: "Instagram Post",
        author: "Instagram Creator",
        thumbnail: "",
        duration: 0,
        formats: [{ id: "ig_hd", label: "Instagram HD Video", quality: "HD", type: "video", ext: "mp4", url: match[1] }],
        photos: [],
      };
    }
  }

  // Spotify
  if (platform === "spotify") {
    const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/i);
    const trackId = trackIdMatch ? trackIdMatch[1] : null;

    let title = "Spotify Track";
    let author = "Artist";
    let thumbnail = "";

    try {
      const oRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
        headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.title) title = oData.title;
        if (oData.thumbnail_url) thumbnail = oData.thumbnail_url;
        if (title.includes(" - song and lyrics by ")) {
          const parts = title.split(" - song and lyrics by ");
          title = parts[0].trim();
          author = parts[1].trim();
        }
      }
    } catch (_) {}

    try {
      const res = await cliFetch({
        method: "POST",
        url: "https://api.spotifydown.com/download",
        headers: { "Content-Type": "application/json", Referer: "https://spotifydown.com/" },
        data: { link: url },
      });
      if (res?.success && res?.link) {
        return {
          platform: "spotify",
          title: res.metadata?.title || title,
          author: res.metadata?.artists || author,
          thumbnail: res.metadata?.cover || thumbnail,
          duration: 0,
          formats: [
            {
              id: "spot_flac",
              label: `Audio FLAC (Lossless Hi-Fi) • ${res.metadata?.title || title} — ${res.metadata?.artists || author}`,
              quality: "Lossless FLAC",
              type: "audio",
              ext: "flac",
              title: res.metadata?.title || title,
              author: res.metadata?.artists || author,
              url: trackId ? `spotiflac_resolve:${trackId}` : `spotiflac_resolve:${encodeURIComponent(url)}`,
            },
            {
              id: "spot_mp3",
              label: `Audio MP3 (320kbps) • ${res.metadata?.title || title} — ${res.metadata?.artists || author}`,
              quality: "320kbps",
              type: "audio",
              ext: "mp3",
              title: res.metadata?.title || title,
              author: res.metadata?.artists || author,
              url: res.link,
            },
          ],
          photos: [],
        };
      }
    } catch (_) {}

    if (trackId) {
      return {
        platform: "spotify",
        title,
        author,
        thumbnail,
        duration: 0,
        formats: [
          {
            id: "spot_flac",
            label: `Audio FLAC (Lossless Hi-Fi) • ${title} — ${author}`,
            quality: "Lossless FLAC",
            type: "audio",
            ext: "flac",
            title,
            author,
            url: `spotiflac_resolve:${trackId}`,
          },
          {
            id: "spot_mp3",
            label: `Audio MP3 (320kbps) • ${title} — ${author}`,
            quality: "320kbps",
            type: "audio",
            ext: "mp3",
            title,
            author,
        ],
        photos: [],
      };
    }
  }

  // Pinterest
  if (platform === "pinterest") {
    try {
      const pageRes = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          Referer: "https://www.pinterest.com/",
        },
      });
      const html = await pageRes.text();
      let title = "Pinterest Pin";
      let author = "Pinterest Creator";
      let thumbnail = "";
      const formats = [];
      const photos = [];

      const ldMatches = [...html.matchAll(/<script [^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of ldMatches) {
        try {
          const ld = JSON.parse(m[1]);
          if (ld.headline) title = ld.headline.trim();
          if (ld.author?.name) author = ld.author.name.trim();
          if (ld.image) {
            const rawImgs = Array.isArray(ld.image) ? ld.image : [ld.image];
            for (const rawImg of rawImgs) {
              const imgUrl = typeof rawImg === "string" ? rawImg : (rawImg.url || rawImg.contentUrl);
              if (imgUrl && !photos.some((p) => p.url === imgUrl)) {
                photos.push({
                  id: `pin_photo_${photos.length + 1}`,
                  label: photos.length === 0 ? "Original Resolution Image" : `Original Image ${photos.length + 1}`,
                  url: imgUrl,
                  ext: imgUrl.toLowerCase().endsWith(".png") ? "png" : "jpg",
                  type: "photo",
                });
              }
            }
          }
          if (ld.video) {
            const vidUrl = typeof ld.video === "string" ? ld.video : (ld.video.contentUrl || ld.video.embedUrl);
            if (vidUrl && !formats.some((f) => f.url === vidUrl)) {
              formats.push({
                id: `pin_video_${formats.length + 1}`,
                label: "Pinterest Video (MP4)",
                quality: "HD 720p",
                type: "video",
                ext: "mp4",
                url: vidUrl,
              });
            }
          }
        } catch (_) {}
      }

      const origMatches = [...html.matchAll(/https:\/\/i\.pinimg\.com\/originals\/[a-zA-Z0-9_\-\/]+\.(?:jpg|png|webp)/gi)].map((m) => m[0]);
      for (const imgUrl of new Set(origMatches)) {
        if (imgUrl.includes("75x75") || imgUrl.includes("avatar")) continue;
        if (!photos.some((p) => p.url === imgUrl)) {
          photos.push({
            id: `pin_photo_${photos.length + 1}`,
            label: photos.length === 0 ? "Original Resolution Image" : `Original Image ${photos.length + 1}`,
            url: imgUrl,
            ext: imgUrl.toLowerCase().endsWith(".png") ? "png" : "jpg",
            type: "photo",
          });
        }
      }

      if (photos.length > 0) thumbnail = photos[0].url;

      if (formats.length > 0 || photos.length > 0) {
        return {
          platform: "pinterest",
          title,
          author,
          thumbnail,
          duration: 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1,
        };
      }
    } catch (_) {}
  }

  throw new Error(`Extraction for ${platform} is not currently responding. Try again or check the URL.`);
}

export async function resolveStreamUrl(url, onProgress = () => {}) {
  if (url.startsWith("youtube_resolve:")) {
    const parts = url.split(":");
    const format = parts[1] || "mp4";
    const videoId = parts[2];

    onProgress(15, 0, 100);

    // ymcdn converter
    try {
      const ymHeaders = {
        Origin: "https://ytmp3.mobi",
        Referer: "https://ytmp3.mobi/en8/",
        "User-Agent": CHROME_UA,
        Accept: "*/*",
      };
      const initRes = await fetch(`https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers: ymHeaders });
      const initData = await initRes.json();

      if (initData?.convertURL) {
        let convRes = await fetch(`${initData.convertURL}&v=${videoId}&f=${format}&_=${Math.random()}`, { headers: ymHeaders });
        let convData = await convRes.json();

        while (convData?.redirect > 0 && convData.redirectURL) {
          convRes = await fetch(`${convData.redirectURL}&v=${videoId}&f=${format}&_=${Math.random()}`, { headers: ymHeaders });
          convData = await convRes.json();
        }

        if (convData && !convData.error) {
          let progress = 0;
          let finalUrl = convData.downloadURL;
          let attempts = 0;
          while (progress < 3 && attempts < 12) {
            await new Promise((r) => setTimeout(r, 1200));
            attempts++;
            if (convData.progressURL) {
              const pRes = await fetch(`${convData.progressURL}&_=${Math.random()}`, { headers: ymHeaders });
              const pData = await pRes.json();
              progress = pData?.progress ?? 0;
              if (pData?.downloadURL) finalUrl = pData.downloadURL;
              if (progress >= 3) break;
            }
          }
          if (finalUrl) {
            return finalUrl.startsWith("//") ? `https:${finalUrl}` : finalUrl;
          }
        }
      }
    } catch (_) {}

    // Piped API progressive stream fallback
    try {
      const pRes = await fetch(`https://api.piped.private.coffee/streams/${videoId}`, { headers: { "User-Agent": CHROME_UA } });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (format === "mp3") {
          const audio = pData.audioStreams?.[0];
          if (audio?.url) return audio.url;
        } else {
          const vid = pData.videoStreams?.find((s) => s.format === "MPEG_4" || s.quality?.includes("720") || s.quality?.includes("360")) || pData.videoStreams?.[0];
          if (vid?.url) return vid.url;
        }
      }
    } catch (_) {}

    throw new Error("Unable to resolve YouTube stream. Please try again.");
  }

  // Spotify Lossless FLAC Token (Mornye Engine)
  if (url.startsWith("spotiflac_resolve:")) {
    const trackId = url.replace("spotiflac_resolve:", "").trim();
    onProgress(25, 0, 100);

    // Tier A: Mornye Provider Gateway
    try {
      const qbzRes = await fetch("https://api.zarz.moe/v2/qbz", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": CHROME_UA },
        body: JSON.stringify({ id: trackId, type: "track", url: `https://open.spotify.com/track/${trackId}`, quality: "27" }),
      });
      if (qbzRes.ok) {
        const qbzData = await qbzRes.json();
        const dlUrl = qbzData?.url || qbzData?.download_url || qbzData?.link;
        if (dlUrl) return dlUrl;
      }
    } catch (_) {}

    // Tier B: High-definition SpotiDown Stream
    try {
      const spotRes = await fetch("https://spotidown.com/api/download-track", {
        method: "POST",
        headers: { "Content-Type": "application/json", Referer: "https://spotidown.com/", "User-Agent": CHROME_UA },
        body: JSON.stringify({ url: `https://open.spotify.com/track/${trackId}`, id: trackId }),
      });
      if (spotRes.ok) {
        const spotData = await spotRes.json();
        if (spotData?.downloadUrl) return spotData.downloadUrl;
      }
    } catch (_) {}

    // Tier C: SpotifyDown Mirror
    try {
      const sdownRes = await fetch("https://api.spotifydown.com/download", {
        method: "POST",
        headers: { "Content-Type": "application/json", Referer: "https://spotifydown.com/", "User-Agent": CHROME_UA },
        body: JSON.stringify({ link: `https://open.spotify.com/track/${trackId}` }),
      });
      if (sdownRes.ok) {
        const sdownData = await sdownRes.json();
        if (sdownData?.success && sdownData?.link) return sdownData.link;
      }
    } catch (_) {}

    throw new Error(`Unable to resolve lossless FLAC stream for Spotify track ${trackId}`);
  }

  // Spotify MP3 Token
  if (url.startsWith("spotidown_resolve:")) {
    const trackId = url.replace("spotidown_resolve:", "").trim();
    onProgress(25, 0, 100);
    try {
      const spotRes = await fetch("https://spotidown.com/api/download-track", {
        method: "POST",
        headers: { "Content-Type": "application/json", Referer: "https://spotidown.com/", "User-Agent": CHROME_UA },
        body: JSON.stringify({ id: trackId }),
      });
      if (spotRes.ok) {
        const spotData = await spotRes.json();
        if (spotData?.downloadUrl) return spotData.downloadUrl;
      }
    } catch (_) {}
    throw new Error("Unable to resolve Spotify audio stream");
  }

  // Apple Music Token
  if (url.startsWith("applemusic_resolve:")) {
    const payloadStr = url.replace("applemusic_resolve:", "");
    onProgress(25, 0, 100);
    try {
      const res = await fetch("https://aplmate.com/action/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://aplmate.com/",
          Origin: "https://aplmate.com",
          "User-Agent": CHROME_UA,
        },
        body: payloadStr,
      });
      if (res.ok) {
        const parsed = await res.json();
        const html = parsed?.data || "";
        const linkMatch = html.match(/href="([^"]*(?:\/dl\?token=|download)[^"]*)"/i);
        if (linkMatch) {
          let resolved = linkMatch[1];
          if (!resolved.startsWith("http")) resolved = `https://aplmate.com${resolved}`;
          return resolved;
        }
      }
    } catch (_) {}
    throw new Error("Unable to resolve Apple Music stream");
  }

  return url;
}

export async function downloadMediaFile(downloadUrl, destPath, onProgress = () => {}) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const targetUrl = await resolveStreamUrl(downloadUrl, onProgress);
  const res = await fetch(targetUrl, { headers: { "User-Agent": CHROME_UA } });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

  const totalBytes = parseInt(res.headers.get("content-length") || "0", 10);
  const fileStream = fs.createWriteStream(destPath);

  let downloadedBytes = 0;
  const reader = res.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fileStream.write(value);
    downloadedBytes += value.length;
    if (totalBytes > 0) {
      const pct = Math.round((downloadedBytes / totalBytes) * 100);
      onProgress(pct, downloadedBytes, totalBytes);
    }
  }

  fileStream.end();
  return { path: destPath, size: downloadedBytes };
}

export async function compileImagesToPdf(imageUrls, destPath, onProgress = () => {}) {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const total = imageUrls.length;

  for (let i = 0; i < total; i++) {
    onProgress(Math.round(((i + 1) / total) * 100), i + 1, total);
    try {
      const res = await fetch(imageUrls[i]);
      const imgBytes = await res.arrayBuffer();
      const img = imageUrls[i].toLowerCase().includes(".png")
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);

      const { width, height } = img.scale(1.0);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
    } catch (_) {}
  }

  const pdfBytes = await pdfDoc.save();
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, Buffer.from(pdfBytes));
  return { path: destPath, size: pdfBytes.length };
}

export function getHistory() {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
    }
  } catch (_) {}
  return [];
}

export function addToHistory(item) {
  const list = getHistory();
  list.unshift(item);
  if (list.length > 500) list.pop();
  try {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(list, null, 2));
  } catch (_) {}
}

export function clearHistory() {
  try {
    fs.writeFileSync(HISTORY_PATH, "[]");
  } catch (_) {}
}

export function getStats() {
  const history = getHistory();
  let totalBytes = 0;
  history.forEach((h) => (totalBytes += h.size || 0));
  return { count: history.length, totalBytes };
}

export function getSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch (_) {}
  return { downloadDir: DEFAULT_DOWNLOAD_DIR };
}

export function saveConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  } catch (_) {}
}
