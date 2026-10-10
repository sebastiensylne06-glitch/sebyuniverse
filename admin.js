
"use strict";

const API_BASE = "https://sebyuniverse.onrender.com";
const TOKEN_KEY = "seby_admin_secret_token";
const USER_KEY = "seby_admin_secret_user";

const API = {
  products: `${API_BASE}/api/products`,
  orders: `${API_BASE}/api/orders`,
  clients: `${API_BASE}/api/clients`,
  recharges: `${API_BASE}/api/recharges`,
  transactions: `${API_BASE}/api/transactions`,
  notifications: `${API_BASE}/api/notifications`,
  customerNotifications: `${API_BASE}/api/customer-notifications`,
  messages: `${API_BASE}/api/admin/messages`
};

let products = [];
let orders = [];
let clients = [];
let recharges = [];
let transactions = [];
let notifications = [];

const $ = id => document.getElementById(id);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

document.addEventListener("DOMContentLoaded", () => {
  $("adminCodeForm")?.addEventListener("submit", handleAdminCodeLogin);
  $("logoutButton")?.addEventListener("click", logout);
  $("settingsLogoutButton")?.addEventListener("click", logout);
  $("refreshButton")?.addEventListener("click", loadAll);

  $("newProductButton")?.addEventListener("click", () => openProductForm());
  $("cancelProductButton")?.addEventListener("click", closeProductForm);
  $("productForm")?.addEventListener("submit", saveProduct);

  $("openChangeSecretButton")?.addEventListener(
    "click",
    openChangeAdminSecret
  );

  $("changeAdminSecretForm")?.addEventListener(
    "submit",
    handleChangeAdminSecret
  );

  // Nouvo sistèm mesaj pou kliyan.
  $("customerMessageForm")?.addEventListener(
    "submit",
    sendCustomerMessage
  );

  $("resetCustomerMessageButton")?.addEventListener("click", () => {
    $("customerMessageForm")?.reset();
    setMessageStatus("");
    updateSpecificCustomerField();
  });

  $("messageAudience")?.addEventListener(
    "change",
    updateSpecificCustomerField
  );

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  updateSpecificCustomerField();

  const token = sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    verifyAdminToken(token);
  } else {
    showLoginGate("Antre kòd sekrè administratè a.");
  }
});

function showLoginGate(message = "") {
  if ($("adminLoginGate")) $("adminLoginGate").hidden = false;
  if ($("adminApp")) $("adminApp").hidden = true;

  if ($("adminLoginMessage")) {
    $("adminLoginMessage").textContent = message;
  }
}

function showAdminApp() {
  if ($("adminLoginGate")) $("adminLoginGate").hidden = true;
  if ($("adminApp")) $("adminApp").hidden = false;
}

async function handleAdminCodeLogin(event) {
  event.preventDefault();

  const input = $("adminCode");
  const button = $("adminLoginButton");
  const code = input?.value || "";

  if (!code || !button) return;

  button.disabled = true;
  button.textContent = "Vérification...";

  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ code }),
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.token) {
      throw new Error(data.error || "Connexion refusée.");
    }

    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, "ADMIN");

    input.value = "";

    await verifyAdminToken(data.token);
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    showLoginGate(error.message || "Erreur de connexion.");
  } finally {
    button.disabled = false;
    button.textContent = "Se connecter";
  }
}

async function verifyAdminToken(token) {
  try {
    const response = await fetch(API.orders, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Session invalide.");
    }

    orders = Array.isArray(data) ? data : [];

    sessionStorage.setItem(TOKEN_KEY, token);

    if ($("adminSignedInAs")) {
      $("adminSignedInAs").textContent = "Connecté : ADMIN";
    }

    if ($("settingsAdminEmail")) {
      $("settingsAdminEmail").textContent =
        "Compte administrateur : ADMIN";
    }

    showAdminApp();
    await loadAll();
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    showLoginGate(error.message || "Session expirée.");
  }
}

