<p align="center">
  <img src=".assets/header.svg" alt="MARPILAH / Terra Zero Peta Bank Sampah" width="100%">
</p>

# MARPILAH — Terra Zero Peta Bank Sampah

Halaman web interaktif untuk edukasi dan kampanye pengelolaan sampah: pengenalan/pemilahan sampah, narasi infrastruktur, pengalaman peta bank sampah, visualisasi dampak, dan ajakan aksi pemulihan. Halaman ini memadukan animasi scroll, media/video, visual 3D, dan peta interaktif.

- **`index.html`** — struktur utama/mount point hasil pemisahan (digunakan untuk menjalankan halaman).
- **`terra_zero_peta_bank_sampah(1).html`** — artefak sumber satu berkas (single-file HTML) sebelum pemisahan, dipertahankan sebagai referensi.

> Catatan penamaan: identitas visual pada halaman menggunakan nama **MARPILAH**, sedangkan artefak sumber bernama `terra_zero_peta_bank_sampah(1).html`.

## Perubahan dari framework ke file HTML tunggal (dan pemisahan aset)

Repositori ini sebelumnya berisi implementasi berbasis **React + TypeScript + Vite** (lihat jejak seperti `package.json`, `vite.config.ts`, `src/`, `tests/`, dan perintah `npm`). Implementasi dikonsolidasikan menjadi **satu file HTML mandiri** (`terra_zero_peta_bank_sampah(1).html`) yang memuat struktur, gaya, skrip, dan sebagian data secara inline serta memanfaatkan dependensi dari CDN.

Selanjutnya, file tunggal tersebut telah **dipisah** menjadi `index.html` dan aset eksternal (`assets/`) untuk memudahkan penyimpanan, peninjauan, dan pengelolaan kode (lihat struktur di bawah).

Tujuan perubahan ini:
- **Distribusi sederhana**: artefak sumber satu berkas tetap tersedia; hasil pemisahan lebih mudah dikelola.
- **Prototipe/presentasi cepat**: tetap tanpa proses build aplikasi (cukup server statis/browser).
- **Konsolidasi pengalaman**: seluruh alur cerita/animasi berada dalam satu dokumen utama.

Trade-off: artefak sumber besar (~442 KB) dan pengalaman tetap berat di runtime (animasi/WebGL/peta), sehingga performa perlu ditangani terpisah dari sekadar pemisahan file.

## Struktur file (hasil pemisahan)

Pemisahan dari `terra_zero_peta_bank_sampah(1).html` telah diterapkan dengan struktur berikut:

```text
.
├── index.html                  # Struktur utama & mount point (menautkan aset terpisah)
├── terra_zero_peta_bank_sampah(1).html  # Artefak sumber satu berkas (referensi)
└── assets/
    ├── css/
    │   └── main.css            # Ekstraksi seluruh blok <style> inline
    └── js/
        ├── main.js             # Logika UI, animasi scroll, GSAP/Lenis (interaksi umum)
        ├── bin-hint.js         # Posisi hint interaksi pada hero/bin scene
        ├── map-controls.js     # Kontrol/toggle interaksi peta (sisi parent iframe)
        ├── desktop-clock.js    # Jam/tanggal pada tampilan desktop MacBook
        └── case-dialog.js      # Dialog detail kasus & dampak
```

Catatan hasil pemisahan:
- **Modul Three.js tetap inline** setelah `importmap` agar dapat berjalan saat `index.html` dibuka langsung maupun lewat HTTP; browser memblokir modul JavaScript lokal eksternal pada `file://`.
- **Urutan eksekusi skrip lain dipertahankan** untuk menjaga ketergantungan global (`window`, `lenis`, dsb.) dan urutan inisialisasi.
- **Peta tetap dalam `iframe srcdoc`**: konten peta beserta data lokasi besar (`GEO`) masih tertanam di dalam `srcdoc` pada `index.html` agar perilaku dan komunikasi parent–iframe tetap aman; karena itu `assets/css/map.css`, `assets/js/map.js`, dan `assets/data/geo.js` (opsional pada rencana) **belum** diekstrak.
- **Cache & ukuran transfer**: pemisahan membantu cache HTTP per aset saat disajikan lewat server (bukan `file://`).
- **Bukan perbaikan performa otomatis**: lag/berat saat scroll terutama dipengaruhi desain animasi dan beban render runtime (GSAP pin/scrub, WebGL, peta), sehingga optimasi tetap diperlukan terpisah.

