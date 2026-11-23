const adminState = {
  tab: "dashboard",
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
    description: "Review, approve, or reject new member registrations.",
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

let pendingRequests = 0;
function connectionNotice(message) {
  const box = document.getElementById("apiNotice");
  box.querySelector("span").textContent = message;
  box.hidden = !message;
}
function signInAgain() {
  document.querySelector(".dashboard-shell").hidden = true;
  document.getElementById("recordModal").classList.add("hidden");
  document.getElementById("qrModal").classList.add("hidden");
  location.replace("/admin-login.html");
}
async function request(path, options = {}) {
  const progress = document.getElementById("apiProgress");
  pendingRequests++;
  progress.hidden = false;
  progress.textContent = options.method ? "Sending request…" : "Loading club records…";
  try {
    if (location.protocol !== "https:") throw new Error("HTTPS required");
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin", cache: "no-store", ...options
    });
    if (response.status === 401) {
      signInAgain();
      throw new Error("Your session has ended.");
    }
    if (!response.ok) {
      if (response.status === 403) throw new Error("You do not have permission for this action.");
      if (response.status >= 500) throw new Error("The server could not complete the request. Refresh before retrying.");
      const problem = await response.json().catch(() => ({}));
      throw new Error(typeof problem.detail === "string" ? problem.detail : "Check the entered values and try again.");
    }
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) throw new Error("Connection interrupted. Reload to check the saved state.");
    throw error;
  } finally {
    pendingRequests--;
    progress.hidden = pendingRequests === 0;
  }
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
    return h(value > 0 ? `+${value}` : value);
  }
  if (key === "users" && field === "role") {
    return h(String(value).toUpperCase());
  }
  if (field === "logo" || field === "image") {
    const src = imageUrl(value);
    return src ? `<img src="${src}" alt="${field === "logo" ? "Logo" : "Image"}" class="table-thumb" loading="lazy">` : h(value);

  }
  if (key === "rewards" && field === "active") {
    return value ? "Yes" : "No";
  }
  if (["products", "banners"].includes(key) && (field === "active" || field === "isOfficialMerchandise" || field === "allowPreorder")) {
    return value ? "Yes" : "No";
  }
  if ((key === "events" || key === "registrations" || key === "redemptions") && field === "status") {
    return h(String(value).toUpperCase());
  }
  if (key === "events" && field === "checkInEnabled") {
    return value ? "Yes" : "No";
  }
  if (key === "vehicleYears" && field === "year") {
    return h(value);
  }
  return h(value);
}

function renderHeader() {
  const home = adminState.tab === "dashboard";
  const config = home ? null : getConfig(adminState.tab);
  document.querySelector(".dashboard-header").hidden = home;
  document.getElementById("heroBanner").hidden = !home;
  document.getElementById("stats").hidden = !home;
  document.getElementById("tableArea").classList.toggle("module-panel", !home);
  document.getElementById("pageTitle").textContent = home ? "Dashboard" : navLabel(adminState.tab);
  document.getElementById("pageDescription").textContent = config?.description || "";
  document.getElementById("adminUserName").textContent = adminState.user.name;
  document.getElementById("adminUserMeta").textContent = "Administrator";
}

