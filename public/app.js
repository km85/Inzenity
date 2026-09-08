const state = {
  user: null,
  events: [],
  announcements: [],
  vendors: [],
  banners: [],
  sponsors: [],
  news: [],
  merchandise: [],
  officialPartners: [],
  merchantPartners: [],
  products: [],
  myOrders: [],
  selectedProduct: null,
  selectedMerchant: null,
  heroIndex: 0,
  heroTouchStartX: 0,
  heroTouchStartY: 0,
  heroTimer: null,
  carProfile: { nickname: "", carModel: "", carYear: "", plateNumber: "" },
  carPhoto: "",
  avatarPhoto: "",
  selectedSponsor: null,
  selectedMerch: null,
  theme: "dark",
  language: "id",
  chapters: [],
  vehicleOptions: { models: [], powertrains: [], years: [], tshirtSizes: [], reminderOptions: [] },
  profile: null,
  vehicle: null,
  reminders: [],
  loadingProfile: false,
  profileError: null,
  // Phase 2
  publicChapters: [],
  publicVehicleOptions: { models: [], powertrains: [], years: [], tshirtSizes: [] },
  pointsBalance: 0,
  pointTransactions: [],
  myCheckIns: [],
  rewards: [],
  myRedemptions: [],
};

const screens = ["home", "my-zenix", "events", "event-detail", "sponsor-detail", "merch-detail", "product-detail", "vendors", "merchandise", "merchant-partners", "merchant-detail", "leaderboard"];

const translations = {
  id: {
    appTitle: "Innova Zenix Community",
    lightMode: "Mode terang",
    darkMode: "Mode gelap",
    loginTitle: "Member Login",
    loginSubtitle: "Masuk dengan akun member untuk membuka aplikasi klub.",
    demoMember: "Demo Member",
    alternative: "Alternatif",
    adminLabel: "Admin",
    openDashboardLogin: "Buka login dashboard",
    username: "Username",
    password: "Password",
    enterApp: "Masuk Aplikasi",
    noAccount: "Belum punya akun?",
    registerNow: "Daftar sekarang",
    registerTitle: "Pendaftaran Member",
    registerSubtitle: "Isi data kamu. Admin akan review dan approve akunmu.",
    submitRegistration: "Kirim Pendaftaran",
    backToLogin: "Kembali ke Login",
    registrationSent: "Pendaftaran terkirim. Tunggu approval admin.",
    registrationFailed: "Pendaftaran gagal.",
    myZenix: "Zenix Saya",
    events: "Event",
    vendors: "Vendor",
    merchandise: "Merchandise",
    merch: "Merch",
    home: "Beranda",
    welcomeBack: "Selamat datang kembali",
    logout: "Logout",
    leaderboard: "Leaderboard",
    person: "Data Pribadi",
    car: "Kendaraan Saya",
    fullName: "Nama Lengkap",
    memberNumber: "Nomor Member",
    email: "Email",
    phone: "Telepon / WhatsApp",
    address: "Alamat",
    postalCode: "Kode Pos",
    socialMedia: "Social Media",
    tshirtSize: "Ukuran Kaos",
    chapter: "Chapter",
    selectChapter: "Pilih chapter",
    carNickname: "Nama / Nickname Mobil",
    plateNumber: "Nomor Polisi",
    model: "Model",
    powertrain: "Tipe",
    year: "Tahun",
    color: "Warna",
    stnkExpiry: "Masa Berlaku STNK",
    lastMaintenance: "Last Maintenance",
    nextMaintenance: "Next Maintenance",
    lastMaintenanceKm: "KM Terakhir Service",
    nextMaintenanceKm: "KM Service Berikutnya",
    maintenanceReminder: "Pengingat Service",
    stnkReminder: "Pengingat STNK",
    reminderOption30: "1 bulan sebelum",
    reminderOption14: "2 minggu sebelum",
    reminderOption7: "1 minggu sebelum",
    saveChanges: "Simpan Perubahan",
    reset: "Reset",
    uploadCarPhoto: "Upload foto mobil",
    changeCarPhoto: "Ganti foto mobil",
    uploadProfilePhoto: "Upload foto profil",
    changeProfilePhoto: "Ganti foto profil",
    remove: "Hapus",
    language: "Bahasa",
    reminders: "Pengingat",
    noReminders: "Tidak ada pengingat aktif.",
    profileSaved: "Profil disimpan.",
    profileError: "Gagal menyimpan profil.",
    requiredField: "Wajib diisi",
    invalidChapter: "Chapter tidak valid",
    loading: "Memuat...",
    errorLoad: "Gagal memuat data. Coba lagi.",
    notSet: "Belum diisi",
    sponsors: "Sponsor",
    trustedPartners: "Official Partner",
    merchantPartners: "Merchant Partner",
    officialPartner: "Partner Resmi",
    merchantPartner: "Partner Merchant",
    partner: "Partner",
    latestNews: "Berita Terbaru",
    updatesForMembers: "Update untuk Member",
    community: "Komunitas",
    followUs: "Ikuti Kami",
    openInstagram: "Buka Instagram",
    followUsText: "Dekat dengan update chapter, foto event, dan cerita klub.",
    clubEvent: "Event Klub",
    clubHighlight: "Sorotan Klub",
    upcomingCommunityHighlight: "Sorotan komunitas mendatang",
    clubTeam: "Tim Klub",
    eventRegistration: "Registrasi Event",
    upcomingClubPlans: "Rencana Klub Mendatang",
    eventsCount: "event",
    eventLabel: "Event",
    openRsvp: "Buka RSVP",
    meetingPointTBA: "Meeting point akan diumumkan",
    viewEvent: "Lihat Event",
    eventDetail: "Detail Event",
    host: "Host",
    meetingPoint: "Meeting Point",
    sharedLater: "Akan dibagikan nanti",
    yourRsvp: "RSVP Kamu",
    chooseResponse: "Pilih respons",
    going: "Hadir",
    maybe: "Mungkin",
    notGoing: "Tidak Hadir",
    goingShort: "Hadir",
    maybeShort: "Mungkin",
    notGoingShort: "Tidak",
    vendorDirectory: "Direktori Vendor",
    searchVendors: "Cari vendor, kategori...",
    chatWhatsapp: "Chat WhatsApp",
    noVendorsFound: "Vendor tidak ditemukan.",
    clubStore: "Official Merchandise",
    trustedPartner: "Official Partner",
    back: "Kembali",
    noSponsorSelected: "Belum ada sponsor dipilih.",
    noItemSelected: "Belum ada item dipilih.",
    itemDetails: "Detail Item",
    partnerDetailsPage: "Halaman detail partner.",
    itemDetailsPage: "Halaman detail item.",
    readyToFill: "Field teks dan gambar siap diisi.",
    daysLeft: "hari lagi",
    couldNotReadCarPhoto: "Gagal membaca foto mobil:",
    couldNotReadProfilePhoto: "Gagal membaca foto profil:",
    resetFormConfirm: "Reset form ke data tersimpan?",
    // Phase 2
    points: "Poin",
    myPoints: "Poin Saya",
    currentBalance: "Saldo saat ini",
    pointHistory: "Riwayat Poin",
    noTransactions: "Belum ada transaksi poin.",
    source: "Sumber",
    date: "Tanggal",
    description: "Keterangan",
    rewards: "Hadiah",
    redeem: "Tukar",
    pointsRequired: "Poin dibutuhkan",
    insufficientPoints: "Poin tidak cukup",
    redemptionRequested: "Permintaan penukaran terkirim. Menunggu approval admin.",
    myRedemptions: "Penukaran Saya",
    status: "Status",
    checkIn: "Check In",
    checkInToken: "Token Check-In",
    enterQrToken: "Masukkan token QR dari panitia",
    alreadyCheckedIn: "Sudah check in",
    checkInSuccess: "Check in berhasil!",
    checkInFailed: "Check in gagal.",
    uploadAttendancePhotos: "Upload foto kehadiran (max 3)",
    uploadPhotos: "Upload Foto",
    photosUploaded: "Foto berhasil diupload.",
    leaderboardTitle: "Leaderboard",
    rank: "Peringkat",
    member: "Member",
    pointsLabel: "Poin",
    period: "Periode",
    monthly: "Bulanan",
    quarterly: "3 Bulan",
    yearly: "Tahunan",
    load: "Muat",
    stnkUpload: "Upload STNK",
    paymentProofUpload: "Upload Bukti Pembayaran",
    quantity: "Jumlah",
    order: "Pesan",
    stock: "Stok",
    preorder: "Pre-order",
    outOfStock: "Stok habis",
    myOrders: "Pesanan Saya",
    locationPin: "Pin Lokasi (lat, lon)",
  },
  en: {
    appTitle: "Innova Zenix Community",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    loginTitle: "Member Login",
    loginSubtitle: "Sign in with your member account to enter the club app.",
    demoMember: "Demo Member",
    alternative: "Alternative",
    adminLabel: "Admin",
    openDashboardLogin: "Open dashboard login",
    username: "Username",
    password: "Password",
    enterApp: "Enter Community App",
    noAccount: "Don't have an account?",
    registerNow: "Register now",
    registerTitle: "Member Registration",
    registerSubtitle: "Fill in your data. Admin will review and approve your account.",
    submitRegistration: "Submit Registration",
    backToLogin: "Back to Login",
    registrationSent: "Registration submitted. Awaiting admin approval.",
    registrationFailed: "Registration failed.",
    myZenix: "My Zenix",
    events: "Events",
    vendors: "Vendors",
    merchandise: "Merchandise",
    merch: "Merch",
    home: "Home",
    welcomeBack: "Welcome back",
    logout: "Logout",
    leaderboard: "Leaderboard",
    person: "Person",
    car: "My Vehicle",
    fullName: "Full Name",
    memberNumber: "Member Number",
    email: "Email",
    phone: "Phone / WhatsApp",
    address: "Address",
    postalCode: "Postal Code",
    socialMedia: "Social Media",
    tshirtSize: "T-shirt Size",
    chapter: "Chapter",
    selectChapter: "Select chapter",
    carNickname: "Car Nickname",
    plateNumber: "Plate Number",
    model: "Model",
    powertrain: "Powertrain",
    year: "Year",
    color: "Color",
    stnkExpiry: "STNK Expiry Date",
    lastMaintenance: "Last Maintenance",
    nextMaintenance: "Next Maintenance",
    lastMaintenanceKm: "Last Service KM",
    nextMaintenanceKm: "Next Service KM",
    maintenanceReminder: "Maintenance Reminder",
    stnkReminder: "STNK Reminder",
    reminderOption30: "1 month before",
    reminderOption14: "2 weeks before",
    reminderOption7: "1 week before",
    saveChanges: "Save Changes",
    reset: "Reset",
    uploadCarPhoto: "Upload car photo",
    changeCarPhoto: "Change car photo",
    uploadProfilePhoto: "Upload profile photo",
    changeProfilePhoto: "Change profile photo",
    remove: "Remove",
    language: "Language",
    reminders: "Reminders",
    noReminders: "No active reminders.",
    profileSaved: "Profile saved.",
    profileError: "Failed to save profile.",
    requiredField: "Required",
    invalidChapter: "Invalid chapter",
    loading: "Loading...",
    errorLoad: "Failed to load data. Please try again.",
    notSet: "Not set",
    sponsors: "Sponsors",
    trustedPartners: "Official Partner",
    merchantPartners: "Merchant Partner",
    officialPartner: "Official Partner",
    merchantPartner: "Merchant Partner",
    partner: "Partner",
    latestNews: "Latest News",
    updatesForMembers: "Updates for Members",
    community: "Community",
    followUs: "Follow Us",
    openInstagram: "Open Instagram",
    followUsText: "Stay close to chapter updates, event photos, and club stories.",
    clubEvent: "Club Event",
    clubHighlight: "Club Highlight",
    upcomingCommunityHighlight: "Upcoming community highlight",
    clubTeam: "Club Team",
    eventRegistration: "Event Registration",
    upcomingClubPlans: "Upcoming Club Plans",
    eventsCount: "events",
    eventLabel: "Event",
    openRsvp: "Open RSVP",
    meetingPointTBA: "Meeting point TBA",
    viewEvent: "View Event",
    eventDetail: "Event Detail",
    host: "Host",
    meetingPoint: "Meeting Point",
    sharedLater: "Shared later",
    yourRsvp: "Your RSVP",
    chooseResponse: "Choose your response",
    going: "Going",
    maybe: "Maybe",
    notGoing: "Not Going",
    goingShort: "Going",
    maybeShort: "Maybe",
    notGoingShort: "Not Going",
    vendorDirectory: "Vendor Directory",
    searchVendors: "Search vendors, category...",
    chatWhatsapp: "Chat WhatsApp",
    noVendorsFound: "No vendors found.",
    clubStore: "Official Merchandise",
    trustedPartner: "Official Partner",
    back: "Back",
    noSponsorSelected: "No sponsor selected.",
    noItemSelected: "No item selected.",
    itemDetails: "Item Details",
    partnerDetailsPage: "Partner details page.",
    itemDetailsPage: "Item details page.",
    readyToFill: "Text and image fields are ready to be filled.",
    daysLeft: "days left",
    couldNotReadCarPhoto: "Could not read car photo:",
    couldNotReadProfilePhoto: "Could not read profile photo:",
    resetFormConfirm: "Reset form to saved data?",
    // Phase 2
    points: "Points",
    myPoints: "My Points",
    currentBalance: "Current balance",
    pointHistory: "Point history",
    noTransactions: "No point transactions yet.",
    source: "Source",
    date: "Date",
    description: "Description",
    rewards: "Rewards",
    redeem: "Redeem",
    pointsRequired: "Points required",
    insufficientPoints: "Insufficient points",
    redemptionRequested: "Redemption request submitted. Awaiting admin approval.",
    myRedemptions: "My Redemptions",
    status: "Status",
    checkIn: "Check In",
    checkInToken: "Check-In Token",
    enterQrToken: "Enter QR token from organizer",
    alreadyCheckedIn: "Already checked in",
    checkInSuccess: "Check-in successful!",
    checkInFailed: "Check-in failed.",
    uploadAttendancePhotos: "Upload attendance photos (max 3)",
    uploadPhotos: "Upload Photos",
    photosUploaded: "Photos uploaded.",
    leaderboardTitle: "Leaderboard",
    rank: "Rank",
    member: "Member",
    pointsLabel: "Points",
    period: "Period",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    load: "Load",
    stnkUpload: "Upload STNK",
    paymentProofUpload: "Upload Payment Proof",
    quantity: "Quantity",
    order: "Order",
    stock: "Stock",
    preorder: "Pre-order",
    outOfStock: "Out of stock",
    myOrders: "My Orders",
    locationPin: "Location pin (lat, lon)",
  },
};