## Teknologi & dependensi

Halaman ini berdiri tanpa bundler/framework JS aplikasi, dengan dependensi utama dimuat via CDN/script eksternal:

- **Tailwind CSS (CDN)** — utilitas styling.
- **Google Fonts** — Inter, Plus Jakarta Sans, Cormorant Garamond.
- **GSAP + ScrollTrigger** — animasi berbasis scroll/pin/scrub.
- **Lenis** — smooth scrolling.
- **Three.js / WebGL** — visual 3D pada showcase MacBook.
- **MapLibre GL JS** — peta bank sampah (di dalam pengalaman peta/iframe).
- **Aset lokal & eksternal** — gambar eksternal, serta referensi aset lokal seperti `media/*`, `scene.css`, dan `scene.js` (lihat catatan aset).

## Penjelasan setiap bagian (section)

Urutan utama konten dalam `index.html` (setara dengan artefak sumber `terra_zero_peta_bank_sampah(1).html`):

1. **Preloader (`#preloader-overlay`)**
   - Overlay awal dengan animasi grid garis dan efek reveal sebelum konten utama tampil penuh.

2. **Header & navigasi (`#site-header`, `#mobile-nav-drawer`)**
   - Header tetap (fixed) dengan brand **Marpilah**, navigasi desktop dan drawer navigasi mobile.
   - Tautan jangkar ke bagian utama: **SAMPAH** (`#infrastruktur`), **Teknologi** (`#tentang`), **Peta** (`#krisis-hero`), **Dampak** (`#dampak`), **Pemulihan** (`#seleksi`), serta tombol **Aksi Nyata**.

3. **Section 1 — Hero interaktif / Bin Scene (`#top`)**
   - Area hero dengan poster dan rangkaian video (`media/leaves.mp4`, transisi `red/yellow/green` dan `*-return`) untuk interaksi pemilihan tong sampah.
   - Hotspot tombol tong, kontrol kembali/jeda, teks petunjuk/status, dan skrip posisi hint.
   - Memuat `scene.css` dan `scene.js` (aset lokal) untuk perilaku/visual bagian ini.

4. **Section 2 — Narasi infrastruktur / Cipher Stage (`#infrastruktur`, label nav: SAMPAH)**
   - Rangkaian storytelling berbasis scroll (pin) bertahap: pengertian sampah, ajakan membuang pada tempatnya, hingga visual full-bleed dengan pesan pemulihan.
   - Menampilkan teks penjelas, tautan ke bagian teknologi, metrik/kapasitas, dan transisi gambar latar.

5. **Section 3 — Teknologi & Layar / 3D MacBook Showcase (`#tentang`)**
   - Showcase laptop 3D berbasis canvas/WebGL dengan perilaku scroll-locked/portal.
   - Memuat tampilan "desktop" Marpilah (wallpaper, sapaan, identitas, aplikasi seperti **MAPS** dan **GAME**, status) sebagai pintu masuk ke pengalaman peta.

6. **Section 4 — Peta Bank Sampah (`#krisis-hero`, label nav: Peta)**
   - Bagian portal peta lokasi bank sampah (MapLibre GL JS) dengan kontrol/aksi navigasi peta (`#map-actions`).
   - Implementasi peta dirender dalam konteks tersemat (iframe/srcdoc) beserta data lokasi yang digunakan peta.

