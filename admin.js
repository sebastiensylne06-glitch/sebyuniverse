
"use strict";

/* =========================================================
   SEBY UNIVERSE ADMIN — GOOGLE LOGIN + API
========================================================= */

const API_BASE = "https://sebyuniverse.onrender.com";

const GOOGLE_CLIENT_ID =
    "98960463625-4v91u459j2tqn83r2bpjqhpa7lvqi5pi.apps.googleusercontent.com";

const ADMIN_EMAIL = "sebastiensylne06@gmail.com";
const TOKEN_KEY = "seby_admin_google_token";
const USER_KEY = "seby_admin_google_user";

const API = {
    health: `${API_BASE}/api/health`,
    products: `${API_BASE}/api/products`,
    orders: `${API_BASE}/api/orders`,
    clients: `${API_BASE}/api/clients`,
    recharges: `${API_BASE}/api/recharges`,
    transactions: `${API_BASE}/api/transactions`,
    notifications: `${API_BASE}/api/notifications`
};

let products = [];
let orders = [];
let recharges = [];
let clients = [];
let transactions = [];
let notifications = [];

let adminEmail = "";
let googleButtonRendered = false;


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("productForm");

    if (form) {
        form.addEventListener("submit", saveProduct);
    }

    const modal = document.getElementById("productModal");

    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeProductModal();
            }
        });
    }

    showLoginGate("Vérification de votre session...");

    const savedToken = sessionStorage.getItem(TOKEN_KEY);

    if (savedToken) {
        verifyAdminToken(savedToken, true);
    } else {
        waitForGoogle();
    }
});


/* =========================================================
   GOOGLE LOGIN
========================================================= */

function waitForGoogle() {
    let attempts = 0;

    const timer = setInterval(() => {
        attempts++;

        if (window.google?.accounts?.id) {
            clearInterval(timer);
            initializeGoogleLogin();
            return;
        }

        if (attempts >= 40) {
            clearInterval(timer);
            setLoginMessage(
                "Google Login ne s'est pas chargé. Vérifiez votre connexion Internet et rechargez la page."
            );
        }
    }, 250);
}


function initializeGoogleLogin() {
    if (!window.google?.accounts?.id) {
        setLoginMessage("Le service Google Login est indisponible.");
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        const button = document.getElementById("googleLoginButton");

        if (button && !googleButtonRendered) {
            button.innerHTML = "";

            google.accounts.id.renderButton(button, {
                type: "standard",
                theme: "filled_black",
                size: "large",
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: 280
            });

            googleButtonRendered = true;
        }

        setLoginMessage(
            "Connectez-vous avec le compte Google autorisé."
        );
    } catch (error) {
        console.error("Google initialization error:", error);
        setLoginMessage("Impossible d'initialiser Google Login.");
    }
}


async function handleGoogleCredential(response) {
    const credential = response?.credential;

    if (!credential) {
        setLoginMessage("Google n'a pas fourni de jeton de connexion.");
        return;
    }

    showLoginGate("Vérification de votre compte Google...");

    try {
        /*
         * Verify the token on the backend.
         * Never trust the email shown in the browser alone.
         */
        await verifyAdminToken(credential, false);
    } catch (error) {
        console.error("Admin login failed:", error);

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        showLoginGate(
            error.message ||
            "Connexion refusée. Utilisez le compte administrateur autorisé."
        );

        waitForGoogle();
    }
}


