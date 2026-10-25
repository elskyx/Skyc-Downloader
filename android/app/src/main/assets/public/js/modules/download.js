// public/js/modules/download.js
import { analyzeUrl } from "../scrapers/index.js";
import { cleanUrl, getPlatformDisplayName } from "../utils/urlUtils.js";
import { resolveDownloadUrl, needsAsyncResolving } from "../downloader/resolver.js";
import { saveMediaFile, downloadAndSaveMediaStream } from "../downloader/storage.js";
import { sanitizeFilename, getMediaTargetDirectory } from "../downloader/filename.js";
import { postProcessDownload } from "../downloader/postProcess.js";
import { compileImagesToPdf } from "../utils/pdfHelper.js";
import { showToast, triggerHaptic, formatDuration } from "../utils/index.js";
import { updateDownloadBubble } from "../ui/downloadBubble.js";

let currentAnalysisData = null;
let selectedFormatIndex = 0;
let currentSlideIndex = 0;

export function initDownloadController() {
  const analyzeBtn = document.getElementById("analyzeBtn");
  const urlInput = document.getElementById("composerUrlInput");
  const clearBtn = document.getElementById("composerClearBtn");
  const retryBtn = document.getElementById("composerRetryBtn");

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      const val = urlInput.value.trim();
      if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
      clearStatusBanner();
    });

    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (analyzeBtn && !analyzeBtn.disabled) {
          analyzeBtn.click();
        }
      }
    });
  }

  if (clearBtn && urlInput) {
    clearBtn.addEventListener("click", () => {
      urlInput.value = "";
      clearBtn.style.display = "none";
      clearStatusBanner();
      hideResultCard();
      triggerHaptic("light");
    });
  }

  if (retryBtn && analyzeBtn) {
    retryBtn.addEventListener("click", () => {
      if (!analyzeBtn.disabled) analyzeBtn.click();
    });
  }

  if (analyzeBtn && urlInput) {
    analyzeBtn.addEventListener("click", async () => {
      const raw = urlInput.value.trim();
      if (!raw) {
        showToast("Please paste a link first", "warning");
        urlInput.focus();
        return;
      }

      // Clear previous analysis state immediately so old card is never displayed
      hideResultCard();
      clearStatusBanner();
      currentAnalysisData = null;
      selectedFormatIndex = 0;
      currentSlideIndex = 0;

      const targetUrl = cleanUrl(raw);
      setAnalyzingState(true, "Connecting to media source...");

      // Status transition timer for responsive visual feedback
      const stepTimer = setTimeout(() => {
        updateStatusText("Extracting media streams & metadata...");
      }, 1200);

      // 25s timeout safeguard to guarantee UI never gets stuck
      let isTimedOut = false;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          isTimedOut = true;
          reject(new Error("Analysis timed out. The server or platform took too long to respond."));
        }, 25000);
      });

      try {
        const data = await Promise.race([analyzeUrl(targetUrl), timeoutPromise]);
        clearTimeout(stepTimer);
        currentAnalysisData = data;
        selectedFormatIndex = 0;
        currentSlideIndex = 0;
        renderAnalysisResult(data);
        clearStatusBanner();
        triggerHaptic("medium");
      } catch (err) {
        clearTimeout(stepTimer);
        console.error("[Skyc Analysis Error]", err);
        hideResultCard();
        currentAnalysisData = null;
        const msg = err.message || "Unable to extract media from this link.";
        setAnalyzingError(msg);
        showToast(msg, "danger");
        triggerHaptic("error");
      } finally {
        setAnalyzingState(false);
      }
    });
  }

  // Download Trigger Button
  const startDownloadBtn = document.getElementById("startDownloadBtn");
  if (startDownloadBtn) {
    startDownloadBtn.addEventListener("click", async () => {
      if (!currentAnalysisData) return;
      await executeSingleDownload();
    });
  }

  // Compile PDF Button
  const compilePdfBtn = document.getElementById("compilePdfBtn");
  if (compilePdfBtn) {
    compilePdfBtn.addEventListener("click", async () => {
      if (!currentAnalysisData?.photos || currentAnalysisData.photos.length === 0) return;
      await executePdfCompilation();
    });
  }
}

