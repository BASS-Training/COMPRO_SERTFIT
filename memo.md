# Memo Maintenance Web Compro `sertifikasifit.com`

## 1) Ringkasan Sistem
- Tipe aplikasi: website company profile statis (multi-page, tanpa backend API lokal).
- Halaman utama: `index.html`, `aboutus.html`, `skema.html`, `asesor.html`, `berita.html`, `kontak.html`.
- Stack: HTML + CSS + JavaScript vanilla.
- Pola desain: shared global style + style per halaman + interaksi JS sederhana (scroll, reveal, filter, WhatsApp CTA).

## 2) Struktur File Utama
- HTML:
  - `index.html` (beranda)
  - `aboutus.html` (tentang kami)
  - `skema.html` (produk skema sertifikasi)
  - `asesor.html` (direktori asesor)
  - `berita.html` (berita & kegiatan)
  - `kontak.html` (kontak + form ke WhatsApp)
- JavaScript:
  - `assets/js/main.js` (global interaction lintas halaman)
  - `assets/js/about.js` (khusus halaman tentang, load AOS CDN)
- CSS global/shared:
  - `assets/css/styles.css` (global base, komponen umum)
  - `assets/css/brand.css` (brand token/presentasi brand)
  - `assets/css/pages.css` (style inner-page umum)
- CSS per halaman:
  - `assets/css/home.css`
  - `assets/css/aboutus.css`
  - `assets/css/skema.css`
  - `assets/css/asesor.css`
  - `assets/css/berita.css`
  - `assets/css/kontak.css`
- Asset:
  - `assets/partners/*` (logo mitra)
  - `assets/asesor/*` (foto asesor)
  - `assets/news/*` (gambar berita)

## 3) Komponen Bersama (Lintas Halaman)
- Header (`.site-header`):
  - Logo, menu navigasi, dropdown `Skema`, tombol `Daftar Uji` ke WhatsApp, hamburger untuk mobile.
- Footer (`.site-footer`):
  - Ringkasan lembaga, sosial media, navigasi, kontak, link legal.
- Shared JS dari `main.js`:
  - Sticky header (`.scrolled` saat scroll > 60).
  - Mobile menu + overlay `.nav-overlay` + lock scroll body.
  - Reveal animation berbasis `IntersectionObserver` (`.reveal` -> `.in-view`).
  - Counter animasi untuk elemen `.stat-num[data-target]`.
  - Scroll spy section id.
  - Hover tilt untuk card tertentu.

## 4) Dokumentasi Per Halaman

### A. `index.html` (Beranda)
Fitur utama:
- Hero utama + badge lisensi BNSP + CTA.
- Marquee skema/keyword.
- Tentang singkat + visi/misi ringkas.
- Statistik (counter animasi dari `main.js`).
- 3 kategori produk skema.
- Alasan memilih LSP FIT.
- Alur sertifikasi 7 tahap.
- Aktivitas terbaru.
- Partner marquee 2 baris logo mitra.
- Jadwal asesmen (tabel statis).
- CTA akhir.

Interaksi khusus di halaman ini (inline script):
- Toggle class logo (`logo-invert`) berdasarkan scroll.
- Inisialisasi partner marquee dengan clone elemen untuk efek loop mulus.

### B. `aboutus.html` (Tentang Kami)
Fitur utama:
- Hero + breadcrumb + CTA anchor ke section internal.
- Section visi/misi/akuntabilitas.
- Timeline produk unggulan (3 kategori).
- Dukungan asosiasi/mitra.
- Proses sertifikasi 3 langkah.
- CTA akhir.

Interaksi khusus:
- Memuat `assets/js/about.js`:
  - Inject AOS CSS/JS dari CDN `unpkg` secara dinamis.
  - Auto-assign `data-aos` ke elemen tertentu.
  - Smooth scroll untuk anchor internal.
  - Update mode hero grid saat resize.
  - Sinkronisasi kontras logo terhadap posisi scroll.