function t(key, fallback = "") {
  const set = translations[state.language] || translations.id;
  return set[key] || fallback || key;
}

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    el.textContent = t(key);
  });
}

async function api(path, options = {}) {
  const base = window.API_BASE_URL || "";
  const token = localStorage.getItem("api_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "X-API-Token": token } : {}),
    ...options.headers
  };
  const url = base + path;
  try {
    const response = await fetch(url, {
      headers,
      credentials: "omit",
      ...options
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { error: text }; }
    if (!response.ok) {
      throw new Error(data.error || data.detail || text || "Request failed");
    }
    return data;
  } catch (err) {
    throw new Error("Network error: " + (err.message || err) + " (URL: " + url + ")");
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString(state.language === "id" ? "id-ID" : "en-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(state.language === "id" ? "id-ID" : "en-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatPrice(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat(state.language === "id" ? "id-ID" : "en-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(num);
}

function normalizeForInput(value) {
  if (!value) return "";
  const iso = typeof value === "string" ? value : new Date(value).toISOString();
  return iso.slice(0, 10);
}

function carKey() {
  return `zenix:car:${state.user?.username || "guest"}`;
}

function carPhotoKey() {
  return `zenix:car-photo:${state.user?.username || "guest"}`;
}

function avatarPhotoKey() {
  return `zenix:avatar:${state.user?.username || "guest"}`;
}

function themeKey() {
  return "zenix:theme";
}

function languageKey() {
  return "zenix:language";
}

function loadTheme() {
  const saved = localStorage.getItem(themeKey());
  if (saved === "light" || saved === "dark") {
    state.theme = saved;
  } else {
    state.theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  applyTheme();
}

function applyTheme() {
  document.body.setAttribute("data-theme", state.theme);
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");
  if (icon) icon.textContent = state.theme === "dark" ? "☀" : "🌙";
  if (label) label.textContent = state.theme === "dark" ? t("lightMode") : t("darkMode");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeKey(), state.theme);
  applyTheme();
}

function loadLanguagePreference() {
  const saved = localStorage.getItem(languageKey());
  if (saved === "en" || saved === "id") {
    state.language = saved;
  }
}

async function setLanguage(lang) {
  if (lang !== "id" && lang !== "en") return;
  state.language = lang;
  localStorage.setItem(languageKey(), lang);
  if (state.user) {
    try {
      await api("/api/me/language", { method: "PUT", body: JSON.stringify({ language: lang }) });
    } catch (err) {
      // keep local change even if server fails
    }
  }
  applyStaticTranslations();
  renderChrome();
}

function loadCarProfile() {
  if (!state.user) return;
  try {
    const saved = localStorage.getItem(carKey());
    if (saved) {
      state.carProfile = { ...state.carProfile, ...JSON.parse(saved) };
    }
  } catch {
    // ignore corrupt storage
  }
  state.carPhoto = localStorage.getItem(carPhotoKey()) || "";
  state.avatarPhoto = localStorage.getItem(avatarPhotoKey()) || "";
}

function saveCarProfile(profile) {
  state.carProfile = { ...state.carProfile, ...profile };
  localStorage.setItem(carKey(), JSON.stringify(state.carProfile));
  renderMyZenix();
}

function saveCarPhoto(base64) {
  state.carPhoto = base64;
  localStorage.setItem(carPhotoKey(), base64 || "");
  renderMyZenix();
}

function saveAvatarPhoto(base64) {
  state.avatarPhoto = base64;
  localStorage.setItem(avatarPhotoKey(), base64 || "");
  renderMyZenix();
  renderChrome();
}

function readFileBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function showLogin() {
  state.user = null;
  document.getElementById("appView").classList.add("hidden");
  document.getElementById("loginView").classList.remove("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.querySelector(".auth-switch")?.classList.remove("hidden");
}

function showApp() {
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("appView").classList.remove("hidden");
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.querySelector(".auth-switch")?.classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  renderRegistrationForm();
}

function backToLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.querySelector(".auth-switch")?.classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
}

function setActiveScreen(screen) {
  screens.forEach((name) => {
    const element = document.getElementById(`screen-${name}`);
    if (element) {
      element.classList.toggle("hidden", name !== screen);
    }
  });

  document.querySelectorAll(".member-nav-link").forEach((link) => {
    const linkScreen = link.dataset.screen;
    const isActive = linkScreen === screen || (linkScreen === "home" && screen === "event-detail") || (linkScreen === "home" && screen === "sponsor-detail") || (linkScreen === "merchandise" && (screen === "merch-detail" || screen === "product-detail")) || (linkScreen === "vendors" && (screen === "merchant-detail" || screen === "merchant-partners")) || (linkScreen === "events" && screen === "event-detail");
    link.classList.toggle("active", isActive);
  });
}

function openDrawer() {
  document.getElementById("sideDrawer").classList.remove("hidden");
  document.getElementById("drawerBackdrop").classList.remove("hidden");
}

function closeDrawer() {
  document.getElementById("sideDrawer").classList.add("hidden");
  document.getElementById("drawerBackdrop").classList.add("hidden");
}

function getUserRsvp(event) {
  return event.rsvps.find((item) => item.userId === state.user.id);
}

function getHeroSlides() {
  const eventMap = new Map(state.events.map((event) => [event.title, event]));
  return [...state.banners]
    .sort((a, b) => a.order - b.order)
    .map((banner) => {
      const matchedEvent = eventMap.get(banner.title);
      return {
        title: banner.title,
        subtitle: banner.subtitle || (matchedEvent ? (matchedEvent.category || t("clubEvent")) : t("clubHighlight")),
        body: matchedEvent ? `${formatDate(matchedEvent.date)} · ${matchedEvent.location}` : (banner.subtitle || t("upcomingCommunityHighlight")),
        tag: matchedEvent ? (matchedEvent.host || t("clubTeam")) : t("appTitle"),
        coverClass: banner.image,
        link: banner.link,
        partnerType: banner.partnerType,
        partnerId: banner.partnerId,
        durationMs: banner.durationMs || 5000
      };
    });
}

function getNewsCards() {
  const announcementMap = new Map(state.announcements.map((item) => [item.title, item]));
  return [...state.news]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((item) => ({
      title: item.title,
      category: item.category,
      date: formatShortDate(item.date),
      content: announcementMap.get(item.title)?.content || item.category,
      coverClass: item.image
    }));
}

function getOfficialPartners() {
  return state.officialPartners.map((p) => ({
    id: p.id,
    name: p.name,
    category: t("officialPartner"),
    logoClass: p.logo,
    link: p.link
  }));
}

function getMerchantPartners() {
  return state.merchantPartners.map((m) => ({
    id: m.id,
    name: m.name,
    category: t("merchantPartner"),
    logoClass: m.logo
  }));
}

function renderHome() {
  const slides = getHeroSlides();
  const activeIndex = slides.length ? state.heroIndex % slides.length : 0;
  const activeSlide = slides[activeIndex] || null;
  const newsCards = getNewsCards();
  const officialPartners = getOfficialPartners();
  const merchantPartners = getMerchantPartners();

  document.getElementById("screen-home").innerHTML = `
    <section class="home-hero-card">
      ${activeSlide ? `
        <div class="hero-banner ${activeSlide.coverClass}" id="heroBanner" role="button" tabindex="0">
          <div class="hero-banner-copy">
            <span class="hero-badge">${activeSlide.subtitle}</span>
            <h2>${activeSlide.title}</h2>
            <p>${activeSlide.body}</p>
            <span class="hero-support">${activeSlide.tag}</span>
          </div>
        </div>
        <div class="hero-dots">
          ${slides.map((_, index) => `<button class="hero-dot ${index === activeIndex ? "active" : ""}" type="button" data-hero-index="${index}" aria-label="Go to slide ${index + 1}"></button>`).join("")}
        </div>
      ` : ""}
    </section>

    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("officialPartner")}</p>
          <h3>${t("trustedPartners")}</h3>
        </div>
      </div>
      <div class="sponsor-grid">
        ${officialPartners.map((partner, index) => `
          <article class="sponsor-card" data-official-partner-index="${index}" role="button" tabindex="0">
            <div class="sponsor-logo ${partner.logoClass || "sponsor-tone-1"}">${partner.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
            <strong>${partner.name}</strong>
            <span>${partner.category}</span>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("vendors")}</p>
          <h3>${t("merchantPartners")}</h3>
        </div>
      </div>
      <div class="sponsor-grid">
        ${merchantPartners.map((partner, index) => `
          <article class="sponsor-card" data-merchant-partner-index="${index}" role="button" tabindex="0">
            <div class="sponsor-logo ${partner.logoClass || "sponsor-tone-2"}">${partner.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
            <strong>${partner.name}</strong>
            <span>${partner.category}</span>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("latestNews")}</p>
          <h3>${t("updatesForMembers")}</h3>
        </div>
      </div>
      <div class="news-grid">
        ${newsCards.map((item) => `
          <article class="news-card">
            <div class="news-cover ${item.coverClass}"></div>
            <div class="news-body">
              <div class="news-meta">
                <span>${item.category}</span>
                <span>${item.date}</span>
              </div>
              <h4>${item.title}</h4>
              <p>${item.content}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("community")}</p>
          <h3>${t("followUs")}</h3>
        </div>
      </div>
      <article class="community-card">
        <div>
          <p class="section-kicker">Instagram</p>
          <p>${t("followUsText")}</p>
        </div>
        <a class="primary-button" href="https://instagram.com" target="_blank" rel="noreferrer">${t("openInstagram")}</a>
      </article>
    </section>
  `;

  attachHeroSwipe();

  document.querySelectorAll("[data-hero-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.heroIndex = Number(button.dataset.heroIndex);
      renderHome();
    });
  });

  document.getElementById("heroBanner")?.addEventListener("click", () => {
    const slide = slides[activeIndex];
    if (!slide) return;
    if (slide.link) {
      window.open(slide.link, "_blank", "noreferrer");
    } else if (slide.partnerType && slide.partnerId) {
      if (slide.partnerType === "merchant") {
        location.hash = `#merchant-${slide.partnerId}`;
      } else {
        alert(`${t("partnerDetailsPage")} (${slide.partnerType} #${slide.partnerId})`);
      }
    }
  });

  document.querySelectorAll("[data-official-partner-index]").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.officialPartnerIndex);
      const partner = officialPartners[index];
      if (partner?.link) window.open(partner.link, "_blank", "noreferrer");
    });
  });

  document.querySelectorAll("[data-merchant-partner-index]").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.merchantPartnerIndex);
      const partner = merchantPartners[index];
      if (partner?.id) location.hash = `#merchant-${partner.id}`;
    });
  });
}

