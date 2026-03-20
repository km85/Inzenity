const adminState = {
  tab: "users",
  user: null,
  items: {
    users: [],
    events: [],
    announcements: [],
    vendors: []
  },
  editingId: null
};

const configs = {
  users: {
    title: "Users",
    description: "Manage local demo member and admin accounts.",
    endpoint: "/api/users",
    columns: ["name", "username", "role", "city"],
    labels: { name: "Name", username: "Username", role: "Role", city: "City" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "role", label: "Role", type: "select", options: ["member", "admin"], required: true },
      { name: "city", label: "City", type: "text", required: true }
    ]
  },
  events: {
    title: "Events",
    description: "Create and update event plans for the community.",
    endpoint: "/api/events",
    columns: ["title", "date", "category", "location"],
    labels: { title: "Title", date: "Date", category: "Type", location: "Location" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "date", label: "Date", type: "datetime-local", required: true },
      { name: "category", label: "Type", type: "text", required: true },
      { name: "host", label: "Host", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "meetingPoint", label: "Meeting Point", type: "text", required: true },
      { name: "summary", label: "Summary", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true }
    ]
  },
  announcements: {
    title: "Announcements",
    description: "Publish short updates and reminders for members.",
    endpoint: "/api/announcements",
    columns: ["title", "createdAt", "content"],
    labels: { title: "Title", createdAt: "Created", content: "Content" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "createdAt", label: "Created At", type: "datetime-local", required: true },
      { name: "content", label: "Content", type: "textarea", required: true }
    ]
  },
  vendors: {
    title: "Vendors",
    description: "Maintain the directory of trusted club partners.",
    endpoint: "/api/vendors",
    columns: ["name", "category", "description", "whatsapp"],
    labels: { name: "Name", category: "Category", description: "Description", whatsapp: "WhatsApp" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "category", label: "Category", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "whatsapp", label: "WhatsApp", type: "text", required: true }
    ]
  }
};

async function request(path, options = {}) {
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

function formatValue(key, field, value) {
  if (!value) {
    return "";
  }
  if (field === "date" || field === "createdAt") {
    return new Date(value).toLocaleString("en-ID");
  }
  if (key === "users" && field === "role") {
    return String(value).toUpperCase();
  }
  return value;
}

function renderSidebar() {
  document.getElementById("sidebarNav").innerHTML = Object.keys(configs).map((key) => `
    <button class="sidebar-link ${adminState.tab === key ? "active" : ""}" data-tab="${key}" type="button">${configs[key].title}</button>
  `).join("");

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.tab = button.dataset.tab;
      adminState.editingId = null;
      renderCurrentTab();
    });
  });
}

function renderStats() {
  const stats = [
    { label: "Users", value: adminState.items.users.length },
    { label: "Events", value: adminState.items.events.length },
    { label: "Announcements", value: adminState.items.announcements.length },
    { label: "Vendors", value: adminState.items.vendors.length }
  ];

  document.getElementById("stats").innerHTML = stats.map((item) => `
    <article class="metric-card">
      <div class="eyebrow">${item.label}</div>
      <h3>${item.value}</h3>
    </article>
  `).join("");
}

function renderHeader() {
  const config = configs[adminState.tab];
  document.getElementById("pageEyebrow").textContent = "Dashboard";
  document.getElementById("pageTitle").textContent = config.title;
  document.getElementById("pageDescription").textContent = config.description;
  document.getElementById("adminUserName").textContent = adminState.user.name;
  document.getElementById("adminUserMeta").textContent = `@${adminState.user.username}`;
}

