const adminState = {
  tab: "users",
  user: null,
  chapters: [],
  users: [],
  items: {
    users: [],
    events: [],
    registrations: [],
    announcements: [],
    vendors: [],
    banners: [],
    sponsors: [],
    news: [],
    merchandise: [],
    chapters: [],
    vehicleModels: [],
    vehicleYears: [],
    vehiclePowertrains: [],
    rewards: [],
    pointTransactions: [],
    redemptions: [],
    leaderboard: [],
    officialPartners: [],
    merchantPartners: [],
    products: [],
    orders: []
  },
  editingId: null
};

const baseConfigs = {
  users: {
    title: "Users",
    description: "Manage member and admin accounts, assign chapters, and update profile data.",
    endpoint: "/api/users",
    columns: ["name", "username", "role", "city", "chapter"],
    labels: { name: "Name", username: "Username", role: "Role", city: "City", chapter: "Chapter" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: false },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: false },
      { name: "role", label: "Role", type: "select", options: ["member", "admin"], required: true },
      { name: "city", label: "City", type: "text", required: true },
      { name: "address", label: "Address", type: "textarea", required: false },
      { name: "postalCode", label: "Postal Code", type: "text", required: false },
      { name: "socialMedia", label: "Social Media", type: "text", required: false },
      { name: "tshirtSize", label: "T-shirt Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], required: false },
      { name: "language", label: "Language", type: "select", options: ["id", "en"], required: false },
      { name: "memberNumber", label: "Member Number", type: "text", required: false },
      { name: "pointsBalance", label: "Points Balance", type: "number", required: false },
      { name: "chapterId", label: "Chapter", type: "select", options: [], required: false }
    ]
  },
  events: {
    title: "Events",
    description: "Create and update event plans, points, and check-in settings.",
    endpoint: "/api/events",
    columns: ["title", "date", "category", "location", "points", "checkInEnabled", "checkInCount"],
    labels: { title: "Title", date: "Date", category: "Type", location: "Location", points: "Points", checkInEnabled: "Check-In", checkInCount: "Attendees" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "date", label: "Date", type: "datetime-local", required: true },
      { name: "category", label: "Type", type: "text", required: true },
      { name: "host", label: "Host", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "meetingPoint", label: "Meeting Point", type: "text", required: true },
      { name: "summary", label: "Summary", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "points", label: "Event Points", type: "number", required: true },
      { name: "qrToken", label: "QR Token", type: "text", required: false, readonly: true },
      { name: "checkInEnabled", label: "Check-In Enabled", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: true },
      { name: "checkInStart", label: "Check-In Start", type: "datetime-local", required: false },
      { name: "checkInEnd", label: "Check-In End", type: "datetime-local", required: false },
      { name: "geoValidationEnabled", label: "Geo Validation", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: false },
      { name: "geoRadiusMeters", label: "Geo Radius (m)", type: "number", required: false },
      { name: "locationLat", label: "Location Latitude", type: "text", required: false },
      { name: "locationLon", label: "Location Longitude", type: "text", required: false },
    ],
    actions: [
      { label: "Show QR", className: "primary-button", handler: (row) => openQrModal(row) }
    ]
  },
  registrations: {
    title: "Registrations",
    description: "Review, approve, or reject new member registrations. Documents are private.",
    endpoint: "/api/registrations",
    columns: ["id", "fullName", "status", "chapter", "username", "submittedAt"],
    labels: { id: "ID", fullName: "Name", status: "Status", chapter: "Chapter", username: "Username", submittedAt: "Submitted" },
    fields: [
      { name: "status", label: "Status", type: "select", options: ["pending", "approved", "rejected"], required: true },
      { name: "fullName", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: false },
      { name: "phone", label: "Phone", type: "text", required: false },
      { name: "address", label: "Address", type: "textarea", required: false },
      { name: "postalCode", label: "Postal Code", type: "text", required: false },
      { name: "tshirtSize", label: "T-shirt Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], required: false },
      { name: "chapterId", label: "Chapter", type: "select", options: [], required: false },
      { name: "vehicleModel", label: "Vehicle Model", type: "text", required: false },
      { name: "vehiclePowertrain", label: "Powertrain", type: "text", required: false },
      { name: "vehicleYear", label: "Year", type: "number", required: false },
      { name: "vehicleColor", label: "Color", type: "text", required: false },
      { name: "plateNumber", label: "Plate Number", type: "text", required: false },
      { name: "stnkImage", label: "STNK Image", type: "file", required: false },
      { name: "paymentProofImage", label: "Payment Proof", type: "file", required: false },
      { name: "locationLat", label: "Latitude", type: "text", required: false },
      { name: "locationLon", label: "Longitude", type: "text", required: false },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "rejectionReason", label: "Rejection Reason", type: "textarea", required: false },
    ],
    actions: [
      { label: "Approve", className: "primary-button", handler: async (row) => {
        await request(`${baseConfigs.registrations.endpoint}/${row.id}`, { method: "PUT", body: JSON.stringify({ status: "approved" }) });
        await loadAdminData();
        renderCurrentTab();
      }},
      { label: "Reject", className: "danger-button", handler: async (row) => {
        const reason = window.prompt("Rejection reason:");
        if (reason === null) return;
        await request(`${baseConfigs.registrations.endpoint}/${row.id}`, { method: "PUT", body: JSON.stringify({ status: "rejected", rejectionReason: reason }) });
        await loadAdminData();
        renderCurrentTab();
      }}
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
  },
  banners: {
    title: "Banners",
    description: "Manage hero banners shown on the member home screen.",
    endpoint: "/api/banners",
    columns: ["title", "image", "order"],
    labels: { title: "Title", image: "Image", order: "Order" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "text", required: false },
      { name: "image", label: "Image", type: "file", required: false },
      { name: "link", label: "Link", type: "text", required: false },
      { name: "startDate", label: "Start Date", type: "datetime-local", required: false },
      { name: "endDate", label: "End Date", type: "datetime-local", required: false },
      { name: "durationMs", label: "Duration (ms)", type: "number", required: false },
      { name: "active", label: "Active", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: true },
      { name: "partnerType", label: "Partner Type", type: "select", options: ["official", "merchant", "sponsor"], required: false },
      { name: "partnerId", label: "Partner ID", type: "number", required: false },
      { name: "order", label: "Order", type: "number", required: true }
    ]
  },
  sponsors: {
    title: "Sponsors",
    description: "Manage sponsor logos and names for the member home screen.",
    endpoint: "/api/sponsors",
    columns: ["name", "logo"],
    labels: { name: "Name", logo: "Logo" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "logo", label: "Logo", type: "text", required: true }
    ]
  },
  news: {
    title: "News",
    description: "Manage latest news cards shown on the member home screen.",
    endpoint: "/api/news",
    columns: ["title", "category", "date", "image"],
    labels: { title: "Title", category: "Category", date: "Date", image: "Image" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "image", label: "Image", type: "text", required: true },
      { name: "category", label: "Category", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true }
    ]
  },
  merchandise: {
    title: "Merchandise",
    description: "Manage merchandise cards shown in the member store screen.",
    endpoint: "/api/merchandise",
    columns: ["title", "price", "points", "image", "description"],
    labels: { title: "Title", price: "Price", points: "Points", image: "Image", description: "Description" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "image", label: "Image", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "price", label: "Price", type: "text", required: true },
      { name: "points", label: "Points", type: "number", required: false }
    ]
  },
  officialPartners: {
    title: "Official Partners",
    description: "Manage official club partner logos, links, and active periods.",
    endpoint: "/api/official-partners",
    columns: ["id", "name", "status", "sortOrder", "activePeriodStart"],
    labels: { id: "ID", name: "Name", status: "Status", sortOrder: "Order", activePeriodStart: "Starts" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: false },
      { name: "contact", label: "Contact", type: "text", required: false },
      { name: "link", label: "Link", type: "text", required: false },
      { name: "logo", label: "Logo", type: "file", required: false },
      { name: "activePeriodStart", label: "Active From", type: "datetime-local", required: false },
      { name: "activePeriodEnd", label: "Active Until", type: "datetime-local", required: false },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"], required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: false }
    ]
  },
  merchantPartners: {
    title: "Merchant Partners",
    description: "Manage merchant partners and their owner accounts.",
    endpoint: "/api/merchant-partners",
    columns: ["id", "name", "status", "contact"],
    labels: { id: "ID", name: "Name", status: "Status", contact: "Contact" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: false },
      { name: "contact", label: "Contact", type: "text", required: false },
      { name: "logo", label: "Logo", type: "file", required: false },
      { name: "status", label: "Status", type: "select", options: ["pending", "active", "inactive"], required: true },
      { name: "ownerUserId", label: "Owner User ID", type: "number", required: false }
    ]
  },
  products: {
    title: "Products",
    description: "Manage club merchandise and merchant partner products.",
    endpoint: "/api/products",
    columns: ["id", "title", "price", "active", "stock"],
    labels: { id: "ID", title: "Title", price: "Price", active: "Active", stock: "Stock" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: false },
      { name: "price", label: "Price", type: "number", required: true },
      { name: "points", label: "Points", type: "number", required: false },
      { name: "category", label: "Category", type: "text", required: false },
      { name: "image", label: "Image", type: "file", required: false },
      { name: "isOfficialMerchandise", label: "Official Merchandise", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: true },
      { name: "merchantPartnerId", label: "Merchant Partner ID", type: "number", required: false },
      { name: "active", label: "Active", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: true },
      { name: "allowPreorder", label: "Allow Preorder", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: false },
      { name: "variants", label: "Variants JSON", type: "textarea", required: false }
    ]
  },
  orders: {
    title: "Orders",
    description: "View and update member product orders.",
    endpoint: "/api/orders",
    custom: true,
    render: renderOrders
  },
  rewards: {
    title: "Rewards",
    description: "Configure rewards members can redeem with points.",
    endpoint: "/api/rewards",
    columns: ["title", "pointsRequired", "active", "stock"],
    labels: { title: "Title", pointsRequired: "Points", active: "Active", stock: "Stock" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: false },
      { name: "pointsRequired", label: "Points Required", type: "number", required: true },
      { name: "image", label: "Image", type: "file", required: false },
      { name: "active", label: "Active", type: "select", options: [{value:"true", label:"Yes"}, {value:"false", label:"No"}], required: true },
      { name: "stock", label: "Stock", type: "number", required: false },
      { name: "sortOrder", label: "Sort Order", type: "number", required: false }
    ]
  },
  pointTransactions: {
    title: "Point Transactions",
    description: "Add or deduct points manually. Every change is recorded in transaction history.",
    endpoint: "/api/point-transactions",
    columns: ["id", "memberName", "amount", "source", "description", "createdAt"],
    labels: { id: "ID", memberName: "Member", amount: "Amount", source: "Source", description: "Description", createdAt: "Date" },
    fields: [
      { name: "userId", label: "Member", type: "select", options: [], required: true },
      { name: "amount", label: "Amount (+/-)", type: "number", required: true },
      { name: "source", label: "Source", type: "select", options: ["manual", "bonus", "merchandise", "partner"], required: true },
      { name: "description", label: "Reason / Description", type: "textarea", required: true }
    ]
  },
  redemptions: {
    title: "Redemptions",
    description: "Approve or reject member reward redemptions.",
    endpoint: "/api/redemptions",
    columns: ["id", "memberName", "rewardTitle", "status", "pointsCost", "requestedAt"],
    labels: { id: "ID", memberName: "Member", rewardTitle: "Reward", status: "Status", pointsCost: "Points", requestedAt: "Requested" },
    fields: [
      { name: "status", label: "Status", type: "select", options: ["pending", "approved", "rejected", "completed"], required: true },
      { name: "rejectionReason", label: "Rejection Reason", type: "textarea", required: false }
    ],
    actions: [
      { label: "Approve", className: "primary-button", handler: async (row) => {
        await request(`${baseConfigs.redemptions.endpoint}/${row.id}`, { method: "PUT", body: JSON.stringify({ status: "approved" }) });
        await loadAdminData();
        renderCurrentTab();
      }},
      { label: "Reject", className: "danger-button", handler: async (row) => {
        const reason = window.prompt("Rejection reason:");
        if (reason === null) return;
        await request(`${baseConfigs.redemptions.endpoint}/${row.id}`, { method: "PUT", body: JSON.stringify({ status: "rejected", rejectionReason: reason }) });
        await loadAdminData();
        renderCurrentTab();
      }},
      { label: "Complete", className: "ghost-button", handler: async (row) => {
        await request(`${baseConfigs.redemptions.endpoint}/${row.id}`, { method: "PUT", body: JSON.stringify({ status: "completed" }) });
        await loadAdminData();
        renderCurrentTab();
      }}
    ]
  },
  leaderboard: {
    title: "Leaderboard",
    description: "View top members by points for monthly, quarterly, or yearly periods.",
    endpoint: "/api/leaderboard",
    custom: true,
    render: renderLeaderboard
  },
  chapters: {
    title: "Chapters",
    description: "Create chapters, upload logos, and standardize chapter names.",
    endpoint: "/api/chapters",
    columns: ["name", "logo"],
    labels: { name: "Name", logo: "Logo" },
    fields: [
      { name: "name", label: "Chapter Name", type: "text", required: true },
      { name: "logo", label: "Chapter Logo", type: "file", required: false }
    ]
  },
  vehicleModels: {
    title: "Vehicle Models",
    description: "Manage available vehicle model options (G, V, Q, etc.).",
    endpoint: "/api/vehicle-models",
    columns: ["code", "label", "sortOrder"],
    labels: { code: "Code", label: "Label", sortOrder: "Order" },
    fields: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: false }
    ]
  },
  vehicleYears: {
    title: "Vehicle Years",
    description: "Manage available vehicle year options.",
    endpoint: "/api/vehicle-years",
    columns: ["year", "sortOrder"],
    labels: { year: "Year", sortOrder: "Order" },
    fields: [
      { name: "year", label: "Year", type: "number", required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: false }
    ]
  },
  vehiclePowertrains: {
    title: "Powertrains",
    description: "Manage available powertrain options (Gasoline, Hybrid, etc.).",
    endpoint: "/api/vehicle-powertrains",
    columns: ["code", "label"],
    labels: { code: "Code", label: "Label" },
    fields: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "label", label: "Label", type: "text", required: true }
    ]
  }
};

