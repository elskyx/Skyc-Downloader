<p align="center">
  <img src="public/logo.svg" width="112" height="112" alt="Zennx Official Logo" />
</p>

<h1 align="center">Zennx Downloader</h1>

<p align="center">
  <strong>Save anything, From anywhere.</strong>
</p>

<p align="center">
  <em>Universal, Zero-Cloud, Client-Side Media Downloader for Android, Windows Desktop & CLI</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.8.67-D97757?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Windows%20%7C%20CLI-191918?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Theme-Mori%20Inspired-F4F3EE?style=flat-square&labelColor=191918&color=1A1917" alt="Theme">
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square" alt="License">
</p>

Simpan dan unduh video tanpa tanda air (*no watermark*), foto resolusi tinggi, serta musik MP3 dan Lossless FLAC dari 16+ platform langsung dari perangkat **Android**, **Windows Desktop**, maupun **Terminal CLI** Anda. Dirancang dengan antarmuka elegan bergaya **coflyn/Mori**, tanpa akun, tanpa iklan, dan berjalan 100% di sisi klien (*client-side*).

---

## 🚀 Cara Penggunaan

Menyimpan media dengan **Zennx** hanya membutuhkan tiga langkah sederhana:

1. **Salin Tautan (*Copy Link*)**: Salin tautan video, foto, atau musik dari aplikasi favorit Anda (TikTok, Instagram, YouTube, Spotify, X/Twitter, dll.).
2. **Buka Zennx**: Zennx secara otomatis mendeteksi tautan dari *clipboard* Anda dan langsung menganalisisnya. Pada perangkat Android, Anda juga cukup menekan tombol **Share (Bagikan)** di aplikasi mana pun lalu memilih **Zennx** untuk mengunduh lewat *overlay* cepat tanpa berpindah aplikasi.
3. **Unduh (*Download*)**: Pilih kualitas yang diinginkan (Video HD tanpa *watermark*, Audio Lossless FLAC, audio MP3 320kbps, galeri foto, atau gabungkan ke PDF) lalu ketuk **Download / Analyze**. Media langsung tersimpan rapi di folder perangkat Anda:
   - **Windows**: `Videos\Zennx` (Video), `Music\Zennx` (Audio/FLAC/MP3), `Pictures\Zennx` (Foto/PDF). Anda juga dapat membuka folder langsung dari menu Riwayat.
   - **Android**: `Internal Storage/Movies/Zennx`, `Music/Zennx`, atau `Pictures/Zennx` (langsung terindeks di Galeri / MediaStore).

---

## 📥 Paket Instalasi & Unduhan

Seluruh paket instalasi siap pakai tersedia di halaman **GitHub Releases** dan **npm**:

| Platform | Paket Tersedia | Metode Instalasi |
| :--- | :--- | :--- |
| **Android (Universal / x64)** | [**`Zennx-v1.8.67.apk`**](https://github.com/elskyx/Zennx-Downloader/releases/download/v1.8.67/Zennx-v1.8.67.apk) | [Unduh Langsung APK](https://github.com/elskyx/Zennx-Downloader/releases/download/v1.8.67/Zennx-v1.8.67.apk) *(Sideload)* |
| **Windows Desktop (64-bit x64)** | [**`Zennx_1.8.67_x64-setup.exe`**](https://github.com/elskyx/Zennx-Downloader/releases/download/v1.8.67/Zennx_1.8.67_x64-setup.exe) / [**`.msi`**](https://github.com/elskyx/Zennx-Downloader/releases/download/v1.8.67/Zennx_1.8.67_x64_en-US.msi) | [Unduh Installer .exe](https://github.com/elskyx/Zennx-Downloader/releases/download/v1.8.67/Zennx_1.8.67_x64-setup.exe) *(NSIS / WiX)* |
| **Windows Desktop (32-bit x86)** | [**`Zennx_1.8.67_x86-setup.exe`**](https://github.com/elskyx/Zennx-Downloader/releases/tag/v1.8.67) | Tersedia di [GitHub Releases](https://github.com/elskyx/Zennx-Downloader/releases/tag/v1.8.67) |
| **CLI (Terminal)** | [`npx @elskyx/zennx`](https://www.npmjs.com/package/@elskyx/zennx) | Jalankan via Node.js / npm (`zennx <URL>`) |

---

## 💻 Zennx CLI (Terminal)

Lebih suka menggunakan baris perintah di Command Prompt, PowerShell, atau Linux? **Zennx** tersedia sebagai paket terminal interaktif yang ditenagai oleh `@clack/prompts`:

```bash
# Jalankan interaktif tanpa instalasi global
npx @elskyx/zennx

# Unduh tautan secara langsung
npx @elskyx/zennx <URL>

# Unduh aliran audio saja (MP3 / FLAC)
npx @elskyx/zennx <URL> -a

# Gabungkan album foto langsung menjadi dokumen PDF
npx @elskyx/zennx <URL> -p
```

Atau instal secara global:

```bash
npm install -g @elskyx/zennx
zennx
```

---

## ✨ Fitur Utama

- **Dukungan 16+ Platform**: Unduh media bebas tanda air dari TikTok, Instagram, YouTube, Twitter/X, Spotify, Apple Music, Pinterest, Facebook, Threads, Bandcamp, Pixiv, Bilibili, Douyin, RedNote (Xiaohongshu), Reddit, dan TeraBox.
- **Desain Elegan Terinspirasi Mori**: Antarmuka bersih, responsif, dan nyaman di mata dengan palet *Warm Linen* (`#FFFBF2` / `#F7F3E9`), *Deep Obsidian* (`#141416` / `#1E1E22`), dan aksen kontras tinggi (`#1A1917` / `#F8F8FA`).
- **Pembaruan *Scraper* *Over-The-Air* (OTA)**: Saat sebuah platform mengubah struktur API-nya, Zennx Downloader memperbarui bundel *scraper* (`bundle.js`) secara otomatis di latar belakang dari GitHub `elskyx/Zennx-Downloader` tanpa perlu menginstal ulang APK atau `.exe`.
- **Unduhan Paralel Berkecepatan Tinggi**: Mengunduh *playlist* musik, album, dan galeri foto *carousel* secara bersamaan hingga 5 *worker thread* paralel.
- **Menu *Quick Save* Android**: Unduh video langsung dari menu *Share* Android melalui tampilan *overlay* ringan tanpa meninggalkan aplikasi yang sedang dibuka.
- **Konversi Foto ke PDF Instan**: Gabungkan postingan multi-foto menjadi satu dokumen PDF menggunakan `pdf-lib` untuk dibaca secara luring.
- **Arsitektur Klien Terdesentralisasi (Zero Zennx Backend)**: Zennx tidak memiliki server backend, database terpusat, pelacak analitik, maupun server proxy perantara milik Zennx. Seluruh permintaan metadata dan pengunduhan stream dieksekusi langsung dari perangkat klien Anda ke endpoint platform atau node resolver terdesentralisasi (seperti instance Cobalt v10 / YtMp3 / Piped). Anda juga dapat menentukan alamat instance Cobalt/resolver privat milik Anda sendiri di menu **Settings** untuk kedaulatan data penuh.

---

## 🛠️ Tumpukan Teknologi & Kompilasi dari Sumber (*Build from Source*)

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Modular (Mori Aesthetic), `pdf-lib`
- **Android Runtime & Native HTTP**: CapacitorJS + Java + `OkHttp` (`DownloadForegroundService` & `ShareActivity`)
- **Windows Desktop Runtime & Native HTTP**: Tauri v2 (Rust) + `Reqwest`
- **Scraper Engine & Bundler**: `Axios`, `Cheerio`, & `esbuild`

### Langkah Kompilasi Lokal

1. Kloning repositori dan instal dependensi:
   ```bash
   git clone https://github.com/elskyx/Zennx-Downloader.git
   cd Zennx-Downloader
   npm install
   ```
2. Kompilasi bundel *scraper* beserta manifest SHA256:
   ```bash
   npm run build:scrapers
   ```
3. Jalankan atau bangun untuk platform target:
   - **Android (Android Studio / Gradle)**: `npm run android:dev` atau `npm run android:apk`
   - **Windows Desktop (Tauri v2)**: `npm run windows:dev` atau `npm run windows:build`

---

## 📄 Lisensi & Atribusi

Proyek `elskyx/Zennx-Downloader` merupakan perangkat lunak sumber terbuka berlisensi **GNU General Public License v3.0 (GPL-3.0)** yang mengadaptasi arsitektur dan gaya antarmuka dari [coflyn/Mori](https://github.com/coflyn/Mori).