7. **Section 5 — Kasus & Dampak (`#dampak`)**
   - Visualisasi dampak dengan latar foto crossfade, elemen statistik/odometer, dan grid 8 kartu kasus.
   - Kartu kasus membuka dialog/detail berisi ringkasan, dampak, tindakan yang dapat dilakukan, dan tautan sumber.

8. **Section 6 — Layanan Pemulihan / Audit Limbah & Seleksi Material (`#seleksi`, label nav: Pemulihan)**
   - Bagian editorial/slider layanan pemulihan dengan proses **PILAH · OLAH · PULIHKAN**.
   - Menyajikan judul, deskripsi, penghitung slide, serta navigasi sebelumnya/berikutnya.

## Cara menjalankan kode

Karena artefak utama adalah halaman HTML statis, tidak diperlukan proses build untuk menjalankannya.

### 1. Jalankan dengan server statis lokal (disarankan)
Menjalankan lewat server lokal membantu konsistensi pemuatan aset/path (CSS/JS terpisah), cache, dan perilaku browser:

```bash
# dari direktori proyek
python3 -m http.server 8000
```

Lalu buka di browser:

```text
http://localhost:8000/index.html
```

Alternatif lain (jika tersedia):

```bash
npx serve .
```
kemudian buka `index.html` dari URL yang ditampilkan.

### 2. Buka langsung (cepat, terbatas)
- Anda dapat membuka `index.html` atau artefak sumber `terra_zero_peta_bank_sampah(1).html` langsung di browser (double-click atau `Open File`).
- Untuk `index.html`, beberapa browser dapat membatasi pemuatan aset lokal saat dibuka via `file://`; jika tampilan/skrip tidak termuat sempurna, gunakan server statis lokal.

### Prasyarat & catatan saat menjalankan
- **Koneksi internet**: diperlukan untuk memuat dependensi CDN (Tailwind, GSAP/ScrollTrigger, Lenis, Three.js, MapLibre, Google Fonts), tile peta, dan sebagian gambar eksternal.
- **Aset lokal**: beberapa referensi menunjuk ke file/folder lokal seperti `scene.css`, `scene.js`, dan `media/` (poster/video hero). Jika aset tersebut tidak tersedia di lokasi yang diharapkan, bagian terkait (terutama hero/bin scene) bisa tidak tampil atau tidak berfungsi penuh.
- **Performa**: halaman memuat animasi scroll, WebGL, dan peta; performa dapat bervariasi antar perangkat/browser, terutama pada perangkat mobile atau spesifikasi rendah.

## Catatan untuk pengembangan lanjutan

- **Validasi perilaku**: setelah pemisahan, uji urutan script, path aset, dan perilaku peta/iframe (terutama interaksi `srcdoc`, toggle peta, animasi scroll, dan scene 3D).
- **Ekstraksi lanjutan (opsional)**: peta di dalam `iframe srcdoc` dapat dipindah ke file HTML/JS/data terpisah (`map`/`geo`) bila diperlukan, dengan memperhatikan path aset, komunikasi antar frame, dan batasan CORS/sandbox.
- **Optimasi performa**: pengurangan beban animasi/WebGL, lazy-load/pause saat offscreen, dan penyesuaian DPR/efek sebaiknya dilakukan terpisah dari pemisahan struktur file.
- **Aset lokal**: referensi `scene.css`, `scene.js`, dan `media/*` perlu tersedia di path yang sesuai agar bagian hero/bin scene berfungsi penuh.
- **Artefak historis**: `terra_zero_peta_bank_sampah(1).html` adalah sumber satu berkas; artefak/konfigurasi React+Vite lama (jika masih ada) adalah konteks historis kecuali ada kebutuhan untuk menghidupkannya kembali.

## Lisensi

Proyek ini menggunakan Apache License 2.0. Lihat [LICENSE](./LICENSE) untuk ketentuannya.
