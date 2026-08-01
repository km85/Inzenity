const state = {
  user: null,
  events: [],
  announcements: [],
  vendors: [],
  banners: [],
  sponsors: [],
  news: [],
  merchandise: [],
  heroIndex: 0,
  heroTimer: null,
  carProfile: { nickname: "", carModel: "", carYear: "", plateNumber: "" },
  theme: "dark"
};

const screens = ["home", "my-zenix", "events", "event-detail", "vendors", "merchandise"];

async function api(path, options = {}) {
  const base = window.API_BASE_URL || "";
  const token = localStorage.getItem("api_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "X-API-Token": token } : {}),
    ...options.headers
  };
  const response = await fetch(base + path, {
    headers,
    credentials: "same-origin",
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString("en-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function carKey() {
  return `zenix:car:${state.user?.username || "guest"}`;
}

function themeKey() {
  return "zenix:theme";
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
  if (label) label.textContent = state.theme === "dark" ? "Light mode" : "Dark mode";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeKey(), state.theme);
  applyTheme();
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
}

function saveCarProfile(profile) {
  state.carProfile = { ...state.carProfile, ...profile };
  localStorage.setItem(carKey(), JSON.stringify(state.carProfile));
  renderMyZenix();
}

function showLogin() {
  state.user = null;
  document.getElementById("appView").classList.add("hidden");
  document.getElementById("loginView").classList.remove("hidden");
}

function showApp() {
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("appView").classList.remove("hidden");
}

function setActiveScreen(screen) {
  screens.forEach((name) => {
    const element = document.getElementById(`screen-${name}`);
    if (element) {
      element.classList.toggle("hidden", name !== screen);
    }
  });

  document.querySelectorAll(".member-nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.screen === screen);
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
        subtitle: matchedEvent ? (matchedEvent.category || "Club Event") : "Club Highlight",
        body: matchedEvent ? `${formatDate(matchedEvent.date)} · ${matchedEvent.location}` : "Upcoming community highlight",
        tag: matchedEvent ? (matchedEvent.host || "Club Team") : "Innova Zenix Community",
        coverClass: banner.image
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

function getSponsors() {
  const vendorMap = new Map(state.vendors.map((vendor) => [vendor.name, vendor]));
  return state.sponsors.map((sponsor) => ({
    name: sponsor.name,
    category: vendorMap.get(sponsor.name)?.category || "Partner",
    logoClass: sponsor.logo
  }));
}

function renderHome() {
  const slides = getHeroSlides();
  const activeSlide = slides[state.heroIndex % slides.length] || null;
  const newsCards = getNewsCards();
  const sponsors = getSponsors();
  const car = state.carProfile;
  const carDisplay = car.carModel || car.nickname || state.user.name.split(" ")[0] + "'s Zenix";

  document.getElementById("screen-home").innerHTML = `
    <section class="home-hero-card">
      ${activeSlide ? `
        <div class="hero-banner ${activeSlide.coverClass}">
          <div class="hero-banner-copy">
            <span class="hero-badge">${activeSlide.subtitle}</span>
            <h2>${activeSlide.title}</h2>
            <p>${activeSlide.body}</p>
            <span class="hero-support">${activeSlide.tag}</span>
          </div>
        </div>
        <div class="hero-dots">
          ${slides.map((_, index) => `<button class="hero-dot ${index === state.heroIndex % slides.length ? "active" : ""}" type="button" data-hero-index="${index}" aria-label="Go to slide ${index + 1}"></button>`).join("")}
        </div>
      ` : ""}
    </section>

    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">Sponsors</p>
          <h3>Trusted Partners</h3>
        </div>
      </div>
      <div class="sponsor-grid">
        ${sponsors.map((sponsor) => `
          <article class="sponsor-card">
            <div class="sponsor-logo ${sponsor.logoClass}">${sponsor.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
            <strong>${sponsor.name}</strong>
            <span>${sponsor.category}</span>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">Latest News</p>
          <h3>Updates for Members</h3>
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
          <p class="section-kicker">Community</p>
          <h3>Follow Us</h3>
        </div>
      </div>
      <article class="community-card">
        <div>
          <p class="section-kicker">Instagram</p>
          <p>Stay close to chapter updates, event photos, and club stories.</p>
        </div>
        <a class="primary-button" href="https://instagram.com" target="_blank" rel="noreferrer">Open Instagram</a>
      </article>
    </section>
  `;

  document.querySelectorAll("[data-hero-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.heroIndex = Number(button.dataset.heroIndex);
      renderHome();
    });
  });
}

function renderMyZenix() {
  const joinedEvents = state.events.filter((event) => {
    const rsvp = getUserRsvp(event);
    return rsvp && rsvp.status !== "Not Going";
  }).length;
  const car = state.carProfile;
  const hasCar = car.carModel || car.nickname || car.plateNumber || car.carYear;

  document.getElementById("screen-my-zenix").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">My Zenix</p>
          <h3>${car.nickname || car.carModel || "Your Innova Zenix"}</h3>
        </div>
      </div>

      <article class="car-profile-card">
        <div class="car-hero">🚙</div>
        <div class="car-profile-body">
          <div class="car-detail-grid">
            <div class="car-detail-item">
              <span>Model</span>
              <strong>${car.carModel || "Not set"}</strong>
            </div>
            <div class="car-detail-item">
              <span>Year</span>
              <strong>${car.carYear || "Not set"}</strong>
            </div>
            <div class="car-detail-item">
              <span>Plate</span>
              <strong>${car.plateNumber || "Not set"}</strong>
            </div>
            <div class="car-detail-item">
              <span>Nickname</span>
              <strong>${car.nickname || "Not set"}</strong>
            </div>
          </div>
        </div>
      </article>

      <article class="member-card">
        <div class="member-card-top">
          <div class="avatar-circle large-avatar">${state.user.name.charAt(0)}</div>
          <div>
            <strong>${state.user.name}</strong>
            <p class="muted">@${state.user.username} · ${state.user.role}</p>
          </div>
        </div>
        <div class="member-detail-grid">
          <div class="member-detail-item">
            <span>Phone</span>
            <strong>${state.user.phone}</strong>
          </div>
          <div class="member-detail-item">
            <span>City</span>
            <strong>${state.user.city}</strong>
          </div>
          <div class="member-detail-item">
            <span>Active Events</span>
            <strong>${joinedEvents}</strong>
          </div>
          <div class="member-detail-item">
            <span>Member ID</span>
            <strong>#${state.user.id.toString().padStart(4, "0")}</strong>
          </div>
        </div>
      </article>

      <article class="member-card">
        <div class="section-title-row">
          <div>
            <p class="section-kicker">Edit Profile</p>
            <h3>Update Car &amp; Member Info</h3>
          </div>
        </div>
        <form id="carProfileForm">
          <div class="input-group">
            <label for="carNickname">Car Nickname</label>
            <input id="carNickname" name="nickname" type="text" value="${car.nickname}" placeholder="e.g. Black Pearl">
          </div>
          <div class="input-group">
            <label for="carModel">Car Model</label>
            <input id="carModel" name="carModel" type="text" value="${car.carModel}" placeholder="e.g. Toyota Innova Zenix G">
          </div>
          <div class="input-group">
            <label for="carYear">Year</label>
            <input id="carYear" name="carYear" type="text" value="${car.carYear}" placeholder="e.g. 2024">
          </div>
          <div class="input-group">
            <label for="plateNumber">Plate Number</label>
            <input id="plateNumber" name="plateNumber" type="text" value="${car.plateNumber}" placeholder="e.g. B 1234 XYZ">
          </div>
          <div class="car-form-actions">
            <button class="primary-button" type="submit">Save Changes</button>
            <button class="ghost-button" type="button" id="clearCarProfile">Reset</button>
          </div>
        </form>
      </article>
    </section>
  `;

  document.getElementById("carProfileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveCarProfile({
      nickname: form.get("nickname"),
      carModel: form.get("carModel"),
      carYear: form.get("carYear"),
      plateNumber: form.get("plateNumber")
    });
    alert("Profile saved locally.");
  });

  document.getElementById("clearCarProfile")?.addEventListener("click", () => {
    localStorage.removeItem(carKey());
    state.carProfile = { nickname: "", carModel: "", carYear: "", plateNumber: "" };
    renderMyZenix();
  });
}

function renderEvents() {
  const upcoming = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  document.getElementById("screen-events").innerHTML = `
    <section class="content-section">
      <div class="section-title-row">
        <div>
          <p class="section-kicker">Event Registration</p>
          <h3>Upcoming Club Plans</h3>
        </div>
        <span class="soft-chip">${upcoming.length} events</span>
      </div>

      <div class="event-stack">
        ${upcoming.map((event, index) => {
          const mine = getUserRsvp(event);
          return `
            <article class="event-registration-card">
              <div class="event-registration-cover hero-cover-${(index % 3) + 1}"></div>
              <div class="event-registration-body">
                <div class="news-meta">
                  <span>${event.category || "Event"}</span>
                  <span>${formatShortDate(event.date)}</span>
                </div>
                <h4>${event.title}</h4>
                <p>${event.summary}</p>
                <div class="event-meta">
                  <span>${event.location}</span>
                  <span>${event.host || "Club Team"}</span>
                </div>
                <div class="tag-row">
                  <span class="info-tag">${mine ? `RSVP: ${mine.status}` : "Open RSVP"}</span>
                  <span class="info-tag">${event.meetingPoint || "Meeting point TBA"}</span>
                </div>
                <a class="primary-button" href="#event-${event.id}">View Event</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderEventDetail(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  const screen = document.getElementById("screen-event-detail");

  if (!event) {
    screen.innerHTML = `<div class="empty-state">Event not found.</div>`;
    return;
  }

  const mine = getUserRsvp(event);
  const counts = {
    Going: event.rsvps.filter((r) => r.status === "Going").length,
    Maybe: event.rsvps.filter((r) => r.status === "Maybe").length,
    "Not Going": event.rsvps.filter((r) => r.status === "Not Going").length
  };

  screen.innerHTML = `
    <section class="content-section">
      <article class="event-detail-shell">
        <div class="event-registration-cover hero-cover-2"></div>
        <div class="detail-card">
          <div class="toolbar">
            <a class="ghost-button" href="#events">Back</a>
            <a class="ghost-button" href="#home">Home</a>
          </div>
          <p class="section-kicker">${event.category || "Event Detail"}</p>
          <h3>${event.title}</h3>
          <div class="event-meta">
            <span>${formatDate(event.date)}</span>
            <span>${event.location}</span>
          </div>
          <p>${event.description}</p>
          <div class="member-detail-grid compact-grid">
            <div class="member-detail-item">
              <span>Host</span>
              <strong>${event.host || "Club Team"}</strong>
            </div>
            <div class="member-detail-item">
              <span>Meeting Point</span>
              <strong>${event.meetingPoint || "Shared later"}</strong>
            </div>
          </div>
          <div class="section-title-row">
            <div>
              <p class="section-kicker">Your RSVP</p>
              <h3>${mine ? mine.status : "Choose your response"}</h3>
            </div>
          </div>
          <div class="pill-group">
            ${["Going", "Maybe", "Not Going"].map((status) => `
              <button class="status-button ${mine && mine.status === status ? "active" : ""}" data-rsvp="${status}" type="button">${status}</button>
            `).join("")}
          </div>
          <div class="rsvp-summary">
            <div class="stat-row">
              <strong>${counts.Going}</strong><span>Going</span>
              <strong>${counts.Maybe}</strong><span>Maybe</span>
              <strong>${counts["Not Going"]}</strong><span>Not Going</span>
            </div>
          </div>
        </div>
      </article>
    </section>
  `;

  screen.querySelectorAll("[data-rsvp]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ status: button.dataset.rsvp })
      });
      await loadData();
      navigate(location.hash || `#event-${event.id}`);
    });
  });
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
          <p class="section-kicker">Vendor Directory</p>
          <h3>Trusted Partners</h3>
        </div>
        <span class="soft-chip">${filtered.length} partners</span>
      </div>
      <input id="vendorSearch" class="vendor-search" type="text" placeholder="Search vendors, category..." value="${searchQuery}">
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
                <a class="primary-button vendor-whatsapp" href="https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}" target="_blank" rel="noreferrer">Chat WhatsApp</a>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
      ${filtered.length === 0 ? `<div class="empty-state">No vendors found.</div>` : ""}
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
          <p class="section-kicker">Merchandise</p>
          <h3>Club Store</h3>
        </div>
      </div>
      <div class="merch-grid">
        ${state.merchandise.map((item) => `
          <article class="merch-card">
            <div class="merch-cover ${item.image}"></div>
            <div class="merch-body">
              <div class="news-meta">
                <span>Club Store</span>
                <span>${item.price}</span>
              </div>
              <h4>${item.title}</h4>
              <p>${item.description}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderChrome() {
  document.getElementById("greetingName").textContent = state.user.name.split(" ")[0];
  document.getElementById("drawerName").textContent = state.user.name;
  document.getElementById("drawerUsername").textContent = `@${state.user.username}`;
  document.getElementById("drawerAvatar").textContent = state.user.name.charAt(0);
  loadCarProfile();
  renderHome();
  renderMyZenix();
  renderEvents();
  renderVendors();
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

  const screen = hash.replace("#", "");
  if (screens.includes(screen)) {
    setActiveScreen(screen);
    if (screen === "vendors") renderVendors();
  } else {
    location.hash = "#home";
  }
}

function startHeroRotation() {
  if (state.heroTimer) {
    clearInterval(state.heroTimer);
  }

  state.heroTimer = setInterval(() => {
    const slides = getHeroSlides();
    if (!slides.length) {
      return;
    }
    state.heroIndex = (state.heroIndex + 1) % slides.length;
    if (!document.getElementById("screen-home").classList.contains("hidden")) {
      renderHome();
    }
  }, 4500);
}

async function loadData() {
  const [events, announcements, vendors, banners, sponsors, news, merchandise] = await Promise.all([
    api("/api/events"),
    api("/api/announcements"),
    api("/api/vendors"),
    api("/api/banners"),
    api("/api/sponsors"),
    api("/api/news"),
    api("/api/merchandise")
  ]);
  state.events = events;
  state.announcements = announcements;
  state.vendors = vendors;
  state.banners = banners;
  state.sponsors = sponsors;
  state.news = news;
  state.merchandise = merchandise;
}

async function restoreSession() {
  try {
    const result = await api("/api/auth/me");
    if (result.user.role !== "member") {
      await handleLogout(false);
      return false;
    }
    state.user = result.user;
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
  const hasSession = await restoreSession();
  if (hasSession) {
    showApp();
    await loadData();
    renderChrome();
    startHeroRotation();
    navigate(location.hash || "#home");
  } else {
    showLogin();
  }

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
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
    localStorage.setItem("api_token", result.token);
    showApp();
    await loadData();
    renderChrome();
    startHeroRotation();
    location.hash = "#home";
  });

  document.querySelectorAll("[data-demo-username]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("loginUsername").value = button.dataset.demoUsername;
      document.getElementById("loginPassword").value = button.dataset.demoPassword;
      document.getElementById("loginPassword").focus();
    });
  });

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
}

bootApp().catch((error) => {
  alert(error.message);
});
