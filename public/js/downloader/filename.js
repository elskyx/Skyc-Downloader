// public/js/downloader/filename.js

/**
 * Sanitizes a title string into a safe file name across Android, Windows, and Linux
 */
export function sanitizeFilename(title, maxLength = 80) {
  if (!title || typeof title !== "string") {
    return `zennx_${Date.now()}`;
  }

  // Remove invalid file name characters across Windows/Android/Linux: \ / : * ? " < > |
  let clean = title
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .trim();

  // Strip excessive spaces or underscores
  clean = clean.replace(/\s+/g, " ").replace(/_+/g, "_");

  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength).trim();
  }

  return clean || `zennx_${Date.now()}`;
}

/**
 * Determines target folder based on media type (Movies/Zennx, Music/Zennx, Pictures/Zennx)
 */
export function getMediaTargetDirectory(mediaType) {
  let custom = null;
  if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
    try {
      custom = localStorage.getItem("zennx_custom_storage_dir") || localStorage.getItem("skyc_custom_storage_dir");
    } catch (_) {}
  }
  if (custom && custom.trim()) return custom.trim();

  const type = (mediaType || "").toLowerCase();
  if (type === "audio" || type === "music" || type === "mp3" || type === "flac") {
    return "Music/Zennx";
  }
  if (type === "photo" || type === "image" || type === "pdf") {
    return "Pictures/Zennx";
  }
  return "Movies/Zennx";
}
