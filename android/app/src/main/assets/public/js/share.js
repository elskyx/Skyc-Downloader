// public/js/share.js
import { analyzeUrl } from "./scrapers/index.js";
import { cleanUrl } from "./utils/urlUtils.js";
import { resolveDownloadUrl, needsAsyncResolving } from "./downloader/resolver.js";
import { saveMediaFile } from "./downloader/storage.js";
import { sanitizeFilename, getMediaTargetDirectory } from "./downloader/filename.js";
import { postProcessDownload } from "./downloader/postProcess.js";
import { showToast, triggerHaptic } from "./utils/index.js";

let currentData = null;
let selectedFmtIdx = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get("url") || window.__ZENNX_SHARED_URL__ || window.__SKYC_SHARED_URL__ || "";

  const statusBox = document.getElementById("shareStatusBox");
  const previewBox = document.getElementById("sharePreviewBox");
  const closeBtn = document.getElementById("shareCloseBtn");
  const downloadBtn = document.getElementById("shareDownloadBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (window.ZennxShare?.close) window.ZennxShare.close();
      else if (window.SkycShare?.close) window.SkycShare.close();
      else window.close();
    });
  }

  if (!sharedUrl) {
    if (statusBox) statusBox.textContent = "No valid URL received from Share menu.";
    return;
  }

  try {
    const cleaned = cleanUrl(sharedUrl);
    if (statusBox) statusBox.textContent = `Analyzing ${cleaned}...`;

    const data = await analyzeUrl(cleaned);
    currentData = data;

    if (statusBox) statusBox.style.display = "none";
    if (previewBox) previewBox.style.display = "flex";

    const titleEl = document.getElementById("shareTitle");
    const authorEl = document.getElementById("shareAuthor");
    const thumbEl = document.getElementById("shareThumb");
    const formatsContainer = document.getElementById("shareFormatsContainer");

    if (titleEl) titleEl.textContent = data.title;
    if (authorEl) authorEl.textContent = data.author || "Creator";
    if (thumbEl) {
      thumbEl.src = data.thumbnail || "";
      thumbEl.style.display = data.thumbnail ? "block" : "none";
    }

    const options = [...(data.formats || []), ...(data.photos || [])];
    if (formatsContainer) {
      formatsContainer.innerHTML = options
        .map(
          (fmt, i) => `
        <div class="format-option-card ${i === 0 ? "selected" : ""}" data-idx="${i}">
          <span style="font-weight:600;font-size:0.85rem;">${fmt.label || "Media"}</span>
        </div>
      `
        )
        .join("");

      formatsContainer.querySelectorAll(".format-option-card").forEach((c) => {
        c.addEventListener("click", () => {
          formatsContainer.querySelectorAll(".format-option-card").forEach((other) => other.classList.remove("selected"));
          c.classList.add("selected");
          selectedFmtIdx = parseInt(c.getAttribute("data-idx"), 10);
        });
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", async () => {
        downloadBtn.disabled = true;
        downloadBtn.textContent = "Downloading...";

        try {
          const opt = options[selectedFmtIdx] || options[0];
          let dlUrl = opt.url;
          if (needsAsyncResolving(dlUrl)) {
            dlUrl = await resolveDownloadUrl({ url: dlUrl });
          }

          const res = await fetch(dlUrl);
          const blob = await res.blob();
          const ext = opt.ext || "mp4";
          const filename = `${sanitizeFilename(data.title)}.${ext}`;
          const subfolder = getMediaTargetDirectory(opt.type || "video");

          await saveMediaFile({
            data: blob,
            filename,
            subfolder,
            mimeType: blob.type || "video/mp4",
          });

          await postProcessDownload({
            title: data.title,
            sourceUrl: dlUrl,
            platform: data.platform,
            filename,
            fileSize: blob.size,
            mediaType: opt.type || "video",
            thumbnailUrl: data.thumbnail,
          });

          triggerHaptic("medium");
          showToast("Download Complete!", "success");

          setTimeout(() => {
            if (window.ZennxShare?.close) window.ZennxShare.close();
            else if (window.SkycShare?.close) window.SkycShare.close();
            else window.close();
          }, 1200);
        } catch (err) {
          showToast(`Download failed: ${err.message}`, "danger");
          downloadBtn.disabled = false;
          downloadBtn.textContent = "Retry Download";
        }
      });
    }
  } catch (err) {
    if (statusBox) statusBox.textContent = `Error: ${err.message}`;
  }
});
