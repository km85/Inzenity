(() => {
  const API = "";
  localStorage.removeItem("sellerToken");
  function escapeSeller(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  let merchant = null;

  const $ = (id) => document.getElementById(id);
  const byQS = (q) => document.querySelectorAll(q);

  async function api(path, method = "GET", body) {
    if (location.protocol !== "https:") throw new Error("HTTPS required");
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    if (r.status === 401 || r.status === 403) {
      throw new Error("Access denied");
    }
    if (!r.ok) throw new Error((await r.json()).detail || r.statusText);
    return r.status === 204 ? null : r.json();
  }

  async function login() {
    const u = $("loginUser").value;
    const p = $("loginPass").value;
    try {
      if (location.protocol !== "https:") throw new Error("HTTPS required");
      const res = await fetch(API + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: u, password: p, scope: "merchant" }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      merchant = await api("/api/merchant/me");
      showApp();
    } catch (e) {
      $("loginError").textContent = e.message;
    }
  }

  function logout() {

    localStorage.removeItem("sellerToken");
    merchant = null;
    $("appScreen").style.display = "none";
    $("loginScreen").style.display = "block";
  }

  async function init() {

    try {
      merchant = await api("/api/merchant/me");
      showApp();
    } catch (e) {
      logout();
    }
  }

  function showApp() {
    $("loginScreen").style.display = "none";
    $("appScreen").style.display = "flex";
    renderProducts();
  }

  function setActive(tab) {
    byQS("[data-tab]").forEach((el) => el.classList.remove("active"));
    byQS(`[data-tab="${tab}"]`)[0].classList.add("active");
  }

  async function readFileAsBase64(file) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(file);
    });
  }

  async function renderProducts() {
    setActive("products");
    const products = await api("/api/products");
    let html = `
      <h2>Products</h2>
      <button class="primary-button" id="newProduct">+ New Product</button>
      <table class="seller-table"><thead><tr><th>ID</th><th>Title</th><th>Price</th><th>Stock</th><th>Active</th><th>Actions</th></tr></thead><tbody>`;
    for (const p of products) {
      const stock = (p.variants || []).reduce((a, v) => a + (v.stock || 0), 0);
      html += `<tr>
        <td>${escapeSeller(p.id)}</td>
        <td>${escapeSeller(p.title)}</td>
        <td>${escapeSeller(p.price)}</td>
        <td>${escapeSeller(stock)}</td>
        <td>${p.active ? "Yes" : "No"}</td>
        <td>
          <button class="edit-product" data-id="${escapeSeller(p.id)}">Edit</button>
          <button class="toggle-product" data-id="${escapeSeller(p.id)}" data-active="${p.active ? 1 : 0}">${p.active ? "Deactivate" : "Activate"}</button>
        </td>
      </tr>`;
    }
    html += `</tbody></table>`;
    $("mainArea").innerHTML = html;

    $("newProduct").onclick = () => productForm();
    byQS(".edit-product").forEach((b) => b.onclick = async () => {
      const id = b.dataset.id;
      const p = await api(`/api/products/${id}`);
      productForm(p);
    });
    byQS(".toggle-product").forEach((b) => b.onclick = async () => {
      const id = b.dataset.id;
      const active = b.dataset.active === "1";
      await api(`/api/products/${id}`, "PUT", { active: !active });
      renderProducts();
    });
  }

  async function productForm(product = null) {
    const variantsText = product && product.variants ? JSON.stringify(product.variants, null, 2) : "[{\"label\":\"Default\",\"stock\":0}]";
    $("mainArea").innerHTML = `
      <h2>${product ? "Edit" : "New"} Product</h2>
      <form class="seller-form" id="productForm">
        <label>Title</label><input name="title" value="${product ? escapeSeller(product.title) : ""}" required>
        <label>Description</label><textarea name="description">${product ? escapeSeller(product.description || "") : ""}</textarea>
        <label>Price (number string)</label><input name="price" value="${product ? escapeSeller(product.price) : ""}" required>
        <label>Points earned</label><input name="points" type="number" value="${product ? escapeSeller(product.points) : 0}">
        <label>Category</label><input name="category" value="${product ? escapeSeller(product.category || "") : ""}">
        <label>Image (file)</label><input name="image" type="file" accept="image/*">
        <label>Allow Pre-order</label><select name="allowPreorder"><option value="false">No</option><option value="true" ${product && product.allowPreorder ? "selected" : ""}>Yes</option></select>
        <label>Active</label><select name="active"><option value="true">Yes</option><option value="false" ${product && !product.active ? "selected" : ""}>No</option></select>
        <label>Variants JSON</label><textarea name="variants" rows="6">${escapeSeller(variantsText)}</textarea>
        <div class="seller-actions">
          <button class="primary-button" type="submit">Save</button>
          <button class="ghost-button" type="button" id="cancelProduct">Cancel</button>
        </div>
      </form>`;

    $("cancelProduct").onclick = renderProducts;
    $("productForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        title: fd.get("title"),
        description: fd.get("description"),
        price: fd.get("price"),
        points: parseInt(fd.get("points") || "0"),
        category: fd.get("category"),
        allowPreorder: fd.get("allowPreorder") === "true",
        active: fd.get("active") === "true",
        variants: JSON.parse(fd.get("variants") || "[]"),
      };
      const file = fd.get("image");
      if (file && file.size) payload.image = await readFileAsBase64(file);
      try {
        if (product) await api(`/api/products/${product.id}`, "PUT", payload);
        else await api("/api/products", "POST", payload);
        renderProducts();
      } catch (err) {
        alert(err.message);
      }
    };
  }

  async function renderOrders() {
    setActive("orders");
    const orders = await api("/api/orders");
    let html = `<h2>Orders</h2><table class="seller-table"><thead><tr><th>Order #</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
    for (const o of orders) {
      html += `<tr>
        <td>${escapeSeller(o.orderNumber)}</td>
        <td>${escapeSeller(o.productTitle)}</td>
        <td>${escapeSeller(o.quantity)}</td>
        <td>${escapeSeller(o.totalPrice)}</td>
        <td><span class="badge">${escapeSeller(o.status)}</span></td>
        <td><button class="update-status" data-id="${escapeSeller(o.id)}">Update Status</button></td>
      </tr>`;
    }
    html += `</tbody></table>`;
    $("mainArea").innerHTML = html;
    byQS(".update-status").forEach((b) => b.onclick = () => statusForm(b.dataset.id));
  }

  async function statusForm(orderId) {
    const order = await api(`/api/orders/${orderId}`);
    const statuses = [order.status, ...({
      pending: ["cancelled"], payment_submitted: ["paid", "cancelled"],
      paid: ["processing", "refunded"], processing: ["shipped", "refunded"],
      shipped: ["completed"]
    }[order.status] || [])];
    $("mainArea").innerHTML = `
      <h2>Update Order ${escapeSeller(order.orderNumber)}</h2>
      <div class="seller-card">
        <p><strong>Product:</strong> ${escapeSeller(order.productTitle)}</p>
        <p><strong>Quantity:</strong> ${escapeSeller(order.quantity)}</p>
        <p><strong>Total:</strong> ${escapeSeller(order.totalPrice)}</p>
        <p><strong>Current Status:</strong> ${escapeSeller(order.status)}</p>
      </div>
      <form class="seller-form" id="statusForm">
        <label>New Status</label>
        <select name="status">${statuses.map((s) => `<option value="${escapeSeller(s)}" ${s === order.status ? "selected" : ""}>${escapeSeller(s)}</option>`).join("")}</select>
        ${order.paymentProofImage && /^\/uploads\/payments\/[a-zA-Z0-9_.-]+$/.test(order.paymentProofImage) ? `<a href="${escapeSeller(order.paymentProofImage)}" target="_blank" rel="noreferrer">View payment proof</a>` : ""}
        <label>Settlement reference (verify against bank before marking paid)</label><input name="paymentReference" maxlength="96">
        ${!order.variantId ? '<label>Inventory variant ID for preorder fulfillment</label><input type="number" min="1" name="variantId">' : ""}
        <label>Note</label><textarea name="note"></textarea>
        <div class="seller-actions">
          <button class="primary-button" type="submit">Update</button>
          <button class="ghost-button" type="button" id="cancelStatus">Cancel</button>
        </div>
      </form>`;
    $("cancelStatus").onclick = renderOrders;
    $("statusForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api(`/api/orders/${orderId}/status`, "PUT", {
          status: fd.get("status"), note: fd.get("note"), paymentReference: fd.get("paymentReference"), variantId: fd.get("variantId")
        });
        renderOrders();
      } catch (err) { alert(err.message); }
    };
  }

  byQS("[data-tab]").forEach((el) => el.onclick = () => {
    const tab = el.dataset.tab;
    if (tab === "products") renderProducts();
    if (tab === "orders") renderOrders();
  });

  $("loginBtn").onclick = login;
  $("logoutBtn").onclick = async () => {
    try { await api("/api/auth/logout", "POST"); logout(); }
    catch (err) { alert(err.message); }
  };

  init();
})();
