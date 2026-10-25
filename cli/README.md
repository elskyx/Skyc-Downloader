# @elskyx/skyc

Universal client-side media downloader CLI with Mori-inspired aesthetic. Save watermark-free videos, lossless FLAC & MP3 music, and photos from 16+ platforms.

## Installation

Run directly with `npx`:
```bash
npx @elskyx/skyc
```

Or install globally:
```bash
npm install -g @elskyx/skyc
skyc
```

## Usage

```bash
# Interactive REPL
skyc

# Direct URL download
skyc https://www.tiktok.com/@user/video/123456789

# Extract MP3 / FLAC Audio Only
skyc https://youtu.be/dQw4w9WgXcQ -a

# Compile Photo Album into PDF
skyc https://www.tiktok.com/@user/video/123456789 -p

# Pick best format automatically
skyc <URL> -y
```

## Supported Platforms

TikTok, Instagram, YouTube, Twitter/X, Spotify, Apple Music, Pinterest, Facebook, Threads, Bandcamp, Pixiv, Bilibili, Douyin, RedNote, Reddit, and TeraBox.
