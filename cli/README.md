# @elskyx/zennx

Universal client-side media downloader CLI with Mori-inspired aesthetic. Save watermark-free videos, lossless FLAC & MP3 music, and photos from 16+ platforms.

## Installation

Run directly with `npx`:
```bash
npx @elskyx/zennx
```

Or install globally:
```bash
npm install -g @elskyx/zennx
zennx
```

## Usage

```bash
# Interactive REPL
zennx

# Direct URL download
zennx https://www.tiktok.com/@user/video/123456789

# Extract MP3 / FLAC Audio Only
zennx https://youtu.be/dQw4w9WgXcQ -a

# Compile Photo Album into PDF
zennx https://www.tiktok.com/@user/video/123456789 -p

# Pick best format automatically
zennx <URL> -y
```

## Supported Platforms

TikTok, Instagram, YouTube, Twitter/X, Spotify, Apple Music, Pinterest, Facebook, Threads, Bandcamp, Pixiv, Bilibili, Douyin, RedNote, Reddit, and TeraBox.