async function verifyAdminToken(token, fromSession) {
    try {
        /*
         * /api/orders is protected by requireAdmin.
         * A successful response confirms the backend accepted
         * the Google token and the authorized admin email.
         */
        const response = await fetch(API.orders, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                "Ce compte Google n'est pas autorisé. Connectez-vous avec le compte administrateur."
            );
        }

        if (!response.ok) {
            throw new Error(
                "Le backend ne peut pas vérifier votre compte. Réessayez dans quelques instants."
            );
        }

        const data = await response.json();

        sessionStorage.setItem(TOKEN_KEY, token);

        const profile = parseGoogleTokenPayload(token);

        adminEmail = profile?.email || ADMIN_EMAIL;

        sessionStorage.setItem(USER_KEY, adminEmail);

        showAdminApp();

        if (Array.isArray(data)) {
            orders = data;
        } else {
            orders = Array.isArray(data.orders) ? data.orders : [];
        }

        const emailDisplay = document.getElementById("adminSignedInAs");
        const settingsEmail = document.getElementById("settingsAdminEmail");

        if (emailDisplay) {
            emailDisplay.textContent = `Connecté : ${adminEmail}`;
        }

        if (settingsEmail) {
            settingsEmail.textContent = `Compte administrateur : ${adminEmail}`;
        }

        await loadAll();
    } catch (error) {
        if (fromSession) {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
        }

        throw error;
    }
}


/*
 * This payload decoding is only for display.
 * Authorization is still verified by the server.
 */
function parseGoogleTokenPayload(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const base64 = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = atob(base64);

        const bytes = Uint8Array.from(
            decoded,
            character => character.charCodeAt(0)
        );

        return JSON.parse(
            new TextDecoder().decode(bytes)
        );
    } catch {
        return null;
    }
}


function showLoginGate(message = "") {
    const gate = document.getElementById("adminLoginGate");
    const app = document.getElementById("adminApp");

    if (gate) gate.style.display = "flex";
    if (app) app.hidden = true;

    setLoginMessage(message);
}


function showAdminApp() {
    const gate = document.getElementById("adminLoginGate");
    const app = document.getElementById("adminApp");

    if (gate) gate.style.display = "none";
    if (app) app.hidden = false;
}


function setLoginMessage(message) {
    const element = document.getElementById("adminLoginMessage");

    if (element) {
        element.textContent = message;
    }
}


/* =========================================================
   API REQUEST HELPER
========================================================= */

async function apiFetch(url, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        showLoginGate("Reconnectez-vous pour continuer.");
        throw new Error("Admin login required.");
    }

    const headers = new Headers(options.headers || {});

    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store"
    });

    if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        showLoginGate(
            "Votre session est expirée ou ce compte n'est pas autorisé. Reconnectez-vous."
        );

        throw new Error("Session refusée.");
    }

    return response;
}


async function responseError(response) {
    try {
        const data = await response.json();
        return data.error || data.message || `Erreur HTTP ${response.status}`;
    } catch {
        return `Erreur HTTP ${response.status}`;
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(section, button = null) {
    document.querySelectorAll(".section").forEach(element => {
        element.classList.remove("active");
    });

    const target = document.getElementById(`${section}Section`);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".menu-item").forEach(element => {
        element.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    } else {
        const matchingButton = [...document.querySelectorAll(".menu-item")]
            .find(element =>
                element.getAttribute("onclick")?.includes(
                    `'${section}'`
                )
            );

        if (matchingButton) {
            matchingButton.classList.add("active");
        }
    }

    const titles = {
        dashboard: "Dashboard",
        orders: "Commandes",
        recharges: "Recharges",
        clients: "Clients",
        notifications: "Notifications",
        products: "Produits & Prix",
        transactions: "Transactions",
        settings: "Paramètres"
    };

    const pageTitle = document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent = titles[section] || "Dashboard";
    }

    closeSidebar();

    if (section === "products") loadProducts();
    if (section === "orders") loadOrders();
    if (section === "recharges") loadRecharges();
    if (section === "clients") loadClients();
    if (section === "transactions") loadTransactions();
    if (section === "notifications") loadNotifications();
}


function openSidebar() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("overlay")?.classList.add("show");
}


function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");
}


/* =========================================================
   CHARGEMENT GENERAL
========================================================= */

async function loadAll() {
    await Promise.allSettled([
        loadProducts(),
        loadOrders(),
        loadRecharges(),
        loadClients(),
        loadTransactions(),
        loadNotifications()
    ]);

    updateDashboard();
    checkAPI();
}


/* =========================================================
   PRODUITS
========================================================= */

