// public/js/modules/update.js
/**
 * Skyc Downloader — Update & Notification Engine
 * Monitors GitHub Releases, Repository Commits on main, and Scraper OTA Patches.
 * Notifies the user via rich interactive dialogs, sticky banners, status pills, and Web Notifications.
 */
import { showToast, triggerHaptic, formatRelativeTime } from "../utils/index.js";
import { checkOtaScraperUpdate } from "./updateScrapers.js";

export const APP_CURRENT_VERSION = "1.6.7";
export const APP_BUILD_COMMIT = "3afa2fc";
export const GITHUB_REPO = "elskyx/Skyc-Downloader";
export const GITHUB_RELEASES_API = "https://api.github.com/repos/elskyx/Skyc-Downloader/releases/latest";
export const GITHUB_COMMITS_API = "https://api.github.com/repos/elskyx/Skyc-Downloader/commits/main";
export const SCRAPER_MANIFEST_URL = "https://raw.githubusercontent.com/elskyx/Skyc-Downloader/main/public/scrapers-version.json";

let activeUpdateInfo = null;

/**
 * Initializes the update notification system
 */
export function initUpdateSystem() {
  bindUpdateModalEvents();
  bindStickyBannerEvents();

  // Restore cached update info if available
  try {
    const cached = localStorage.getItem("skyc_cached_update_info");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.type === "version" ? isVersionGreater(parsed.version, APP_CURRENT_VERSION) : true)) {
        activeUpdateInfo = parsed;
        updateHeaderStatusPill(parsed);
        updateNavIndicator(true);
      }
    }
  } catch (_) {}

  // Auto-check on launch if enabled
  const autoCheck = localStorage.getItem("skyc_auto_check_updates") !== "false";
  if (autoCheck) {
    setTimeout(() => {
      checkForAppUpdates({ manual: false }).catch((err) => {
        console.warn("[Skyc Update] Auto-check encountered error:", err);
      });
    }, 2500);
  }

  // Periodic check when app/window gains focus (every 2 hours minimum)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const lastCheck = parseInt(localStorage.getItem("skyc_last_checked_update_time") || "0", 10);
      const twoHours = 2 * 60 * 60 * 1000;
      if (Date.now() - lastCheck > twoHours) {
        const canCheck = localStorage.getItem("skyc_auto_check_updates") !== "false";
        if (canCheck) {
          checkForAppUpdates({ manual: false }).catch(() => {});
        }
      }
    }
  });
}

/**
 * Checks for updates across Releases, Repo Commits, and Scraper Patches
 */