function attachHeroSwipe() {
  const banner = document.getElementById("heroBanner");
  if (!banner) return;

  banner.addEventListener("touchstart", (e) => {
    state.heroTouchStartX = e.changedTouches[0].screenX;
    state.heroTouchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  banner.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].screenX;
    const endY = e.changedTouches[0].screenY;
    const diffX = state.heroTouchStartX - endX;
    const diffY = state.heroTouchStartY - endY;
    const slides = getHeroSlides();
    if (!slides.length) return;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        state.heroIndex = (state.heroIndex + 1) % slides.length;
      } else {
        state.heroIndex = (state.heroIndex - 1 + slides.length) % slides.length;
      }
      renderHome();
    }
  }, { passive: true });
}

function reminderLabel(days) {
  const opt = state.vehicleOptions.reminderOptions.find((o) => o.days === Number(days));
  if (!opt) return "";
  return state.language === "id" ? opt.labelId : opt.labelEn;
}

function renderReminderBanner() {
  if (!state.reminders.length) {
    return `<div class="reminder-banner empty">${t("noReminders")}</div>`;
  }
  return state.reminders.map((r) => {
    const title = r.type === "maintenance" ? t("maintenanceReminder") : t("stnkReminder");
    return `<div class="reminder-banner ${r.type}">
      <strong>${title}</strong>
      <span>${formatShortDate(r.dueDate)} · ${r.daysRemaining} ${t("daysLeft")}</span>
    </div>`;
  }).join("");
}