function getConfig(key) {
  const config = baseConfigs[key];
  if (key === "users" || key === "registrations") {
    config.fields = config.fields.map((field) => {
      if (field.name === "chapterId") {
        return { ...field, options: adminState.chapters.map((c) => ({ value: String(c.id), label: c.name })) };
      }
      return field;
    });
  }
  if (key === "pointTransactions") {
    config.fields = config.fields.map((field) => {
      if (field.name === "userId") {
        return { ...field, options: adminState.users.map((u) => ({ value: String(u.id), label: `${u.name} (${u.username})` })) };
      }
      return field;
    });
  }
  return config;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
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

function formatValue(key, field, value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (field === "date" || field === "createdAt" || field === "submittedAt" || field === "requestedAt" || field === "reviewedAt") {
    return new Date(value).toLocaleString("en-ID");
  }
  if (field === "amount") {
    return value > 0 ? `+${value}` : `${value}`;
  }
  if (key === "users" && field === "role") {
    return String(value).toUpperCase();
  }
  if (key === "chapters" && field === "logo") {
    return value ? `<img src="${value}" alt="logo" class="table-thumb">` : "";
  }
  if (key === "rewards" && field === "active") {
    return value ? "Yes" : "No";
  }
  if (["products", "banners"].includes(key) && (field === "active" || field === "isOfficialMerchandise" || field === "allowPreorder")) {
    return value ? "Yes" : "No";
  }
  if ((key === "events" || key === "registrations" || key === "redemptions") && field === "status") {
    return String(value).toUpperCase();
  }
  if (key === "events" && field === "checkInEnabled") {
    return value ? "Yes" : "No";
  }
  if (key === "vehicleYears" && field === "year") {
    return value;
  }
  return value;
}

function renderSidebar() {
  document.getElementById("sidebarNav").innerHTML = Object.keys(baseConfigs).map((key) => `
    <button class="sidebar-link ${adminState.tab === key ? "active" : ""}" data-tab="${key}" type="button">${baseConfigs[key].title}</button>
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
    { label: "Registrations", value: adminState.items.registrations.length },
    { label: "Vendors", value: adminState.items.vendors.length },
    { label: "Rewards", value: adminState.items.rewards.length },
    { label: "Redemptions", value: adminState.items.redemptions.length },
    { label: "Merch", value: adminState.items.merchandise.length },
    { label: "Chapters", value: adminState.items.chapters.length },
    { label: "Products", value: adminState.items.products.length },
    { label: "Orders", value: adminState.items.orders.length },
    { label: "Official Partners", value: adminState.items.officialPartners.length },
    { label: "Merchant Partners", value: adminState.items.merchantPartners.length }
  ];

  document.getElementById("stats").innerHTML = stats.map((item) => `
    <article class="metric-card">
      <div class="eyebrow">${item.label}</div>
      <h3>${item.value}</h3>
    </article>
  `).join("");
}

function renderHeader() {
  const config = getConfig(adminState.tab);
  document.getElementById("pageEyebrow").textContent = "Dashboard";
  document.getElementById("pageTitle").textContent = config.title;
  document.getElementById("pageDescription").textContent = config.description;
  document.getElementById("adminUserName").textContent = adminState.user.name;
  document.getElementById("adminUserMeta").textContent = `@${adminState.user.username}`;
}

function renderTable() {
  const config = getConfig(adminState.tab);
  const rows = adminState.items[adminState.tab];
  const itemLabel = config.title.endsWith("s") ? config.title.slice(0, -1) : config.title;

  document.getElementById("tableArea").innerHTML = `
    <div class="table-heading">
      <div>
        <div class="eyebrow">${config.title}</div>
        <h3>${config.title} Table</h3>
      </div>
      ${config.custom ? "" : `<button class="primary-button" id="newRecordButton" type="button">Add ${itemLabel}</button>`}
    </div>
    ${rows && rows.length ? `
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
                    ${(config.actions || []).map((action, index) => `
                      <button class="${action.className || "ghost-button"} ${adminState.tab}-action-${index}" data-action-index="${index}" data-row-id="${row.id}" type="button">${action.label}</button>
                    `).join("")}
                    ${config.custom ? "" : `<button class="ghost-button" data-edit="${row.id}" type="button">Edit</button>`}
                    ${config.custom ? "" : `<button class="danger-button" data-delete="${row.id}" type="button">Delete</button>`}
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<div class="empty-state">No ${config.title.toLowerCase()} yet.</div>`}
  `;

  if (!config.custom) {
    document.getElementById("newRecordButton").addEventListener("click", () => {
      adminState.editingId = null;
      openModal();
      renderForm();
    });
  }

  document.querySelectorAll("[data-action-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.actionIndex);
      const rowId = Number(button.dataset.rowId);
      const row = rows.find((r) => r.id === rowId);
      if (row && config.actions && config.actions[index]) {
        try {
          await config.actions[index].handler(row);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.editingId = Number(button.dataset.edit);
      openModal();
      renderForm();
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleDeleteRecord(button.dataset.delete);
    });
  });
}

function openModal() {
  document.getElementById("recordModal").classList.remove("hidden");
  document.getElementById("modalBackdrop").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("recordModal").classList.add("hidden");
  document.getElementById("modalBackdrop").classList.add("hidden");
}

function openQrModal(row) {
  const modal = document.getElementById("qrModal");
  const backdrop = document.getElementById("modalBackdrop");
  const tokenUrl = `${window.location.origin}/?checkin=1&event=${row.id}&token=${encodeURIComponent(row.qrToken || "")}`;
  document.getElementById("qrTitle").textContent = `Check-In QR: ${row.title}`;
  document.getElementById("qrImage").src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tokenUrl)}`;
  document.getElementById("qrToken").textContent = row.qrToken || "No token";
  modal.classList.remove("hidden");
  backdrop.classList.remove("hidden");
}

function closeQrModal() {
  document.getElementById("qrModal").classList.add("hidden");
  document.getElementById("modalBackdrop").classList.add("hidden");
}

async function handleDeleteRecord(id) {
  const config = getConfig(adminState.tab);
  const itemLabel = config.title.endsWith("s") ? config.title.slice(0, -1) : config.title;
  const ok = window.confirm(`Delete this ${itemLabel.toLowerCase()}?`);
  if (!ok) {
    return;
  }

  await request(`${config.endpoint}/${id}`, { method: "DELETE" });
  adminState.items[adminState.tab] = adminState.items[adminState.tab].filter((item) => item.id !== Number(id));
  if (adminState.editingId === Number(id)) {
      adminState.editingId = null;
      closeModal();
    }
  renderCurrentTab();
}

function normalizeForInput(field, value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (field.type === "datetime-local") {
    return new Date(value).toISOString().slice(0, 16);
  }
  if (field.type === "date") {
    return new Date(value).toISOString().slice(0, 10);
  }
  if (field.type === "textarea" && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return value;
}

function isOptionObject(option) {
  return option && typeof option === "object" && "value" in option && "label" in option;
}

async function serializeForm(config, formData, existing) {
  const payload = {};
  for (const field of config.fields) {
    if (field.type === "file") {
      const fileInput = document.getElementById(field.name);
      const file = fileInput?.files?.[0];
      if (file) {
        payload[field.name] = await readFileBase64(file);
      } else if (existing?.[field.name]) {
        payload[field.name] = existing[field.name];
      } else {
        payload[field.name] = null;
      }
      continue;
    }
    payload[field.name] = formData.get(field.name);
    if (field.type === "number") {
      payload[field.name] = payload[field.name] === "" ? null : Number(payload[field.name]);
    }
    if (field.name === "variants" && typeof payload[field.name] === "string" && payload[field.name].trim() === "") {
      payload[field.name] = null;
    }
  }

  if (adminState.tab === "users" && existing && payload.password === "") {
    delete payload.password;
  }

  if (adminState.tab === "users" && !existing && !payload.password) {
    throw new Error("Password is required for new users");
  }

  if (adminState.tab === "events") {
    payload.rsvps = existing ? existing.rsvps || [] : [];
  }

  return payload;
}

function renderForm() {
  const config = getConfig(adminState.tab);
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
              <select id="${field.name}" name="${field.name}" ${field.required ? "required" : ""} ${field.readonly ? "disabled" : ""}>
                ${field.required ? "" : `<option value=""></option>`}
                ${field.options.map((option) => {
                  const value = isOptionObject(option) ? option.value : option;
                  const label = isOptionObject(option) ? option.label : option;
                  const selected = String(existing?.[field.name]) === String(value);
                  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
                }).join("")}
              </select>
            </div>
          `;
        }

        if (field.type === "file") {
          const preview = existing?.[field.name]
            ? `<div class="file-preview"><img src="${existing[field.name]}" alt="${field.label}" class="preview-thumb"></div>`
            : "";
          return `
            <div class="input-group">
              <label for="${field.name}">${field.label}</label>
              ${preview}
              <input id="${field.name}" name="${field.name}" type="file" accept="image/*" ${field.required && !existing?.[field.name] ? "required" : ""}>
            </div>
          `;
        }

        return `
          <div class="input-group">
            <label for="${field.name}">${field.label}</label>
            <input id="${field.name}" name="${field.name}" type="${field.type}" value="${normalizeForInput(field, existing?.[field.name])}" ${field.required ? "required" : ""} ${field.readonly ? "readonly" : ""}>
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
    closeModal();
    renderForm();
  });

  document.getElementById("recordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const existing = adminState.items[adminState.tab].find((item) => item.id === adminState.editingId);
    const payload = await serializeForm(config, new FormData(event.currentTarget), existing);
    const method = existing ? "PUT" : "POST";
    const url = existing ? `${config.endpoint}/${existing.id}` : config.endpoint;
    const saved = await request(url, { method, body: JSON.stringify(payload) });
    if (existing) {
      adminState.items[adminState.tab] = adminState.items[adminState.tab].map((item) => item.id === existing.id ? saved : item);
    } else {
      adminState.items[adminState.tab] = [...adminState.items[adminState.tab], saved];
    }
    adminState.editingId = null;
    closeModal();
    renderCurrentTab();
  });
}