async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);

  const headers = {
    "Accept": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    showLoginGate(
      data.error || "Session expirée. Reconnectez-vous."
    );

    throw new Error(data.error || "Session expirée.");
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Erreur HTTP ${response.status}`
    );
  }

  return data;
}

async function loadAll() {
  try {
    const result = await Promise.all([
      apiFetch(API.products),
      apiFetch(API.orders),
      apiFetch(API.clients),
      apiFetch(API.recharges),
      apiFetch(API.transactions),
      apiFetch(API.notifications)
    ]);

    [
      products,
      orders,
      clients,
      recharges,
      transactions,
      notifications
    ] = result.map(value =>
      Array.isArray(value) ? value : []
    );

    renderAll();

    if ($("globalMessage")) {
      $("globalMessage").textContent = "Données actualisées.";
    }
  } catch (error) {
    if ($("globalMessage")) {
      $("globalMessage").textContent = error.message;
    }
  }
}

function tableHTML(headers, rows) {
  if (!rows.length) {
    return '<div class="empty">Aucune donnée pour le moment.</div>';
  }

  return `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function dateText(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? esc(value)
    : date.toLocaleString("fr-FR");
}

function renderAll() {
  if ($("statProducts")) {
    $("statProducts").textContent = products.length;
  }

  if ($("statOrders")) {
    $("statOrders").textContent = orders.length;
  }

  if ($("statClients")) {
    $("statClients").textContent = clients.length;
  }

  if ($("statPending")) {
    $("statPending").textContent = recharges.filter(r =>
      /attente|pending/i.test(r.status || "")
    ).length;
  }

  if ($("productsTable")) {
    $("productsTable").innerHTML = tableHTML(
      ["Produit", "Catégorie", "Prix", "Actions"],
      products.map(p => [
        `<strong>${esc(p.name || p.title)}</strong><br>${esc(p.description || "")}`,
        esc(p.category || "—"),
        `${esc(p.price ?? 0)} ${esc(p.currency || "Gdes")}`,
        `
          <button class="btn" data-edit-product="${esc(p.id)}">
            Modifier
          </button>
          <button class="btn secondary" data-delete-product="${esc(p.id)}">
            Supprimer
          </button>
        `
      ])
    );
  }

  if ($("ordersTable")) {
    $("ordersTable").innerHTML = tableHTML(
      ["Date", "Client", "Produit", "Montant", "Statut", "Action"],
      orders.map(o => [
        dateText(o.createdAt),
        `${esc(o.customerName || "—")}<br>${esc(o.customerPhone || o.customerEmail || "")}`,
        esc(o.productName || o.product || "—"),
        `${esc(o.amount ?? o.price ?? 0)} Gdes`,
        esc(o.status || "En attente"),
        `
          <select data-order-status="${esc(o.id)}">
            <option>En attente</option>
            <option>Payée</option>
            <option>Terminée</option>
            <option>Annulée</option>
          </select>
          <button class="btn" data-save-order="${esc(o.id)}">
            OK
          </button>
        `
      ])
    );
  }

  if ($("rechargesTable")) {
    $("rechargesTable").innerHTML = tableHTML(
      [
        "Date",
        "Client",
        "Téléphone",
        "Montant",
        "Référence",
        "Statut",
        "Action"
      ],
      recharges.map(r => [
        dateText(r.createdAt),
        esc(r.customerName || "—"),
        esc(r.phone || "—"),
        `${esc(r.amount ?? 0)} Gdes`,
        esc(r.transactionId || "—"),
        esc(r.status || "En attente"),
        `
          <select data-recharge-status="${esc(r.id)}">
            <option>En attente</option>
            <option>Validée</option>
            <option>Refusée</option>
          </select>
          <button class="btn" data-save-recharge="${esc(r.id)}">
            OK
          </button>
        `
      ])
    );
  }

  if ($("clientsTable")) {
    $("clientsTable").innerHTML = tableHTML(
      ["Nom", "Téléphone", "E-mail", "Date"],
      clients.map(c => [
        esc(c.name || "—"),
        esc(c.phone || "—"),
        esc(c.email || "—"),
        dateText(c.createdAt)
      ])
    );
  }

  if ($("transactionsTable")) {
    $("transactionsTable").innerHTML = tableHTML(
      ["Date", "Type", "Description", "Montant", "Statut"],
      transactions.map(t => [
        dateText(t.createdAt),
        esc(t.type || "—"),
        esc(t.description || "—"),
        `${esc(t.amount ?? 0)} Gdes`,
        esc(t.status || "—")
      ])
    );
  }

  if ($("notificationsTable")) {
    $("notificationsTable").innerHTML = tableHTML(
      ["Date", "Titre", "Message", "État", "Action"],
      notifications.map(n => [
        dateText(n.createdAt),
        esc(n.title || "Notification"),
        esc(n.message || ""),
        n.read ? "Lue" : "Non lue",
        `
          <button class="btn" data-read-notification="${esc(n.id)}">
            ${n.read ? "Marquer non lue" : "Marquer lue"}
          </button>
          <button class="btn secondary" data-delete-notification="${esc(n.id)}">
            Supprimer
          </button>
        `
      ])
    );
  }

  if ($("recentOrders")) {
    $("recentOrders").innerHTML = tableHTML(
      ["Date", "Client", "Produit", "Montant", "Statut"],
      orders.slice(0, 8).map(o => [
        dateText(o.createdAt),
        esc(o.customerName || o.customerPhone || "Client"),
        esc(o.productName || o.product || "—"),
        `${esc(o.amount ?? o.price ?? 0)} Gdes`,
        esc(o.status || "En attente")
      ])
    );
  }

  // Konsève estati aktyèl kòmand yo.
  orders.forEach(o => {
    const select = document.querySelector(
      `[data-order-status="${CSS.escape(String(o.id))}"]`
    );

    if (select && o.status) {
      select.value = o.status;
    }
  });

  // Konsève estati aktyèl rechaj yo.
  recharges.forEach(r => {
    const select = document.querySelector(
      `[data-recharge-status="${CSS.escape(String(r.id))}"]`
    );

    if (select && r.status) {
      select.value = r.status;
    }
  });
}

function showPage(name) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === name
    );
  });

  $(`page-${name}`)?.classList.add("active");

  const titles = {
    dashboard: "Tableau de bord",
    products: "Produits",
    orders: "Commandes",
    recharges: "Recharges",
    clients: "Clients",
    transactions: "Transactions",
    notifications: "Notifications",
    messages: "Mesaj kliyan",
    settings: "Paramètres"
  };

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      titles[name] || "Administration";
  }

  // Fè seksyon mesaj la parèt ak bon seleksyon an.
  if (name === "messages") {
    updateSpecificCustomerField();
  }
}