### C. `skema.html` (Skema Sertifikasi)
Fitur utama:
- Hero skema + quick navigation pill.
- Sticky tabs ke 3 section (`#klaster`, `#instruktur`, `#kepelatihan`).
- Detail 4 skema klaster dalam card.
- Tabel skema instruktur (level 3–6).
- Tabel skema tenaga kepelatihan (level 3–6).
- CTA bawah.

Interaksi khusus (inline script):
- Reveal observer khusus halaman.
- Active tab berdasarkan posisi scroll.
- Smooth scroll offset terhadap sticky header + tabs bar.
- Filter level per section (show/hide row + divider dinamis).

### D. `asesor.html` (Direktori Asesor)
Fitur utama:
- Hero statistik asesor.
- Intro kualitas asesor.
- Direktori kartu asesor.
- Search nama asesor realtime.
- CTA akhir.

Interaksi khusus (inline script):
- Filter card berdasarkan input `#asSearch` terhadap `data-name`.
- Tampilkan panel `#notFound` saat tidak ada hasil.

### E. `berita.html` (Berita & Kegiatan)
Fitur utama:
- Hero halaman berita.
- Filter kategori (`all`, `sertifikasi`, `pelatihan`, `kegiatan`).
- Grid kartu berita.
- Pagination UI.
- CTA akhir.

Interaksi khusus (inline script):
- Filter card berdasarkan `data-category`.

### F. `kontak.html` (Kontak)
Fitur utama:
- Hero kontak.
- Panel informasi alamat/telepon/email/website + sosial media.
- CTA WhatsApp cepat.
- Embed Google Maps.
- Form sederhana kirim ke WhatsApp.

Interaksi khusus (inline script):
- Tombol `#btnWaSubmit` merangkai pesan dari input form dan membuka `https://wa.me/...` di tab baru.

## 5) Dependensi Eksternal
- Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) di semua halaman.
- AOS (hanya `aboutus.html`, dimuat dinamis dari `https://unpkg.com/aos@2.3.4/...`).
- Google Maps Embed (`kontak.html`).
- WhatsApp link (`wa.me`) untuk CTA pendaftaran/kontak.

## 6) Checklist Operasional Saat Update Konten
- [ ] Semua link internal sudah sesuai tujuan halaman.
- [ ] Semua gambar baru ditempatkan pada folder asset yang sesuai.
- [ ] Semua CTA WhatsApp memakai nomor dan template pesan terbaru.
- [ ] Tanggal/konten berita diurutkan konsisten.
- [ ] Navigasi aktif (`class="active"`) sesuai halaman.
- [ ] Cek tampilan mobile (menu hamburger + section penting).
- [ ] Cek console browser sebelum deploy.

## 7) File Coverage (yang ditinjau untuk memo ini)
- HTML: `index.html`, `aboutus.html`, `skema.html`, `asesor.html`, `berita.html`, `kontak.html`
- JS: `assets/js/main.js`, `assets/js/about.js`
- CSS: `assets/css/styles.css`, `assets/css/pages.css`, `assets/css/home.css`, `assets/css/aboutus.css`, `assets/css/skema.css`, `assets/css/asesor.css`, `assets/css/berita.css`, `assets/css/kontak.css`, `assets/css/brand.css`
- Asset inventory: `assets/partners/*`, `assets/asesor/*`, `assets/news/*`, root image assets di `assets/`

## 8) Cuplikan Kode (Panduan Visual Edit Cepat)
Catatan:
- Karena memo berbasis teks, bagian ini memakai "cuplikan kode + lokasi baris" sebagai pengganti screenshot.
- Gunakan line number sebagai patokan cepat saat membuka file di editor.

### A. Menambah Logo Partner (Beranda)
Lokasi:
- `index.html` sekitar baris `586-653` (blok `.partner-track`).

Contoh tambah 1 partner:
```html
<div class="partner-chip has-logo">
  <img class="partner-logo-img" src="/assets/partners/nama-partner.svg" alt="Nama Partner logo" loading="lazy">
  <span class="partner-name">Nama Partner</span><small>Kategori Industri</small>
</div>
```

Checklist:
- Simpan file logo di `assets/partners/`.
- Pastikan `src` sesuai nama file aktual (huruf besar/kecil harus sama).

