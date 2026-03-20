const state = {
  user: null,
  events: [],
  announcements: [],
  vendors: []
};

const screens = ["events", "event-detail", "announcements", "vendors", "profile"];

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
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
    weekday: "short",
    day: "numeric",
    month: "short"
  });
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

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.screen === screen);
  });
}

function getUserRsvp(event) {
  return event.rsvps.find((item) => item.userId === state.user.id);
}

function renderEvents() {
  const upcoming = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextEvent = upcoming[0];
  document.getElementById("screen-events").innerHTML = `
    ${nextEvent ? `
      <article class="club-spotlight">
        <div class="eyebrow">Next Meet</div>
        <h2>${nextEvent.title}</h2>
        <p>${formatDate(nextEvent.date)} at ${nextEvent.location}</p>
        <div class="tag-row">
          <span class="info-tag">${nextEvent.category || "Event"}</span>
          <span class="info-tag">${nextEvent.host || "Club Host"}</span>
        </div>
      </article>
    ` : ""}
    <div class="section-header">
      <h2>Upcoming Events</h2>
      <span class="muted">${upcoming.length} plans ahead</span>
    </div>
    ${upcoming.map((event) => {
      const mine = getUserRsvp(event);
      return `
        <article class="event-card">
          <div class="event-topline">
            <span class="eyebrow">${event.category || "Club Event"}</span>
            <span class="tiny-status">${mine ? `You: ${mine.status}` : "RSVP Open"}</span>
          </div>
          <h3>${event.title}</h3>
          <div class="event-meta">
            <span>${formatShortDate(event.date)}</span>
            <span>${event.location}</span>
            <span>Host: ${event.host || "Club Team"}</span>
          </div>
          <p>${event.summary}</p>
          <div class="tag-row">
            <span class="info-tag">${event.meetingPoint || "Meeting point TBA"}</span>
            <span class="info-tag">${event.rsvps.length} members replied</span>
          </div>
          <a class="primary-button" href="#event-${event.id}">View Details</a>
        </article>
      `;
    }).join("")}
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
    <div class="detail-card panel">
      <div class="toolbar">
        <a class="ghost-button" href="#events">Back</a>
        <a class="ghost-button" href="#announcements">Club Updates</a>
      </div>
      <div class="eyebrow">${event.category || "Event Detail"}</div>
      <h2>${event.title}</h2>
      <div class="event-meta">
        <span>${formatDate(event.date)}</span>
        <span>${event.location}</span>
        <span>Host: ${event.host || "Club Team"}</span>
      </div>
      <p>${event.description}</p>
      <div class="tag-row">
        <span class="info-tag">Meet at: ${event.meetingPoint || "Shared in group chat"}</span>
      </div>
      <div class="section-header">
        <h2>RSVP</h2>
        <span class="muted">${mine ? `Current: ${mine.status}` : "No response yet"}</span>
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

function renderAnnouncements() {
  document.getElementById("screen-announcements").innerHTML = `
    <div class="section-header">
      <h2>Club Updates</h2>
      <span class="muted">${state.announcements.length} recent notes</span>
    </div>
    ${state.announcements
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((item) => `
        <article class="announcement-card">
          <div class="eyebrow">${formatDate(item.createdAt)}</div>
          <h3>${item.title}</h3>
          <p>${item.content}</p>
        </article>
      `).join("")}
  `;
}

function renderVendors() {
  document.getElementById("screen-vendors").innerHTML = `
    <div class="section-header">
      <h2>Partner Directory</h2>
      <span class="muted">${state.vendors.length} trusted contacts</span>
    </div>
    ${state.vendors.map((vendor) => `
      <article class="vendor-card">
        <div class="eyebrow">${vendor.category}</div>
        <h3>${vendor.name}</h3>
        <p>${vendor.description}</p>
        <div class="vendor-meta">
          <span>WhatsApp: +${vendor.whatsapp}</span>
          <span>Member-friendly vendor</span>
        </div>
        <p>
          <a class="primary-button" href="https://wa.me/${vendor.whatsapp}" target="_blank" rel="noreferrer">Contact on WhatsApp</a>
        </p>
      </article>
    `).join("")}
  `;
}

function renderProfile() {
  const myPlans = state.events.filter((event) => {
    const rsvp = getUserRsvp(event);
    return rsvp && rsvp.status !== "Not Going";
  }).length;

  document.getElementById("screen-profile").innerHTML = `
    <div class="section-header">
      <h2>Member Profile</h2>
    </div>
    <article class="profile-card">
      <div class="eyebrow">${state.user.role}</div>
      <h3>${state.user.name}</h3>
      <div class="vendor-meta">
        <span>@${state.user.username}</span>
        <span>${state.user.phone}</span>
        <span>${state.user.city}</span>
      </div>
      <div class="tag-row">
        <span class="info-tag">${myPlans} active plans</span>
        <span class="info-tag">${state.vendors.length} partner vendors</span>
      </div>
      <p class="muted">Local MVP member account with username/password access. Events, updates, and vendor contacts stay behind login.</p>
      <div class="toolbar">
        <a class="ghost-button" href="#vendors">Open Vendors</a>
        <a class="ghost-button" href="/admin">Admin Login</a>
        <button class="danger-button" id="logoutButton" type="button">Log Out</button>
      </div>
    </article>
  `;

  document.getElementById("logoutButton").addEventListener("click", handleLogout);
}

function renderChrome() {
  document.getElementById("welcomeName").textContent = `Welcome, ${state.user.name}`;
  document.getElementById("welcomeMeta").textContent = `${state.events.length} upcoming events, ${state.announcements.length} club updates, and ${state.vendors.length} partner vendors`;
  renderEvents();
  renderAnnouncements();
  renderVendors();
  renderProfile();
}

function navigate(hash) {
  if (!state.user) {
    return;
  }

  if (!hash || hash === "#") {
    location.hash = "#events";
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
  } else {
    location.hash = "#events";
  }
}

async function loadData() {
  const [events, announcements, vendors] = await Promise.all([
    api("/api/events"),
    api("/api/announcements"),
    api("/api/vendors")
  ]);
  state.events = events;
  state.announcements = announcements;
  state.vendors = vendors;
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

  showLogin();
  if (redirectToLogin) {
    location.hash = "";
  }
}

async function bootApp() {
  const hasSession = await restoreSession();
  if (hasSession) {
    showApp();
    await loadData();
    renderChrome();
    navigate(location.hash || "#events");
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
    showApp();
    await loadData();
    renderChrome();
    location.hash = "#events";
  });

  document.querySelectorAll("[data-demo-username]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("loginUsername").value = button.dataset.demoUsername;
      document.getElementById("loginPassword").value = button.dataset.demoPassword;
      document.getElementById("loginPassword").focus();
    });
  });

  window.addEventListener("hashchange", () => navigate(location.hash));
}

bootApp().catch((error) => {
  alert(error.message);
});
