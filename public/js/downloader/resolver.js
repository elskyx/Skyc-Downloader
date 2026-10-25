// public/js/downloader/resolver.js
import { scraperFetch } from "../scrapers/httpHelper.js";

/**
 * Checks if a media stream URL requires an async secondary resolution pass
 */
export function needsAsyncResolving(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith("applemusic_resolve:") ||
    url.startsWith("spotidown_resolve:") ||
    url.startsWith("spotiflac_resolve:") ||
    url.startsWith("youtube_resolve:") ||
    url.includes("token=snapsave")
  );
}

/**
 * Resolves indirect tokens to direct downloadable media URLs
 */
export async function resolveDownloadUrl({ url, updateProgress = () => {}, isCancelled = () => false }) {
  if (!url) throw new Error("Empty URL passed to resolver");

  // 1. YouTube Resolution Token (youtube_resolve:<format>:<videoId>)
  if (url.startsWith("youtube_resolve:")) {
    const parts = url.split(":");
    const format = parts[1] || "mp4"; // "mp4", "mp3", or "1080p"
    const videoId = parts[2];

    if (!videoId) throw new Error("Invalid YouTube video ID in token");
    updateProgress(15, `Resolving YouTube ${format.toUpperCase()} stream...`);

    // Tier A: Custom Cobalt v10 instance (if configured by user in Settings)
    let customCobaltUrl = null;
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      try {
        customCobaltUrl = localStorage.getItem("skyc_cobalt_instance");
      } catch (_) {}
    }

    if (customCobaltUrl && customCobaltUrl.startsWith("http")) {
      try {
        updateProgress(30, "Querying custom Cobalt instance...");
        const endpoint = customCobaltUrl.endsWith("/") ? customCobaltUrl : `${customCobaltUrl}/`;
        const cobaltRes = await scraperFetch({
          method: "POST",
          url: endpoint,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          data: {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoQuality: format === "1080p" ? "1080" : "720",
            audioFormat: "mp3",
            downloadMode: format === "mp3" ? "audio" : "auto",
          },
        }, "Custom Cobalt");

        if (cobaltRes && (cobaltRes.url || cobaltRes.status === "tunnel" || cobaltRes.status === "redirect")) {
          updateProgress(100, "Stream link ready!");
          return cobaltRes.url;
        }
      } catch (e) {
        console.warn("[Skyc YouTube] Custom Cobalt instance resolution error:", e);
      }
    }

    // Tier B: High-Speed ymcdn Converter (YtMp3 engine)
    try {
      updateProgress(35, "Connecting to media conversion node...");
      const ymHeaders = {
        Origin: "https://ytmp3.mobi",
        Referer: "https://ytmp3.mobi/en8/",
        Accept: "*/*",
      };

      const initData = await scraperFetch({
        method: "GET",
        url: `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`,
        headers: ymHeaders,
      }, "YtMp3 Init");

      if (initData && initData.convertURL) {
        const targetFormat = format === "mp3" ? "mp3" : "mp4";
        let convData = await scraperFetch({
          method: "GET",
          url: `${initData.convertURL}&v=${videoId}&f=${targetFormat}&_=${Math.random()}`,
          headers: ymHeaders,
        }, "YtMp3 Convert");

        while (convData && convData.redirect > 0 && convData.redirectURL) {
          if (isCancelled()) throw new Error("Download cancelled");
          convData = await scraperFetch({
            method: "GET",
            url: `${convData.redirectURL}&v=${videoId}&f=${targetFormat}&_=${Math.random()}`,
            headers: ymHeaders,
          }, "YtMp3 Redir");
        }

        if (convData && !convData.error) {
          let progress = 0;
          let finalUrl = convData.downloadURL;
          let attempts = 0;

          while (progress < 3 && attempts < 12) {
            if (isCancelled()) throw new Error("Download cancelled");
            await new Promise((r) => setTimeout(r, 1200));
            attempts++;
            updateProgress(40 + attempts * 5, `Preparing ${targetFormat.toUpperCase()} stream...`);

            if (convData.progressURL) {
              const pData = await scraperFetch({
                method: "GET",
                url: `${convData.progressURL}&_=${Math.random()}`,
                headers: ymHeaders,
              }, "YtMp3 Progress");

              progress = pData?.progress ?? 0;
              if (pData?.downloadURL) finalUrl = pData.downloadURL;
              if (progress >= 3) break;
            }
          }

          if (finalUrl) {
            updateProgress(100, "Stream link ready!");
            return finalUrl.startsWith("//") ? `https:${finalUrl}` : finalUrl;
          }
        }
      }
    } catch (ymErr) {
      console.warn("[Skyc YouTube] ymcdn node failed, trying Piped stream fallback:", ymErr);
    }

    // Tier C: Piped API Progressive Media Streams
    try {
      updateProgress(75, "Falling back to progressive media stream...");
      const pipedData = await scraperFetch({
        method: "GET",
        url: `https://api.piped.private.coffee/streams/${videoId}`,
        headers: { Accept: "application/json" },
      }, "Piped API");

      if (pipedData) {
        if (format === "mp3") {
          const audioStreams = pipedData.audioStreams || [];
          if (audioStreams.length > 0) {
            const bestAudio = audioStreams[0];
            updateProgress(100, "Audio stream ready!");
            return bestAudio.url;
          }
        } else {
          const videoStreams = pipedData.videoStreams || [];
          if (videoStreams.length > 0) {
            const mp4Stream = videoStreams.find((s) => s.format === "MPEG_4" || s.quality?.includes("720") || s.quality?.includes("360")) || videoStreams[0];
            updateProgress(100, "Video stream ready!");
            return mp4Stream.url;
          }
        }
      }
    } catch (pipedErr) {
      console.warn("[Skyc YouTube] Piped API fallback error:", pipedErr);
    }

    throw new Error("Unable to resolve YouTube stream. Please try again or configure a private Cobalt instance in Settings.");
  }

  // 2. Apple Music Resolution Token
  if (url.startsWith("applemusic_resolve:")) {
    const payloadStr = url.replace("applemusic_resolve:", "");
    updateProgress(25, "Resolving Apple Music track...");

    const res = await scraperFetch({
      method: "POST",
      url: "https://aplmate.com/action/track",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://aplmate.com/",
        Origin: "https://aplmate.com",
      },
      data: payloadStr,
    }, "AplMate");

    const parsed = typeof res === "string" ? JSON.parse(res) : res;
    const html = (parsed && parsed.data) || "";
    const linkMatch = html.match(/href="([^"]*(?:\/dl\?token=|download)[^"]*)"/i);
    if (linkMatch) {
      let resolved = linkMatch[1];
      if (!resolved.startsWith("http")) resolved = `https://aplmate.com${resolved}`;
      return resolved;
    }
    throw new Error("Unable to resolve Apple Music download link");
  }

  // 3. Spotify MP3 Resolution Token
  if (url.startsWith("spotidown_resolve:")) {
    const payload = url.replace("spotidown_resolve:", "");
    updateProgress(25, "Resolving Spotify MP3 audio...");

    const res = await scraperFetch({
      method: "POST",
      url: "https://spotidown.com/api/download-track",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://spotidown.com/",
      },
      data: payload,
    }, "SpotiDown");

    const parsed = typeof res === "string" ? JSON.parse(res) : res;
    if (parsed && parsed.downloadUrl) {
      return parsed.downloadUrl;
    }
    throw new Error("Unable to resolve Spotify audio link");
  }

  // 4. Spotify Lossless FLAC Resolution Token (Mornye Ecosystem Engine)
  if (url.startsWith("spotiflac_resolve:")) {
    const trackId = url.replace("spotiflac_resolve:", "").trim();
    updateProgress(20, "Resolving Spotify FLAC lossless audio...");

    // Tier A: Query Mornye / SpotiFLAC Lossless Provider Gateway
    try {
      updateProgress(40, "Matching track in lossless provider catalog...");
      let mornyeEndpoint = "https://api.zarz.moe";
      if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
        const custom = localStorage.getItem("skyc_mornye_endpoint");
        if (custom && custom.startsWith("http")) mornyeEndpoint = custom;
      }

      const qbzPayload = {
        id: trackId,
        type: "track",
        url: `https://open.spotify.com/track/${trackId}`,
        quality: "27",
      };

      const providerRes = await scraperFetch({
        method: "POST",
        url: `${mornyeEndpoint}/v2/qbz`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: qbzPayload,
      }, "Mornye Lossless Provider");

      const qbzParsed = typeof providerRes === "string" ? JSON.parse(providerRes) : providerRes;
      const flacUrl = qbzParsed?.url || qbzParsed?.download_url || qbzParsed?.link || qbzParsed?.downloadUrl;
      if (flacUrl) {
        updateProgress(100, "Lossless FLAC audio stream ready!");
        return flacUrl;
      }
    } catch (e) {
      console.warn("[Skyc Mornye] Provider gateway notice:", e.message);
    }

    // Tier B: High-definition audio stream resolver (SpotiDown / SpotMate node)
    try {
      updateProgress(65, "Connecting to high-bitrate media node...");
      const spotRes = await scraperFetch({
        method: "POST",
        url: "https://spotidown.com/api/download-track",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://spotidown.com/",
        },
        data: trackId,
      }, "SpotiDown Stream");

      const parsed = typeof spotRes === "string" ? JSON.parse(spotRes) : spotRes;
      if (parsed && (parsed.downloadUrl || parsed.url || parsed.file_url)) {
        updateProgress(100, "Lossless FLAC stream ready!");
        return parsed.downloadUrl || parsed.url || parsed.file_url;
      }
    } catch (e) {
      console.warn("[Skyc Lossless] Secondary node notice:", e.message);
    }

    // Tier C: SpotifyDown direct API fallback
    try {
      updateProgress(85, "Resolving stream link from fallback mirror...");
      const sdownRes = await scraperFetch({
        method: "POST",
        url: "https://api.spotifydown.com/download",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://spotifydown.com/",
        },
        data: { link: `https://open.spotify.com/track/${trackId}` },
      }, "SpotifyDown Mirror");

      if (sdownRes?.success && sdownRes?.link) {
        updateProgress(100, "Lossless audio stream ready!");
        return sdownRes.link;
      }
    } catch (e) {
      console.warn("[Skyc Lossless] Fallback mirror notice:", e.message);
    }

    throw new Error(`Unable to resolve lossless FLAC stream for Spotify track (${trackId}). Please check network or try again.`);
  }

  return url;
}
