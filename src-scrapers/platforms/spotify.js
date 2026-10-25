// src-scrapers/platforms/spotify.js

export async function scrapeSpotify(url, fetchClient) {
  const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/i);
  const trackId = trackIdMatch ? trackIdMatch[1] : null;

  // Primary: Spotify oEmbed metadata baseline (official zero-auth Spotify API)
  let title = "Spotify Track";
  let author = "Spotify Artist";
  let thumbnail = "";

  try {
    const oembedRes = await fetchClient({
      method: "GET",
      url: `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      headers: {
        Accept: "application/json",
      },
    }, "SpotifyOEmbed");

    if (oembedRes && oembedRes.title) {
      title = oembedRes.title;
      if (oembedRes.thumbnail_url) thumbnail = oembedRes.thumbnail_url;
      // oEmbed title format is typically "Track Title" or "Track Title - song and lyrics by Artist"
      if (oembedRes.title.includes(" - song and lyrics by ")) {
        const parts = oembedRes.title.split(" - song and lyrics by ");
        title = parts[0].trim();
        author = parts[1].trim();
      }
    }
  } catch (_) {}

  // Server 1: SpotifyDown / Spotidown API
  try {
    const res = await fetchClient({
      method: "POST",
      url: "https://api.spotifydown.com/download",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://spotifydown.com/",
      },
      data: { link: url },
    }, "SpotifyDown");

    if (res?.success && res?.link) {
      const trackTitle = res.metadata?.title || title;
      const trackAuthor = res.metadata?.artists || author;
      const trackCover = res.metadata?.cover || thumbnail;

      return {
        platform: "spotify",
        title: trackTitle,
        author: trackAuthor,
        thumbnail: trackCover,
        duration: 0,
        formats: [
          {
            id: "spotify_flac_lossless",
            label: `Lossless FLAC • ${trackTitle} — ${trackAuthor}`,
            quality: "Lossless FLAC",
            type: "audio",
            ext: "flac",
            title: trackTitle,
            author: trackAuthor,
            url: trackId ? `spotiflac_resolve:${trackId}` : `spotiflac_resolve:${encodeURIComponent(url)}`,
          },
          {
            id: "spotify_mp3_320",
            label: `Audio MP3 320kbps • ${trackTitle} — ${trackAuthor}`,
            quality: "320kbps",
            type: "audio",
            ext: "mp3",
            title: trackTitle,
            author: trackAuthor,
            url: res.link,
          }
        ],
        photos: [],
        hasPdfOption: false,
      };
    }
  } catch (err) {
    console.warn("[Skyc Scraper] SpotifyDown failed, trying fallback:", err);
  }

  // Fallback: Spotmate & Mornye FLAC token resolution
  if (trackId) {
    return {
      platform: "spotify",
      title: title,
      author: author,
      thumbnail: thumbnail,
      duration: 0,
      formats: [
        {
          id: "spotify_flac_lossless",
          label: `Lossless FLAC • ${title} — ${author}`,
          quality: "Lossless FLAC",
          type: "audio",
          ext: "flac",
          title: title,
          author: author,
          url: `spotiflac_resolve:${trackId}`,
        },
        {
          id: "spot_audio",
          label: `Spotify Audio MP3 • ${title} — ${author}`,
          quality: "320kbps",
          type: "audio",
          ext: "mp3",
          title: title,
          author: author,
          url: `spotidown_resolve:${trackId}`,
        }
      ],
      photos: [],
      hasPdfOption: false,
    };
  }

  throw new Error("Spotify track could not be resolved.");
}