async function renderLeaderboard() {
  document.getElementById("tableArea").innerHTML = `
    <div class="table-heading">
      <div>
        <div class="eyebrow">Leaderboard</div>
        <h3>Top Members by Points</h3>
      </div>
    </div>
    <div class="split" style="margin-bottom: 16px;">
      <div class="input-group">
        <label for="leaderboardPeriod">Period</label>
        <select id="leaderboardPeriod">
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div class="input-group">
        <label for="leaderboardDate">Anchor Date</label>
        <input id="leaderboardDate" type="date" value="${new Date().toISOString().slice(0, 10)}">
      </div>
    </div>
    <button class="primary-button" id="loadLeaderboardButton" type="button" style="margin-bottom: 16px;">Load Leaderboard</button>
    <div id="leaderboardResults"></div>
  `;

  document.getElementById("loadLeaderboardButton").addEventListener("click", async () => {
    const period = document.getElementById("leaderboardPeriod").value;
    const date = document.getElementById("leaderboardDate").value;
    const data = await request(`/api/leaderboard?period=${period}&date=${date}`);
    renderLeaderboardResults(data);
  });

  // Auto-load once
  const period = document.getElementById("leaderboardPeriod").value;
  const date = document.getElementById("leaderboardDate").value;
  const data = await request(`/api/leaderboard?period=${period}&date=${date}`);
  renderLeaderboardResults(data);
}