function renderMyZenix() {
  const carPhoto = state.carPhoto;
  const avatarPhoto = state.avatarPhoto;

  const person = state.profile || {};
  const vehicle = state.vehicle || {};

  // Merge legacy localStorage car profile as fallback when no server vehicle exists
  const fallback = { ...state.carProfile };
  const carNickname = vehicle.nickname || fallback.nickname || "";
  const carModel = vehicle.model || fallback.carModel || "";

  const chapterOptions = state.chapters.length
    ? state.chapters.map((c) => `<option value="${c.id}" ${String(person.chapterId) === String(c.id) ? "selected" : ""}>${c.name}</option>`).join("")
    : `<option value="">${t("selectChapter")}</option>`;

  const modelOptions = state.vehicleOptions.models.length
    ? state.vehicleOptions.models.map((m) => `<option value="${m.code}" ${vehicle.model === m.code ? "selected" : ""}>${m.label}</option>`).join("")
    : `<option value="">G / V / Q</option>`;

  const powertrainOptions = state.vehicleOptions.powertrains.length
    ? state.vehicleOptions.powertrains.map((p) => `<option value="${p.code}" ${vehicle.powertrain === p.code ? "selected" : ""}>${p.label}</option>`).join("")
    : `<option value="">Gasoline / Hybrid</option>`;

  const yearOptions = state.vehicleOptions.years.length
    ? state.vehicleOptions.years.map((y) => `<option value="${y}" ${String(vehicle.year) === String(y) ? "selected" : ""}>${y}</option>`).join("")
    : `<option value="">2023 / 2024 / 2025</option>`;

  const tshirtOptions = state.vehicleOptions.tshirtSizes.length
    ? state.vehicleOptions.tshirtSizes.map((s) => `<option value="${s}" ${person.tshirtSize === s ? "selected" : ""}>${s}</option>`).join("")
    : "";

  const reminderOptions = state.vehicleOptions.reminderOptions.length
    ? state.vehicleOptions.reminderOptions.map((o) => `<option value="${o.days}" ${String(vehicle.maintenanceReminderDays) === String(o.days) ? "selected" : ""}>${state.language === "id" ? o.labelId : o.labelEn}</option>`).join("")
    : "";

  const stnkReminderOptions = state.vehicleOptions.reminderOptions.length
    ? state.vehicleOptions.reminderOptions.map((o) => `<option value="${o.days}" ${String(vehicle.stnkReminderDays) === String(o.days) ? "selected" : ""}>${state.language === "id" ? o.labelId : o.labelEn}</option>`).join("")
    : "";

  document.getElementById("screen-my-zenix").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("myZenix")}</p>
          <h3>${carNickname || carModel || t("appTitle")}</h3>
        </div>
      </div>

      ${renderReminderBanner()}

      <article class="car-profile-card">
        <div class="car-hero ${carPhoto ? "car-photo-hero" : ""}">
          ${carPhoto ? `<img src="${carPhoto}" alt="Car photo" class="car-photo">` : "🚙"}
        </div>
        <div class="car-profile-body">
          <div class="upload-row">
            <label class="upload-label" for="carPhotoInput">
              <span class="upload-icon">📷</span>
              <span>${carPhoto ? t("changeCarPhoto") : t("uploadCarPhoto")}</span>
            </label>
            <input type="file" id="carPhotoInput" accept="image/*" class="hidden-file-input">
            ${carPhoto ? `<button type="button" class="ghost-button upload-remove" data-remove-car>${t("remove")}</button>` : ""}
          </div>
          <div class="car-detail-grid">
            <div class="car-detail-item">
              <span>${t("model")}</span>
              <strong>${vehicle.model || t("notSet")}</strong>
            </div>
            <div class="car-detail-item">
              <span>${t("year")}</span>
              <strong>${vehicle.year || t("notSet")}</strong>
            </div>
            <div class="car-detail-item">
              <span>${t("plateNumber")}</span>
              <strong>${vehicle.plateNumber || t("notSet")}</strong>
            </div>
            <div class="car-detail-item">
              <span>${t("carNickname")}</span>
              <strong>${vehicle.nickname || t("notSet")}</strong>
            </div>
          </div>
        </div>
      </article>

      <article class="member-card">
        <div class="member-card-top">
          <div class="avatar-circle large-avatar">
            ${avatarPhoto ? `<img src="${avatarPhoto}" alt="Profile" class="avatar-photo">` : state.user.name.charAt(0)}
          </div>
          <div>
            <strong>${state.user.name}</strong>
            <p class="muted">@${state.user.username} · ${state.user.role}</p>
          </div>
        </div>
        <div class="upload-row compact">
          <label class="upload-label" for="avatarPhotoInput">
            <span class="upload-icon">🖼</span>
            <span>${avatarPhoto ? t("changeProfilePhoto") : t("uploadProfilePhoto")}</span>
          </label>
          <input type="file" id="avatarPhotoInput" accept="image/*" class="hidden-file-input">
          ${avatarPhoto ? `<button type="button" class="ghost-button upload-remove" data-remove-avatar>${t("remove")}</button>` : ""}
        </div>
        <div class="member-detail-grid">
          <div class="member-detail-item">
            <span>${t("phone")}</span>
            <strong>${person.phone || state.user.phone || t("notSet")}</strong>
          </div>
          <div class="member-detail-item">
            <span>${t("chapter")}</span>
            <strong>${state.chapters.find((c) => String(c.id) === String(person.chapterId))?.name || t("notSet")}</strong>
          </div>
          <div class="member-detail-item">
            <span>${t("memberNumber")}</span>
            <strong>${person.memberNumber || t("notSet")}</strong>
          </div>
          <div class="member-detail-item">
            <span>${t("year")}</span>
            <strong>${vehicle.year || t("notSet")}</strong>
          </div>
        </div>
      </article>

      ${renderPointsSection()}
      ${renderMyOrdersSection()}

      <form id="profileForm">
        <article class="member-card">
          <div class="section-title-row">
            <div>
              <p class="section-kicker">${t("person")}</p>
              <h3>${t("person")}</h3>
            </div>
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label for="fullName">${t("fullName")}</label>
              <input id="fullName" name="fullName" type="text" value="${person.name || state.user.name || ""}" required>
            </div>
            <div class="input-group">
              <label for="memberNumber">${t("memberNumber")}</label>
              <input id="memberNumber" name="memberNumber" type="text" value="${person.memberNumber || ""}" readonly>
            </div>
            <div class="input-group">
              <label for="email">${t("email")}</label>
              <input id="email" name="email" type="email" value="${person.email || ""}">
            </div>
            <div class="input-group">
              <label for="phone">${t("phone")}</label>
              <input id="phone" name="phone" type="tel" value="${person.phone || state.user.phone || ""}" required>
            </div>
            <div class="input-group span-2">
              <label for="address">${t("address")}</label>
              <input id="address" name="address" type="text" value="${person.address || ""}">
            </div>
            <div class="input-group">
              <label for="postalCode">${t("postalCode")}</label>
              <input id="postalCode" name="postalCode" type="text" value="${person.postalCode || ""}">
            </div>
            <div class="input-group">
              <label for="socialMedia">${t("socialMedia")}</label>
              <input id="socialMedia" name="socialMedia" type="text" value="${person.socialMedia || ""}" placeholder="@instagram">
            </div>
            <div class="input-group">
              <label for="tshirtSize">${t("tshirtSize")}</label>
              <select id="tshirtSize" name="tshirtSize">
                <option value="">${t("notSet")}</option>
                ${tshirtOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="chapterId">${t("chapter")}</label>
              <select id="chapterId" name="chapterId">
                <option value="">${t("selectChapter")}</option>
                ${chapterOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="language">${t("language")}</label>
              <select id="language" name="language">
                <option value="id" ${state.language === "id" ? "selected" : ""}>Bahasa Indonesia</option>
                <option value="en" ${state.language === "en" ? "selected" : ""}>English</option>
              </select>
            </div>
          </div>
        </article>

        <article class="member-card">
          <div class="section-title-row">
            <div>
              <p class="section-kicker">${t("car")}</p>
              <h3>${t("car")}</h3>
            </div>
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label for="carNickname">${t("carNickname")}</label>
              <input id="carNickname" name="carNickname" type="text" value="${vehicle.nickname || fallback.nickname || ""}">
            </div>
            <div class="input-group">
              <label for="plateNumber">${t("plateNumber")}</label>
              <input id="plateNumber" name="plateNumber" type="text" value="${vehicle.plateNumber || fallback.plateNumber || ""}">
            </div>
            <div class="input-group">
              <label for="carModel">${t("model")}</label>
              <select id="carModel" name="carModel">
                <option value="">${t("notSet")}</option>
                ${modelOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="powertrain">${t("powertrain")}</label>
              <select id="powertrain" name="powertrain">
                <option value="">${t("notSet")}</option>
                ${powertrainOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="carYear">${t("year")}</label>
              <select id="carYear" name="carYear">
                <option value="">${t("notSet")}</option>
                ${yearOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="color">${t("color")}</label>
              <input id="color" name="color" type="text" value="${vehicle.color || ""}">
            </div>
            <div class="input-group">
              <label for="stnkExpiryDate">${t("stnkExpiry")}</label>
              <input id="stnkExpiryDate" name="stnkExpiryDate" type="date" value="${normalizeForInput(vehicle.stnkExpiryDate)}">
            </div>
            <div class="input-group">
              <label for="stnkReminderDays">${t("stnkReminder")}</label>
              <select id="stnkReminderDays" name="stnkReminderDays">
                <option value="">${t("notSet")}</option>
                ${stnkReminderOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="lastMaintenanceDate">${t("lastMaintenance")}</label>
              <input id="lastMaintenanceDate" name="lastMaintenanceDate" type="date" value="${normalizeForInput(vehicle.lastMaintenanceDate)}">
            </div>
            <div class="input-group">
              <label for="nextMaintenanceDate">${t("nextMaintenance")}</label>
              <input id="nextMaintenanceDate" name="nextMaintenanceDate" type="date" value="${normalizeForInput(vehicle.nextMaintenanceDate)}">
            </div>
            <div class="input-group">
              <label for="lastMaintenanceKm">${t("lastMaintenanceKm")}</label>
              <input id="lastMaintenanceKm" name="lastMaintenanceKm" type="number" value="${vehicle.lastMaintenanceKm || ""}">
            </div>
            <div class="input-group">
              <label for="nextMaintenanceKm">${t("nextMaintenanceKm")}</label>
              <input id="nextMaintenanceKm" name="nextMaintenanceKm" type="number" value="${vehicle.nextMaintenanceKm || ""}">
            </div>
            <div class="input-group">
              <label for="maintenanceReminderDays">${t("maintenanceReminder")}</label>
              <select id="maintenanceReminderDays" name="maintenanceReminderDays">
                <option value="">${t("notSet")}</option>
                ${reminderOptions}
              </select>
            </div>
          </div>
          <div class="car-form-actions">
            <button class="primary-button" type="submit">${t("saveChanges")}</button>
            <button class="ghost-button" type="button" id="clearProfileForm">${t("reset")}</button>
          </div>
        </article>
      </form>
    </section>
  `;

  document.getElementById("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      person: {
        name: form.get("fullName"),
        email: form.get("email"),
        phone: form.get("phone"),
        address: form.get("address"),
        postalCode: form.get("postalCode"),
        socialMedia: form.get("socialMedia"),
        tshirtSize: form.get("tshirtSize"),
        chapterId: form.get("chapterId"),
        language: form.get("language"),
      },
      vehicle: {
        nickname: form.get("carNickname"),
        plateNumber: form.get("plateNumber"),
        model: form.get("carModel"),
        powertrain: form.get("powertrain"),
        year: form.get("carYear"),
        color: form.get("color"),
        stnkExpiryDate: form.get("stnkExpiryDate") || null,
        stnkReminderDays: form.get("stnkReminderDays") || null,
        lastMaintenanceDate: form.get("lastMaintenanceDate") || null,
        nextMaintenanceDate: form.get("nextMaintenanceDate") || null,
        lastMaintenanceKm: form.get("lastMaintenanceKm") || null,
        nextMaintenanceKm: form.get("nextMaintenanceKm") || null,
        maintenanceReminderDays: form.get("maintenanceReminderDays") || null,
      },
    };
    try {
      const result = await api("/api/profile", { method: "PUT", body: JSON.stringify(payload) });
      state.profile = result.user;
      state.vehicle = result.vehicle;
      state.reminders = result.reminders || [];
      state.user = result.user;
      state.language = result.user.language || state.language;
      localStorage.setItem(languageKey(), state.language);
      saveCarProfile({ nickname: result.vehicle?.nickname, carModel: result.vehicle?.model, carYear: String(result.vehicle?.year || ""), plateNumber: result.vehicle?.plateNumber });
      applyStaticTranslations();
      renderChrome();
      alert(t("profileSaved"));
    } catch (err) {
      alert(t("profileError") + " " + err.message);
    }
  });

  document.getElementById("clearProfileForm").addEventListener("click", () => {
    if (confirm(t("resetFormConfirm"))) {
      renderMyZenix();
    }
  });

  document.getElementById("language")?.addEventListener("change", (e) => {
    state.language = e.target.value;
  });

  document.getElementById("carPhotoInput")?.addEventListener("change", async (event) => {
    try {
      const base64 = await readFileBase64(event.target.files[0]);
      if (base64) saveCarPhoto(base64);
    } catch (err) {
      alert(t("couldNotReadCarPhoto") + " " + err.message);
    }
  });

  document.querySelector("[data-remove-car]")?.addEventListener("click", () => saveCarPhoto(""));

  document.getElementById("avatarPhotoInput")?.addEventListener("change", async (event) => {
    try {
      const base64 = await readFileBase64(event.target.files[0]);
      if (base64) saveAvatarPhoto(base64);
    } catch (err) {
      alert(t("couldNotReadProfilePhoto") + " " + err.message);
    }
  });

  document.querySelector("[data-remove-avatar]")?.addEventListener("click", () => saveAvatarPhoto(""));
}

function renderPointsSection() {
  const txs = state.pointTransactions.slice(0, 10);
  return `
    <article class="member-card">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("points")}</p>
          <h3>${t("myPoints")}</h3>
        </div>
        <span class="soft-chip">${state.pointsBalance} ${t("pointsLabel")}</span>
      </div>
      <div class="points-balance">
        <strong>${state.pointsBalance}</strong>
        <span>${t("currentBalance")}</span>
      </div>
      <div class="section-title-row" style="margin-top: 16px;">
        <div>
          <p class="section-kicker">${t("pointHistory")}</p>
        </div>
      </div>
      ${txs.length ? `
        <div class="point-list">
          ${txs.map((tx) => `
            <div class="point-item">
              <div>
                <strong>${tx.source || "-"}</strong>
                <p>${tx.description || ""}</p>
                <span class="muted">${formatShortDate(tx.createdAt)}</span>
              </div>
              <span class="point-amount ${tx.amount >= 0 ? "positive" : "negative"}">${tx.amount >= 0 ? "+" : ""}${tx.amount}</span>
            </div>
          `).join("")}
        </div>
      ` : `<div class="empty-state small">${t("noTransactions")}</div>`}
      ${renderRewardsSection()}
    </article>
  `;
}

function renderRewardsSection() {
  const activeRewards = state.rewards.filter((r) => r.active);
  return `
    <div class="section-title-row" style="margin-top: 16px;">
      <div>
        <p class="section-kicker">${t("rewards")}</p>
      </div>
    </div>
    ${activeRewards.length ? `
      <div class="reward-list">
        ${activeRewards.map((reward) => `
          <div class="reward-item">
            <div>
              <strong>${reward.title}</strong>
              <p>${reward.description || ""}</p>
              <span class="muted">${reward.pointsRequired} ${t("pointsLabel")}</span>
            </div>
            <button class="primary-button small" type="button" data-redeem="${reward.id}">${t("redeem")}</button>
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty-state small">${t("noItemSelected")}</div>`}
    ${state.myRedemptions.length ? `
      <div class="section-title-row" style="margin-top: 16px;">
        <div>
          <p class="section-kicker">${t("myRedemptions")}</p>
        </div>
      </div>
      <div class="point-list">
        ${state.myRedemptions.slice(0, 5).map((r) => `
          <div class="point-item">
            <div>
              <strong>${r.rewardTitle || "-"}</strong>
              <span class="muted">${r.status} · ${r.pointsCost} ${t("pointsLabel")}</span>
            </div>
          </div>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function renderMyOrdersSection() {
  const orders = state.myOrders.slice(0, 10);
  return `
    <article class="member-card">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("merchandise")}</p>
          <h3>${t("myOrders")}</h3>
        </div>
      </div>
      ${orders.length ? `
        <div class="point-list">
          ${orders.map((o) => `
            <div class="point-item">
              <div>
                <strong>${o.productTitle || "-"}</strong>
                <p>${o.orderNumber} · ${o.quantity}x ${o.variantLabel || ""}</p>
                <span class="muted">${formatPrice(o.totalPrice)} · ${o.status}</span>
              </div>
            </div>
          `).join("")}
        </div>
      ` : `<div class="empty-state small">${t("noItemSelected")}</div>`}
    </article>
  `;
}

async function requestRedemption(rewardId) {
  try {
    await api("/api/redemptions", { method: "POST", body: JSON.stringify({ rewardId }) });
    alert(t("redemptionRequested"));
    await loadMemberPhase2Data();
    renderMyZenix();
  } catch (err) {
    alert(err.message);
  }
}

function renderEvents() {
  const upcoming = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  document.getElementById("screen-events").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("eventRegistration")}</p>
          <h3>${t("upcomingClubPlans")}</h3>
        </div>
        <span class="soft-chip">${upcoming.length} ${t("eventsCount")}</span>
      </div>

      <div class="event-stack">
        ${upcoming.map((event, index) => {
          const mine = getUserRsvp(event);
          return `
            <article class="event-registration-card" data-event-id="${event.id}" role="button" tabindex="0">
              <div class="event-registration-cover hero-cover-${(index % 3) + 1}"></div>
              <div class="event-registration-body">
                <div class="news-meta">
                  <span>${event.category || t("eventLabel")}</span>
                  <span>${formatShortDate(event.date)}</span>
                </div>
                <h4>${event.title}</h4>
                <p>${event.summary}</p>
                <div class="event-meta">
                  <span>${event.location}</span>
                  <span>${event.host || t("clubTeam")}</span>
                </div>
                <div class="tag-row">
                  <span class="info-tag">${mine ? `RSVP: ${translateRsvp(mine.status)}` : t("openRsvp")}</span>
                  <span class="info-tag">${event.meetingPoint || t("meetingPointTBA")}</span>
                </div>
                <button class="primary-button" type="button">${t("viewEvent")}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;

  document.querySelectorAll("[data-event-id]").forEach((card) => {
    card.addEventListener("click", () => {
      location.hash = `#event-${card.dataset.eventId}`;
    });
  });
}

function renderEventDetail(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  const screen = document.getElementById("screen-event-detail");

  if (!event) {
    screen.innerHTML = `<div class="empty-state">${t("eventLabel")} ${t("notSet")}</div>`;
    return;
  }

  const mine = getUserRsvp(event);
  const counts = {
    Going: event.rsvps.filter((r) => r.status === "Going").length,
    Maybe: event.rsvps.filter((r) => r.status === "Maybe").length,
    "Not Going": event.rsvps.filter((r) => r.status === "Not Going").length
  };

  const myCheckIn = state.myCheckIns.find((ci) => ci.eventId === event.id);

  screen.innerHTML = `
    <section class="content-section">
      <article class="event-detail-shell">
        <div class="event-registration-cover hero-cover-2"></div>
        <div class="detail-card">
          <div class="toolbar">
            <a class="ghost-button" href="#events">${t("back")}</a>
            <a class="ghost-button" href="#home">${t("home")}</a>
          </div>
          <p class="section-kicker">${event.category || t("eventDetail")}</p>
          <h3>${event.title}</h3>
          <div class="event-meta">
            <span>${formatDate(event.date)}</span>
            <span>${event.location}</span>
          </div>
          <p>${event.description}</p>
          <div class="member-detail-grid compact-grid">
            <div class="member-detail-item">
              <span>${t("host")}</span>
              <strong>${event.host || t("clubTeam")}</strong>
            </div>
            <div class="member-detail-item">
              <span>${t("meetingPoint")}</span>
              <strong>${event.meetingPoint || t("sharedLater")}</strong>
            </div>
          </div>
          <div class="section-title-row">
            <div>
              <p class="section-kicker">${t("yourRsvp")}</p>
              <h3>${mine ? translateRsvp(mine.status) : t("chooseResponse")}</h3>
            </div>
          </div>
          <div class="pill-group">
            ${["Going", "Maybe", "Not Going"].map((status) => `
              <button class="status-button ${mine && mine.status === status ? "active" : ""}" data-rsvp="${status}" type="button">${translateRsvp(status)}</button>
            `).join("")}
          </div>
          <div class="rsvp-summary">
            <div class="stat-row">
              <strong>${counts.Going}</strong><span>${t("goingShort")}</span>
              <strong>${counts.Maybe}</strong><span>${t("maybeShort")}</span>
              <strong>${counts["Not Going"]}</strong><span>${t("notGoingShort")}</span>
            </div>
          </div>

          ${event.checkInEnabled ? `
            <div class="checkin-section" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
              <div class="section-title-row">
                <div>
                  <p class="section-kicker">${t("checkIn")}</p>
                  <h3>${myCheckIn ? t("alreadyCheckedIn") : t("checkInToken")}</h3>
                </div>
              </div>
              ${myCheckIn ? `
                <p class="muted">${formatDate(myCheckIn.checkedInAt)}</p>
                <div class="input-group" style="margin-top: 12px;">
                  <label>${t("uploadAttendancePhotos")}</label>
                  <input type="file" id="attendancePhotoInput" accept="image/*" multiple>
                </div>
                <button class="primary-button" type="button" id="uploadAttendancePhotos">${t("uploadPhotos")}</button>
              ` : `
                <div class="input-group">
                  <label for="checkInToken">${t("enterQrToken")}</label>
                  <input id="checkInToken" name="checkInToken" type="text" placeholder="QR token">
                </div>
                <button class="primary-button" type="button" id="eventCheckInButton">${t("checkIn")}</button>
              `}
              <div id="checkInMessage" style="margin-top: 10px;"></div>
            </div>
          ` : ""}
        </div>
      </article>
    </section>
  `;

  screen.querySelectorAll("[data-rsvp]").forEach((button) => {
    button.addEventListener("click", async () => {
      const status = button.dataset.rsvp;
      const mine = getUserRsvp(event);
      const previousStatus = mine ? mine.status : null;

      // Optimistic update: reflect choice immediately without waiting for the server
      if (mine) {
        mine.status = status;
      } else {
        event.rsvps.push({ userId: state.user.id, status: status });
      }
      renderEventDetail(event.id);

      // Sync to server in the background; only refresh when done
      try {
        await api(`/api/events/${event.id}/rsvp`, {
          method: "POST",
          body: JSON.stringify({ status: status })
        });
        await loadData();
        renderEventDetail(event.id);
      } catch (err) {
        console.error("RSVP failed", err);
        // Revert on failure
        const current = getUserRsvp(event);
        if (current) {
          if (previousStatus) {
            current.status = previousStatus;
          } else {
            event.rsvps = event.rsvps.filter((r) => r.userId !== state.user.id);
          }
        }
        renderEventDetail(event.id);
      }
    });
  });

  const checkInButton = screen.querySelector("#eventCheckInButton");
  if (checkInButton) {
    checkInButton.addEventListener("click", async () => {
      const token = document.getElementById("checkInToken").value.trim();
      const msg = document.getElementById("checkInMessage");
      try {
        await api(`/api/events/${event.id}/check-in`, {
          method: "POST",
          body: JSON.stringify({ qrToken: token, method: "qr" })
        });
        msg.textContent = t("checkInSuccess");
        await loadMemberPhase2Data();
        navigate(`#event-${event.id}`);
      } catch (err) {
        msg.textContent = t("checkInFailed") + " " + err.message;
      }
    });
  }

  const uploadPhotosButton = screen.querySelector("#uploadAttendancePhotos");
  if (uploadPhotosButton) {
    uploadPhotosButton.addEventListener("click", async () => {
      const input = document.getElementById("attendancePhotoInput");
      const files = Array.from(input.files || []).slice(0, 3);
      if (!files.length) return;
      const photos = await Promise.all(files.map((f) => readFileBase64(f)));
      const msg = document.getElementById("checkInMessage");
      try {
        await api(`/api/check-ins/${myCheckIn.id}/photos`, {
          method: "POST",
          body: JSON.stringify({ photos: photos.filter(Boolean) })
        });
        msg.textContent = t("photosUploaded");
        await loadMemberPhase2Data();
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }
}

function translateRsvp(status) {
  if (status === "Going") return t("going");
  if (status === "Maybe") return t("maybe");
  if (status === "Not Going") return t("notGoing");
  return status;
}

function renderVendors(searchQuery = "") {
  const query = searchQuery.toLowerCase();
  const filtered = state.vendors.filter((v) =>
    v.name.toLowerCase().includes(query) ||
    v.category.toLowerCase().includes(query) ||
    v.description.toLowerCase().includes(query)
  );

  document.getElementById("screen-vendors").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("vendorDirectory")}</p>
          <h3>${t("trustedPartners")}</h3>
        </div>
        <span class="soft-chip">${filtered.length} ${t("partner").toLowerCase()}</span>
      </div>
      <input id="vendorSearch" class="vendor-search" type="text" placeholder="${t("searchVendors")}" value="${searchQuery}">
      <div class="vendor-grid">
        ${filtered.map((vendor, index) => `
          <article class="vendor-card">
            <div class="vendor-cover vendor-cover-${(index % 4) + 1}"></div>
            <div class="vendor-body">
              <div class="vendor-meta">
                <span class="info-tag">${vendor.category}</span>
              </div>
              <h4>${vendor.name}</h4>
              <p>${vendor.description}</p>
              <div class="vendor-actions">
                ${vendor.whatsapp ? `<a class="primary-button vendor-whatsapp" href="https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}" target="_blank" rel="noreferrer">${t("chatWhatsapp")}</a>` : ""}
              </div>
            </div>
          </article>
        `).join("")}
      </div>
      ${filtered.length === 0 ? `<div class="empty-state">${t("noVendorsFound")}</div>` : ""}
    </section>
  `;

  document.getElementById("vendorSearch")?.addEventListener("input", (event) => {
    renderVendors(event.target.value);
  });
}

function renderMerchandise() {
  document.getElementById("screen-merchandise").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("merchandise")}</p>
          <h3>${t("clubStore")}</h3>
        </div>
      </div>
      <div class="merch-grid">
        ${state.products.map((item, index) => `
          <article class="merch-card" data-product-index="${index}" role="button" tabindex="0">
            <div class="merch-cover ${item.image || "merch-cover-red"}"></div>
            <div class="merch-body">
              <div class="news-meta">
                <span>${t("clubStore")}</span>
                <span>${formatPrice(item.price)}</span>
              </div>
              <h4>${item.title}</h4>
              <p>${item.points ? `+${item.points} ${t("pointsLabel")}` : ""}</p>
            </div>
          </article>
        `).join("")}
      </div>
      ${state.products.length === 0 ? `<div class="empty-state">${t("noItemSelected")}</div>` : ""}
    </section>
  `;

  document.querySelectorAll("[data-product-index]").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.productIndex);
      state.selectedProduct = state.products[index];
      location.hash = "#product-detail";
    });
  });
}

function renderSponsorDetail() {
  const screen = document.getElementById("screen-sponsor-detail");
  const sponsor = state.selectedSponsor;
  if (!sponsor) {
    screen.innerHTML = `<div class="empty-state">${t("noSponsorSelected")}</div>`;
    return;
  }

  screen.innerHTML = `
    <section class="content-section">
      <article class="event-detail-shell">
        <div class="sponsor-logo large-logo ${sponsor.logoClass}">${sponsor.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
        <div class="detail-card">
          <p class="section-kicker">${t("trustedPartner")}</p>
          <h3>${sponsor.name}</h3>
          <div class="event-meta">
            <span class="info-tag">${sponsor.category}</span>
          </div>
          <div class="detail-placeholder">
            <p>${t("partnerDetailsPage")}</p>
            <p class="muted">${t("readyToFill")}</p>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderMerchDetail() {
  const screen = document.getElementById("screen-merch-detail");
  const item = state.selectedMerch;
  if (!item) {
    screen.innerHTML = `<div class="empty-state">${t("noItemSelected")}</div>`;
    return;
  }

  screen.innerHTML = `
    <section class="content-section">
      <article class="event-detail-shell">
        <div class="merch-cover detail-cover ${item.image || "merch-cover-red"}"></div>
        <div class="detail-card">
          <p class="section-kicker">${t("clubStore")}</p>
          <h3>${item.title}</h3>
          <div class="event-meta">
            <span>${item.price}</span>
          </div>
          <p>${item.description}</p>
          <div class="detail-placeholder">
            <p>${t("itemDetailsPage")}</p>
            <p class="muted">${t("readyToFill")}</p>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderProductDetail() {
  const screen = document.getElementById("screen-product-detail");
  const product = state.selectedProduct;
  if (!product) {
    screen.innerHTML = `<div class="empty-state">${t("noItemSelected")}</div>`;
    return;
  }

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const variantOptions = variants.map((v) => `<option value="${v.id}">${v.label} ${formatPriceAdjustment(v.priceAdjustment)} ${stockLabel(v)}</option>`).join("");
  const person = state.profile || {};

  screen.innerHTML = `
    <section class="content-section">
      <article class="event-detail-shell">
        <div class="merch-cover detail-cover ${product.image || "merch-cover-red"}"></div>
        <div class="detail-card">
          <div class="toolbar">
            <a class="ghost-button" href="#merchandise">${t("back")}</a>
            <a class="ghost-button" href="#home">${t("home")}</a>
          </div>
          <p class="section-kicker">${t("clubStore")}</p>
          <h3>${product.title}</h3>
          <div class="event-meta">
            <span class="info-tag">${formatPrice(product.price)}</span>
            ${product.points ? `<span class="info-tag">+${product.points} ${t("pointsLabel")}</span>` : ""}
          </div>
          <p>${product.description || ""}</p>

          <form id="orderForm" class="form-grid" style="margin-top: 18px;">
            <div class="input-group span-2">
              <label for="orderVariant">${t("tshirtSize")} / ${t("model")}</label>
              <select id="orderVariant" name="variantId" ${!hasVariants ? "disabled" : ""}>
                <option value="">${t("notSet")}</option>
                ${variantOptions}
              </select>
            </div>
            <div class="input-group">
              <label for="orderQuantity">${t("quantity") || "Qty"}</label>
              <input id="orderQuantity" name="quantity" type="number" min="1" value="1" required>
            </div>
            <div class="input-group">
              <label for="orderPoints">${t("points")}</label>
              <input id="orderPoints" name="pointsUsed" type="number" min="0" max="${Math.min(Number(product.price) || 0, state.pointsBalance)}" value="0">
            </div>
            <div class="input-group span-2">
              <label for="orderRecipient">${t("fullName")}</label>
              <input id="orderRecipient" name="recipientName" type="text" value="${person.name || state.user.name || ""}" required>
            </div>
            <div class="input-group span-2">
              <label for="orderAddress">${t("address")}</label>
              <input id="orderAddress" name="address" type="text" value="${person.address || ""}" required>
            </div>
            <div class="input-group">
              <label for="orderPostalCode">${t("postalCode")}</label>
              <input id="orderPostalCode" name="postalCode" type="text" value="${person.postalCode || ""}">
            </div>
            <div class="input-group">
              <label for="orderPhone">${t("phone")}</label>
              <input id="orderPhone" name="phone" type="tel" value="${person.phone || state.user.phone || ""}" required>
            </div>
            <div class="input-group span-2">
              <label for="orderPaymentProof">${t("paymentProofUpload")}</label>
              <input id="orderPaymentProof" name="paymentProof" type="file" accept="image/*">
            </div>
            <div class="input-group span-2">
              <button class="primary-button" type="submit">${t("order") || "Order"}</button>
            </div>
          </form>
          <div id="orderMessage" class="form-message" style="margin-top: 12px;"></div>
        </div>
      </article>
    </section>
  `;

  document.getElementById("orderForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const variantId = form.get("variantId") || null;
    const quantity = Number(form.get("quantity")) || 1;
    const pointsUsed = Number(form.get("pointsUsed")) || 0;
    const paymentFile = document.getElementById("orderPaymentProof").files[0];

    try {
      const order = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          variantId: variantId,
          quantity: quantity,
          pointsUsed: pointsUsed,
          recipientName: form.get("recipientName"),
          address: form.get("address"),
          postalCode: form.get("postalCode"),
          phone: form.get("phone")
        })
      });

      if (paymentFile) {
        const paymentProofImage = await readFileBase64(paymentFile);
        await api(`/api/orders/${order.id}/payment`, {
          method: "POST",
          body: JSON.stringify({ paymentProofImage })
        });
      }

      document.getElementById("orderMessage").textContent = `Order ${order.orderNumber} ${paymentFile ? "dan bukti pembayaran" : "dibuat"}.`;
      document.getElementById("orderMessage").className = "form-message success";
      await loadMemberPhase2Data();
    } catch (err) {
      const msg = document.getElementById("orderMessage");
      msg.textContent = err.message;
      msg.className = "form-message error";
    }
  });
}

