# Inzenity MVP 1.0 — Fitur Ada vs Kurang

Dokumen ini merangkum fitur yang sudah ada dan yang masih kurang di **Inzenity MVP 1.0**, baik untuk **member app (Android)** maupun **web admin**, sebelum siap dirilis ke **Google Play Store**.

Tanggal: 2026-08-11  
Versi APK terakhir: v9 (2 Agustus 2026)  
Branch GitHub: `main` — sudah sinkron dengan local.

---

## 📱 MEMBER APP (Android APK)

### ✅ Sudah Ada

| Fitur | Keterangan | Notes |
|-------|-----------|-------|
| **Login member** | Username + password, session token disimpan | Token via `localStorage` + cookie |
| **Home screen** | Hero banner auto-swipe, sponsor, news, community links | Banner diatur via admin |
| **Events** | List event, detail event, RSVP Going/Maybe/Not Going | RSVP masuk ke backend |
| **My Zenix** | Profil mobil: nickname, model, tahun, plat nomor | Cuma tersimpan lokal di HP |
| **Upload foto lokal** | Foto mobil & avatar bisa di-upload dari galeri/kamera | Tapi cuma di `localStorage`, bukan ke server |
| **Vendor directory** | Daftar partner + search + chat WhatsApp | WhatsApp link otomatis |
| **Merchandise** | List merch + halaman detail | Belum ada checkout |
| **Dark/light mode** | Toggle tema | Tersimpan di localStorage |
| **Bottom nav + side drawer** | Navigasi utama | Home, Events, Vendors, Merch, My Zenix |
| **Sponsor detail** | Halaman detail sponsor | Masih placeholder konten |
| **Demo login shortcut** | Tombol demo member di landing | Perlu dihapus/sembunyikan sebelum rilis production |

### ❌ Belum Ada / Kurang

| Fitur | Kenapa Penting | Prioritas |
|-------|---------------|-----------|
| **Push notification** | Gak ada FCM/OneSignal. Penting buat announce event & reminder | Tinggi |
| **Upload foto ke server** | Foto profil & mobil cuma lokal, hilang kalau ganti HP | Tinggi |
| **Sinkronisasi profil My Zenix** | Data mobil gak tersimpan di backend | Tinggi |
| **Forgot password / change password** | Member gak bisa ganti password sendiri | Tinggi |
| **Pull-to-refresh** | Data gak bisa di-refresh manual saat buka app | Menengah |
| **Offline mode / caching** | Kalau jaringan lemah, app kosong | Menengah |
| **Onboarding / tutorial** | First-time user gak ada pengenalan singkat | Menengah |
| **Multi-language (EN/ID)** | Target user Indonesia, saat ini cuma English | Menengah |
| **Crash analytics** | Gak ada Sentry / Firebase Crashlytics | Menengah |
| **Chat antar member** | Belum ada komunikasi internal | Rendah |
| **Pembayaran / merch checkout** | Merch cuma katalog, belum ada order/payment | Rendah |
| **Event check-in / QR** | Belum ada absensi saat event | Rendah |
| **In-app update notification** | Member gak tahu kalau ada versi baru | Rendah |

---

## 🖥️ WEB ADMIN

### ✅ Sudah Ada

| Fitur | Keterangan |
|-------|-----------|
| **Login admin** | Scope admin terpisah dari member |
| **CRUD Users** | Create, read, update, delete member & admin |
| **CRUD Events** | Kelola event + field lengkap (date, location, host, meeting point, dll) |
| **CRUD Announcements** | Post pengumuman |
| **CRUD Vendors** | Kelola direktori partner |
| **CRUD Banners** | Kelola hero banner di home |
| **CRUD Sponsors** | Kelola sponsor/partner |
| **CRUD News** | Kelola berita/update |
| **CRUD Merchandise** | Kelola katalog merch |
| **Reset seed data** | Reset ke data demo dari admin panel |
| **Stats count** | Nunjukin jumlah users, events, vendors, dll |

### ❌ Belum Ada / Kurang