function renderTable() {
  const config = getConfig(adminState.tab);
  const rows = adminState.items[adminState.tab];
  const canCreate = !["registrations", "redemptions"].includes(adminState.tab);
  const canChange = adminState.tab !== "pointTransactions";
  const itemLabel = config.title.endsWith("s") ? config.title.slice(0, -1) : config.title;

  document.getElementById("tableArea").innerHTML = `
    <div class="table-heading">
      <div>
        <div class="eyebrow">${config.title}</div>
        <h3>${config.title} Table</h3>
      </div>
      ${!canCreate ? "" : `<button class="primary-button" id="newRecordButton" type="button">Add ${itemLabel}</button>`}
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
                    ${!canChange ? "" : `<button class="ghost-button" data-edit="${row.id}" type="button">Edit</button>`}
                    ${!canChange ? "" : `<button class="danger-button" data-delete="${row.id}" type="button">Delete</button>`}
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<div class="empty-state">No ${config.title.toLowerCase()} yet.</div>`}
  `;

  if (canCreate) {
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
        const action = config.actions[index];
        if (action.label !== "Show QR" && !window.confirm(`${action.label} this record?`)) return;
        button.disabled = true;
        try {
          await action.handler(row);
        } catch (err) {
          alert(err.message);
        } finally { button.disabled = false; }
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
      button.disabled = true;
      try { await handleDeleteRecord(button.dataset.delete); }
      catch (error) { alert(error.message); }
      finally { button.disabled = false; }
    });
  });
}

function openModal() {
  document.querySelector(".dashboard-shell").inert = true;
  document.getElementById("recordModal").classList.remove("hidden");
  document.getElementById("closeModalButton").focus();
  document.getElementById("modalBackdrop").classList.remove("hidden");
}

function closeModal() {
  document.querySelector(".dashboard-shell").inert = false;
  document.getElementById("recordModal").classList.add("hidden");
  document.getElementById("modalBackdrop").classList.add("hidden");
}

function openQrModal(row) {
  const modal = document.getElementById("qrModal");
  const backdrop = document.getElementById("modalBackdrop");
  const tokenUrl = `${window.location.origin}/?checkin=1&event=${row.id}&token=${encodeURIComponent(row.qrToken || "")}`;
  document.getElementById("qrTitle").textContent = `Check-In QR: ${row.title}`;
  const qr = qrcode(0, "M");
  qr.addData(tokenUrl);
  qr.make();
  document.getElementById("qrImage").src = qr.createDataURL(5, 20);
  document.getElementById("qrToken").textContent = row.qrToken || "No token";
  document.querySelector(".dashboard-shell").inert = true;
  modal.classList.remove("hidden");
  document.getElementById("closeQrModalButton").focus();
  backdrop.classList.remove("hidden");
}

function closeQrModal() {
  document.querySelector(".dashboard-shell").inert = false;
  document.getElementById("qrModal").classList.add("hidden");
  document.getElementById("modalBackdrop").classList.add("hidden");
}

async function handleDeleteRecord(id) {
  const key = adminState.tab;
  const config = getConfig(key);
  const itemLabel = config.title.endsWith("s") ? config.title.slice(0, -1) : config.title;
  const ok = window.confirm(`Delete this ${itemLabel.toLowerCase()}?`);
  if (!ok) {
    return;
  }

  await request(`${config.endpoint}/${id}`, { method: "DELETE" });
  if (adminState.tab === key && adminState.editingId === Number(id)) {
      adminState.editingId = null;
      closeModal();
    }
  await loadAdminData();
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
    if (field.readonly) continue;
    if (field.type === "file") {
      const fileInput = document.getElementById(field.name);
      const file = fileInput?.files?.[0];
      if (file) {
        payload[field.name] = await readFileBase64(file);
      } else if (!existing) {
        payload[field.name] = null;
      }
      continue;
    }
    payload[field.name] = formData.get(field.name);
    if (field.type === "number") {
      payload[field.name] = payload[field.name] === "" ? null : Number(payload[field.name]);
    }
    if (field.name === "variants") {
      const raw = String(payload.variants || "").trim();
      const variants = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(variants) || variants.some(v => !v || typeof v !== "object" || Array.isArray(v))) {
        throw new Error("Variants must be a JSON array of objects.");
      }
      if (existing && JSON.stringify(variants) === JSON.stringify(existing.variants || [])) delete payload.variants;
      else payload.variants = variants;
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
              <textarea id="${field.name}" name="${field.name}" rows="4" ${field.required ? "required" : ""}>${h(normalizeForInput(field, existing?.[field.name]))}</textarea>
            </div>
          `;
        }

        if (field.type === "select") {
          return `
            <div class="input-group">
              <label for="${field.name}">${field.label}</label>
              <select id="${field.name}" name="${field.name}" ${field.required ? "required" : ""} ${field.readonly ? "disabled" : ""}>
                ${field.required ? "" : `<option value=""></option>`}
                ${field.name === "role" && existing?.role && !field.options.includes(existing.role) ? `<option selected value="${h(existing.role)}">${h(existing.role)}</option>` : ""}
                ${field.options.map((option) => {
                  const value = isOptionObject(option) ? option.value : option;
                  const label = isOptionObject(option) ? option.label : option;
                  const selected = String(existing?.[field.name]) === String(value);
                  return `<option value="${h(value)}" ${selected ? "selected" : ""}>${h(label)}</option>`;
                }).join("")}
              </select>
            </div>
          `;
        }

        if (field.type === "file") {
          const preview = existing?.[field.name]
            ? `<div class="file-preview"><img src="${imageUrl(existing[field.name])}" alt="${field.label}" class="preview-thumb"></div>`
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
            <input id="${field.name}" name="${field.name}" type="${field.type}" value="${h(normalizeForInput(field, existing?.[field.name]))}" ${field.required ? "required" : ""} ${field.readonly ? "readonly" : ""}>
          </div>
        `;
      }).join("")}
    </div>
    <div class="toolbar">
      <button class="primary-button" type="submit">${existing ? "Save Changes" : "Create"}</button>
      <button class="ghost-button" type="button" id="clearFormButton">Cancel</button>
    </div>
  `;

  document.getElementById("clearFormButton").addEventListener("click", () => {
    adminState.editingId = null;
    closeModal();
    renderForm();
  });

  const form = document.getElementById("recordForm");
  form.onsubmit = async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit.disabled) return;
    const key = adminState.tab;
    const existing = adminState.items[key].find(item => item.id === adminState.editingId);
    submit.disabled = true;
    try {
      const payload = await serializeForm(config, new FormData(form), existing);
      if (["pointTransactions", "registrations", "redemptions"].includes(key)
          && (!existing || payload.status !== existing.status)
          && !window.confirm("Confirm this change?")) {
        submit.disabled = false;
        return;
      }
      const url = existing ? `${config.endpoint}/${existing.id}` : config.endpoint;
      await request(url, { method: existing ? "PUT" : "POST", body: JSON.stringify(payload) });
    } catch (error) {
      alert(error.message);
      submit.disabled = false;
      return;
    }
    closeModal();
    adminState.editingId = null;
    try {
      await loadAdminData();
      renderCurrentTab();
    } catch (error) {
      alert("Saved. Reload the dashboard to refresh the records.");
    }
  };
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

  const results = document.getElementById("leaderboardResults");
  const button = document.getElementById("loadLeaderboardButton");
  async function loadRanking() {
    button.disabled = true;
    results.textContent = "Loading leaderboard…";
    try {
      const period = document.getElementById("leaderboardPeriod").value;
      const date = document.getElementById("leaderboardDate").value;
      const data = await request(`/api/leaderboard?period=${period}&date=${date}`);
      if (results.isConnected) renderLeaderboardResults(data);
    } catch (error) { results.textContent = error.message; }
    finally { button.disabled = false; }
  }
  button.onclick = loadRanking;
  await loadRanking();
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
                <td>${h(row.orderNumber || row.id)}</td>
                <td>${h(row.memberName || "-")}</td>
                <td>${h(row.productTitle || "-")}</td>
                <td>${h(row.totalPrice != null ? row.totalPrice : "-")}</td>
                <td>${h(String(row.status || "").toUpperCase())}</td>
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
                    <p><strong>Order Number:</strong> ${h(row.orderNumber || "-")}</p>
                    <p><strong>Member:</strong> ${h(row.memberName || "-")}</p>
                    <p><strong>Product:</strong> ${h(row.productTitle || "-")}</p>
                    <p><strong>Total Price:</strong> ${h(row.totalPrice != null ? row.totalPrice : "-")}</p>
                    <p><strong>Status:</strong> ${h(String(row.status || "").toUpperCase())}</p>
                    <p><strong>Variant:</strong> ${h(row.variantLabel || "-")}</p>
                    ${/^\/uploads\/payments\/[a-zA-Z0-9_.-]+$/.test(row.paymentProofImage || "") ? `<a href="${h(row.paymentProofImage)}" target="_blank" rel="noreferrer">View payment proof</a>` : ""}
                    <p><strong>Quantity:</strong> ${h(row.quantity)}</p>
                    <p><strong>Unit price:</strong> ${h(row.unitPrice ?? "-")}</p>
                    <p><strong>Created:</strong> ${row.createdAt ? new Date(row.createdAt).toLocaleString("en-ID") : "-"}</p>
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
      if (!window.confirm(`Change this order to ${status}?`)) return;
      const paymentReference = status === "paid" ? window.prompt("Verify the settlement with your bank and enter its unique reference:") : undefined;
      if (status === "paid" && !paymentReference) return;
      const order = rows.find(row => Number(row.id) === id);
      const variantId = status === "processing" && !order?.variantId ? window.prompt("Inventory variant ID for this preorder:") : undefined;
      const note = window.prompt("Optional note:") || "";
      try {
        await request(`${config.endpoint}/${id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status, note, paymentReference, variantId })
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
  const results = document.getElementById("leaderboardResults");
  if (!results) return;
  results.innerHTML = entries.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Rank</th><th>Member</th><th>Chapter</th><th>Points</th></tr>
        </thead>
        <tbody>
          ${entries.map((entry) => `
            <tr class="${entry.rank <= 3 ? "top-rank" : ""}">
              <td><strong>#${h(entry.rank)}</strong></td>
              <td>${h(entry.name || "-")}<br><span class="muted">${h(entry.memberNumber || "")}</span></td>
              <td>${h(entry.chapter || "-")}</td>
              <td>${h(entry.points)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : `<div class="empty-state">No points activity for this period.</div>`;
}

function renderCurrentTab() {
  buildNav();
  renderHeader();
  if (adminState.tab === "dashboard") {
    renderClubTotals();
    renderOverview();
    return;
  }
  const config = getConfig(adminState.tab);
  if (config.custom && typeof config.render === "function") {
    document.getElementById("tableArea").innerHTML = "";
    config.render();
  } else {
    renderTable();
  }
}

async function loadAdminData() {
  const keys = Object.keys(baseConfigs).filter((k) => !baseConfigs[k].custom || k === "orders");
  const results = await Promise.all(keys.map((key) => request(baseConfigs[key].endpoint)));
  keys.forEach((key, index) => {
    // The legacy list response includes a password. Existing credentials never
    // belong in an edit form. A blank edit keeps the user's password intact.
    adminState.items[key] = key === "users"
      ? results[index].map(({ password, ...user }) => user)
      : results[index];
  });
  adminState.chapters = adminState.items.chapters;
  adminState.users = adminState.items.users;
}

async function logoutAdmin() {
  try {
    await request("/api/auth/logout", { method: "POST" });
    signInAgain();
  } catch (error) {
    connectionNotice("Sign-out was not confirmed. Retry when the service is reachable.");
  }
}
async function bootAdmin() {
  const me = await request("/api/auth/me");
  if (me.user?.role !== "admin") { signInAgain(); return; }
  adminState.user = me.user;
  await loadAdminData();
  bindDashboardNavigation();
  renderCurrentTab();
  document.getElementById("adminLogoutButton").addEventListener("click", logoutAdmin);
  document.getElementById("closeModalButton").addEventListener("click", closeModal);
  document.getElementById("closeQrModalButton").addEventListener("click", closeQrModal);
  document.getElementById("modalBackdrop").addEventListener("click", () => {
    closeModal();
    closeQrModal();
  });
}

document.getElementById("reloadRecords").onclick = () => location.reload();
addEventListener("pageshow", event => { if (event.persisted) location.reload(); });
bootAdmin().catch(error => connectionNotice(error.message));