function formatPriceAdjustment(value) {
  const num = Number(value) || 0;
  if (num === 0) return "";
  return `(${num > 0 ? "+" : ""}${formatPrice(num)})`;
}

function stockLabel(variant) {
  if (variant.stock > 0) return `· ${variant.stock} ${t("stock") || "stock"}`;
  if (variant.allowPreorder) return `· ${t("preorder") || "preorder"}`;
  return `· ${t("outOfStock") || "out of stock"}`;
}

function renderMerchantPartners() {
  document.getElementById("screen-merchant-partners").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("merchantPartner")}</p>
          <h3>${t("merchantPartners")}</h3>
        </div>
      </div>
      <div class="sponsor-grid">
        ${state.merchantPartners.map((partner, index) => `
          <article class="sponsor-card" data-merchant-index="${index}" role="button" tabindex="0">
            <div class="sponsor-logo ${partner.logo || "sponsor-tone-2"}">${partner.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
            <strong>${partner.name}</strong>
            <span>${partner.description || t("merchantPartner")}</span>
          </article>
        `).join("")}
      </div>
      ${state.merchantPartners.length === 0 ? `<div class="empty-state">${t("noVendorsFound")}</div>` : ""}
    </section>
  `;

  document.querySelectorAll("[data-merchant-index]").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.merchantIndex);
      state.selectedMerchant = state.merchantPartners[index];
      location.hash = `#merchant-${state.selectedMerchant.id}`;
    });
  });
}