export async function checkForAppUpdates({ manual = false } = {}) {
  const notifyRepo = localStorage.getItem("skyc_notify_repo_commits") !== "false";
  localStorage.setItem("skyc_last_checked_update_time", `${Date.now()}`);

  try {
    // 1. Fetch latest GitHub release
    let releaseData = null;
    try {
      const relRes = await fetch(GITHUB_RELEASES_API, {
        headers: { Accept: "application/vnd.github.v3+json" },
        cache: "no-store",
      });
      if (relRes.ok) releaseData = await relRes.json();
    } catch (e) {
      console.warn("[Skyc Update] Failed to query releases API:", e);
    }

    // Check if new version release exists
    if (releaseData && releaseData.tag_name) {
      const latestTag = releaseData.tag_name.replace(/^v/, "").trim();
      if (isVersionGreater(latestTag, APP_CURRENT_VERSION)) {
        // Find APK / EXE asset if present
        const assets = Array.isArray(releaseData.assets) ? releaseData.assets : [];
        const apkAsset = assets.find((a) => a.name && a.name.toLowerCase().endsWith(".apk"));
        const exeAsset = assets.find((a) => a.name && (a.name.toLowerCase().endsWith(".exe") || a.name.toLowerCase().endsWith(".msi")));

        const update = {
          type: "version",
          badge: "NEW RELEASE",
          version: `v${latestTag}`,
          rawVersion: latestTag,
          title: `Skyc Downloader v${latestTag}`,
          changelog: cleanChangelog(releaseData.body) || `Versi baru v${latestTag} telah dirilis dengan pembaruan stabilitas dan fitur terbaru.`,
          publishedAt: releaseData.published_at || new Date().toISOString(),
          releaseUrl: releaseData.html_url || `https://github.com/${GITHUB_REPO}/releases`,
          downloadUrl: apkAsset ? apkAsset.browser_download_url : (exeAsset ? exeAsset.browser_download_url : releaseData.html_url),
          downloadLabel: apkAsset ? `Download APK (v${latestTag})` : (exeAsset ? `Download EXE (v${latestTag})` : "Download Update"),
          uniqueId: `release_${latestTag}`,
        };

        handleUpdateDetected(update, manual);
        return { updateAvailable: true, update };
      }
    }

    // 2. Fetch latest repo commit on main if enabled
    let commitData = null;
    if (notifyRepo) {
      try {
        const comRes = await fetch(GITHUB_COMMITS_API, {
          headers: { Accept: "application/vnd.github.v3+json" },
          cache: "no-store",
        });
        if (comRes.ok) commitData = await comRes.json();
      } catch (e) {
        console.warn("[Skyc Update] Failed to query commits API:", e);
      }

      if (commitData && commitData.sha) {
        const remoteSha = commitData.sha;
        const shortSha = remoteSha.slice(0, 7);
        const lastSeenCommit = localStorage.getItem("skyc_last_seen_commit") || APP_BUILD_COMMIT;

        if (remoteSha !== APP_BUILD_COMMIT && remoteSha !== lastSeenCommit) {
          const commitMsg = commitData.commit?.message || "Repository maintenance update";
          const commitDate = commitData.commit?.author?.date || new Date().toISOString();

          const update = {
            type: "commit",
            badge: "REPO UPDATE",
            version: shortSha,
            rawVersion: shortSha,
            title: `Repository Update (${shortSha})`,
            changelog: commitMsg,
            publishedAt: commitDate,
            releaseUrl: commitData.html_url || `https://github.com/${GITHUB_REPO}/commits/main`,
            downloadUrl: commitData.html_url || `https://github.com/${GITHUB_REPO}/commits/main`,
            downloadLabel: "View Commit & Changes",
            uniqueId: `commit_${shortSha}`,
          };

          handleUpdateDetected(update, manual);
          return { updateAvailable: true, update };
        }
      }
    }

    // 3. Check OTA Scraper version
    try {
      const scrRes = await fetch(SCRAPER_MANIFEST_URL, { cache: "no-store" });
      if (scrRes.ok) {
        const manifest = await scrRes.json();
        const activeVer = parseInt(localStorage.getItem("skyc_active_scraper_version") || "1", 10);
        if (manifest.version > activeVer) {
          const update = {
            type: "scraper",
            badge: "SCRAPER PATCH",
            version: `OTA v${manifest.version}`,
            rawVersion: `${manifest.version}`,
            title: `Extractor Engine Patch (v${manifest.version})`,
            changelog: `Pembaruan otomatis extractor scraper untuk platform TikTok, Instagram, Pinterest, YouTube, dan Spotify.`,
            publishedAt: new Date(manifest.updatedAt || Date.now()).toISOString(),
            releaseUrl: `https://github.com/${GITHUB_REPO}`,
            downloadUrl: "#apply-scraper",
            downloadLabel: "Apply Scraper Patch",
            uniqueId: `scraper_${manifest.version}`,
          };

          handleUpdateDetected(update, manual);
          return { updateAvailable: true, update };
        }
      }
    } catch (_) {}

    // No updates detected
    handleNoUpdate(manual);
    return { updateAvailable: false };
  } catch (err) {
    console.error("[Skyc Update] Check error:", err);
    if (manual) {
      showToast("Unable to check for updates right now.", "warning");
    }
    return { error: err.message };
  }
}

/**
 * Handle when an update is found
 */
function handleUpdateDetected(update, manual) {
  activeUpdateInfo = update;
  try {
    localStorage.setItem("skyc_cached_update_info", JSON.stringify(update));
  } catch (_) {}

  // Update header status pill
  updateHeaderStatusPill(update);

  // Update Settings navigation indicator
  updateNavIndicator(true);

  // Update Settings UI card
  updateSettingsViewStatus(update);

  const dismissedId = localStorage.getItem("skyc_dismissed_update_id");
  const isDismissed = dismissedId === update.uniqueId;

  // Show UI notifications
  if (manual || !isDismissed) {
    showUpdateModal(update);
    showStickyBanner(update);
    triggerHaptic("medium");

    // Native Web / Desktop Notification
    sendWebNotification(update.title, {
      body: `${update.badge}: ${update.changelog.replace(/\n+/g, " ").slice(0, 100)}...`,
      icon: "favicon.png",
      tag: update.uniqueId,
    });

    if (manual) {
      showToast(`✨ ${update.title} available!`, "info");
    }
  } else {
    // Keep subtle banner & pills even if modal dismissed
    showStickyBanner(update);
  }
}