async function loadProducts() {
    const container = document.getElementById("productsList");

    if (container) {
        container.innerHTML = `
            <div class="loading">Chargement des produits...</div>
        `;
    }

    try {
        /*
         * GET products is public on the current backend.
         * Use apiFetch anyway so the admin UI always has a session.
         */
        const response = await apiFetch(API.products, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        const data = await response.json();

        products = Array.isArray(data)
            ? data
            : (Array.isArray(data.products) ? data.products : []);

        renderProducts();
        setApiStatus("API connectée — produits synchronisés.", true);
    } catch (error) {
        console.error("loadProducts:", error);

        if (container) {
            container.innerHTML = `
                <div class="empty-box">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Impossible de charger les produits.</p>
                    <small>${escapeHtml(error.message)}</small>
                </div>
            `;
        }
    }
}


function renderProducts() {
    const container = document.getElementById("productsList");
    if (!container) return;

    if (!products.length) {
        container.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-box-open"></i>
                <p>Aucun produit pour le moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const id = product.id || product._id || "";
        const image = product.image || product.imageUrl || "";

        const available =
            product.available !== false &&
            product.active !== false;

        return `
            <article class="product-card">
                ${
                    image
                    ? `<img class="product-image"
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(product.name || "Produit")}"
                            loading="lazy">`
                    : `<div class="product-no-image">
                            <i class="fa-solid fa-box"></i>
                       </div>`
                }

                <div class="product-body">
                    <h3>${escapeHtml(product.name || "Sans nom")}</h3>

                    <div class="product-category">
                        ${escapeHtml(product.category || "Produit")}
                    </div>

                    <div class="product-price">
                        ${formatPrice(product.price)} GDES
                    </div>

                    <span class="product-status ${
                        available ? "available" : "unavailable"
                    }">
                        ${available ? "Disponible" : "Indisponible"}
                    </span>

                    <div class="product-actions">
                        <button class="edit-button"
                            onclick="editProduct('${escapeJs(id)}')">
                            <i class="fa-solid fa-pen"></i> Modifier
                        </button>

                        <button class="delete-button"
                            onclick="deleteProduct('${escapeJs(id)}')">
                            <i class="fa-solid fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}


/* =========================================================
   AJOUT / MODIFICATION PRODUIT
========================================================= */

function openProductModal(product = null) {
    const modal = document.getElementById("productModal");
    const form = document.getElementById("productForm");

    form.reset();

    document.getElementById("productAvailable").checked = true;

    if (product) {
        document.getElementById("modalTitle").textContent =
            "Modifier le produit";

        document.getElementById("productId").value =
            product.id || product._id || "";

        document.getElementById("productName").value =
            product.name || "";

        document.getElementById("productCategory").value =
            product.category || "";

        document.getElementById("productPrice").value =
            product.price ?? "";

        document.getElementById("productImage").value =
            product.image || product.imageUrl || "";

        document.getElementById("productDescription").value =
            product.description || "";

        document.getElementById("productAvailable").checked =
            product.available !== false;
    } else {
        document.getElementById("modalTitle").textContent =
            "Ajouter un produit";

        document.getElementById("productId").value = "";
    }

    modal.classList.add("show");
}


function closeProductModal() {
    document.getElementById("productModal")?.classList.remove("show");
}


function editProduct(id) {
    const product = products.find(item =>
        String(item.id || item._id) === String(id)
    );

    if (!product) {
        showToast("Produit introuvable.");
        return;
    }

    openProductModal(product);
}


async function saveProduct(event) {
    event.preventDefault();

    const id = document.getElementById("productId").value.trim();

    const product = {
        name: document.getElementById("productName").value.trim(),
        category: document.getElementById("productCategory").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        image: document.getElementById("productImage").value.trim(),
        description: document.getElementById("productDescription").value.trim(),
        available: document.getElementById("productAvailable").checked
    };

    if (!product.name) {
        showToast("Entrez le nom du produit.");
        return;
    }

    if (!Number.isFinite(product.price) || product.price < 0) {
        showToast("Entrez un prix valide.");
        return;
    }

    const isEdit = Boolean(id);

    const url = isEdit
        ? `${API.products}/${encodeURIComponent(id)}`
        : API.products;

    try {
        const response = await apiFetch(url, {
            method: isEdit ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        closeProductModal();

        showToast(
            isEdit
                ? "Produit modifié avec succès."
                : "Produit ajouté avec succès."
        );

        await loadProducts();
        updateDashboard();
    } catch (error) {
        console.error("saveProduct:", error);
        showToast(`Erreur : ${error.message}`);
    }
}


/* =========================================================
   SUPPRIMER PRODUIT
========================================================= */

async function deleteProduct(id) {
    const product = products.find(item =>
        String(item.id || item._id) === String(id)
    );

    const name = product?.name || "ce produit";

    if (!confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) {
        return;
    }

    try {
        const response = await apiFetch(
            `${API.products}/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        showToast("Produit supprimé.");

        await loadProducts();
        updateDashboard();
    } catch (error) {
        console.error("deleteProduct:", error);
        showToast(`Erreur : ${error.message}`);
    }
}