async function renderMerchantDetail(merchantId) {
  const screen = document.getElementById("screen-merchant-detail");
  const merchant = state.merchantPartners.find((m) => m.id === merchantId) || state.selectedMerchant;
  if (!merchant) {
    screen.innerHTML = `<div class="empty-state">${t("noVendorsFound")}</div>`;
    return;
  }
  state.selectedMerchant = merchant;

  let products = [];
  try {
    products = await api(`/api/public/products?merchant_id=${merchant.id}`);
  } catch (err) {
    console.error("Failed to load merchant products", err);
  }

  screen.innerHTML = `
    <section class="content-section">
      <article class="event-detail-shell">
        <div class="sponsor-logo large-logo ${merchant.logo || "sponsor-tone-2"}">${merchant.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
        <div class="detail-card">
          <div class="toolbar">
            <a class="ghost-button" href="#merchant-partners">${t("back")}</a>
            <a class="ghost-button" href="#home">${t("home")}</a>
          </div>
          <p class="section-kicker">${t("merchantPartner")}</p>
          <h3>${merchant.name}</h3>
          <div class="event-meta">
            ${merchant.contact ? `<span class="info-tag">${merchant.contact}</span>` : ""}
          </div>
          <p>${merchant.description || ""}</p>

          <div class="section-title-row" style="margin-top: 24px;">
            <div>
              <p class="section-kicker">${t("merchandise")}</p>
              <h3>${t("clubStore")}</h3>
            </div>
          </div>
          <div class="merch-grid">
            ${products.map((item, index) => `
              <article class="merch-card" data-merchant-product-index="${index}" role="button" tabindex="0">
                <div class="merch-cover ${item.image || "merch-cover-sand"}"></div>
                <div class="merch-body">
                  <div class="news-meta">
                    <span>${formatPrice(item.price)}</span>
                    <span>${item.points ? `+${item.points} ${t("pointsLabel")}` : ""}</span>
                  </div>
                  <h4>${item.title}</h4>
                </div>
              </article>
            `).join("")}
          </div>
          ${products.length === 0 ? `<div class="empty-state small">${t("noItemSelected")}</div>` : ""}
        </div>
      </article>
    </section>
  `;

  document.querySelectorAll("[data-merchant-product-index]").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.merchantProductIndex);
      state.selectedProduct = products[index];
      location.hash = "#product-detail";
    });
  });
}