/**
 * Handle when no updates are found
 */
function handleNoUpdate(manual) {
  activeUpdateInfo = null;
  try {
    localStorage.removeItem("skyc_cached_update_info");
  } catch (_) {}

  // Reset header pill
  const pill = document.getElementById("headerOtaStatus");
  if (pill) {
    pill.textContent = `Core v${APP_CURRENT_VERSION}`;
    const wrap = pill.closest(".badge-status-pill");
    if (wrap) {
      wrap.classList.remove("has-update", "clickable");
      wrap.onclick = null;
    }
  }

  // Hide nav indicator
  updateNavIndicator(false);

  // Hide sticky banner
  hideStickyBanner();

  // Update settings card
  updateSettingsViewStatus(null);

  if (manual) {
    showToast(`Skyc is up to date (v${APP_CURRENT_VERSION})`, "success");
    triggerHaptic("light");
  }
}

/**
 * Displays the rich Update Notification Modal
 */
export function showUpdateModal(info = activeUpdateInfo) {
  if (info) activeUpdateInfo = info;
  if (!activeUpdateInfo) return;
  info = activeUpdateInfo;

  const modal = document.getElementById("updateModal");
  if (!modal) return;

  const badgeEl = document.getElementById("updateModalBadge");
  const titleEl = document.getElementById("updateModalTitle");
  const verEl = document.getElementById("updateModalVersion");
  const timeEl = document.getElementById("updateModalTime");
  const currentEl = document.getElementById("updateCurrentVersionTag");
  const notesEl = document.getElementById("updateModalChangelog");
  const dlBtn = document.getElementById("updateModalDownloadBtn");
  const dlText = document.getElementById("updateModalDownloadText");
  const ghBtn = document.getElementById("updateModalGithubBtn");

  if (badgeEl) {
    badgeEl.textContent = info.badge || "UPDATE";
    badgeEl.className = info.type === "commit" ? "badge badge-cobalt" : "badge badge-terracotta";
  }

  if (titleEl) titleEl.textContent = info.title || "Skyc Update Available";
  if (verEl) verEl.textContent = info.version || "";
  if (timeEl) {
    const relTime = formatRelativeTime(new Date(info.publishedAt).getTime());
    timeEl.textContent = relTime ? `Released ${relTime}` : "Recently updated";
  }
  if (currentEl) currentEl.textContent = `Current: v${APP_CURRENT_VERSION}`;

  if (notesEl) {
    notesEl.textContent = info.changelog || "No changelog notes provided.";
  }

  if (dlBtn && dlText) {
    dlText.textContent = info.downloadLabel || "Download Update";
    dlBtn.href = info.downloadUrl || info.releaseUrl || "#";
    dlBtn.onclick = (e) => {
      if (info.downloadUrl === "#apply-scraper") {
        e.preventDefault();
        closeUpdateModal(false);
        checkOtaScraperUpdate(true);
      }
    };
  }

  if (ghBtn) {
    ghBtn.href = info.releaseUrl || `https://github.com/${GITHUB_REPO}`;
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

/**
 * Closes the update modal
 */
export function closeUpdateModal(dismissForSession = false) {
  const modal = document.getElementById("updateModal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");

  if (dismissForSession && activeUpdateInfo) {
    localStorage.setItem("skyc_dismissed_update_id", activeUpdateInfo.uniqueId);
    if (activeUpdateInfo.type === "commit") {
      localStorage.setItem("skyc_last_seen_commit", activeUpdateInfo.version);
    }
  }
}

/**
 * Displays the top floating sticky banner
 */
export function showStickyBanner(info = activeUpdateInfo) {
  if (info) activeUpdateInfo = info;
  if (!activeUpdateInfo) return;
  info = activeUpdateInfo;

  const banner = document.getElementById("updateStickyBanner");
  const bannerText = document.getElementById("updateBannerText");
  if (!banner || !bannerText) return;

  bannerText.innerHTML = `<strong>Update available!</strong> ${info.title}`;
  banner.style.display = "flex";
}

/**
 * Hides the sticky banner
 */
export function hideStickyBanner() {
  const banner = document.getElementById("updateStickyBanner");
  if (banner) banner.style.display = "none";
}

/**
 * Binds events for update modal
 */
function bindUpdateModalEvents() {
  const closeBtn = document.getElementById("updateModalCloseBtn");
  const dismissBtn = document.getElementById("updateModalDismissBtn");
  const modal = document.getElementById("updateModal");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeUpdateModal(true));
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      closeUpdateModal(true);
      showToast("Update reminder postponed.", "info");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUpdateModal(true);
    });
  }
}