function renderOrders() {
  const rows = adminState.items.orders || [];
  const config = baseConfigs.orders;

  document.getElementById("tableArea").innerHTML = `
    <div class="table-heading">
      <div>
        <div class="eyebrow">${config.title}</div>
        <h3>${config.title} Table</h3>
      </div>
    </div>
    ${rows.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Order #</th><th>Member</th><th>Product</th><th>Total</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="order-row" data-order-id="${row.id}">
                <td>${row.orderNumber || row.id}</td>
                <td>${row.memberName || "-"}</td>
                <td>${row.productTitle || "-"}</td>
                <td>${row.totalPrice != null ? row.totalPrice : "-"}</td>
                <td>${String(row.status || "").toUpperCase()}</td>
                <td>${row.createdAt ? new Date(row.createdAt).toLocaleString("en-ID") : "-"}</td>
                <td>
                  <div class="table-actions">
                    <button class="primary-button order-update-status" data-order-id="${row.id}" type="button">Update Status</button>
                  </div>
                </td>
              </tr>
              <tr class="order-detail hidden" id="orderDetail-${row.id}">
                <td colspan="7">
                  <div class="dashboard-card" style="margin: 8px 0;">
                    <div class="eyebrow">Order Details</div>
                    <p><strong>ID:</strong> ${row.id}</p>
                    <p><strong>Order Number:</strong> ${row.orderNumber || "-"}</p>
                    <p><strong>Member:</strong> ${row.memberName || "-"}</p>
                    <p><strong>Product:</strong> ${row.productTitle || "-"}</p>
                    <p><strong>Total Price:</strong> ${row.totalPrice != null ? row.totalPrice : "-"}</p>
                    <p><strong>Status:</strong> ${String(row.status || "").toUpperCase()}</p>
                    <p><strong>Note:</strong> ${row.note || "-"}</p>
                    <p><strong>Created:</strong> ${row.createdAt ? new Date(row.createdAt).toLocaleString("en-ID") : "-"}</p>
                    ${(row.items && row.items.length) ? `
                      <div class="eyebrow" style="margin-top: 12px;">Items</div>
                      <ul>
                        ${row.items.map((item) => `<li>${item.title || "Item"} x${item.quantity || 1} — ${item.price != null ? item.price : "-"}</li>`).join("")}
                      </ul>
                    ` : ""}
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<div class="empty-state">No orders yet.</div>`}
  `;

  document.querySelectorAll(".order-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest(".order-update-status")) return;
      const id = row.dataset.orderId;
      const detail = document.getElementById(`orderDetail-${id}`);
      if (detail) detail.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".order-update-status").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.orderId);
      const status = window.prompt("New status (pending/paid/processing/shipped/completed/cancelled/refunded):");
      if (!status) return;
      const note = window.prompt("Optional note:") || "";
      try {
        await request(`${config.endpoint}/${id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status, note })
        });
        await loadAdminData();
        renderCurrentTab();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function renderLeaderboardResults(data) {
  const entries = data.entries || [];
  document.getElementById("leaderboardResults").innerHTML = entries.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Rank</th><th>Member</th><th>Chapter</th><th>Points</th></tr>
        </thead>
        <tbody>
          ${entries.map((entry) => `
            <tr class="${entry.rank <= 3 ? "top-rank" : ""}">
              <td><strong>#${entry.rank}</strong></td>
              <td>${entry.name || "-"}<br><span class="muted">${entry.memberNumber || ""}</span></td>
              <td>${entry.chapter || "-"}</td>
              <td>${entry.points}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : `<div class="empty-state">No points activity for this period.</div>`;
}

function renderCurrentTab() {
  renderSidebar();
  renderHeader();
  renderStats();
  const config = getConfig(adminState.tab);
  if (config.custom && typeof config.render === "function") {
    document.getElementById("tableArea").innerHTML = "";
    config.render();
  } else {
    renderTable();
    renderForm();
  }
}

async function loadAdminData() {
  const keys = Object.keys(baseConfigs).filter((k) => !baseConfigs[k].custom || k === "orders");
  const results = await Promise.all(keys.map((key) => request(baseConfigs[key].endpoint)));
  keys.forEach((key, index) => {
    adminState.items[key] = results[index];
  });
  adminState.chapters = await request("/api/chapters");
  adminState.users = await request("/api/users");
}

async function logoutAdmin() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout failures.
  }
  window.location.href = "/admin-login.html";
}

async function bootAdmin() {
  try {
    const me = await request("/api/auth/me");
    adminState.user = me.user;
    if (adminState.user.role !== "admin") {
      window.location.href = "/admin-login.html";
      return;
    }
  } catch {
    window.location.href = "/admin-login.html";
    return;
  }

  await loadAdminData();
  renderCurrentTab();

  document.getElementById("resetDataButton").addEventListener("click", async () => {
    await request("/api/reset", { method: "POST" });
    adminState.editingId = null;
    closeModal();
    closeQrModal();
    await loadAdminData();
    renderCurrentTab();
  });

  document.getElementById("adminLogoutButton").addEventListener("click", logoutAdmin);
  document.getElementById("closeModalButton").addEventListener("click", closeModal);
  document.getElementById("closeQrModalButton").addEventListener("click", closeQrModal);
  document.getElementById("modalBackdrop").addEventListener("click", () => {
    closeModal();
    closeQrModal();
  });
}

bootAdmin().catch((error) => {
  alert(error.message);
  window.location.href = "/admin-login.html";
});