function renderLeaderboard() {
  document.getElementById("screen-leaderboard").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">${t("leaderboard")}</p>
          <h3>${t("leaderboardTitle")}</h3>
        </div>
      </div>
      <div class="form-grid" style="margin-bottom: 16px;">
        <div class="input-group">
          <label for="leaderboardPeriod">${t("period")}</label>
          <select id="leaderboardPeriod">
            <option value="monthly">${t("monthly")}</option>
            <option value="quarterly">${t("quarterly")}</option>
            <option value="yearly">${t("yearly")}</option>
          </select>
        </div>
        <div class="input-group">
          <label for="leaderboardDate">${t("date")}</label>
          <input id="leaderboardDate" type="date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
      </div>
      <button class="primary-button" id="loadLeaderboardButton" type="button">${t("load")}</button>
      <div id="leaderboardResults" style="margin-top: 16px;"></div>
    </section>
  `;

  document.getElementById("loadLeaderboardButton").addEventListener("click", async () => {
    const period = document.getElementById("leaderboardPeriod").value;
    const date = document.getElementById("leaderboardDate").value;
    try {
      const data = await api(`/api/leaderboard?period=${period}&date=${date}`);
      renderLeaderboardResults(data);
    } catch (err) {
      document.getElementById("leaderboardResults").innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  });
}

function renderLeaderboardResults(data) {
  const entries = data.entries || [];
  document.getElementById("leaderboardResults").innerHTML = entries.length ? `
    <div class="leaderboard-list">
      ${entries.map((entry) => `
        <div class="leaderboard-item ${entry.rank <= 3 ? "top" : ""}">
          <div class="leaderboard-rank">#${entry.rank}</div>
          <div class="leaderboard-info">
            <strong>${entry.name || "-"}</strong>
            <span class="muted">${entry.memberNumber || ""} · ${entry.chapter || "-"}</span>
          </div>
          <div class="leaderboard-points">${entry.points} ${t("pointsLabel")}</div>
        </div>
      `).join("")}
    </div>
  ` : `<div class="empty-state">No entries for this period.</div>`;
}

function renderRegistrationForm() {
  const chapterOptions = state.publicChapters.length
    ? state.publicChapters.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")
    : `<option value="">${t("selectChapter")}</option>`;

  const modelOptions = state.publicVehicleOptions.models.length
    ? state.publicVehicleOptions.models.map((m) => `<option value="${m.code}">${m.label}</option>`).join("")
    : `<option value="">G / V / Q</option>`;

  const powertrainOptions = state.publicVehicleOptions.powertrains.length
    ? state.publicVehicleOptions.powertrains.map((p) => `<option value="${p.code}">${p.label}</option>`).join("")
    : `<option value="">Gasoline / Hybrid</option>`;

  const yearOptions = state.publicVehicleOptions.years.length
    ? state.publicVehicleOptions.years.map((y) => `<option value="${y}">${y}</option>`).join("")
    : `<option value="">2023 / 2024 / 2025</option>`;

  const tshirtOptions = state.publicVehicleOptions.tshirtSizes.length
    ? state.publicVehicleOptions.tshirtSizes.map((s) => `<option value="${s}">${s}</option>`).join("")
    : "";

  document.getElementById("registerFields").innerHTML = `
    <div class="form-grid">
      <div class="input-group span-2">
        <label for="regFullName">${t("fullName")} *</label>
        <input id="regFullName" name="fullName" type="text" required>
      </div>
      <div class="input-group">
        <label for="regEmail">${t("email")}</label>
        <input id="regEmail" name="email" type="email">
      </div>
      <div class="input-group">
        <label for="regPhone">${t("phone")} *</label>
        <input id="regPhone" name="phone" type="tel" required>
      </div>
      <div class="input-group span-2">
        <label for="regAddress">${t("address")}</label>
        <input id="regAddress" name="address" type="text">
      </div>
      <div class="input-group">
        <label for="regPostalCode">${t("postalCode")}</label>
        <input id="regPostalCode" name="postalCode" type="text">
      </div>
      <div class="input-group">
        <label for="regTshirtSize">${t("tshirtSize")}</label>
        <select id="regTshirtSize" name="tshirtSize">
          <option value="">${t("notSet")}</option>
          ${tshirtOptions}
        </select>
      </div>
      <div class="input-group">
        <label for="regChapter">${t("chapter")}</label>
        <select id="regChapter" name="chapterId">
          <option value="">${t("selectChapter")}</option>
          ${chapterOptions}
        </select>
      </div>
      <div class="input-group">
        <label for="regVehicleModel">${t("model")}</label>
        <select id="regVehicleModel" name="vehicleModel">
          <option value="">${t("notSet")}</option>
          ${modelOptions}
        </select>
      </div>
      <div class="input-group">
        <label for="regPowertrain">${t("powertrain")}</label>
        <select id="regPowertrain" name="vehiclePowertrain">
          <option value="">${t("notSet")}</option>
          ${powertrainOptions}
        </select>
      </div>
      <div class="input-group">
        <label for="regYear">${t("year")}</label>
        <select id="regYear" name="vehicleYear">
          <option value="">${t("notSet")}</option>
          ${yearOptions}
        </select>
      </div>
      <div class="input-group">
        <label for="regColor">${t("color")}</label>
        <input id="regColor" name="vehicleColor" type="text">
      </div>
      <div class="input-group">
        <label for="regPlateNumber">${t("plateNumber")}</label>
        <input id="regPlateNumber" name="plateNumber" type="text">
      </div>
      <div class="input-group">
        <label for="regUsername">${t("username")} *</label>
        <input id="regUsername" name="username" type="text" required>
      </div>
      <div class="input-group">
        <label for="regPassword">${t("password")} *</label>
        <input id="regPassword" name="password" type="password" required>
      </div>
      <div class="input-group">
        <label for="regStnkImage">${t("stnkUpload")}</label>
        <input id="regStnkImage" name="stnkImage" type="file" accept="image/*">
      </div>
      <div class="input-group">
        <label for="regPaymentProofImage">${t("paymentProofUpload")}</label>
        <input id="regPaymentProofImage" name="paymentProofImage" type="file" accept="image/*">
      </div>
      <div class="input-group">
        <label for="regLocationLat">${t("locationPin")} lat</label>
        <input id="regLocationLat" name="locationLat" type="text" placeholder="-6.2088">
      </div>
      <div class="input-group">
        <label for="regLocationLon">${t("locationPin")} lon</label>
        <input id="regLocationLon" name="locationLon" type="text" placeholder="106.8456">
      </div>
    </div>
  `;
}

async function submitRegistration(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const files = {
    stnk: form.querySelector("[name=stnkImage]")?.files?.[0],
    payment: form.querySelector("[name=paymentProofImage]")?.files?.[0]
  };
  const [stnkImage, paymentProofImage] = await Promise.all([
    files.stnk ? readFileBase64(files.stnk) : "",
    files.payment ? readFileBase64(files.payment) : ""
  ]);
  const payload = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    tshirtSize: formData.get("tshirtSize"),
    chapterId: formData.get("chapterId"),
    vehicleModel: formData.get("vehicleModel"),
    vehiclePowertrain: formData.get("vehiclePowertrain"),
    vehicleYear: formData.get("vehicleYear"),
    vehicleColor: formData.get("vehicleColor"),
    plateNumber: formData.get("plateNumber"),
    username: formData.get("username"),
    password: formData.get("password"),
    stnkImage: stnkImage || undefined,
    paymentProofImage: paymentProofImage || undefined,
    locationLat: formData.get("locationLat"),
    locationLon: formData.get("locationLon"),
  };
  try {
    await api("/api/register", { method: "POST", body: JSON.stringify(payload) });
    document.getElementById("registerMessage").textContent = t("registrationSent");
    document.getElementById("registerMessage").className = "form-message success";
    form.reset();
  } catch (err) {
    document.getElementById("registerMessage").textContent = t("registrationFailed") + " " + err.message;
    document.getElementById("registerMessage").className = "form-message error";
  }
}

function renderChrome() {
  document.getElementById("greetingName").textContent = state.user.name.split(" ")[0];
  document.getElementById("drawerName").textContent = state.user.name;
  document.getElementById("drawerUsername").textContent = `@${state.user.username}`;
  const drawerAvatar = document.getElementById("drawerAvatar");
  const avatarPhoto = state.avatarPhoto;
  if (drawerAvatar) {
    drawerAvatar.innerHTML = avatarPhoto ? `<img src="${avatarPhoto}" alt="Profile" class="avatar-photo small">` : state.user.name.charAt(0);
  }
  loadCarProfile();
  applyStaticTranslations();
  renderHome();
  renderMyZenix();
  renderEvents();
  renderVendors();
  renderMerchantPartners();
  renderMerchandise();
}

function navigate(hash) {
  if (!state.user) {
    return;
  }

  closeDrawer();

  if (!hash || hash === "#") {
    location.hash = "#home";
    return;
  }

  if (hash.startsWith("#event-")) {
    renderEventDetail(Number(hash.replace("#event-", "")));
    setActiveScreen("event-detail");
    return;
  }

  if (hash.startsWith("#merchant-")) {
    renderMerchantDetail(Number(hash.replace("#merchant-", "")));
    setActiveScreen("merchant-detail");
    return;
  }

  const screen = hash.replace("#", "");
  if (screens.includes(screen)) {
    setActiveScreen(screen);
    if (screen === "vendors") renderVendors();
    if (screen === "sponsor-detail") renderSponsorDetail();
    if (screen === "merch-detail") renderMerchDetail();
    if (screen === "product-detail") renderProductDetail();
    if (screen === "merchant-partners") renderMerchantPartners();
    if (screen === "leaderboard") renderLeaderboard();
  } else {
    location.hash = "#home";
  }
}

function rotateHero() {
  const slides = getHeroSlides();
  if (!slides.length) return;
  state.heroIndex = (state.heroIndex + 1) % slides.length;
  if (!document.getElementById("screen-home").classList.contains("hidden")) {
    renderHome();
  }
  const duration = slides[state.heroIndex]?.durationMs || 5000;
  state.heroTimer = setTimeout(rotateHero, duration);
}

function startHeroRotation() {
  if (state.heroTimer) {
    clearTimeout(state.heroTimer);
  }
  const slides = getHeroSlides();
  if (!slides.length) return;
  const duration = slides[state.heroIndex]?.durationMs || 5000;
  state.heroTimer = setTimeout(rotateHero, duration);
}

async function loadData() {
  const [events, announcements, vendors, banners, news, products, officialPartners, merchantPartners] = await Promise.all([
    api("/api/events"),
    api("/api/announcements"),
    api("/api/vendors"),
    api("/api/public/banners"),
    api("/api/news"),
    api("/api/public/products?official=true"),
    api("/api/public/official-partners"),
    api("/api/public/merchant-partners")
  ]);
  state.events = events;
  state.announcements = announcements;
  state.vendors = vendors;
  state.banners = banners;
  state.news = news;
  state.products = products;
  state.officialPartners = officialPartners;
  state.merchantPartners = merchantPartners;
}

async function loadReferenceData() {
  try {
    const [chapters, options] = await Promise.all([
      api("/api/chapters"),
      api("/api/vehicle-options")
    ]);
    state.chapters = chapters || [];
    state.vehicleOptions = options || { models: [], powertrains: [], years: [], tshirtSizes: [], reminderOptions: [] };
  } catch (err) {
    console.error("Failed to load reference data", err);
  }
}

async function loadPublicReferenceData() {
  try {
    const [chapters, options] = await Promise.all([
      fetch((window.API_BASE_URL || "") + "/api/public/chapters").then((r) => r.json()),
      fetch((window.API_BASE_URL || "") + "/api/public/vehicle-options").then((r) => r.json())
    ]);
    state.publicChapters = chapters || [];
    state.publicVehicleOptions = options || { models: [], powertrains: [], years: [], tshirtSizes: [] };
  } catch (err) {
    console.error("Failed to load public reference data", err);
  }
}

async function loadMemberPhase2Data() {
  try {
    const [points, checkIns, rewards, redemptions, orders] = await Promise.all([
      api("/api/me/points"),
      api("/api/me/check-ins"),
      api("/api/rewards"),
      api("/api/me/redemptions"),
      api("/api/me/orders")
    ]);
    state.pointsBalance = points.balance || 0;
    state.pointTransactions = points.transactions || [];
    state.myCheckIns = checkIns || [];
    state.rewards = rewards || [];
    state.myRedemptions = redemptions || [];
    state.myOrders = orders || [];
  } catch (err) {
    console.error("Failed to load member phase2 data", err);
  }
}

async function loadProfile() {
  if (!state.user) return;
  state.loadingProfile = true;
  state.profileError = null;
  try {
    const profile = await api("/api/profile");
    state.profile = profile.user;
    state.vehicle = profile.vehicle || {};
    state.reminders = profile.reminders || [];
    state.user = profile.user;
    state.pointsBalance = profile.user.pointsBalance || 0;
    if (profile.user.language) {
      state.language = profile.user.language;
      localStorage.setItem(languageKey(), state.language);
    }
    saveCarProfile({
      nickname: profile.vehicle?.nickname,
      carModel: profile.vehicle?.model,
      carYear: String(profile.vehicle?.year || ""),
      plateNumber: profile.vehicle?.plateNumber
    });
  } catch (err) {
    state.profileError = err.message;
  } finally {
    state.loadingProfile = false;
  }
}

async function restoreSession() {
  try {
    const result = await api("/api/auth/me");
    if (result.user.role !== "member") {
      await handleLogout(false);
      return false;
    }
    state.user = result.user;
    if (result.user.language) {
      state.language = result.user.language;
      localStorage.setItem(languageKey(), result.user.language);
    }
    return true;
  } catch {
    return false;
  }
}

async function handleLogout(redirectToLogin = true) {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout failures and clear UI state.
  }
  localStorage.removeItem("api_token");
  closeDrawer();
  showLogin();
  if (redirectToLogin) {
    location.hash = "";
  }
}

async function bootApp() {
  loadTheme();
  loadLanguagePreference();
  applyStaticTranslations();
  loadPublicReferenceData(); // no auth needed
  const hasSession = await restoreSession();
  if (hasSession) {
    showApp();
    await Promise.all([loadData(), loadReferenceData(), loadMemberPhase2Data()]);
    await loadProfile();
    renderChrome();
    startHeroRotation();
    navigate(location.hash || "#home");
  } else {
    showLogin();
  }

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const msgEl = document.getElementById("loginMessage");
    if (msgEl) msgEl.textContent = "";
    try {
      const form = new FormData(event.currentTarget);
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          scope: "member"
        })
      });

      state.user = result.user;
      if (result.user.language) {
        state.language = result.user.language;
        localStorage.setItem(languageKey(), result.user.language);
      }
      localStorage.setItem("api_token", result.token);
      showApp();
      await Promise.all([loadData(), loadReferenceData(), loadMemberPhase2Data()]);
      await loadProfile();
      renderChrome();
      startHeroRotation();
      location.hash = "#home";
    } catch (err) {
      console.error(err);
      if (msgEl) {
        msgEl.textContent = err.message || "Login failed";
        msgEl.classList.add("error");
        msgEl.classList.remove("success");
      }
    }
  });

  document.querySelectorAll("[data-demo-username]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("loginUsername").value = button.dataset.demoUsername;
      document.getElementById("loginPassword").value = button.dataset.demoPassword;
      document.getElementById("loginPassword").focus();
    });
  });

  document.getElementById("showRegisterButton")?.addEventListener("click", showRegister);
  document.getElementById("backToLoginButton")?.addEventListener("click", backToLogin);
  document.getElementById("registerForm")?.addEventListener("submit", submitRegistration);

  document.getElementById("menuButton").addEventListener("click", openDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", closeDrawer);
  document.getElementById("drawerLogoutButton").addEventListener("click", handleLogout);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  document.querySelectorAll("[data-drawer-target]").forEach((button) => {
    button.addEventListener("click", () => {
      location.hash = `#${button.dataset.drawerTarget}`;
    });
  });

  window.addEventListener("hashchange", () => navigate(location.hash));

  document.body.addEventListener("click", (e) => {
    if (e.target.matches("[data-redeem]")) {
      requestRedemption(e.target.dataset.redeem);
    }
  });
}

bootApp().catch((error) => {
  alert(error.message);
});