/* =========================================================
   COMMANDES
========================================================= */

async function loadOrders() {
    try {
        const response = await apiFetch(API.orders);

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        const data = await response.json();
        orders = Array.isArray(data) ? data : (data.orders || []);

        renderRecords("ordersList", orders, [
            ["Commande", item => item.id],
            ["Client", item => {
                const customer = item.customer || {};
                return `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
                    || customer.email || customer.whatsapp || item.userId || "—";
            }],
            ["Produit", item => item.productName || "—"],
            ["Montant", item => `${formatPrice(item.total)} GDES`],
            ["Transaction", item => item.transactionId || "—"],
            ["Statut", item => item.status || "en_cours"]
        ]);

        updateDashboard();
    } catch (error) {
        console.error("loadOrders:", error);
        showListError("ordersList", error.message);
    }
}


/* =========================================================
   RECHARGES
========================================================= */

async function loadRecharges() {
    try {
        const response = await apiFetch(API.recharges);

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        const data = await response.json();
        recharges = Array.isArray(data) ? data : (data.recharges || []);

        renderRecords("rechargesList", recharges, [
            ["Référence", item => item.id],
            ["Client", item => {
                const customer = item.customer || {};
                return `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
                    || customer.email || customer.whatsapp || item.userId || "—";
            }],
            ["Montant", item => `${formatPrice(item.amount)} GDES`],
            ["Transaction", item => item.transactionId || "—"],
            ["Statut", item => item.status || "en_cours"]
        ]);

        updateDashboard();
    } catch (error) {
        console.error("loadRecharges:", error);
        showListError("rechargesList", error.message);
    }
}


/* =========================================================
   CLIENTS
========================================================= */

