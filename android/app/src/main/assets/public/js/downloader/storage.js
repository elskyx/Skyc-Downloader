// public/js/downloader/storage.js
import { showToast } from "../utils/index.js";

/**
 * High-performance streaming media downloader and storage coordinator.
 * Uses native OS streaming transports when available to avoid CORS restrictions
 * and eliminate large JavaScript memory buffers:
 * 1. Windows Tauri Desktop: Reqwest native chunk streaming directly to user folder
 * 2. Android: OkHttp native bridge streaming directly to public media storage + MediaScanner
 * 3. Web: fetch blob with automatic anchor download fallback for CORS-isolated hosts
 */
export async function downloadAndSaveMediaStream({
  url,
  filename,
  subfolder = "Movies/Zennx",
  mimeType = "video/mp4",
  onProgress = () => {},
}) {
  if (!url) throw new Error("No download URL provided");

  // 1. Windows Tauri Desktop Native Streaming (Reqwest -> Tokio File)
  if (window.__TAURI__?.core?.invoke) {
    let unlisten = null;
    try {
      onProgress(10, "Connecting native desktop stream...");

      // Listen for chunk-by-chunk real-time progress events from Rust
      if (window.__TAURI__?.event?.listen) {
        unlisten = await window.__TAURI__.event.listen("zennx://download-progress", (event) => {
          const payload = event.payload;
          if (payload && payload.filename === filename) {
            if (payload.total && payload.total > 0) {
              const mbDownloaded = (payload.downloaded / 1048576).toFixed(1);
              const mbTotal = (payload.total / 1048576).toFixed(1);
              onProgress(payload.percent, `Downloading ${mbDownloaded} / ${mbTotal} MB`);
            } else {
              const mbDownloaded = (payload.downloaded / 1048576).toFixed(1);
              onProgress(payload.percent || 0, `Streaming ${mbDownloaded} MB...`);
            }
          }
        });
      }

      const res = await window.__TAURI__.core.invoke("download_media_stream", {
        url,
        filename,
        subfolder,
      });

      if (unlisten) unlisten();
      onProgress(100, "Saved to device");
      const savedPath = typeof res === "object" && res !== null ? res.path : res;
      const fileSize = typeof res === "object" && res !== null ? res.file_size : 0;
      return { success: true, path: savedPath, fileSize };
    } catch (tauriErr) {
      if (unlisten) unlisten();
      console.warn("[Zennx Storage] Tauri native stream failed, attempting memory fallback:", tauriErr);
    }
  }

  // 2. Android Native Bridge Streaming (OkHttp -> Public Media File)
  const nativeHttp = window.ZennxNativeHttp || window.SkycNativeHttp;
  if (nativeHttp?.downloadFileNative) {
    try {
      onProgress(15, "Connecting Android native stream...");
      const payload = JSON.stringify({ url, filename, subfolder });
      const rawRes = nativeHttp.downloadFileNative(payload);
      const res = JSON.parse(rawRes);
      if (res && res.success) {
        onProgress(100, "Saved to device");
        return { success: true, path: res.path };
      }
      console.warn("[Zennx Storage] Android native download returned non-success:", res?.error);
    } catch (androidErr) {
      console.warn("[Zennx Storage] Android native download exception:", androidErr);
    }
  }

  // 3. Web & WebView Hybrid Fallback
  // Try fetching blob for seamless local save; if CORS restricts fetch, trigger browser download
  try {
    onProgress(20, "Fetching media stream...");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const blob = await res.blob();
    onProgress(85, "Saving media file...");

    return await saveMediaFile({
      data: blob,
      filename,
      subfolder,
      mimeType: blob.type || mimeType,
      onProgress,
    });
  } catch (fetchErr) {
    console.warn("[Skyc Storage] Direct fetch failed (likely CORS), falling back to browser download dispatch:", fetchErr);
    onProgress(90, "Triggering browser direct download...");

    // Browser navigation download dispatch (bypasses CORS restrictions)
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return { success: true, path: filename, isExternalDispatch: true };
  }
}

/**
 * Saves a Blob or ArrayBuffer to the user's device filesystem
 */
export async function saveMediaFile({
  data,
  filename,
  subfolder = "Movies/Zennx",
  mimeType = "video/mp4",
  onProgress = () => {},
}) {
  // 1. Android Capacitor Environment
  if (window.Capacitor?.Plugins?.Filesystem) {
    try {
      const { Filesystem, Directory } = window.Capacitor.Plugins;

      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result;
          const base64 = typeof res === "string" ? res.split(",")[1] : "";
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(data instanceof Blob ? data : new Blob([data], { type: mimeType }));
      });

      const fullPath = `${subfolder}/${filename}`;
      await Filesystem.writeFile({
        path: fullPath,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      const dataSize = data.size || (data.byteLength ? data.byteLength : 0);
      return { success: true, path: fullPath, fileSize: dataSize };
    } catch (androidErr) {
      console.warn("[Skyc Storage] Capacitor Filesystem failed, falling back:", androidErr);
    }
  }

  // 2. Windows Tauri Desktop Environment
  if (window.__TAURI__?.core?.invoke) {
    try {
      const buffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      const res = await window.__TAURI__.core.invoke("save_media_file", {
        filename,
        subfolder,
        bytes,
      });
      return { success: true, path: res, fileSize: bytes.length };
    } catch (tauriErr) {
      console.warn("[Skyc Storage] Tauri native write failed:", tauriErr);
    }
  }

  // 3. Web Browser Fallback (Anchor Download via Object URL)
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

  return { success: true, path: filename, fileSize: blob.size };
}