### B. Mengubah Link Menu / Tombol ke Page Lain
Lokasi utama:
- Header nav: `index.html` sekitar baris `82-99` (pola sama di halaman lain).
- Tombol CTA: banyak di `index.html` (mis. baris `124`, `670`, `725`) dan halaman lain.

Contoh ubah link:
```html
<!-- sebelum -->
<a href="kontak.html">Kontak</a>

<!-- sesudah -->
<a href="https://domain-baru.com" target="_blank" rel="noopener">Kontak</a>
```

Catatan:
- Internal page: pakai `href="nama-file.html"`.
- External page/web lain: tambahkan `target="_blank"` + `rel="noopener"`.

### C. Update Informasi Kontak (Alamat, Telp, Email, Website)
Lokasi:
- Kontak utama: `kontak.html` sekitar baris `94-121`.
- Footer kontak: `kontak.html` sekitar baris `252-267`.
- Footer global lain: `index.html` (`776-791`), `berita.html` (`371-386`), `skema.html` (`310-325`), `aboutus.html` (`269-284`), `asesor.html` (`760-764`).

Contoh update nomor:
```html
<!-- sebelum -->
<span><a href="tel:+6281112101007">0811-1210-1007</a></span>

<!-- sesudah -->
<span><a href="tel:+6281234567890">0812-3456-7890</a></span>
```

Penting:
- Update di semua footer agar konsisten, bukan hanya 1 halaman.

### D. Update Berita/Kegiatan (Judul, Tanggal, Gambar, Kategori)
Lokasi:
- `berita.html` sekitar baris `91-288` (kartu berita).
- Filter kategori tombol: baris `77-80`.
- JS filter kategori: baris `404-415`.

Contoh edit 1 kartu berita:
```html
<article class="br-card reveal" data-category="sertifikasi">
  <div class="br-card-img">
    <img src="/assets/news/berita-baru.jpg" alt="Judul Berita Baru" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="br-img-placeholder">...</div>
    <span class="br-card-cat br-cat-sertifikasi">Sertifikasi</span>
  </div>
  <div class="br-card-body">
    <time class="br-card-date">27 Februari 2026</time>
    <h3>Judul Berita Baru</h3>
    <p>Ringkasan berita...</p>
  </div>
</article>
```

Checklist:
- Simpan gambar berita di `assets/news/`.
- Gunakan `data-category` yang valid: `sertifikasi`, `pelatihan`, `kegiatan`.

### E. Update Daftar Asesor (Tambah/Ubah Card)
Lokasi:
- `asesor.html` sekitar baris `160-680` (kumpulan `.as-card`).
- JS search asesor: baris `781-792`.

Contoh tambah asesor:
```html
<div class="as-card reveal" data-name="Nama Asesor Baru">
  <div class="as-card-photo">
    <img src="/assets/asesor/nama-asesor-baru.jpg" alt="Nama Asesor Baru" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="as-photo-placeholder">
      <span class="as-photo-initials">NB</span>
    </div>
  </div>
  <div class="as-card-info">
    <h3>Nama Asesor Baru</h3>
    <p>Asesor Kompetensi BNSP</p>
  </div>
</div>
```

Penting:
- `data-name` harus sama/selaras dengan nama agar fitur search tetap akurat.

### F. Update CTA WhatsApp (Nomor / Template Pesan)
Lokasi:
- Tombol header lintas halaman: cari `wa.me/6281112101007`.
- Form kirim WA: `kontak.html` baris `285-299`.

Contoh update nomor WA:
```js
const url = 'https://wa.me/6281234567890?text=' + encodeURIComponent(msg);
```

### G. Titik CSS untuk Ubah Tampilan Cepat
- Global style utama: `assets/css/styles.css`.
- Layout halaman dalam: `assets/css/pages.css`.
- Beranda: `assets/css/home.css`.
- Halaman spesifik:
  - `assets/css/asesor.css`
  - `assets/css/berita.css`
  - `assets/css/skema.css`
  - `assets/css/kontak.css`
  - `assets/css/aboutus.css`

Contoh cepat ubah warna brand (global):
```css
:root {
  --navy: #0D1B2A;
  --red: #F52525;
  --cyan: #00ACEA;
}
```