async function loadClients() {
    try {
        const response = await apiFetch(API.clients);

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        const data = await response.json();
        clients = Array.isArray(data) ? data : (data.clients || []);

        renderRecords("clientsList", clients, [
            ["Nom", item => `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"],
            ["Email", item => item.email || "—"],
            ["WhatsApp", item => item.whatsapp || "—"],
            ["Solde", item => `${formatPrice(item.balance)} GDES`]
        ]);

        updateDashboard();
    } catch (error) {
        console.error("loadClients:", error);
        showListError("clientsList", error.message);
    }
}


/* =========================================================
   TRANSACTIONS
========================================================= */

async function loadTransactions() {
    try {
        const response = await apiFetch(API.transactions);

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        const data = await response.json();
        transactions = Array.isArray(data)
            ? data
            : (data.transactions || []);

        renderRecords("transactionsList", transactions, [
            ["Référence", item => item.id],
            ["ID transaction", item => item.transactionId || "—"],
            ["Type", item => item.type || "—"],
            ["Montant", item => `${formatPrice(item.amount)} GDES`],
            ["Statut", item => item.status || "en_cours"]
        ]);
    } catch (error) {
        console.error("loadTransactions:", error);
        showListError("transactionsList", error.message);
    }
}


/* =========================================================
   NOTIFICATIONS — LECTURE SEULE AVEC LE BACKEND ACTUEL
========================================================= */

async function loadNotifications() {
    try {
        const response = await apiFetch(API.notifications);

        if (!response.ok) {
            throw new Error(await responseError(response));
        }

        const data = await response.json();
        notifications = Array.isArray(data)
            ? data
            : (data.notifications || []);

        renderRecords("notificationsList", notifications, [
            ["Titre", item => item.title || item.subject || "Notification"],
            ["Message", item => item.message || item.body || "—"],
            ["Date", item => formatDate(item.createdAt)]
        ]);

        const badge = document.getElementById("notificationsBadge");
        const topBadge = document.getElementById("topNotificationBadge");

        if (badge) badge.textContent = notifications.length;
        if (topBadge) topBadge.textContent = notifications.length;
    } catch (error) {
        console.error("loadNotifications:", error);
        showListError("notificationsList", error.message);
    }
}


/* =========================================================
   RENDU DES TABLEAUX
========================================================= */

function renderRecords(containerId, items, columns) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-inbox"></i>
                <p>Aucun élément à afficher.</p>
            </div>
        `;
        return;
    }

    const header = columns.map(column =>
        `<th>${escapeHtml(column[0])}</th>`
    ).join("");

    const rows = items.map(item => `
        <tr>
            ${columns.map(column => `
                <td>${escapeHtml(column[1](item) ?? "—")}</td>
            `).join("")}
        </tr>
    `).join("");

    container.innerHTML = `
        <div style="width:100%;overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr>${header}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}


function showListError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="empty-box">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>Impossible de charger les données.</p>
            <small>${escapeHtml(message || "Erreur API")}</small>
        </div>
    `;
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {
    const pendingStatuses = ["en_cours", "pending", "en attente"];
    const validatedStatuses = ["valide", "validée", "validated", "approved", "completed"];
    const rejectedStatuses = ["refuse", "refusée", "rejected", "cancelled"];

    const countStatus = (items, statuses) =>
        items.filter(item =>
            statuses.includes(String(item.status || "").toLowerCase())
        ).length;

    setText("statOrders", orders.length);
    setText("statPending", countStatus(orders, pendingStatuses));
    setText("statValidated", countStatus(orders, validatedStatuses));
    setText("statRejected", countStatus(orders, rejectedStatuses));
    setText("statRecharges", recharges.length);
    setText("statClients", clients.length);

    setText(
        "ordersBadge",
        orders.filter(item =>
            pendingStatuses.includes(String(item.status || "").toLowerCase())
        ).length
    );

    setText(
        "rechargesBadge",
        recharges.filter(item =>
            pendingStatuses.includes(String(item.status || "").toLowerCase())
        ).length
    );
}


/* =========================================================
   API STATUS
========================================================= */

async function checkAPI() {
    try {
        const response = await fetch(API.health, {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("API indisponible.");
        }

        setApiStatus("API connectée — système opérationnel.", true);
    } catch (error) {
        console.error("checkAPI:", error);
        setApiStatus("API non disponible. Vérifiez le backend Render.", false);
    }
}


function setApiStatus(message, success) {
    ["apiStatus", "settingsApiStatus"].forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;

        element.textContent = message;
        element.style.background = success ? "#dcf7e5" : "#ffe5e5";
        element.style.color = success ? "#15803d" : "#dc2626";
    });
}


/* =========================================================
   SITE CLIENT
========================================================= */

function openSite() {
    window.location.href = "../index.html";
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    adminEmail = "";
    googleButtonRendered = false;

    if (window.google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
    }

    showLoginGate("Vous êtes déconnecté. Connectez-vous pour continuer.");

    const button = document.getElementById("googleLoginButton");
    if (button) button.innerHTML = "";

    waitForGoogle();
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   UTILITAIRES
========================================================= */

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
}


function formatPrice(price) {
    const number = Number(price) || 0;
    return number.toLocaleString("fr-FR");
}


function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("fr-FR");
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeJs(value) {
    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}