| Fitur | Kenapa Penting | Prioritas |
|-------|---------------|-----------|
| **Upload gambar** | Field image/logo cuma text URL, admin harus upload manual dulu | Tinggi |
| **Hash password** | Password user disimpan plain text — red flag buat production | Tinggi |
| **Ganti / reset password member** | Admin gak bisa bantu reset password member | Tinggi |
| **Dashboard RSVP per event** | Gak bisa lihat siapa yang daftar dan status-nya | Tinggi |
| **Export data** | Gak bisa export member / RSVP ke Excel/CSV | Menengah |
| **Search & pagination** | Tabel bakal berat kalau data sudah ratusan | Menengah |
| **Rich text editor** | Deskripsi event masih textarea polos | Menengah |
| **Audit log** | Gak ada jejak siapa yang edit/delete data | Menengah |
| **Settings / config page** | Nama komunitas, kontak, sosmed masih hardcoded | Menengah |
| **Responsive mobile admin** | Admin UI desktop-first, susah dipakai lewat HP | Menengah |
| **Preview gambar** | Gak ada thumbnail sebelum publish | Rendah |

---

## 🚀 PLAY STORE RELEASE REQUIREMENTS

### ❌ Blocker — Harus Selesai Sebelum Rilis

| Item | Status | Keterangan |
|------|--------|-----------|
| **Google Play Console account** | Belum | Daftar + bayar $25 one-time |
| **Privacy Policy** | Belum | Wajib ada di Play Store |
| **Terms of Service** | Belum | Wajib ada |
| **App content rating** | Belum | Isi kuesioner di Play Console |
| **Data safety form** | Belum | Google wajibkan declare data yang dikumpulin |
| **Signed release APK / AAB** | Belum | Belum setup keystore proper |
| **App icon & store screenshots** | Sebagian | Icon ada, tapi butuh store listing assets lengkap |
| **Production backend URL** | Belum | Sekarang pakai Cloudflare tunnel `trycloudflare.com` — tidak stabil |
| **HTTPS-only** | Belum | `usesCleartextTraffic="true"` harus mati di production |
| **Target SDK compliance** | Perlu cek | Pastikan `targetSdkVersion` sesuai kebutuhan Google 2026 |
| **Remove/sembunyikan demo account** | Perlu | Google tester butuh credential yang jelas; demo shortcut mungkin ditolak |

### ⚠️ Perlu Perhatian

- **Demo account** (`raka/member123`, `dina/member123`, dll) — sebaiknya disembunyikan di production build atau dijadikan internal test saja.
- **Versioning** — `versionCode` masih 1, perlu strategy version tiap update.
- **App bundle (AAB)** — Google lebih prefer AAB daripada APK untuk rilis.

---

## 🎯 Rekomendasi MVP 1.0 PlayStore

### Must-Have Sebelum Rilis

1. **Production backend** — domain sendiri + HTTPS (bukan tunnel)
2. **Privacy policy + Terms of Service**
3. **Password hashing**
4. **Upload gambar ke backend** (foto profil, banner, merch, sponsor, vendor)
5. **Sinkronisasi My Zenix ke backend**
6. **Signed release APK/AAB**
7. **Play Console setup + data safety form**

### Nice-to-Have (Bisa Rilis Tanpa)

- Push notification
- Chat antar member
- Payment / merch checkout
- Event check-in QR
- Multi-language
- Rich analytics dashboard

---

## 🗓️ Roadmap Prioritas Minggu Ini

| Minggu | Fokus | Output |
|--------|-------|--------|
| **1** | Hash password + upload gambar backend | Admin bisa upload gambar & password aman |
| **2** | Sinkronisasi My Zenix + privacy policy | Profil mobil tersimpan di server + halaman legal |
| **3** | Production domain + signed APK/AAB | Backend live di domain sendiri + build rilis |
| **4** | Play Console submission | Upload AAB, isi data safety & content rating |

---

## 📂 Lokasi File Terkait

- Backend: `backend/main.py`
- Member app: `public/index.html`, `public/app.js`
- Admin web: `public/admin.html`, `public/admin.js`
- Styles: `public/styles.css`
- Android project: `android/`
- GitHub: `https://github.com/km85/Inzenity.git`

---

*Dokumen ini bisa di-update seiring progress development.*