function setAnalyzingState(isAnalyzing, statusMsg = "Analyzing link...") {
  const btn = document.getElementById("analyzeBtn");
  const banner = document.getElementById("composerStatusBanner");
  const statusText = document.getElementById("composerStatusText");
  const statusIcon = document.getElementById("composerStatusIcon");
  const retryBtn = document.getElementById("composerRetryBtn");

  if (btn) {
    btn.disabled = isAnalyzing;
    if (isAnalyzing) {
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10"/>
        </svg>
        <span>Analyzing...</span>
      `;
    } else {
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span>Analyze</span>
      `;
    }
  }

  if (banner) {
    if (isAnalyzing) {
      banner.className = "composer-status-banner status-loading";
      if (statusText) statusText.textContent = statusMsg;
      if (statusIcon) {
        statusIcon.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10"/>
          </svg>
        `;
      }
      if (retryBtn) retryBtn.style.display = "none";
    }
  }
}

function updateStatusText(msg) {
  const statusText = document.getElementById("composerStatusText");
  if (statusText) statusText.textContent = msg;
}

function setAnalyzingError(errorMessage) {
  const banner = document.getElementById("composerStatusBanner");
  const statusText = document.getElementById("composerStatusText");
  const statusIcon = document.getElementById("composerStatusIcon");
  const retryBtn = document.getElementById("composerRetryBtn");

  if (banner) {
    banner.className = "composer-status-banner status-error";
    if (statusText) statusText.textContent = errorMessage;
    if (statusIcon) {
      statusIcon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      `;
    }
    if (retryBtn) retryBtn.style.display = "inline-flex";
  }
}

function clearStatusBanner() {
  const banner = document.getElementById("composerStatusBanner");
  if (banner) {
    banner.className = "composer-status-banner";
    banner.style.display = "none";
  }
}

function renderAnalysisResult(data) {
  const card = document.getElementById("resultCardContainer");
  const titleEl = document.getElementById("resultTitle");
  const authorEl = document.getElementById("resultAuthor");
  const platBadge = document.getElementById("resultPlatformBadge");
  const thumbImg = document.getElementById("resultThumbImg");
  const formatsGrid = document.getElementById("resultFormatsGrid");
  const carouselWrapper = document.getElementById("resultCarouselWrapper");
  const compilePdfBtn = document.getElementById("compilePdfBtn");

  if (!card) return;

  if (titleEl) titleEl.textContent = data.title;
  if (authorEl) authorEl.textContent = data.author || "Creator";
  if (platBadge) platBadge.textContent = getPlatformDisplayName(data.platform);
  if (thumbImg) {
    thumbImg.src = data.thumbnail || "";
    thumbImg.style.display = data.thumbnail ? "block" : "none";
  }

  // Render Carousel if multiple photos
  if (data.photos && data.photos.length > 1) {
    if (carouselWrapper) carouselWrapper.style.display = "block";
    if (compilePdfBtn) compilePdfBtn.style.display = "inline-flex";
    setupCarousel(data.photos);
  } else {
    if (carouselWrapper) carouselWrapper.style.display = "none";
    if (compilePdfBtn) compilePdfBtn.style.display = "none";
  }

  // Render Formats Grid
  if (formatsGrid) {
    const allOptions = [...(data.formats || []), ...(data.photos || [])];
    formatsGrid.innerHTML = allOptions
      .map(
        (fmt, idx) => `
      <div class="format-option-card ${idx === 0 ? "selected" : ""}" data-idx="${idx}">
        <div class="format-info-left">
          <span class="format-quality-label">${fmt.label || fmt.quality || "Standard"}</span>
          <span class="format-type-label">${(fmt.ext || "mp4").toUpperCase()} • ${(fmt.type || "media").toUpperCase()}</span>
        </div>
        <div class="format-radio-indicator">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${idx === 0 ? '<circle cx="12" cy="12" r="10" fill="currentColor"/><circle cx="12" cy="12" r="4" fill="#FAF9F5"/>' : '<circle cx="12" cy="12" r="10"/>'}
          </svg>
        </div>
      </div>
    `
      )
      .join("");

    formatsGrid.querySelectorAll(".format-option-card").forEach((c) => {
      c.addEventListener("click", () => {
        formatsGrid.querySelectorAll(".format-option-card").forEach((other) => other.classList.remove("selected"));
        c.classList.add("selected");
        selectedFormatIndex = parseInt(c.getAttribute("data-idx"), 10);
        triggerHaptic("light");
      });
    });
  }

  card.classList.add("visible");
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideResultCard() {
  const card = document.getElementById("resultCardContainer");
  if (card) card.classList.remove("visible");
  currentAnalysisData = null;
}

function setupCarousel(photos) {
  const slideImg = document.getElementById("carouselSlideImg");
  const dotsContainer = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("carouselPrevBtn");
  const nextBtn = document.getElementById("carouselNextBtn");

  function updateSlide() {
    if (slideImg) slideImg.src = photos[currentSlideIndex].url;
    if (dotsContainer) {
      dotsContainer.innerHTML = photos
        .map((_, i) => `<div class="carousel-dot ${i === currentSlideIndex ? "active" : ""}"></div>`)
        .join("");
    }
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentSlideIndex = (currentSlideIndex - 1 + photos.length) % photos.length;
      updateSlide();
      triggerHaptic("light");
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentSlideIndex = (currentSlideIndex + 1) % photos.length;
      updateSlide();
      triggerHaptic("light");
    };
  }

  updateSlide();
}

async function executeSingleDownload() {
  if (!currentAnalysisData) return;
  const startBtn = document.getElementById("startDownloadBtn");
  const allOptions = [...(currentAnalysisData.formats || []), ...(currentAnalysisData.photos || [])];
  const selectedFormat = allOptions[selectedFormatIndex] || allOptions[0];

  if (!selectedFormat) {
    showToast("No format selected", "warning");
    return;
  }

  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = "Downloading...";
  }

  try {
    let dlUrl = selectedFormat.url;
    if (needsAsyncResolving(dlUrl)) {
      showToast("Resolving stream link...", "info");
      dlUrl = await resolveDownloadUrl({
        url: dlUrl,
        updateProgress: (pct, msg) => {
          if (startBtn) startBtn.textContent = `${msg} (${pct}%)`;
        },
      });
    }

    const ext = selectedFormat.ext || (selectedFormat.type === "audio" ? "mp3" : "mp4");
    const filename = `${sanitizeFilename(currentAnalysisData.title)}.${ext}`;
    const subfolder = getMediaTargetDirectory(selectedFormat.ext || selectedFormat.type || "video");
    const mimeType = selectedFormat.ext === "flac" ? "audio/flac" : (selectedFormat.type === "audio" ? "audio/mpeg" : "video/mp4");

    if (startBtn) startBtn.textContent = "Saving to device...";

    const saveResult = await downloadAndSaveMediaStream({
      url: dlUrl,
      filename,
      subfolder,
      mimeType,
      onProgress: (pct, msg) => {
        if (startBtn) startBtn.textContent = `${msg} (${pct}%)`;
      },
    });

    await postProcessDownload({
      title: currentAnalysisData.title,
      sourceUrl: dlUrl,
      platform: currentAnalysisData.platform,
      filename,
      fileSize: saveResult?.fileSize || 0,
      savedPath: saveResult?.path || "",
      mediaType: selectedFormat.type || "video",
      thumbnailUrl: currentAnalysisData.thumbnail,
    });
  } catch (err) {
    console.error("[Download Error]", err);
    showToast(`Download failed: ${err.message}`, "danger");
    triggerHaptic("error");
  } finally {
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span>Download Now</span>
      `;
    }
  }
}

async function executePdfCompilation() {
  if (!currentAnalysisData?.photos || currentAnalysisData.photos.length === 0) return;
  const pdfBtn = document.getElementById("compilePdfBtn");

  if (pdfBtn) {
    pdfBtn.disabled = true;
    pdfBtn.textContent = "Compiling PDF...";
  }

  try {
    const urls = currentAnalysisData.photos.map((p) => p.url);
    const pdfBlob = await compileImagesToPdf(urls, currentAnalysisData.title, (p, text) => {
      if (pdfBtn) pdfBtn.textContent = `${text} (${p}%)`;
    });

    const filename = `${sanitizeFilename(currentAnalysisData.title)}.pdf`;
    await saveMediaFile({
      data: pdfBlob,
      filename,
      subfolder: "Pictures/Skyc",
      mimeType: "application/pdf",
    });

    await postProcessDownload({
      title: `${currentAnalysisData.title} (PDF)`,
      sourceUrl: currentAnalysisData.photos[0].url,
      platform: currentAnalysisData.platform,
      filename,
      fileSize: pdfBlob.size,
      mediaType: "pdf",
      thumbnailUrl: currentAnalysisData.thumbnail,
    });
  } catch (err) {
    console.error("[PDF Compile Error]", err);
    showToast(`PDF compilation failed: ${err.message}`, "danger");
  } finally {
    if (pdfBtn) {
      pdfBtn.disabled = false;
      pdfBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Compile into PDF</span>
      `;
    }
  }
}
