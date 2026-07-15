# Cara Menjadikan "Notepad Sharing" sebagai PWA

Kamu tidak perlu menulis ulang HTML kamu. Cukup taruh 3 file baru ini
**satu folder** dengan `index.html` kamu:

```
/ (root situs kamu)
├── index.html        ← file HTML kamu yang sudah ada
├── manifest.json      ← baru
├── sw.js               ← baru
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-192.png
    └── icon-maskable-512.png
```

## 1. Tambahkan ini di dalam `<head>...</head>` HTML kamu

Taruh persis setelah baris `<meta name="viewport" ...>`:

```html
<link rel="manifest" href="manifest.json" />
<meta name="theme-color" content="#4f5cff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#090d1c" media="(prefers-color-scheme: dark)" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Notepad" />
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png" />
<link rel="apple-touch-icon" href="icons/icon-192.png" />
```

## 2. Tambahkan ini persis sebelum tag penutup `</body>`

(setelah tag `<script>...</script>` yang berisi kode Alpine kamu)

```html
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW register failed', err));
  });
}
</script>
```

## 3. Deploy semua file di atas HTTPS

PWA (service worker) **wajib HTTPS** (kecuali `localhost` untuk testing).
Kalau situsmu sudah pakai HTTPS (misalnya Vercel, Netlify, GitHub Pages, dsb),
cukup upload semua file di folder ini.

## Yang sudah diatur

- **manifest.json** — nama app "Notepad Sharing", warna tema biru (#4f5cff)
  sesuai brand kamu, mode `standalone` (tampil tanpa address bar seperti app
  native), dan 4 ukuran ikon (termasuk versi *maskable* untuk Android).
- **sw.js** — service worker dengan strategi:
  - Request ke API (`railway.app`) → **selalu ke network**, tidak pernah
    di-cache, supaya data catatan selalu fresh dan aman (khususnya untuk
    endpoint login/create/edit/delete).
  - Request lain (HTML, CSS, script CDN Alpine/dayjs) → **cache-first**
    dengan update di background, jadi app tetap bisa dibuka walau koneksi
    lambat/offline, tapi otomatis update begitu online lagi.
- **icons/** — 4 ikon PNG bertema notepad biru-ungu gradient, sudah termasuk
  versi maskable untuk Android adaptive icons.

## Uji coba

1. Buka situs kamu di Chrome (desktop atau Android).
2. Cek DevTools → Application → Manifest & Service Workers, pastikan tidak
   ada error dan status service worker "activated".
3. Di Chrome akan muncul ikon "Install" di address bar (desktop) atau
   banner "Tambahkan ke layar Utama" (Android). Di Safari iOS, gunakan
   tombol Share → "Add to Home Screen".

## Catatan

Karena `start_url` di manifest adalah `"/"`, pastikan route `/n/:id` (untuk
link share catatan) tetap bisa diakses langsung — ini sudah kamu tangani
lewat `handleShareLink()` di kode Alpine kamu, jadi tidak perlu perubahan
tambahan di server.
