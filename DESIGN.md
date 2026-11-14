# MARPILAH — Design System

## Identitas Visual

MARPILAH adalah aplikasi edukasi pemilahan sampah berbasis warna tong.
Palette diambil dari lingkungan sampah dan organik, bukan dari default AI gradient.

### Warna Utama

| Token | Nilai | Digunakan untuk |
|-------|-------|-----------------|
| `--color-bg` | `#242722` | Background utama, navbar, footer, scene |
| `--color-text` | `#fffaf1` | Teks utama (krim hangat) |
| `--color-text-muted` | `#c9c5b8` | Teks sekunder, deskripsi |
| `--color-text-dim` | `#a7a596` | Teks redu, label non-aktif |
| `--color-accent` | `#f9d476` | Aksen utama: CTA, titik bin aktif, brand dot |
| `--color-accent-hover` | `#ffdf8d` | Hover CTA |
| `--color-bin-green` | `#3e9b4f` | Tong organik |
| `--color-bin-blue` | `#2f6fe0` | Tong anorganik |
| `--color-bin-gray` | `#8b949c` | Tong residu |

### Radius

| Token | Nilai | Digunakan untuk |
|-------|-------|-----------------|
| `--radius-sm` | `6px` | kbd, chip kecil |
| `--radius-md` | `10px` | link navbar, status |
| `--radius-lg` | `14px` | CTA utama |
| `--radius-xl` | `26px` | swatch panel edukasi |
| `--radius-pill` | `999px` | Dilarang digunakan sebagai default |

### Tipografi

- Font utama: Inter (fallback system-ui → Arial)
- Skala: `text-xs` (12px) hingga `text-7xl` (84px)
- Line-height: tight (1.02) untuk judul, relaxed (1.65) untuk paragraf

### Aturan Penggunaan (berdasarkan antislop-ui)

1. **Aksen digunakan hanya di momen kunci** — `var(--color-accent)` hanya untuk CTA utama, titik aktif, dan brand dot. Tidak menyebar ke semua elemen.
2. **Glass maksimum 1-2 elemen** — backdrop-filter hanya pada navbar saat scrolled, bukan di seluruh kartu.
3. **Radius tidak seragam** — setiap radius memiliki tujuan spesifik, tidak semua pill-shaped.
4. **Shadow hanya elevation marker** — elemen yang perlu terangkat di atas halaman saja.
5. **Gelombang/gradasi default dilarang** — tidak ada biru-unggu, neon, atau orb blur sebagai background default.

### Kontras & Aksesibilitas

- Semua elemen interaktif memiliki fokus outline terlihat (`--color-border-focus-outline`).
- Target sentuh minimal 44px.
- `prefers-reduced-motion` dihormati di seluruh komponen.
- Warna titik bin menunjukkan state nyata (organik/anorganik/residu), bukan hiasan dekoratif.