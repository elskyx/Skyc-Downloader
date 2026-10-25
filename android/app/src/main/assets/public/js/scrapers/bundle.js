"use strict";
var __SkycScraperEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src-scrapers/index.js
  var index_exports = {};
  __export(index_exports, {
    PLATFORM_REGISTRY: () => PLATFORM_REGISTRY,
    SCRAPER_VERSION: () => SCRAPER_VERSION,
    extractMedia: () => extractMedia
  });

  // public/js/utils/urlUtils.js
  function detectPlatform(url) {
    if (!url) return "unknown";
    const lower = url.toLowerCase();
    if (lower.includes("tiktok.com") || lower.includes("douyin.com")) {
      return lower.includes("douyin.com") ? "douyin" : "tiktok";
    }
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

  // src-scrapers/platforms/tiktok.js
  async function scrapeTikTok(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://www.tikwm.com/api/",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://www.tikwm.com/"
        },
        data: { url, count: 12, cursor: 0, web: 1, hd: 1 }
      }, "TikWM");
      if (res?.data) {
        const d = res.data;
        const formats = [];
        if (d.hdplay || d.play) {
          formats.push({
            id: "hd_nowm",
            label: "HD Video (No Watermark)",
            quality: "1080p / 720p",
            type: "video",
            ext: "mp4",
            url: d.hdplay ? d.hdplay.startsWith("http") ? d.hdplay : `https://www.tikwm.com${d.hdplay}` : d.play
          });
        }
        if (d.music) {
          formats.push({
            id: "audio_mp3",
            label: "Original Audio (MP3)",
            quality: "Audio 128kbps",
            type: "audio",
            ext: "mp3",
            url: d.music.startsWith("http") ? d.music : `https://www.tikwm.com${d.music}`
          });
        }
        let photos = [];
        if (d.images && Array.isArray(d.images) && d.images.length > 0) {
          photos = d.images.map((imgUrl, idx) => ({
            id: `photo_${idx + 1}`,
            label: `Photo ${idx + 1}`,
            url: imgUrl,
            ext: "jpg",
            type: "photo"
          }));
        }
        return {
          platform: "tiktok",
          title: d.title || "TikTok Media",
          author: d.author?.nickname || d.author?.unique_id || "TikTok User",
          authorAvatar: d.author?.avatar || "",
          thumbnail: d.cover || photos[0]?.url || "",
          duration: d.duration || 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] TikWM failed, trying fallback:", err);
    }
    const res2 = await fetchClient({
      method: "POST",
      url: "https://ssstik.io/abc?url=dl",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://ssstik.io/en"
      },
      data: { id: url, locale: "en", tt: "bXNj" }
    }, "Ssstik");
    const html = typeof res2 === "string" ? res2 : JSON.stringify(res2);
    const match = html.match(/href="(https:\/\/[^"]*tikcdn[^"]*)"/i);
    if (match) {
      return {
        platform: "tiktok",
        title: "TikTok Video",
        author: "TikTok User",
        thumbnail: "",
        duration: 0,
        formats: [
          {
            id: "nowm",
            label: "Video (No Watermark)",
            quality: "Standard HD",
            type: "video",
            ext: "mp4",
            url: match[1]
          }
        ],
        photos: [],
        hasPdfOption: false
      };
    }
    throw new Error("TikTok media could not be extracted.");
  }

  // src-scrapers/platforms/instagram.js
  async function scrapeInstagram(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://snapinsta.app/action2.php",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://snapinsta.app/"
        },
        data: { url, action: "post" }
      }, "SnapInsta");
      const html = typeof res === "string" ? res : res?.data || JSON.stringify(res);
      const formats = [];
      const photos = [];
      const videoMatches = [...html.matchAll(/href="([^"]*(?:snapinsta\.app\/get\.php|\.mp4)[^"]*)"/gi)];
      for (const vm of videoMatches) {
        formats.push({
          id: `video_${formats.length + 1}`,
          label: `Instagram Video ${formats.length + 1}`,
          quality: "HD 1080p",
          type: "video",
          ext: "mp4",
          url: vm[1]
        });
      }
      const imgMatches = [...html.matchAll(/<img[^>]+src="([^">]+\.(?:jpg|jpeg|webp|png)[^">]*)"/gi)];
      for (const im of imgMatches) {
        if (!im[1].includes("logo") && !im[1].includes("icon")) {
          photos.push({
            id: `photo_${photos.length + 1}`,
            label: `Photo ${photos.length + 1}`,
            url: im[1],
            ext: "jpg",
            type: "photo"
          });
        }
      }
      if (formats.length > 0 || photos.length > 0) {
        return {
          platform: "instagram",
          title: "Instagram Post",
          author: "Instagram Creator",
          thumbnail: photos[0]?.url || "",
          duration: 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] SnapInsta failed, trying fallback:", err);
    }
    const res2 = await fetchClient({
      method: "POST",
      url: "https://fastdl.app/c/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://fastdl.app/"
      },
      data: { url, lang_code: "en" }
    }, "FastDL");
    const html2 = typeof res2 === "string" ? res2 : JSON.stringify(res2);
    const match = html2.match(/href="([^"]*(?:download|fastdl\.app)[^"]*)"/i);
    if (match) {
      return {
        platform: "instagram",
        title: "Instagram Media",
        author: "Instagram Creator",
        thumbnail: "",
        duration: 0,
        formats: [
          {
            id: "ig_hd",
            label: "Instagram HD Media",
            quality: "High Definition",
            type: "video",
            ext: "mp4",
            url: match[1]
          }
        ],
        photos: [],
        hasPdfOption: false
      };
    }
    throw new Error("Instagram media could not be extracted.");
  }

  // src-scrapers/platforms/youtube.js
  async function scrapeYouTube(url, fetchClient) {
    const idMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
    );
    const videoId = idMatch ? idMatch[1] : null;
    if (!videoId) {
      throw new Error("Invalid YouTube URL. Please provide a standard YouTube video, shorts, or live link.");
    }
    let title = "YouTube Video";
    let author = "YouTube Creator";
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    let duration = 0;
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedData = await fetchClient({
        method: "GET",
        url: oembedUrl,
        headers: {
          Accept: "application/json"
        }
      }, "YouTube OEmbed");
      if (oembedData && typeof oembedData === "object") {
        if (oembedData.title) title = oembedData.title;
        if (oembedData.author_name) author = oembedData.author_name;
        if (oembedData.thumbnail_url) thumbnail = oembedData.thumbnail_url;
      }
    } catch (oembedErr) {
      console.warn("[Skyc YouTube] OEmbed metadata lookup note:", oembedErr?.message || oembedErr);
    }
    let customCobaltUrl = null;
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      try {
        customCobaltUrl = localStorage.getItem("skyc_cobalt_instance");
      } catch (_) {
      }
    }
    if (customCobaltUrl && customCobaltUrl.startsWith("http")) {
      try {
        const cobaltEndpoint = customCobaltUrl.endsWith("/") ? customCobaltUrl : `${customCobaltUrl}/`;
        const cobaltRes = await fetchClient({
          method: "POST",
          url: cobaltEndpoint,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          data: {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoQuality: "1080",
            downloadMode: "auto"
          }
        }, "Custom Cobalt");
        if (cobaltRes && (cobaltRes.url || cobaltRes.status === "tunnel" || cobaltRes.status === "redirect")) {
          const streamUrl = cobaltRes.url;
          return {
            platform: "youtube",
            title: cobaltRes.filename || title,
            author,
            thumbnail,
            duration,
            formats: [
              {
                id: "yt_1080p_cobalt",
                label: "Video (1080p Full HD)",
                quality: "1080p",
                type: "video",
                ext: "mp4",
                url: streamUrl
              },
              {
                id: "yt_mp3_resolve",
                label: "Audio Only (MP3 320kbps)",
                quality: "320kbps",
                type: "audio",
                ext: "mp3",
                url: `youtube_resolve:mp3:${videoId}`
              }
            ],
            photos: [],
            hasPdfOption: false
          };
        }
      } catch (cobaltErr) {
        console.warn("[Skyc YouTube] Custom Cobalt instance failed, using default multi-tiered resolvers:", cobaltErr);
      }
    }
    return {
      platform: "youtube",
      title,
      author,
      thumbnail,
      duration,
      formats: [
        {
          id: "yt_720p",
          label: "Video (720p HD MP4)",
          quality: "720p",
          type: "video",
          ext: "mp4",
          url: `youtube_resolve:mp4:${videoId}`
        },
        {
          id: "yt_360p",
          label: "Video (360p SD MP4)",
          quality: "360p",
          type: "video",
          ext: "mp4",
          url: `youtube_resolve:360p:${videoId}`
        },
        {
          id: "yt_mp3",
          label: "Audio Only (MP3 320kbps)",
          quality: "320kbps",
          type: "audio",
          ext: "mp3",
          url: `youtube_resolve:mp3:${videoId}`
        },
        {
          id: "yt_1080p",
          label: "Video (1080p Full HD)",
          quality: "1080p",
          type: "video",
          ext: "mp4",
          url: `youtube_resolve:1080p:${videoId}`
        }
      ],
      photos: [],
      hasPdfOption: false
    };
  }

  // src-scrapers/platforms/twitter.js
  async function scrapeTwitter(url, fetchClient) {
    const tweetIdMatch = url.match(/(?:status|statuses)\/(\d+)/i);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
    if (tweetId) {
      try {
        const res = await fetchClient({
          method: "GET",
          url: `https://api.fxtwitter.com/status/${tweetId}`,
          headers: { Accept: "application/json" }
        }, "FxTwitter");
        if (res?.tweet) {
          const t = res.tweet;
          const formats = [];
          const photos = [];
          if (t.media?.videos && t.media.videos.length > 0) {
            t.media.videos.forEach((v, idx) => {
              formats.push({
                id: `twitter_video_${idx + 1}`,
                label: `Video (HD)`,
                quality: "High Quality",
                type: "video",
                ext: "mp4",
                url: v.url
              });
            });
          }
          if (t.media?.photos && t.media.photos.length > 0) {
            t.media.photos.forEach((p, idx) => {
              photos.push({
                id: `twitter_photo_${idx + 1}`,
                label: `Photo ${idx + 1}`,
                url: p.url,
                ext: "jpg",
                type: "photo"
              });
            });
          }
          return {
            platform: "twitter",
            title: t.text || "X / Twitter Post",
            author: `${t.author?.name || "Twitter User"} (@${t.author?.screen_name || ""})`,
            authorAvatar: t.author?.avatar_url || "",
            thumbnail: photos[0]?.url || "",
            duration: 0,
            formats,
            photos,
            hasPdfOption: photos.length > 1
          };
        }
      } catch (err) {
        console.warn("[Skyc Scraper] FxTwitter failed, trying fallback:", err);
      }
    }
    const res2 = await fetchClient({
      method: "GET",
      url: `https://twitsave.com/info?url=${encodeURIComponent(url)}`,
      headers: { Referer: "https://twitsave.com/" }
    }, "Twitsave");
    const html = typeof res2 === "string" ? res2 : JSON.stringify(res2);
    const match = html.match(/href="([^"]*(?:video\.twimg\.com|twitsave\.com\/download)[^"]*)"/i);
    if (match) {
      return {
        platform: "twitter",
        title: "X / Twitter Video",
        author: "Twitter User",
        thumbnail: "",
        duration: 0,
        formats: [
          {
            id: "tw_video",
            label: "Twitter Video (MP4)",
            quality: "HD",
            type: "video",
            ext: "mp4",
            url: match[1]
          }
        ],
        photos: [],
        hasPdfOption: false
      };
    }
    throw new Error("X / Twitter media could not be extracted.");
  }

  // src-scrapers/platforms/spotify.js
  async function scrapeSpotify(url, fetchClient) {
    const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/i);
    const trackId = trackIdMatch ? trackIdMatch[1] : null;
    let title = "Spotify Track";
    let author = "Spotify Artist";
    let thumbnail = "";
    try {
      const oembedRes = await fetchClient({
        method: "GET",
        url: `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
        headers: {
          Accept: "application/json"
        }
      }, "SpotifyOEmbed");
      if (oembedRes && oembedRes.title) {
        title = oembedRes.title;
        if (oembedRes.thumbnail_url) thumbnail = oembedRes.thumbnail_url;
        if (oembedRes.title.includes(" - song and lyrics by ")) {
          const parts = oembedRes.title.split(" - song and lyrics by ");
          title = parts[0].trim();
          author = parts[1].trim();
        }
      }
    } catch (_) {
    }
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://api.spotifydown.com/download",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://spotifydown.com/"
        },
        data: { link: url }
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
              label: `Lossless FLAC \u2022 ${trackTitle} \u2014 ${trackAuthor}`,
              quality: "Lossless FLAC",
              type: "audio",
              ext: "flac",
              title: trackTitle,
              author: trackAuthor,
              url: trackId ? `spotiflac_resolve:${trackId}` : `spotiflac_resolve:${encodeURIComponent(url)}`
            },
            {
              id: "spotify_mp3_320",
              label: `Audio MP3 320kbps \u2022 ${trackTitle} \u2014 ${trackAuthor}`,
              quality: "320kbps",
              type: "audio",
              ext: "mp3",
              title: trackTitle,
              author: trackAuthor,
              url: res.link
            }
          ],
          photos: [],
          hasPdfOption: false
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] SpotifyDown failed, trying fallback:", err);
    }
    if (trackId) {
      return {
        platform: "spotify",
        title,
        author,
        thumbnail,
        duration: 0,
        formats: [
          {
            id: "spotify_flac_lossless",
            label: `Lossless FLAC \u2022 ${title} \u2014 ${author}`,
            quality: "Lossless FLAC",
            type: "audio",
            ext: "flac",
            title,
            author,
            url: `spotiflac_resolve:${trackId}`
          },
          {
            id: "spot_audio",
            label: `Spotify Audio MP3 \u2022 ${title} \u2014 ${author}`,
            quality: "320kbps",
            type: "audio",
            ext: "mp3",
            title,
            author,
            url: `spotidown_resolve:${trackId}`
          }
        ],
        photos: [],
        hasPdfOption: false
      };
    }
    throw new Error("Spotify track could not be resolved.");
  }

  // src-scrapers/platforms/applemusic.js
  async function scrapeAppleMusic(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://aplmate.com/action/track",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://aplmate.com/"
        },
        data: { url }
      }, "Aplmate");
      const html = typeof res === "string" ? res : res?.data || JSON.stringify(res);
      const titleMatch = html.match(/class="song-title"[^>]*>([^<]+)<\//i);
      const artistMatch = html.match(/class="artist-name"[^>]*>([^<]+)<\//i);
      const coverMatch = html.match(/<img[^>]+src="([^">]+apple[^">]*)"/i);
      return {
        platform: "applemusic",
        title: titleMatch ? titleMatch[1].trim() : "Apple Music Track",
        author: artistMatch ? artistMatch[1].trim() : "Apple Music Artist",
        thumbnail: coverMatch ? coverMatch[1] : "",
        duration: 0,
        formats: [
          {
            id: "apple_music_mp3",
            label: "Apple Music Track (MP3)",
            quality: "320kbps",
            type: "audio",
            ext: "mp3",
            url: `applemusic_resolve:${encodeURIComponent(url)}`
          }
        ],
        photos: [],
        hasPdfOption: false
      };
    } catch (err) {
      console.warn("[Skyc Scraper] Apple Music resolver error:", err);
    }
    throw new Error("Apple Music track could not be resolved.");
  }

  // src-scrapers/platforms/pinterest.js
  function extractPinId(url, html = "") {
    if (url) {
      const directMatch = url.match(/pin\/(\d+)/i);
      if (directMatch) return directMatch[1];
    }
    if (html) {
      const canonicalMatch = html.match(/<link [^>]*rel="canonical"[^>]*href="[^"]*pin\/(\d+)/i) || html.match(/<meta [^>]*property="og:url"[^>]*content="[^"]*pin\/(\d+)/i) || html.match(/pinterest\.com\/pin\/(\d+)/i) || html.match(/"pin_id":\s*"(\d+)"/i) || html.match(/"pins":\s*\{\s*"(\d+)"/i);
      if (canonicalMatch) return canonicalMatch[1];
    }
    return null;
  }
  function parsePinterestHtml(html, fallbackUrl = "") {
    let title = "Pinterest Pin";
    let author = "Pinterest Creator";
    let thumbnail = "";
    const formats = [];
    const photos = [];
    const ldMatches = [...html.matchAll(/<script [^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of ldMatches) {
      try {
        const ld = JSON.parse(m[1]);
        if (ld.headline && title === "Pinterest Pin") title = ld.headline.trim();
        if (ld.author?.name && author === "Pinterest Creator") author = ld.author.name.trim();
        if (ld.image) {
          const rawImgs = Array.isArray(ld.image) ? ld.image : [ld.image];
          for (const rawImg of rawImgs) {
            const imgUrl = typeof rawImg === "string" ? rawImg : rawImg.url || rawImg.contentUrl;
            if (imgUrl && !photos.some((p) => p.url === imgUrl)) {
              const ext = imgUrl.toLowerCase().endsWith(".png") ? "png" : "jpg";
              photos.push({
                id: `pin_photo_${photos.length + 1}`,
                label: photos.length === 0 ? "Original Resolution Image" : `Original Image ${photos.length + 1}`,
                url: imgUrl,
                ext,
                type: "photo"
              });
            }
          }
        }
        if (ld.video) {
          const vidUrl = typeof ld.video === "string" ? ld.video : ld.video.contentUrl || ld.video.embedUrl;
          if (vidUrl && !formats.some((f) => f.url === vidUrl)) {
            formats.push({
              id: `pin_video_${formats.length + 1}`,
              label: "Pinterest Video (MP4)",
              quality: "HD 720p",
              type: "video",
              ext: "mp4",
              url: vidUrl
            });
          }
        }
      } catch (_) {
      }
    }
    const stateMatches = [
      html.match(/<script [^>]*id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/i),
      html.match(/<script [^>]*id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/i)
    ];
    for (const sm of stateMatches) {
      if (!sm) continue;
      try {
        let findPins2 = function(obj, depth = 0) {
          if (!obj || depth > 8 || typeof obj !== "object") return;
          if (obj.images?.orig?.url || obj.videos?.video_list || obj.story_pin_data) {
            if (obj.title && title === "Pinterest Pin") title = obj.title.trim();
            if (obj.grid_title && title === "Pinterest Pin") title = obj.grid_title.trim();
            if (obj.pinner?.full_name && author === "Pinterest Creator") author = obj.pinner.full_name;
            else if (obj.pinner?.username && author === "Pinterest Creator") author = obj.pinner.username;
            if (obj.images?.orig?.url) {
              const u = obj.images.orig.url;
              if (!photos.some((p) => p.url === u)) {
                photos.push({
                  id: `pin_photo_${photos.length + 1}`,
                  label: photos.length === 0 ? "Original Resolution Image" : `Original Image ${photos.length + 1}`,
                  url: u,
                  ext: u.toLowerCase().endsWith(".png") ? "png" : "jpg",
                  type: "photo"
                });
              }
            }
            if (obj.videos?.video_list) {
              for (const [k, v] of Object.entries(obj.videos.video_list)) {
                if (v?.url && !formats.some((f) => f.url === v.url)) {
                  formats.push({
                    id: `pin_video_${k}`,
                    label: `Pinterest Video (${k.replace(/^V_/, "")})`,
                    quality: k.replace(/^V_/, ""),
                    type: "video",
                    ext: "mp4",
                    url: v.url
                  });
                }
              }
            }
            if (obj.story_pin_data?.pages && Array.isArray(obj.story_pin_data.pages)) {
              for (const page of obj.story_pin_data.pages) {
                const pageImg = page.blocks?.[0]?.image?.images?.orig?.url;
                if (pageImg && !photos.some((p) => p.url === pageImg)) {
                  photos.push({
                    id: `pin_photo_${photos.length + 1}`,
                    label: `Story Photo ${photos.length + 1}`,
                    url: pageImg,
                    ext: pageImg.toLowerCase().endsWith(".png") ? "png" : "jpg",
                    type: "photo"
                  });
                }
              }
            }
          }
          for (const k of Object.keys(obj)) {
            findPins2(obj[k], depth + 1);
          }
        };
        var findPins = findPins2;
        const data = JSON.parse(sm[1]);
        findPins2(data);
      } catch (_) {
      }
    }
    if (title === "Pinterest Pin") {
      const ogTitle = html.match(/<meta [^>]*property="og:title"[^>]*content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitle) {
        title = ogTitle[1].replace(/\s*\|\s*Pinterest$/i, "").trim();
      }
    }
    const ogVideo = html.match(/<meta [^>]*property="og:video(?::secure_url)?"[^>]*content="([^"]+)"/i);
    if (ogVideo && !formats.some((f) => f.url === ogVideo[1])) {
      formats.push({
        id: "pin_video_og",
        label: "Pinterest Video (MP4)",
        quality: "HD 720p",
        type: "video",
        ext: "mp4",
        url: ogVideo[1]
      });
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
          type: "photo"
        });
      }
    }
    const vidMatches = [...html.matchAll(/https:\/\/v\.pinimg\.com\/videos\/[a-zA-Z0-9_\-\/]+\.mp4/gi)].map((m) => m[0]);
    for (const vidUrl of new Set(vidMatches)) {
      if (!formats.some((f) => f.url === vidUrl)) {
        formats.push({
          id: `pin_video_${formats.length + 1}`,
          label: "Pinterest Video (MP4)",
          quality: "HD",
          type: "video",
          ext: "mp4",
          url: vidUrl
        });
      }
    }
    if (photos.length > 0) {
      thumbnail = photos[0].url;
    }
    return {
      platform: "pinterest",
      title,
      author,
      thumbnail,
      duration: 0,
      formats,
      photos,
      hasPdfOption: photos.length > 1
    };
  }
  async function scrapePinterest(url, fetchClient) {
    const targetUrl = (url || "").trim();
    if (!targetUrl) {
      throw new Error("Invalid or empty Pinterest URL.");
    }
    let pinId = extractPinId(targetUrl);
    let html = "";
    try {
      const pageHtml = await fetchClient({
        method: "GET",
        url: targetUrl,
        rawText: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.pinterest.com/"
        }
      }, "Pinterest Direct");
      html = typeof pageHtml === "string" ? pageHtml : JSON.stringify(pageHtml);
      if (html && html.length > 200) {
        if (!pinId) {
          pinId = extractPinId(targetUrl, html);
        }
        const parsed = parsePinterestHtml(html, targetUrl);
        if (parsed && (parsed.formats.length > 0 || parsed.photos.length > 0)) {
          return parsed;
        }
      }
    } catch (directErr) {
      console.warn("[Skyc Scraper] Pinterest Direct HTML fetch error:", directErr);
    }
    if (pinId) {
      try {
        const widgetData = await fetchClient({
          method: "GET",
          url: `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
            Referer: "https://www.pinterest.com/"
          }
        }, "Pinterest Widget API");
        const pin = widgetData?.data?.[0];
        if (pin && pin.images) {
          const photos = [];
          const formats = [];
          const bestImg = pin.images["564x"] || pin.images["237x"] || pin.images["236x"];
          if (bestImg?.url) {
            const origUrl = bestImg.url.replace(/\/\d+x\//, "/originals/");
            photos.push({
              id: "pin_photo_1",
              label: "Original Resolution Image",
              url: origUrl,
              ext: origUrl.toLowerCase().endsWith(".png") ? "png" : "jpg",
              type: "photo"
            });
          }
          if (pin.videos?.video_list) {
            for (const [k, v] of Object.entries(pin.videos.video_list)) {
              if (v?.url && !formats.some((f) => f.url === v.url)) {
                formats.push({
                  id: `pin_video_${k}`,
                  label: `Pinterest Video (${k.replace(/^V_/, "")})`,
                  quality: k.replace(/^V_/, ""),
                  type: "video",
                  ext: "mp4",
                  url: v.url
                });
              }
            }
          }
          if (photos.length > 0 || formats.length > 0) {
            return {
              platform: "pinterest",
              title: pin.description?.trim() || pin.link || "Pinterest Pin",
              author: pin.pinner?.full_name || pin.pinner?.username || "Pinterest Creator",
              thumbnail: photos[0]?.url || "",
              duration: 0,
              formats,
              photos,
              hasPdfOption: photos.length > 1
            };
          }
        }
      } catch (widgetErr) {
        console.warn("[Skyc Scraper] Pinterest Widget API error:", widgetErr);
      }
    }
    try {
      const oembedData = await fetchClient({
        method: "GET",
        url: `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(targetUrl)}`,
        headers: {
          Accept: "application/json",
          Referer: "https://www.pinterest.com/"
        }
      }, "Pinterest oEmbed API");
      if (oembedData?.thumbnail_url) {
        const orig = oembedData.thumbnail_url.replace(/\/\d+x\//, "/originals/");
        return {
          platform: "pinterest",
          title: oembedData.title?.trim() || "Pinterest Pin",
          author: oembedData.author_name || "Pinterest Creator",
          thumbnail: orig,
          duration: 0,
          formats: [],
          photos: [{
            id: "pin_photo_1",
            label: "Original Resolution Image",
            url: orig,
            ext: orig.toLowerCase().endsWith(".png") ? "png" : "jpg",
            type: "photo"
          }],
          hasPdfOption: false
        };
      }
    } catch (oembedErr) {
      console.warn("[Skyc Scraper] Pinterest oEmbed API error:", oembedErr);
    }
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://pindown.app/api/action",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://pindown.app/"
        },
        data: { url: targetUrl }
      }, "PinDown");
      const htmlRes = typeof res === "string" ? res : res?.data || JSON.stringify(res);
      const formats = [];
      const photos = [];
      const videoMatch = htmlRes.match(/href="([^"]*(?:v\.pinimg\.com|\.mp4)[^"]*)"/i);
      if (videoMatch) {
        formats.push({
          id: "pin_video",
          label: "Pinterest Video (MP4)",
          quality: "HD 720p",
          type: "video",
          ext: "mp4",
          url: videoMatch[1]
        });
      }
      const imgMatch = htmlRes.match(/href="([^"]*(?:i\.pinimg\.com\/originals|\.jpg)[^"]*)"/i);
      if (imgMatch) {
        photos.push({
          id: "pin_photo_1",
          label: "Original Resolution Image",
          url: imgMatch[1],
          ext: "jpg",
          type: "photo"
        });
      }
      if (formats.length > 0 || photos.length > 0) {
        return {
          platform: "pinterest",
          title: "Pinterest Pin",
          author: "Pinterest Creator",
          thumbnail: photos[0]?.url || "",
          duration: 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1
        };
      }
    } catch (pindownErr) {
      console.warn("[Skyc Scraper] PinDown fallback error:", pindownErr);
    }
    throw new Error("Pinterest media could not be extracted.");
  }

  // src-scrapers/platforms/facebook.js
  async function scrapeFacebook(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://snapsave.app/action.php?lang=en",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://snapsave.app/"
        },
        data: { url }
      }, "SnapSave");
      const html = typeof res === "string" ? res : res?.data || JSON.stringify(res);
      const formats = [];
      const hdMatch = html.match(/href="([^"]*(?:fbcdn\.net|\.mp4)[^"]*)"[^>]*>[\s\S]*?(?:HD|720p|1080p)/i);
      if (hdMatch) {
        formats.push({
          id: "fb_hd",
          label: "Facebook Video (HD)",
          quality: "HD 720p/1080p",
          type: "video",
          ext: "mp4",
          url: hdMatch[1]
        });
      }
      const sdMatch = html.match(/href="([^"]*(?:fbcdn\.net|\.mp4)[^"]*)"/i);
      if (sdMatch && (!hdMatch || sdMatch[1] !== hdMatch[1])) {
        formats.push({
          id: "fb_sd",
          label: "Facebook Video (SD)",
          quality: "Standard SD",
          type: "video",
          ext: "mp4",
          url: sdMatch[1]
        });
      }
      if (formats.length > 0) {
        return {
          platform: "facebook",
          title: "Facebook Video",
          author: "Facebook Page / User",
          thumbnail: "",
          duration: 0,
          formats,
          photos: [],
          hasPdfOption: false
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] SnapSave Facebook error:", err);
    }
    throw new Error("Facebook video could not be extracted.");
  }

  // src-scrapers/platforms/threads.js
  async function scrapeThreads(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://threadsphotodownloader.com/api/threads",
        headers: {
          "Content-Type": "application/json"
        },
        data: { url }
      }, "ThreadsDownloader");
      if (res?.media) {
        const formats = [];
        const photos = [];
        res.media.forEach((item, idx) => {
          if (item.type === "video") {
            formats.push({
              id: `threads_video_${idx + 1}`,
              label: `Threads Video ${idx + 1}`,
              quality: "HD",
              type: "video",
              ext: "mp4",
              url: item.url
            });
          } else {
            photos.push({
              id: `threads_photo_${idx + 1}`,
              label: `Photo ${idx + 1}`,
              url: item.url,
              ext: "jpg",
              type: "photo"
            });
          }
        });
        return {
          platform: "threads",
          title: res.caption || "Threads Post",
          author: res.user?.username || "Threads User",
          authorAvatar: res.user?.profile_pic || "",
          thumbnail: photos[0]?.url || "",
          duration: 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] Threads error:", err);
    }
    throw new Error("Threads media could not be extracted.");
  }

  // src-scrapers/platforms/bandcamp.js
  async function scrapeBandcamp(url, fetchClient) {
    try {
      const html = await fetchClient({
        method: "GET",
        url,
        headers: {
          Accept: "text/html"
        }
      }, "Bandcamp");
      const htmlStr = typeof html === "string" ? html : JSON.stringify(html);
      const tralbumMatch = htmlStr.match(/data-tralbum="([^"]+)"/i);
      if (tralbumMatch) {
        const tralbum = JSON.parse(tralbumMatch[1].replace(/&quot;/g, '"'));
        const track = tralbum.trackinfo?.[0];
        const audioUrl = track?.file?.["mp3-128"];
        return {
          platform: "bandcamp",
          title: track?.title || "Bandcamp Track",
          author: tralbum.artist || "Bandcamp Artist",
          thumbnail: tralbum.art_id ? `https://f4.bcbits.com/img/a${tralbum.art_id}_10.jpg` : "",
          duration: track?.duration || 0,
          formats: audioUrl ? [
            {
              id: "bandcamp_mp3",
              label: "Original Audio (MP3 128kbps)",
              quality: "128kbps",
              type: "audio",
              ext: "mp3",
              url: audioUrl
            }
          ] : [],
          photos: [],
          hasPdfOption: false
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] Bandcamp error:", err);
    }
    throw new Error("Bandcamp media could not be extracted.");
  }

  // src-scrapers/platforms/pixiv.js
  async function scrapePixiv(url, fetchClient) {
    const illustIdMatch = url.match(/artworks\/(\d+)/i) || url.match(/illust_id=(\d+)/i);
    const illustId = illustIdMatch ? illustIdMatch[1] : null;
    if (illustId) {
      try {
        const res = await fetchClient({
          method: "GET",
          url: `https://www.pixiv.net/ajax/illust/${illustId}`,
          headers: {
            Referer: "https://www.pixiv.net/",
            Accept: "application/json"
          }
        }, "Pixiv");
        if (res?.body) {
          const b = res.body;
          const photos = [];
          if (b.pageCount > 1) {
            const pagesRes = await fetchClient({
              method: "GET",
              url: `https://www.pixiv.net/ajax/illust/${illustId}/pages`,
              headers: { Referer: "https://www.pixiv.net/" }
            }, "PixivPages");
            if (Array.isArray(pagesRes?.body)) {
              pagesRes.body.forEach((p, idx) => {
                photos.push({
                  id: `pixiv_p${idx + 1}`,
                  label: `Page ${idx + 1} (Original)`,
                  url: p.urls?.original || p.urls?.regular,
                  ext: "jpg",
                  type: "photo"
                });
              });
            }
          } else {
            photos.push({
              id: "pixiv_original",
              label: "Original Full Resolution",
              url: b.urls?.original || b.urls?.regular,
              ext: "jpg",
              type: "photo"
            });
          }
          return {
            platform: "pixiv",
            title: b.title || "Pixiv Artwork",
            author: b.userName || "Pixiv Artist",
            authorAvatar: "",
            thumbnail: b.urls?.small || photos[0]?.url || "",
            duration: 0,
            formats: [],
            photos,
            hasPdfOption: photos.length > 1
          };
        }
      } catch (err) {
        console.warn("[Skyc Scraper] Pixiv error:", err);
      }
    }
    throw new Error("Pixiv artwork could not be extracted.");
  }

  // src-scrapers/platforms/bilibili.js
  async function scrapeBilibili(url, fetchClient) {
    const bvidMatch = url.match(/(BV[a-zA-Z0-9]+)/i);
    const bvid = bvidMatch ? bvidMatch[1] : null;
    if (bvid) {
      try {
        const res = await fetchClient({
          method: "GET",
          url: `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
          headers: { Referer: "https://www.bilibili.com/" }
        }, "Bilibili");
        if (res?.data) {
          const d = res.data;
          const cid = d.cid;
          return {
            platform: "bilibili",
            title: d.title || "Bilibili Video",
            author: d.owner?.name || "Bilibili Creator",
            thumbnail: d.pic || "",
            duration: d.duration || 0,
            formats: [
              {
                id: "bili_1080p",
                label: "Bilibili Video (High Definition)",
                quality: "HD",
                type: "video",
                ext: "mp4",
                url: `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=64&type=&otype=json`
              }
            ],
            photos: [],
            hasPdfOption: false
          };
        }
      } catch (err) {
        console.warn("[Skyc Scraper] Bilibili error:", err);
      }
    }
    throw new Error("Bilibili video could not be extracted.");
  }

  // src-scrapers/platforms/douyin.js
  async function scrapeDouyin(url, fetchClient) {
    try {
      const res = await scrapeTikTok(url, fetchClient);
      res.platform = "douyin";
      return res;
    } catch (err) {
      console.warn("[Skyc Scraper] Douyin fallback attempt:", err);
      throw new Error("Douyin video could not be extracted.");
    }
  }

  // src-scrapers/platforms/rednote.js
  async function scrapeRedNote(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://dlpanda.com/id/rednote",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://dlpanda.com/"
        },
        data: { url }
      }, "DLPandaRedNote");
      const html = typeof res === "string" ? res : res?.data || JSON.stringify(res);
      const formats = [];
      const photos = [];
      const videoMatch = html.match(/href="([^"]*(?:sns-video|\.mp4)[^"]*)"/i);
      if (videoMatch) {
        formats.push({
          id: "rednote_video",
          label: "RedNote Video (No Watermark)",
          quality: "HD",
          type: "video",
          ext: "mp4",
          url: videoMatch[1]
        });
      }
      const imgMatches = [...html.matchAll(/<img[^>]+src="([^">]+(?:sns-webpic|ci\.xiaohongshu\.com)[^">]*)"/gi)];
      for (const im of imgMatches) {
        photos.push({
          id: `rednote_p${photos.length + 1}`,
          label: `Photo ${photos.length + 1}`,
          url: im[1],
          ext: "jpg",
          type: "photo"
        });
      }
      if (formats.length > 0 || photos.length > 0) {
        return {
          platform: "rednote",
          title: "RedNote Note",
          author: "RedNote Creator",
          thumbnail: photos[0]?.url || "",
          duration: 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] RedNote error:", err);
    }
    throw new Error("RedNote post could not be extracted.");
  }

  // src-scrapers/platforms/reddit.js
  async function scrapeReddit(url, fetchClient) {
    try {
      const cleanUrl = url.split("?")[0].replace(/\/+$/, "") + ".json";
      const res = await fetchClient({
        method: "GET",
        url: cleanUrl,
        headers: {
          Accept: "application/json"
        }
      }, "RedditAPI");
      if (Array.isArray(res) && res[0]?.data?.children?.[0]?.data) {
        const post = res[0].data.children[0].data;
        const formats = [];
        const photos = [];
        if (post.secure_media?.reddit_video?.fallback_url || post.media?.reddit_video?.fallback_url) {
          const vUrl = (post.secure_media || post.media).reddit_video.fallback_url;
          formats.push({
            id: "reddit_video",
            label: "Reddit Video (Audio & Video)",
            quality: `${(post.secure_media || post.media).reddit_video.height || "720"}p`,
            type: "video",
            ext: "mp4",
            url: vUrl
          });
        }
        if (post.gallery_data && post.media_metadata) {
          post.gallery_data.items.forEach((item, idx) => {
            const meta = post.media_metadata[item.media_id];
            if (meta?.s?.u) {
              photos.push({
                id: `reddit_p${idx + 1}`,
                label: `Photo ${idx + 1}`,
                url: meta.s.u.replace(/&amp;/g, "&"),
                ext: "jpg",
                type: "photo"
              });
            }
          });
        } else if (post.url && post.url.match(/\.(jpg|jpeg|png|webp)$/i)) {
          photos.push({
            id: "reddit_image",
            label: "Full Resolution Image",
            url: post.url,
            ext: "jpg",
            type: "photo"
          });
        }
        return {
          platform: "reddit",
          title: post.title || "Reddit Post",
          author: `u/${post.author || "reddit_user"} in r/${post.subreddit || "all"}`,
          thumbnail: post.thumbnail?.startsWith("http") ? post.thumbnail : photos[0]?.url || "",
          duration: 0,
          formats,
          photos,
          hasPdfOption: photos.length > 1
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] Reddit error:", err);
    }
    throw new Error("Reddit media could not be extracted.");
  }

  // src-scrapers/platforms/terabox.js
  async function scrapeTeraBox(url, fetchClient) {
    try {
      const res = await fetchClient({
        method: "POST",
        url: "https://terabox-downloader.com/api/get-info",
        headers: {
          "Content-Type": "application/json"
        },
        data: { url }
      }, "TeraBoxAPI");
      if (res?.download_url || res?.direct_link) {
        const dl = res.download_url || res.direct_link;
        return {
          platform: "terabox",
          title: res.filename || "TeraBox File",
          author: "TeraBox Shared Storage",
          thumbnail: res.thumb || "",
          duration: 0,
          formats: [
            {
              id: "terabox_direct",
              label: `Direct Download (${res.size || "Original"})`,
              quality: res.size || "Original",
              type: "video",
              ext: res.filename?.split(".").pop() || "mp4",
              url: dl
            }
          ],
          photos: [],
          hasPdfOption: false
        };
      }
    } catch (err) {
      console.warn("[Skyc Scraper] TeraBox error:", err);
    }
    throw new Error("TeraBox link could not be resolved.");
  }

  // src-scrapers/index.js
  var SCRAPER_VERSION = 2;
  var PLATFORM_REGISTRY = {
    tiktok: scrapeTikTok,
    douyin: scrapeDouyin,
    instagram: scrapeInstagram,
    youtube: scrapeYouTube,
    twitter: scrapeTwitter,
    spotify: scrapeSpotify,
    applemusic: scrapeAppleMusic,
    pinterest: scrapePinterest,
    facebook: scrapeFacebook,
    threads: scrapeThreads,
    bandcamp: scrapeBandcamp,
    pixiv: scrapePixiv,
    bilibili: scrapeBilibili,
    rednote: scrapeRedNote,
    reddit: scrapeReddit,
    terabox: scrapeTeraBox
  };
  async function extractMedia(url, fetchClient) {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid or empty URL provided.");
    }
    const platform = detectPlatform(url);
    const handler = PLATFORM_REGISTRY[platform];
    if (!handler) {
      throw new Error(`Platform '${platform}' is not supported yet.`);
    }
    return await handler(url, fetchClient);
  }
  return __toCommonJS(index_exports);
})();

const __ZennxScraperEngine = __SkycScraperEngine;
if (typeof module !== 'undefined' && module.exports) { module.exports = __SkycScraperEngine; }
if (typeof window !== 'undefined') { window.__SkycScraperEngine = __SkycScraperEngine; window.__ZennxScraperEngine = __SkycScraperEngine; }
if (typeof globalThis !== 'undefined') { globalThis.__SkycScraperEngine = __SkycScraperEngine; globalThis.__ZennxScraperEngine = __SkycScraperEngine; }