/**
 * Binds events for top sticky banner
 */
function bindStickyBannerEvents() {
  const viewBtn = document.getElementById("updateBannerViewBtn");
  const closeBtn = document.getElementById("updateBannerCloseBtn");

  if (viewBtn) {
    viewBtn.addEventListener("click", () => {
      showUpdateModal();
      triggerHaptic("light");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      hideStickyBanner();
      if (activeUpdateInfo) {
        localStorage.setItem("skyc_dismissed_update_id", activeUpdateInfo.uniqueId);
      }
    });
  }
}

/**
 * Updates header status pill to indicate an available update
 */
function updateHeaderStatusPill(info) {
  const pill = document.getElementById("headerOtaStatus");
  if (!pill) return;

  const wrap = pill.closest(".badge-status-pill");
  if (!wrap) return;

  wrap.classList.add("has-update", "clickable");
  pill.textContent = `⚡ Update: ${info.version}`;
  wrap.title = `Click to view details for ${info.title}`;
  wrap.onclick = () => {
    showUpdateModal(info);
    triggerHaptic("light");
  };
}

/**
 * Shows or hides the pulse dot on Settings tab in bottom navigation
 */
function updateNavIndicator(show) {
  const dot = document.getElementById("settingsNavDot");
  if (dot) {
    dot.style.display = show ? "block" : "none";
  }
}

/**
 * Updates the Settings screen status indicators
 */
export function updateSettingsViewStatus(info = activeUpdateInfo) {
  const versionDesc = document.getElementById("settingsAppVersion");
  const badgeWrap = document.getElementById("settingsUpdateBadge");
  const timeEl = document.getElementById("settingsLastCheckedTime");

  if (versionDesc) {
    versionDesc.textContent = `v${APP_CURRENT_VERSION} (Build ${APP_BUILD_COMMIT})`;
  }

  if (badgeWrap) {
    if (info) {
      badgeWrap.className = "badge badge-terracotta";
      badgeWrap.textContent = `Update: ${info.version}`;
      badgeWrap.style.display = "inline-flex";
      badgeWrap.style.cursor = "pointer";
      badgeWrap.onclick = () => showUpdateModal(info);
    } else {
      badgeWrap.className = "badge badge-success";
      badgeWrap.textContent = "Up to date";
      badgeWrap.style.display = "inline-flex";
      badgeWrap.style.cursor = "default";
      badgeWrap.onclick = null;
    }
  }

  if (timeEl) {
    const lastCheck = parseInt(localStorage.getItem("skyc_last_checked_update_time") || "0", 10);
    if (lastCheck) {
      const rel = formatRelativeTime(lastCheck);
      timeEl.textContent = `Last checked: ${rel || "Just now"}`;
    } else {
      timeEl.textContent = "Last checked: Never";
    }
  }
}

/**
 * Triggers native Web Notifications if permitted
 */
export async function sendWebNotification(title, options = {}) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const notif = new Notification(title, {
        icon: options.icon || "favicon.png",
        body: options.body || "",
        tag: options.tag || "skyc-update",
      });
      notif.onclick = () => {
        window.focus();
        showUpdateModal();
      };
    }
  } catch (err) {
    console.warn("[Skyc Notification] System notification failed:", err);
  }
}

/**
 * Requests browser notification permission
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("Web Notifications are not supported on this device/browser.", "warning");
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      showToast("Notifications enabled for Skyc updates!", "success");
      triggerHaptic("medium");
      return true;
    } else {
      showToast("Notification permission was not granted.", "info");
      return false;
    }
  } catch (err) {
    console.error("[Skyc Notification] Error requesting permission:", err);
    return false;
  }
}

/**
 * Clean markdown changelog into readable text
 */
function cleanChangelog(raw) {
  if (!raw) return "";
  return raw
    .replace(/^#+\s+/gm, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

/**
 * Compares two semantic version strings (e.g. 1.8.68 > 1.6.7)
 */
export function isVersionGreater(latest, current) {
  if (!latest || !current) return false;
  const l = latest.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const c = current.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(l.length, c.length);
  for (let i = 0; i < len; i++) {
    const lPart = l[i] || 0;
    const cPart = c[i] || 0;
    if (lPart > cPart) return true;
    if (lPart < cPart) return false;
  }
  return false;
}