/* =========================================================
   MESAJ KLIYAN
========================================================= */

function updateSpecificCustomerField() {
  const audience = $("messageAudience")?.value;
  const field = $("specificCustomerEmailField");
  const emailInput = $("messageCustomerEmail");

  if (!field) return;

  const needsEmail = audience === "specific";

  field.hidden = !needsEmail;

  if (emailInput) {
    emailInput.required = needsEmail;
  }
}

function setMessageStatus(message, type = "info") {
  const status = $("messageFormStatus");

  if (!status) return;

  status.textContent = message;
  status.dataset.type = type;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
}

async function sendCustomerMessage(event) {
  event.preventDefault();

  const form = $("customerMessageForm");
  const button = $("sendCustomerMessageButton");

  if (!form || !button) return;

  const audience = $("messageAudience")?.value || "all";
  const title = $("customerMessageTitle")?.value.trim() || "";
  const message = $("customerMessageText")?.value.trim() || "";
  const email = $("messageCustomerEmail")?.value.trim() || "";

  if (!title || !message) {
    setMessageStatus(
      "Tanpri ranpli tit mesaj la ak kontni mesaj la.",
      "error"
    );
    return;
  }

  if (audience === "specific" && !email) {
    setMessageStatus(
      "Antre adrès imèl kliyan ou vle kontakte a.",
      "error"
    );
    return;
  }

  if (!confirm(
    "Èske ou konfime ou vle voye mesaj sa a bay kliyan ou chwazi yo?"
  )) {
    return;
  }

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Ap voye mesaj la...";

  setMessageStatus("Ap voye mesaj la. Tanpri tann...", "info");

  const payload = {
    audience,
    title,
    message
  };

  if (audience === "specific") {
    payload.email = email;
  }

  try {
    const data = await apiFetch(API.messages, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const recipientCount =
      data.recipients ??
      data.recipientCount ??
      data.notificationsSaved ??
      0;

    const emailsSent = data.emailsSent ?? 0;
    const emailsFailed = data.emailsFailed ?? 0;
    const emailsSkipped = data.emailsSkipped ?? 0;

    let result =
      `Mesaj la trete. Kliyan ki vize yo: ${recipientCount}. ` +
      `Imèl voye: ${emailsSent}.`;

    if (emailsFailed > 0) {
      result += ` Imèl ki echwe: ${emailsFailed}.`;
    }

    if (emailsSkipped > 0) {
      result += ` Imèl pa voye: ${emailsSkipped}.`;
    }

    if (data.message && typeof data.message === "string") {
      result += ` ${data.message}`;
    }

    setMessageStatus(result, "success");

    // Kenbe tit ak kontni mesaj la pou admin nan ka verifye yo.
    // Pa efase fòm nan otomatikman.
  } catch (error) {
    setMessageStatus(
      `Mesaj la pa t voye: ${error.message}`,
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

/* =========================================================
   PWODWI
========================================================= */

function openProductForm(product = null) {
  if (!$("productForm")) return;

  $("productForm").hidden = false;
  $("productFormTitle").textContent =
    product ? "Modifier le produit" : "Ajouter un produit";

  $("productId").value = product?.id || "";
  $("productName").value = product?.name || product?.title || "";
  $("productCategory").value = product?.category || "";
  $("productPrice").value = product?.price ?? "";
  $("productImage").value =
    product?.image || product?.imageUrl || "";
  $("productDescription").value = product?.description || "";

  if ($("productMessage")) {
    $("productMessage").textContent = "";
  }
}

function closeProductForm() {
  if (!$("productForm")) return;

  $("productForm").hidden = true;
  $("productForm").reset();
  $("productId").value = "";
}

async function saveProduct(event) {
  event.preventDefault();

  const productId = $("productId").value;

  const body = {
    name: $("productName").value.trim(),
    category: $("productCategory").value.trim(),
    price: Number($("productPrice").value),
    image: $("productImage").value.trim(),
    description: $("productDescription").value.trim()
  };

  try {
    await apiFetch(
      productId
        ? `${API.products}/${encodeURIComponent(productId)}`
        : API.products,
      {
        method: productId ? "PUT" : "POST",
        body: JSON.stringify(body)
      }
    );

    closeProductForm();
    await loadAll();
  } catch (error) {
    if ($("productMessage")) {
      $("productMessage").textContent = error.message;
    }
  }
}

/* =========================================================
   AKSYON SO TAB YO
========================================================= */

document.addEventListener("click", async event => {
  const edit = event.target.closest("[data-edit-product]");

  if (edit) {
    const product = products.find(
      p => String(p.id) === edit.dataset.editProduct
    );

    if (product) openProductForm(product);
    return;
  }

  const delProduct = event.target.closest("[data-delete-product]");

  if (delProduct) {
    if (!confirm("Supprimer ce produit ?")) return;

    try {
      await apiFetch(
        `${API.products}/${encodeURIComponent(delProduct.dataset.deleteProduct)}`,
        { method: "DELETE" }
      );

      await loadAll();
    } catch (error) {
      alert(error.message);
    }

    return;
  }

  const saveOrder = event.target.closest("[data-save-order]");

  if (saveOrder) {
    const id = saveOrder.dataset.saveOrder;

    const select = document.querySelector(
      `[data-order-status="${CSS.escape(id)}"]`
    );

    if (!select) return;

    try {
      await apiFetch(
        `${API.orders}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: select.value })
        }
      );

      await loadAll();
    } catch (error) {
      alert(error.message);
    }

    return;
  }

  const saveRecharge = event.target.closest("[data-save-recharge]");

  if (saveRecharge) {
    const id = saveRecharge.dataset.saveRecharge;

    const select = document.querySelector(
      `[data-recharge-status="${CSS.escape(id)}"]`
    );

    if (!select) return;

    try {
      await apiFetch(
        `${API.recharges}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: select.value })
        }
      );

      await loadAll();
    } catch (error) {
      alert(error.message);
    }

    return;
  }

  const readNotification =
    event.target.closest("[data-read-notification]");

  if (readNotification) {
    const id = readNotification.dataset.readNotification;

    const item = notifications.find(
      n => String(n.id) === id
    );

    try {
      await apiFetch(
        `${API.notifications}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ read: !item?.read })
        }
      );

      await loadAll();
    } catch (error) {
      alert(error.message);
    }

    return;
  }

  const delNotification =
    event.target.closest("[data-delete-notification]");

  if (delNotification) {
    if (!confirm("Supprimer cette notification ?")) return;

    try {
      await apiFetch(
        `${API.notifications}/${encodeURIComponent(delNotification.dataset.deleteNotification)}`,
        { method: "DELETE" }
      );

      await loadAll();
    } catch (error) {
      alert(error.message);
    }
  }
});

/* =========================================================
   CHANJE KÒD SEKRÈ ADMIN
========================================================= */

function openChangeAdminSecret() {
  const form = $("changeAdminSecretForm");

  if (!form) return;

  form.hidden = !form.hidden;

  if (!form.hidden) {
    $("currentAdminSecret")?.focus();
  }
}

async function handleChangeAdminSecret(event) {
  event.preventDefault();

  const currentCode = $("currentAdminSecret").value;
  const newCode = $("newAdminSecret").value;
  const confirmCode = $("confirmAdminSecret").value;
  const message = $("changeAdminSecretMessage");

  const button = $("changeAdminSecretForm").querySelector(
    'button[type="submit"]'
  );

  if (newCode.length < 16) {
    message.textContent =
      "Le nouveau code doit contenir au moins 16 caractères.";
    return;
  }

  if (newCode !== confirmCode) {
    message.textContent =
      "Les deux codes ne correspondent pas.";
    return;
  }

  if (currentCode === newCode) {
    message.textContent =
      "Choisissez un code différent de l'ancien.";
    return;
  }

  button.disabled = true;

  try {
    const data = await apiFetch(
      `${API_BASE}/api/admin/change-secret`,
      {
        method: "POST",
        body: JSON.stringify({ currentCode, newCode })
      }
    );

    message.textContent =
      data.message || "Code modifié. Reconnectez-vous.";

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    $("changeAdminSecretForm").reset();

    setTimeout(() => {
      showLoginGate(
        "Kòd la chanje. Konekte avèk nouvo kòd la."
      );
    }, 1000);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

/* =========================================================
   DEKONEKSYON
========================================================= */

async function logout() {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (_) {
      // Kontinye efase sesyon lokal la menm si API a pa disponib.
    }
  }

  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  $("adminCodeForm")?.reset();

  showLoginGate(
    "Ou dekonekte. Antre kòd sekrè administratè a."
  );
}