function renderTable() {
  const config = configs[adminState.tab];
  const rows = adminState.items[adminState.tab];
  const itemLabel = config.title.endsWith("s") ? config.title.slice(0, -1) : config.title;

  document.getElementById("tableArea").innerHTML = `
    <div class="table-heading">
      <div>
        <div class="eyebrow">${config.title}</div>
        <h3>${config.title} Table</h3>
      </div>
      <button class="primary-button" id="newRecordButton" type="button">Add ${itemLabel}</button>
    </div>
    ${rows.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${config.columns.map((column) => `<th>${config.labels[column]}</th>`).join("")}<th>Actions</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                ${config.columns.map((column) => `<td>${formatValue(adminState.tab, column, row[column])}</td>`).join("")}
                <td>
                  <div class="table-actions">
                    <button class="ghost-button" data-edit="${row.id}" type="button">Edit</button>
                    <button class="danger-button" data-delete="${row.id}" type="button">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<div class="empty-state">No ${config.title.toLowerCase()} yet.</div>`}
  `;

  document.getElementById("newRecordButton").addEventListener("click", () => {
    adminState.editingId = null;
    renderForm();
  });

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.editingId = Number(button.dataset.edit);
      renderForm();
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await request(`${config.endpoint}/${button.dataset.delete}`, { method: "DELETE" });
      adminState.editingId = null;
      await loadAdminData();
      renderCurrentTab();
    });
  });
}

function normalizeForInput(field, value) {
  if (!value) {
    return "";
  }
  if (field.type === "datetime-local") {
    return new Date(value).toISOString().slice(0, 16);
  }
  return value;
}

function serializeForm(config, formData, existing) {
  const payload = {};
  config.fields.forEach((field) => {
    payload[field.name] = formData.get(field.name);
  });

  if (adminState.tab === "events") {
    payload.rsvps = existing ? existing.rsvps || [] : [];
  }

  return payload;
}

function renderForm() {
  const config = configs[adminState.tab];
  const existing = adminState.items[adminState.tab].find((item) => item.id === adminState.editingId);
  const itemLabel = config.title.endsWith("s") ? config.title.slice(0, -1) : config.title;
  document.getElementById("formTitle").textContent = existing ? `Edit ${itemLabel}` : `New ${itemLabel}`;

  document.getElementById("recordForm").innerHTML = `
    <p class="muted">${existing ? "Update the selected record and save." : "Create a new record for this section."}</p>
    <div class="split">
      ${config.fields.map((field) => {
        if (field.type === "textarea") {
          return `
            <div class="input-group">
              <label for="${field.name}">${field.label}</label>
              <textarea id="${field.name}" name="${field.name}" rows="4" ${field.required ? "required" : ""}>${normalizeForInput(field, existing?.[field.name])}</textarea>
            </div>
          `;
        }

        if (field.type === "select") {
          return `
            <div class="input-group">
              <label for="${field.name}">${field.label}</label>
              <select id="${field.name}" name="${field.name}" ${field.required ? "required" : ""}>
                ${field.options.map((option) => `<option value="${option}" ${existing?.[field.name] === option ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </div>
          `;
        }

        return `
          <div class="input-group">
            <label for="${field.name}">${field.label}</label>
            <input id="${field.name}" name="${field.name}" type="${field.type}" value="${normalizeForInput(field, existing?.[field.name])}" ${field.required ? "required" : ""}>
          </div>
        `;
      }).join("")}
    </div>
    <div class="toolbar">
      <button class="primary-button" type="submit">${existing ? "Save Changes" : "Create"}</button>
      <button class="ghost-button" type="button" id="clearFormButton">${existing ? "New Record" : "Clear"}</button>
    </div>
  `;

  document.getElementById("clearFormButton").addEventListener("click", () => {
    adminState.editingId = null;
    renderForm();
  });

  document.getElementById("recordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = serializeForm(config, new FormData(event.currentTarget), existing);
    const method = existing ? "PUT" : "POST";
    const url = existing ? `${config.endpoint}/${existing.id}` : config.endpoint;
    await request(url, { method, body: JSON.stringify(payload) });
    adminState.editingId = null;
    await loadAdminData();
    renderCurrentTab();
  });
}

function renderCurrentTab() {
  renderSidebar();
  renderHeader();
  renderStats();
  renderTable();
  renderForm();
}

async function loadAdminData() {
  const keys = Object.keys(configs);
  const results = await Promise.all(keys.map((key) => request(configs[key].endpoint)));
  keys.forEach((key, index) => {
    adminState.items[key] = results[index];
  });
}

async function logoutAdmin() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout failures.
  }
  window.location.href = "/admin";
}

async function bootAdmin() {
  const me = await request("/api/auth/me");
  adminState.user = me.user;
  if (adminState.user.role !== "admin") {
    window.location.href = "/admin";
    return;
  }

  await loadAdminData();
  renderCurrentTab();

  document.getElementById("resetDataButton").addEventListener("click", async () => {
    await request("/api/reset", { method: "POST" });
    adminState.editingId = null;
    await loadAdminData();
    renderCurrentTab();
  });

  document.getElementById("adminLogoutButton").addEventListener("click", logoutAdmin);
}

bootAdmin().catch((error) => {
  alert(error.message);
  window.location.href = "/admin";
});
