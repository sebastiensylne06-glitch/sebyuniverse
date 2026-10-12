
"use strict";

/* =========================================================
   SEBY UNIVERSE — MAIN SCRIPT
   Render API • Customer Orders Sync • Notifications
========================================================= */

/* =========================================================
   CONFIGURATION & STORAGE
========================================================= */

const STORAGE_KEYS = {
    USERS: "sebyUsers",
    CURRENT_USER: "sebyCurrentUser",
    ORDERS: "sebyUniverseOrders",
    CART: "sebyUniverseCart",
    WALLETS: "sebyWallets",
    RECHARGES: "sebyWalletRecharges",
    USED_TXNS: "sebyUsedTransactionIds",
    LANGUAGE: "sebyLanguage",
    NOTIFICATIONS: "sebyNotifications"
};

const SEBY_API_BASE = "https://sebyuniverse.onrender.com";
const WHATSAPP_NUMBER = "50937155313";
const WHATSAPP_DISPLAY = "+509 37 15 53 13";
const NATCASH_NUMBER = "+509 40 09 8873";
const NATCASH_CLEAN = "50940098873";

let selectedProduct = null;
let selectedOption = null;
let selectedQuantity = 1;

let remoteNotifications = [];
let notificationRequestRunning = false;
let notificationRefreshTimer = null;

let orderRequestRunning = false;
let orderRefreshTimer = null;

let orderSubmitting = false;
let rechargeSubmitting = false;

/* =========================================================
   PRODUCTS — PRICES PRESERVED
========================================================= */

const PRODUCTS = {
    freefire: {
        id: "freefire",
        name: "Free Fire Diamonds",
        category: "game",
        description: "Get diamonds quickly to buy skins and passes!",
        fields: ["region", "gameId", "whatsapp", "transaction"],
        options: [
            { id: "ff100", label: "100 + 10 Diamonds", price: 168 },
            { id: "ff310", label: "310 + 31 Diamonds", price: 480 },
            { id: "ff520", label: "520 + 52 Diamonds", price: 800 },
            { id: "ff1060", label: "1 060 + 106 Diamonds", price: 1650 },
            { id: "ff2180", label: "2 180 + 218 Diamonds", price: 3200 },
            { id: "ff5600", label: "5 600 + 560 Diamonds", price: 8000 }
        ]
    },

    tiktok: {
        id: "tiktok",
        name: "TikTok Coins",
        category: "social",
        description: "Send gifts during live streams and support your favorite TikToker!",
        fields: ["email", "whatsapp", "transaction"],
        options: [
            { id: "tt30", label: "30 Coins", price: 125 },
            { id: "tt70", label: "70 Coins", price: 275 },
            { id: "tt350", label: "350 Coins", price: 1260 },
            { id: "tt700", label: "700 Coins", price: 2560 },
            { id: "tt1400", label: "1 400 Coins", price: 5125 },
            { id: "tt3500", label: "3 500 Coins", price: 14250 },
            { id: "tt7000", label: "7 000 Coins", price: 24300 },
            { id: "tt17500", label: "17 500 Coins", price: 55550 }
        ]
    },

    netflix: {
        id: "netflix",
        name: "Netflix Premium",
        category: "streaming",
        description: "Watch great movies and series with a Premium subscription.",
        fields: ["email", "whatsapp", "transaction"],
        options: [
            { id: "nf1", label: "1 Mois abonnement Premium", price: 500 },
            { id: "nf2", label: "2 Mois abonnement Premium", price: 1000 },
            { id: "nf3", label: "3 Mois abonnement Premium", price: 1450 }
        ]
    },

    efootball: {
        id: "efootball",
        name: "eFootball Coins",
        category: "game",
        description: "Get the best players and build your dream team!",
        fields: ["konamiId", "email", "whatsapp", "transaction"],
        options: [
            { id: "ef130", label: "130 Coins", price: 250 },
            { id: "ef300", label: "300 Coins", price: 600 },
            { id: "ef550", label: "550 Coins", price: 950 },
            { id: "ef1040", label: "1 040 Coins", price: 1700 },
            { id: "ef2130", label: "2 130 Coins", price: 3200 },
            { id: "ef12800", label: "12 800 Coins", price: 16480 }
        ]
    },

    dls_gems: {
        id: "dls_gems",
        name: "DLS Diamonds",
        category: "game",
        description: "Upgrade your stadium and unlock great superstars!",
        fields: ["email", "whatsapp", "transaction"],
        options: [
            { id: "dlsd1", label: "90 GEMS", price: 500 },
            { id: "dlsd2", label: "400 GEMS", price: 1750 },
            { id: "dlsd3", label: "910 GEMS", price: 3500 },
            { id: "dlsd4", label: "2 700 GEMS", price: 8950 },
            { id: "dlsd5", label: "6 000 GEMS", price: 21000 }
        ]
    },

    dls_coins: {
        id: "dls_coins",
        name: "DLS Coins",
        category: "game",
        description: "Increase your team level quickly in Dream League Football!",
        fields: ["email", "whatsapp", "transaction"],
        options: [
            { id: "dlsc900", label: "900 COINS", price: 500 },
            { id: "dlsc1950", label: "1 950 COINS", price: 1000 },
            { id: "dlsc3450", label: "3 450 COINS", price: 1600 },
            { id: "dlsc6700", label: "6 700 COINS", price: 2500 },
            { id: "dlsc14000", label: "14 000 COINS", price: 4500 },
            { id: "dlsc40500", label: "40 500 COINS", price: 10000 }
        ]
    },

    flex_gold: {
        id: "flex_gold",
        name: "Flex City Gold",
        category: "game",
        description: "Build and dominate the city with powerful gold resources!",
        fields: ["gameId", "whatsapp", "transaction"],
        options: [
            { id: "fg2100", label: "2 100 Gold", price: 660 },
            { id: "fg6250", label: "6 250 Gold", price: 1900 },
            { id: "fg17000", label: "17 000 Gold", price: 4950 },
            { id: "fg40000", label: "40 000 Gold", price: 10700 },
            { id: "fg77500", label: "77 500 Gold", price: 18900 }
        ]
    },

    flex_diamonds: {
        id: "flex_diamonds",
        name: "Flex City Diamonds",
        category: "game",
        description: "Buy exclusive vehicles and unlock advanced levels!",
        fields: ["gameId", "whatsapp", "transaction"],
        options: [
            { id: "fd360", label: "360 Diamonds", price: 700 },
            { id: "fd725", label: "725 Diamonds", price: 1400 },
            { id: "fd1980", label: "1 980 Diamonds", price: 3400 },
            { id: "fd8470", label: "8 470 Diamonds", price: 6750 },
            { id: "fd17820", label: "17 820 Diamonds", price: 13250 },
            { id: "fd27500", label: "27 500 Diamonds", price: 31900 },
            { id: "fd49500", label: "49 500 Diamonds", price: 47850 },
            { id: "fd70400", label: "70 400 Diamonds", price: 63950 }
        ]
    }
};

/* =========================================================
   HELPERS
========================================================= */

function getJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (_) {
        return fallback;
    }
}

function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
    return "SU-" + Date.now().toString(36) + "-" +
        Math.random().toString(36).slice(2, 7).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatGdes(amount) {
    return Number(amount || 0).toLocaleString("en-US") + " Gdes";
}

function getCurrentUser() {
    return getJSON(STORAGE_KEYS.CURRENT_USER, null);
}

function saveCurrentUser(user) {
    setJSON(STORAGE_KEYS.CURRENT_USER, user);
}

function showToast(message) {
    document.querySelector(".seby-toast")?.remove();

    const toast = document.createElement("div");
    toast.className = "seby-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}

/* =========================================================
   RENDER API HELPER
========================================================= */

async function sebyApiPost(endpoint, payload) {
    let response;

    try {
        response = await fetch(SEBY_API_BASE + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
            cache: "no-store"
        });
    } catch (_) {
        throw new Error(
            "Pa ka konekte ak sèvè a. Verifye entènèt ou epi eseye ankò."
        );
    }

    const raw = await response.text();
    let result = {};

    try {
        result = raw ? JSON.parse(raw) : {};
    } catch (_) {
        throw new Error(
            "Sèvè a pa voye yon repons JSON ki valab. Verifye API Render la."
        );
    }

    if (!response.ok || result.ok === false) {
        throw new Error(
            result.error || result.message ||
            "Erè sèvè a: " + response.status
        );
    }

    return result;
}

/* =========================================================
   TRANSACTION VALIDATION — 10 TO 20 DIGITS
========================================================= */

function validTransactionId(id) {
    const value = String(id || "").trim();

    if (!/^\d{10,20}$/.test(value)) return false;

    const used = getJSON(STORAGE_KEYS.USED_TXNS, []);
    return !used.includes(value);
}

function markTransactionUsed(txn) {
    const used = getJSON(STORAGE_KEYS.USED_TXNS, []);

    if (!used.includes(txn)) {
        used.push(txn);
        setJSON(STORAGE_KEYS.USED_TXNS, used);
    }
}

function validateTransactionOrShowMessage(txn) {
    const value = String(txn || "").trim();

    if (!/^\d{10,20}$/.test(value)) {
        showToast(
            "Kòd tranzaksyon invalid. Li dwe gen ant 10 ak 20 chif. Verifye SMS la ankò."
        );
        return false;
    }

    const used = getJSON(STORAGE_KEYS.USED_TXNS, []);

    if (used.includes(value)) {
        showToast(
            "Kòd tranzaksyon sa a deja itilize. Verifye SMS NatCash ou a."
        );
        return false;
    }

    return true;
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validWhatsApp(number) {
    let digits = String(number || "").replace(/\D/g, "");
    if (digits.startsWith("509")) digits = digits.substring(3);
    return digits.length === 8;
}

/* =========================================================
   PHONE FORMAT
========================================================= */

function formatPhoneInput(input) {
    let digits = input.value.replace(/\D/g, "");

    if (digits.startsWith("509")) digits = digits.substring(3);
    digits = digits.substring(0, 8);

    let result = "+509 ";
    if (digits.length > 0) result += digits.substring(0, 2);
    if (digits.length > 2) result += " " + digits.substring(2, 4);
    if (digits.length > 4) result += " " + digits.substring(4, 8);

    input.value = result;
}

/* =========================================================
   AUTH GATE
========================================================= */

function showApp() {
    const gate = document.getElementById("sebyAuthGate");
    const app = document.getElementById("sebyApp");

    if (gate) gate.style.display = "none";
    if (app) app.classList.add("app-visible");

    loadProfile();
    renderOrders();
    startOrderPolling();
    renderWallet();
    updateCartBadge();
    updateNotificationBadge();

    fetchCustomerNotifications();
    startNotificationPolling();
}

function showAuthGate() {
    const gate = document.getElementById("sebyAuthGate");
    const app = document.getElementById("sebyApp");

    if (gate) gate.style.display = "flex";
    if (app) app.classList.remove("app-visible");

    stopOrderPolling();
    stopNotificationPolling();
}

function switchGateAuth(type) {
    const loginForm = document.getElementById("gateLoginForm");
    const registerForm = document.getElementById("gateRegisterForm");
    const title = document.getElementById("gateAuthTitle");
    const subtitle = document.getElementById("gateAuthSubtitle");

    if (type === "register") {
        loginForm?.classList.remove("active");
        registerForm?.classList.add("active");

        if (title) title.textContent = "Create your SEBY UNIVERSE account";
        if (subtitle) subtitle.textContent = "Create your account to continue.";
    } else {
        registerForm?.classList.remove("active");
        loginForm?.classList.add("active");

        if (title) title.textContent = "Welcome to SEBY UNIVERSE";
        if (subtitle) subtitle.textContent = "Sign in or create your account to continue.";
    }
}

/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function toggleGatePassword(id, button) {
    const input = document.getElementById(id);
    if (!input) return;

    const visible = input.type === "password";
    input.type = visible ? "text" : "password";

    if (button) {
        button.innerHTML = visible
            ? '<i class="fa-regular fa-eye-slash"></i>'
            : '<i class="fa-regular fa-eye"></i>';
    }
}

function togglePasswordVisibility(id, element) {
    const input = document.getElementById(id);
    if (!input) return;

    const visible = input.type === "password";
    input.type = visible ? "text" : "password";

    if (element) {
        element.classList.toggle("fa-eye", !visible);
        element.classList.toggle("fa-eye-slash", visible);
    }
}

/* =========================================================
   REGISTER
========================================================= */

function registerUser(data) {
    const users = getJSON(STORAGE_KEYS.USERS, []);
    const email = String(data.email || "").trim().toLowerCase();

    if (!validEmail(email)) {
        showToast("Invalid email address.");
        return false;
    }

    if (!data.firstName?.trim() || !data.lastName?.trim()) {
        showToast("Enter your first and last name.");
        return false;
    }

    if (!validWhatsApp(data.whatsapp)) {
        showToast("Enter a valid WhatsApp number.");
        return false;
    }

    if (String(data.password || "").length < 6) {
        showToast("Password must contain at least 6 characters.");
        return false;
    }

    if (data.password !== data.confirmPassword) {
        showToast("Passwords do not match.");
        return false;
    }

    if (users.some(user => user.email === email)) {
        showToast("This email is already registered.");
        return false;
    }

    const user = {
        id: generateId(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        whatsapp: String(data.whatsapp || "").trim(),
        email,
        password: data.password,
        createdAt: new Date().toISOString()
    };

    users.push(user);
    setJSON(STORAGE_KEYS.USERS, users);

    const wallets = getJSON(STORAGE_KEYS.WALLETS, {});
    wallets[user.id] = 0;
    setJSON(STORAGE_KEYS.WALLETS, wallets);

    saveCurrentUser(user);
    showToast("Account created successfully.");
    showApp();

    return true;
}

/* =========================================================
   LOGIN & PROFILE STORAGE
========================================================= */

function loginUser(email, password) {
    const users = getJSON(STORAGE_KEYS.USERS, []);
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = users.find(item =>
        item.email === normalizedEmail && item.password === password
    );

    if (!user) {
        showToast("Incorrect email or password.");
        return false;
    }

    saveCurrentUser(user);
    showToast("Welcome back!");
    showApp();

    return true;
}

function updateStoredUser(user) {
    const users = getJSON(STORAGE_KEYS.USERS, []);
    const index = users.findIndex(item => item.id === user.id);

    if (index !== -1) {
        users[index] = user;
        setJSON(STORAGE_KEYS.USERS, users);
    }

    saveCurrentUser(user);
}

/* =========================================================
   SIDEBAR & NAVIGATION
========================================================= */

function openSidebar() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("sidebarOverlay")?.classList.add("active");
}

function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebarOverlay")?.classList.remove("active");
}

function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(pageId)?.classList.add("active");

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageId);
    });

    if (pageId === "orders-page") {
        renderOrders();
        fetchCustomerOrders();
    }

    if (pageId === "wallet-page") renderWallet();
    if (pageId === "profile-page") loadProfile();

    closeSidebar();
}

function toggleSettings() {
    document.getElementById("paramsMenu")?.classList.toggle("open");
    document.getElementById("paramsToggle")?.classList.toggle("open");
}

/* =========================================================
   PRODUCT FILTER
========================================================= */

function filterProducts(category) {
    document.querySelectorAll(".cat-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.cat === category);
    });

    document.querySelectorAll(".product-card").forEach(card => {
        const cardCategory = card.dataset.category;
        card.style.display =
            category === "all" || cardCategory === category ? "" : "none";
    });
}

/* =========================================================
   PRODUCT MODAL & FIELDS
========================================================= */

function createProductField(field) {
    const user = getCurrentUser();

    if (field === "region") {
        return `
            <div class="form-group">
                <label>Region</label>
                <select id="productRegion">
                    <option value="">Select Region</option>
                    <option value="Amérique du Nord">Amérique du Nord</option>
                    <option value="États-Unis">États-Unis</option>
                    <option value="Europe">Europe</option>
                </select>
            </div>`;
    }

    if (field === "gameId") {
        return `
            <div class="form-group">
                <label>Game ID</label>
                <input type="text" id="productGameId" inputmode="numeric"
                    autocomplete="off" placeholder="Enter ID"
                    oninput="this.value=this.value.replace(/\\D/g,'')">
            </div>`;
    }

    if (field === "konamiId") {
        return `
            <div class="form-group">
                <label>Konami ID</label>
                <input type="text" id="productKonamiId"
                    autocomplete="off" placeholder="Enter Konami ID">
            </div>`;
    }

    if (field === "email") {
        return `
            <div class="form-group">
                <label>E-mail</label>
                <input type="email" id="productEmail" autocomplete="email"
                    value="${escapeHTML(user?.email || "")}"
                    placeholder="Enter your e-mail">
            </div>`;
    }

    if (field === "whatsapp") {
        return `
            <div class="form-group">
                <label>WhatsApp Number</label>
                <input type="text" id="productWhatsapp" inputmode="tel"
                    value="${escapeHTML(user?.whatsapp || "+509 ")}"
                    oninput="formatPhoneInput(this)"
                    placeholder="+509 XX XX XXXX">
            </div>`;
    }

    if (field === "transaction") {
        return `
            <div class="form-group">
                <label>Transaction ID</label>
                <input type="text" id="productTxnId" inputmode="numeric"
                    autocomplete="off" maxlength="20"
                    placeholder="Enter NatCash transaction ID"
                    oninput="this.value=this.value.replace(/\\D/g,'').slice(0,20)">
                <small class="hint-text">
                    Voye peman an nan NatCash ${NATCASH_NUMBER}.
                    Kòd la dwe gen ant 10 ak 20 chif.
                    Si SMS konfimasyon an poko rive, tann,
                    verifye mesaj ou yo epi eseye ankò.
                </small>
            </div>`;
    }

    return "";
}

function openProductModal(productId) {
    const product = PRODUCTS[productId];
    if (!product) return;

    selectedProduct = product;
    selectedOption = null;
    selectedQuantity = 1;

    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    if (!modal || !body) return;

    body.innerHTML = `
        <h2 class="product-modal-title">${escapeHTML(product.name)}</h2>
        <p class="product-modal-description">${escapeHTML(product.description)}</p>

        <div class="product-options">
            ${product.options.map(option => `
                <div class="product-option"
                    data-option-id="${escapeHTML(option.id)}"
                    onclick="selectProductOption('${escapeHTML(option.id)}')">
                    <span>${escapeHTML(option.label)}</span>
                    <strong>${formatGdes(option.price)}</strong>
                </div>
            `).join("")}
        </div>

        <div class="order-fields">
            ${product.fields.map(createProductField).join("")}

            <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="productQuantity" min="1" max="100"
                    value="1" onchange="updateProductQuantity()">
            </div>

            <div id="productTotal" style="padding:13px;border-radius:10px;
                background:#f0f9ff;color:#0284c7;font-weight:900;margin-bottom:12px">
                Select a package
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-primary" onclick="confirmProductOrder()">Commander</button>
            <button class="btn-whatsapp" onclick="addSelectedToCart()">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
        </div>`;

    modal.classList.add("active");
}

function selectProductOption(optionId) {
    if (!selectedProduct) return;

    selectedOption = selectedProduct.options.find(option => option.id === optionId);

    document.querySelectorAll(".product-option").forEach(option => {
        option.classList.toggle("selected", option.dataset.optionId === optionId);
    });

    updateProductTotal();
}

function updateProductQuantity() {
    const input = document.getElementById("productQuantity");
    if (!input) return;

    const quantity = parseInt(input.value, 10);
    selectedQuantity = Number.isFinite(quantity) && quantity > 0
        ? Math.min(quantity, 100)
        : 1;

    input.value = selectedQuantity;
    updateProductTotal();
}

function updateProductTotal() {
    const element = document.getElementById("productTotal");
    if (!element) return;

    element.textContent = selectedOption
        ? "Total: " + formatGdes(selectedOption.price * selectedQuantity)
        : "Select a package";
}

function closeProductModal() {
    document.getElementById("productModal")?.classList.remove("active");
    selectedProduct = null;
    selectedOption = null;
    selectedQuantity = 1;
}

/* =========================================================
   ORDERS — SEND TO RENDER API
========================================================= */

async function confirmProductOrder() {
    if (orderSubmitting) return;

    if (!selectedProduct || !selectedOption) {
        showToast("Please select a package.");
        return;
    }

    const user = getCurrentUser();

    if (!user) {
        showToast("Please sign in first.");
        return;
    }

    const value = id =>
        String(document.getElementById(id)?.value || "").trim();

    const whatsapp = value("productWhatsapp");
    const txn = value("productTxnId");
    const email = value("productEmail").toLowerCase();
    const region = value("productRegion");
    const gameId = value("productGameId");
    const konamiId = value("productKonamiId");

    const quantityValue = parseInt(value("productQuantity") || "1", 10);
    const quantity = Number.isFinite(quantityValue) && quantityValue > 0
        ? Math.min(quantityValue, 100)
        : 1;

    if (!validWhatsApp(whatsapp)) {
        showToast("Enter a valid WhatsApp number.");
        return;
    }

    if (selectedProduct.fields.includes("region") && !region) {
        showToast("Select a region.");
        return;
    }

    if (selectedProduct.fields.includes("gameId") &&
        (!gameId || !/^\d+$/.test(gameId))) {
        showToast("Enter a valid numeric ID.");
        return;
    }

    if (selectedProduct.fields.includes("konamiId") && !konamiId) {
        showToast("Enter your Konami ID.");
        return;
    }

    if (selectedProduct.fields.includes("email") && !validEmail(email)) {
        showToast("Enter a valid e-mail.");
        return;
    }

    if (!validateTransactionOrShowMessage(txn)) {
        const txnInput = document.getElementById("productTxnId");
        if (txnInput && !/^\d{10,20}$/.test(txn)) txnInput.focus();
        return;
    }

    const total = selectedOption.price * quantity;
    const customerName = [
        user.firstName || "",
        user.lastName || ""
    ].join(" ").trim() || user.email || "Customer";

    const descriptionParts = [
        "Option: " + selectedOption.label,
        "Transaction ID: " + txn,
        "Customer ID: " + (user.id || ""),
        "WhatsApp: " + whatsapp
    ];

    if (region) descriptionParts.push("Region: " + region);
    if (gameId) descriptionParts.push("Game ID: " + gameId);
    if (konamiId) descriptionParts.push("Konami ID: " + konamiId);
    if (email) descriptionParts.push("Product account email: " + email);

    const button = document.querySelector(
        "#productModal .modal-actions .btn-primary"
    );

    orderSubmitting = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Envoi...";
    }

    try {
        const result = await sebyApiPost("/api/orders", {
            productName: selectedProduct.name + " — " + selectedOption.label,
            customerName,
            customerPhone: whatsapp,
            customerEmail: user.email || email,
            amount: total,
            quantity,
            description
        });

        if (result.ok !== true || !result.order) {
            throw new Error(
                result.error || "Sèvè a pa konfime anrejistreman kòmand lan."
            );
        }

        const serverOrder = result.order;
        const orders = getJSON(STORAGE_KEYS.ORDERS, []);

        const order = {
            id: generateId(),
            remoteOrderId: String(serverOrder.id || serverOrder._id || ""),
            userId: user.id,
            customer: {
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                whatsapp
            },
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            optionId: selectedOption.id,
            optionLabel: selectedOption.label,
            quantity,
            price: selectedOption.price,
            total,
            transactionId: txn,
            region,
            gameId,
            konamiId,
            accountEmail: email,
            status: serverOrder.status || "En attente",
            createdAt: serverOrder.createdAt || new Date().toISOString()
        };

        orders.push(order);
        setJSON(STORAGE_KEYS.ORDERS, orders);
        markTransactionUsed(txn);

        closeProductModal();
        renderOrders();
        fetchCustomerOrders();

        showToast("Kòmand lan voye. Li an atant validasyon Admin lan.");
        openWhatsAppOrder(order);
    } catch (error) {
        console.error("SEBY order submission failed:", error);
        showToast(error.message || "Kòmand lan pa pase. Eseye ankò.");
    } finally {
        orderSubmitting = false;

        if (button) {
            button.disabled = false;
            button.textContent = "Commander";
        }
    }
}

function openWhatsAppOrder(order) {
    let message =
        `Bonjour, mwen vle pase yon kòmand sou sit la.\n\n` +
        `Produit: ${order.productName}\n` +
        `Offre: ${order.optionLabel}\n` +
        `Quantité: ${order.quantity}\n` +
        `Prix total: ${order.total} Gdes\n` +
        `ID Transaction: ${order.transactionId}\n` +
        `WhatsApp: ${order.customer.whatsapp}\n`;

    if (order.region) message += `Region: ${order.region}\n`;
    if (order.gameId) message += `ID: ${order.gameId}\n`;
    if (order.konamiId) message += `Konami ID: ${order.konamiId}\n`;
    if (order.accountEmail) message += `E-mail: ${order.accountEmail}\n`;

    message += "\nStatut: En attente de validation.";

    const url = "https://wa.me/" + WHATSAPP_NUMBER +
        "?text=" + encodeURIComponent(message);

    window.open(url, "_blank", "noopener");
}

/* =========================================================
   CART
========================================================= */

function getCart() {
    return getJSON(STORAGE_KEYS.CART, []);
}

function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;

    badge.textContent = getCart().length;
    badge.style.display = getCart().length ? "" : "none";
}

function addSelectedToCart() {
    if (!selectedProduct || !selectedOption) {
        showToast("Please select a package.");
        return;
    }

    const cart = getCart();

    cart.push({
        id: generateId(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        optionId: selectedOption.id,
        optionLabel: selectedOption.label,
        price: selectedOption.price,
        quantity: selectedQuantity
    });

    setJSON(STORAGE_KEYS.CART, cart);
    updateCartBadge();
    showToast("Added to cart.");
}

function openCartModal() {
    const modal = document.getElementById("cartModal");
    const body = document.getElementById("cartModalBody");
    if (!modal || !body) return;

    const cart = getCart();

    if (!cart.length) {
        body.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
        modal.classList.add("active");
        return;
    }

    let total = 0;

    body.innerHTML = cart.map((item, index) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        total += itemTotal;

        return `
            <div class="cart-item">
                <div class="cart-item-top">
                    <strong>${escapeHTML(item.productName)}</strong>
                    <button onclick="removeCartItem(${index})"
                        style="border:0;background:none;color:#dc2626">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <p>${escapeHTML(item.optionLabel)}</p>
                <p>Quantity: ${Number(item.quantity) || 1}</p>
                <strong>${formatGdes(itemTotal)}</strong>
            </div>`;
    }).join("");

    body.innerHTML += `
        <div class="cart-total">
            <span>Total</span><span>${formatGdes(total)}</span>
        </div>
        <button class="btn-primary full-btn" style="margin-top:15px"
            onclick="checkoutCart()">Commander</button>`;

    modal.classList.add("active");
}

function removeCartItem(index) {
    const cart = getCart();
    if (index < 0 || index >= cart.length) return;

    cart.splice(index, 1);
    setJSON(STORAGE_KEYS.CART, cart);
    updateCartBadge();
    openCartModal();
}

function checkoutCart() {
    if (!getCart().length) {
        showToast("Your cart is empty.");
        return;
    }

    showToast(
        "Open a product, select its package, and enter its transaction ID to place an order."
    );
}

function closeCartModal() {
    document.getElementById("cartModal")?.classList.remove("active");
}

/* =========================================================
   WALLET & NATCASH RECHARGE
========================================================= */

function renderWallet() {
    const user = getCurrentUser();
    const balanceElement = document.getElementById("userWalletBalance");

    if (!user || !balanceElement) return;

    const wallets = getJSON(STORAGE_KEYS.WALLETS, {});
    const balance = Number(wallets[user.id] || 0);

    balanceElement.textContent = balance.toLocaleString("en-US") + " Gdes";
}

async function submitWalletRecharge() {
    if (rechargeSubmitting) return;

    const user = getCurrentUser();

    if (!user) {
        showToast("Please sign in first.");
        return;
    }

    const amountInput = document.getElementById("rechargeAmount");
    const txnInput = document.getElementById("walletTxnId");

    const amount = Number(amountInput?.value || 0);
    const txn = String(txnInput?.value || "").trim();

    if (!Number.isFinite(amount) || amount < 150) {
        showToast("Minimum recharge amount is 150 Gdes.");
        return;
    }

    if (!Number.isSafeInteger(amount)) {
        showToast("Enter a valid whole-number amount.");
        return;
    }

    if (!validateTransactionOrShowMessage(txn)) {
        if (txnInput && !/^\d{10,20}$/.test(txn)) txnInput.focus();
        return;
    }

    const customerName = [
        user.firstName || "",
        user.lastName || ""
    ].join(" ").trim() || user.email || "Customer";

    const submitButton = document.querySelector(
        '[onclick*="submitWalletRecharge"]'
    );

    rechargeSubmitting = true;

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Envoi...";
    }

    try {
        const result = await sebyApiPost("/api/recharges", {
            customerName,
            phone: user.whatsapp || "",
            amount,
            transactionId: txn
        });

        if (result.ok !== true || !result.recharge) {
            throw new Error(
                result.error || "Sèvè a pa konfime demann depo a."
            );
        }

        const serverRecharge = result.recharge;
        const recharges = getJSON(STORAGE_KEYS.RECHARGES, []);

        recharges.push({
            id: generateId(),
            remoteRechargeId: serverRecharge.id || serverRecharge._id || "",
            userId: user.id,
            customer: {
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                whatsapp: user.whatsapp || ""
            },
            amount,
            transactionId: txn,
            status: serverRecharge.status || "En attente",
            createdAt: serverRecharge.createdAt || new Date().toISOString()
        });

        setJSON(STORAGE_KEYS.RECHARGES, recharges);
        markTransactionUsed(txn);

        if (amountInput) amountInput.value = "";
        if (txnInput) txnInput.value = "";

        showToast("Demann depo a voye. Li an atant validasyon Admin lan.");
    } catch (error) {
        console.error("SEBY recharge submission failed:", error);
        showToast(error.message || "Depo a pa pase. Eseye ankò.");
    } finally {
        rechargeSubmitting = false;

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Confirmer le dépôt";
        }
    }
}

/* =========================================================
   ORDERS DISPLAY — LIVE RENDER API SYNC
========================================================= */

function normalizeOrderStatus(status) {
    return String(status || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .trim();
}

function statusLabel(status) {
    const value = normalizeOrderStatus(status);

    if (
        value.includes("refus") ||
        value.includes("reject") ||
        value.includes("cancel") ||
        value.includes("failed")
    ) {
        return "Refusée";
    }

    if (
        value.includes("termine") ||
        value.includes("complete") ||
        value.includes("livre")
    ) {
        return "Terminé";
    }

    if (
        value.includes("valide") ||
        value.includes("approved") ||
        value.includes("success")
    ) {
        return "Validée";
    }

    if (
        value.includes("attente") ||
        value.includes("pending")
    ) {
        return "En attente";
    }

    if (value.includes("cours")) {
        return "En cours";
    }

    return status || "En attente";
}

/*
 * Rekipere estati yo nan baz done Render la.
 * API a konpare imèl ak/oswa nimewo telefòn kliyan an.
 */
async function fetchCustomerOrders() {
    if (orderRequestRunning) return;

    const user = getCurrentUser();

    if (!user || (!user.email && !user.whatsapp)) return;

    orderRequestRunning = true;

    try {
        const params = new URLSearchParams();

        if (user.email) {
            params.set("email", user.email.trim().toLowerCase());
        }

        if (user.whatsapp) {
            params.set("phone", user.whatsapp.trim());
        }

        const response = await fetch(
            SEBY_API_BASE + "/api/customer-orders?" + params.toString(),
            {
                method: "GET",
                headers: { "Accept": "application/json" },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Customer orders API: " + response.status);
        }

        const result = await response.json();

        if (!Array.isArray(result)) {
            throw new Error("Repons kòmand sèvè a pa valab.");
        }

        const currentUser = getCurrentUser();

        if (!currentUser || currentUser.id !== user.id) return;

        const orders = getJSON(STORAGE_KEYS.ORDERS, []);

        result.forEach(remote => {
            if (!remote || !remote.id) return;

            const remoteId = String(remote.id);

            let existing = orders.find(order =>
                String(order.remoteOrderId || "") === remoteId
            );

            if (!existing) {
                /*
                 * Kòmand lan sou sèvè a men li pa nan localStorage.
                 * Ajoute li pou li ka parèt nan My Orders.
                 */
                existing = {
                    id: "remote-" + remoteId,
                    remoteOrderId: remoteId,
                    userId: currentUser.id,
                    productName: remote.productName || "Commande",
                    optionLabel: "",
                    quantity: Number(remote.quantity) || 1,
                    price: Number(remote.amount) || 0,
                    total: Number(remote.amount) || 0,
                    transactionId: "",
                    status: remote.status || "En attente",
                    createdAt: remote.createdAt || "",
                    updatedAt: remote.updatedAt || null
                };

                orders.push(existing);
            } else {
                /*
                 * Estati ki sou Render la ranplase ansyen estati lokal la.
                 */
                existing.status = remote.status || existing.status;
                existing.updatedAt =
                    remote.updatedAt || existing.updatedAt || null;

                if (remote.createdAt) {
                    existing.createdAt = remote.createdAt;
                }

                if (remote.productName) {
                    existing.remoteProductName = remote.productName;
                }

                if (remote.amount !== undefined && remote.amount !== null) {
                    existing.remoteAmount = Number(remote.amount);
                }
            }
        });

        setJSON(STORAGE_KEYS.ORDERS, orders);

        renderOrders({ skipRemote: true });

    } catch (error) {
        console.warn(
            "My Orders pa t kapab rafrechi:",
            error.message
        );
    } finally {
        orderRequestRunning = false;
    }
}

function startOrderPolling() {
    stopOrderPolling();

    if (!getCurrentUser()) return;

    fetchCustomerOrders();

    orderRefreshTimer = setInterval(() => {
        if (getCurrentUser()) {
            fetchCustomerOrders();
        } else {
            stopOrderPolling();
        }
    }, 15000);
}

function stopOrderPolling() {
    if (orderRefreshTimer) {
        clearInterval(orderRefreshTimer);
        orderRefreshTimer = null;
    }
}

function renderOrders(options = {}) {
    const list = document.getElementById("ordersList");
    const user = getCurrentUser();

    if (!list || !user) return;

    if (!options.skipRemote) {
        fetchCustomerOrders();
    }

    const orders = getJSON(STORAGE_KEYS.ORDERS, []);

    const userOrders = orders.filter(order =>
        order.userId === user.id
    );

    if (!userOrders.length) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-bag-shopping"></i>
                <p>No orders yet.</p>
            </div>`;
        return;
    }

    list.innerHTML = userOrders.slice().reverse().map(order => {
        const status = statusLabel(order.status);

        const statusClass =
            status === "Validée" ? "validated" :
            status === "Terminé" ? "completed" :
            status === "Refusée" ? "rejected" :
            status === "En attente" ? "pending" :
            "in-progress";

        const displayedTotal =
            order.remoteAmount !== undefined
                ? order.remoteAmount
                : order.total;

        return `
            <div class="order-card">
                <h3>${escapeHTML(order.remoteProductName || order.productName || "Commande")}</h3>

                ${
                    order.optionLabel
                        ? `<p>Offer: ${escapeHTML(order.optionLabel)}</p>`
                        : ""
                }

                <p>Quantity: ${Number(order.quantity) || 1}</p>

                <p>
                    Total:
                    <strong>${formatGdes(displayedTotal)}</strong>
                </p>

                ${
                    order.transactionId
                        ? `<p>Transaction ID: ${escapeHTML(order.transactionId)}</p>`
                        : ""
                }

                <p>Date: ${escapeHTML(
                    order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : ""
                )}</p>

                <span class="status ${statusClass}">
                    ${escapeHTML(status)}
                </span>
            </div>`;
    }).join("");
}

/* =========================================================
   PROFILE
========================================================= */

function loadProfile() {
    const user = getCurrentUser();
    const content = document.getElementById("profileContent");

    if (!user || !content) return;

    content.innerHTML = `
        <div class="profile-row">
            <span class="profile-label">First Name</span>
            <span class="profile-value">${escapeHTML(user.firstName)}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Last Name</span>
            <span class="profile-value">${escapeHTML(user.lastName)}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">WhatsApp</span>
            <span class="profile-value">${escapeHTML(user.whatsapp)}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Email</span>
            <span class="profile-value">${escapeHTML(user.email)}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Customer ID</span>
            <span class="profile-value">${escapeHTML(user.id)}</span>
        </div>`;
}

/* =========================================================
   CUSTOMER NOTIFICATIONS — RENDER API
========================================================= */

function getLocalNotifications() {
    return getJSON(STORAGE_KEYS.NOTIFICATIONS, []);
}

function getNotifications() {
    const local = getLocalNotifications();
    const remote = Array.isArray(remoteNotifications) ? remoteNotifications : [];

    const combined = [...remote, ...local];
    const seen = new Set();

    return combined.filter(item => {
        const key = String(
            item.id || item._id || item.title + "|" + item.message
        );

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function notificationRead(item) {
    return item.read === true ||
        item.isRead === true ||
        item.status === "read" ||
        item.readAt != null;
}

function notificationTitle(item) {
    return item.title || item.subject || item.heading || "SEBY UNIVERSE";
}

function notificationMessage(item) {
    return item.message || item.body || item.text || item.content || "";
}

function notificationDate(item) {
    const value = item.createdAt || item.created_at || item.date || item.timestamp;
    if (!value) return "";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function updateNotificationBadge() {
    const badge = document.getElementById("notifBadge");
    if (!badge) return;

    const unread = getNotifications().filter(
        item => !notificationRead(item)
    ).length;

    badge.textContent = unread > 99 ? "99+" : String(unread);
    badge.style.display = unread > 0 ? "" : "none";
}

function getNotificationContainer() {
    const candidates = [
        "notifModalBody",
        "notificationList",
        "customerNotificationsList"
    ];

    for (const id of candidates) {
        const element = document.getElementById(id);
        if (element) return element;
    }

    const modal = document.getElementById("notifModal");
    if (!modal) return null;

    let container = modal.querySelector(".seby-notification-list");

    if (!container) {
        container = document.createElement("div");
        container.className = "seby-notification-list";
        modal.appendChild(container);
    }

    return container;
}

function renderCustomerNotifications() {
    const container = getNotificationContainer();

    if (!container) {
        updateNotificationBadge();
        return;
    }

    const notifications = getNotifications();

    if (!notifications.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-bell"></i>
                <p>No notifications yet.</p>
            </div>`;

        updateNotificationBadge();
        return;
    }

    container.innerHTML = notifications.map(item => {
        const id = item.id || item._id || "";

        const isRemote = remoteNotifications.some(remote =>
            String(remote.id || remote._id) === String(id)
        );

        return `
            <article class="seby-notification-item ${
                notificationRead(item) ? "is-read" : "is-unread"
            }">
                <div class="seby-notification-heading">
                    <strong>${escapeHTML(notificationTitle(item))}</strong>
                    ${notificationRead(item)
                        ? ""
                        : '<span class="seby-notification-dot"></span>'}
                </div>
                <p>${escapeHTML(notificationMessage(item))}</p>
                ${notificationDate(item)
                    ? `<small>${escapeHTML(notificationDate(item))}</small>`
                    : ""}
                ${!notificationRead(item) && id
                    ? `<button type="button" class="seby-notification-read"
                        onclick="markCustomerNotificationRead('${escapeHTML(id)}', ${isRemote})">
                        Mark as read
                       </button>`
                    : ""}
            </article>`;
    }).join("");

    updateNotificationBadge();
}

async function fetchCustomerNotifications() {
    const user = getCurrentUser();

    if (!user || !user.email || notificationRequestRunning) return;

    notificationRequestRunning = true;

    try {
        const url = SEBY_API_BASE +
            "/api/customer-notifications?email=" +
            encodeURIComponent(user.email);

        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Notifications API returned " + response.status);
        }

        const result = await response.json();

        const notifications = Array.isArray(result)
            ? result
            : Array.isArray(result.notifications)
                ? result.notifications
                : Array.isArray(result.data)
                    ? result.data
                    : [];

        remoteNotifications = notifications.filter(item => {
            const targetEmail = String(
                item.email || item.customerEmail || item.recipientEmail || ""
            ).toLowerCase();

            const audience = String(
                item.audience || item.target || ""
            ).toLowerCase();

            return !targetEmail ||
                targetEmail === user.email.toLowerCase() ||
                audience === "all";
        });

        renderCustomerNotifications();
    } catch (error) {
        console.warn(
            "SEBY notifications could not be loaded:",
            error.message
        );

        updateNotificationBadge();
    } finally {
        notificationRequestRunning = false;
    }
}

async function markCustomerNotificationRead(id, isRemote) {
    const user = getCurrentUser();
    if (!user) return;

    if (isRemote) {
        try {
            const response = await fetch(
                SEBY_API_BASE + "/api/customer-notifications/" +
                encodeURIComponent(id),
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        email: user.email,
                        phone: user.whatsapp,
                        read: true
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Could not mark remote notification as read.");
            }

            remoteNotifications = remoteNotifications.map(item => {
                const itemId = String(item.id || item._id || "");

                return itemId === String(id)
                    ? { ...item, read: true }
                    : item;
            });
        } catch (error) {
            console.warn("Remote read status was not saved:", error.message);
            showToast("Could not update the notification. Try again later.");
            return;
        }
    } else {
        const local = getLocalNotifications().map(item => {
            const itemId = String(item.id || item._id || "");

            return itemId === String(id)
                ? { ...item, read: true }
                : item;
        });

        setJSON(STORAGE_KEYS.NOTIFICATIONS, local);
    }

    renderCustomerNotifications();
}

async function openNotifModal() {
    const modal = document.getElementById("notifModal");
    if (!modal) return;

    modal.classList.add("active");
    renderCustomerNotifications();
    await fetchCustomerNotifications();
    renderCustomerNotifications();
}

function closeNotifModal() {
    document.getElementById("notifModal")?.classList.remove("active");
}

function startNotificationPolling() {
    stopNotificationPolling();

    if (getCurrentUser()) {
        fetchCustomerNotifications();

        notificationRefreshTimer = setInterval(() => {
            if (getCurrentUser()) {
                fetchCustomerNotifications();
            } else {
                stopNotificationPolling();
            }
        }, 45000);
    }
}

function stopNotificationPolling() {
    if (notificationRefreshTimer) {
        clearInterval(notificationRefreshTimer);
        notificationRefreshTimer = null;
    }
}

/* =========================================================
   AUTH MODAL COMPATIBILITY
========================================================= */

function switchAuthTab(type) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const loginBtn = document.getElementById("tabLoginBtn");
    const registerBtn = document.getElementById("tabRegisterBtn");

    if (type === "register") {
        loginForm?.classList.remove("active");
        registerForm?.classList.add("active");
        loginBtn?.classList.remove("active");
        registerBtn?.classList.add("active");
    } else {
        registerForm?.classList.remove("active");
        loginForm?.classList.add("active");
        registerBtn?.classList.remove("active");
        loginBtn?.classList.add("active");
    }
}

/* =========================================================
   GOOGLE / SOCIAL AUTH PLACEHOLDER
========================================================= */

function socialAuth(provider) {
    showToast(provider + " login requires Google Identity configuration.");
}

/* =========================================================
   PRO MODAL
========================================================= */

function openProModal() {
    document.getElementById("proModal")?.classList.add("active");
}

function closeProModal() {
    document.getElementById("proModal")?.classList.remove("active");
}

/* =========================================================
   COPY
========================================================= */

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(String(text))
            .then(() => showToast("Copied."))
            .catch(() => showToast("Copy failed."));
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = String(text);
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand("copy");
        showToast("Copied.");
    } catch (_) {
        showToast("Copy failed.");
    } finally {
        textarea.remove();
    }
}

/* =========================================================
   LOGOUT & ACCOUNT INFORMATION
========================================================= */

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    remoteNotifications = [];

    stopOrderPolling();
    stopNotificationPolling();

    showAuthGate();
    switchGateAuth("login");
    updateNotificationBadge();

    showToast("You have been signed out.");
}

function openAccountInformation() {
    if (!getCurrentUser()) return;
    showPage("profile-page");
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const getValue = id => document.getElementById(id)?.value || "";

    document.getElementById("gateLoginForm")?.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            loginUser(
                getValue("gateLoginEmail"),
                getValue("gateLoginPassword")
            );
        }
    );

    document.getElementById("gateRegisterForm")?.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            registerUser({
                firstName: getValue("gateFirstName"),
                lastName: getValue("gateLastName"),
                whatsapp: getValue("gateWhatsapp"),
                email: getValue("gateRegisterEmail"),
                password: getValue("gateRegisterPassword"),
                confirmPassword: getValue("gateConfirmPassword")
            });
        }
    );

    document.getElementById("openMenuBtn")
        ?.addEventListener("click", openSidebar);

    document.getElementById("closeMenuBtn")
        ?.addEventListener("click", closeSidebar);

    document.getElementById("sidebarOverlay")
        ?.addEventListener("click", closeSidebar);

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.addEventListener("click", function (event) {
            event.preventDefault();
            showPage(this.dataset.page);
        });
    });

    document.getElementById("paramsToggle")
        ?.addEventListener("click", function (event) {
            event.preventDefault();
            toggleSettings();
        });

    document.getElementById("accountInfosBtn")
        ?.addEventListener("click", function (event) {
            event.preventDefault();
            openAccountInformation();
        });

    document.getElementById("logoutBtn")
        ?.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });

    document.getElementById("goProBtn")
        ?.addEventListener("click", function (event) {
            event.preventDefault();
            openProModal();
        });

    document.getElementById("cartBtn")
        ?.addEventListener("click", openCartModal);

    document.getElementById("notifBtn")
        ?.addEventListener("click", openNotifModal);

    document.getElementById("profileHeaderBtn")
        ?.addEventListener("click", function () {
            showPage("profile-page");
        });

    document.querySelectorAll(".cat-btn").forEach(button => {
        button.addEventListener("click", function () {
            filterProducts(this.dataset.cat);
        });
    });

    document.getElementById("loginForm")
        ?.addEventListener("submit", function (event) {
            event.preventDefault();

            loginUser(
                getValue("loginEmail"),
                getValue("loginPassword")
            );
        });

    document.getElementById("registerForm")
        ?.addEventListener("submit", function (event) {
            event.preventDefault();

            registerUser({
                firstName: getValue("regFirstName"),
                lastName: getValue("regLastName"),
                whatsapp: getValue("regWhatsapp"),
                email: getValue("regEmail"),
                password: getValue("regPassword"),
                confirmPassword: getValue("regConfirmPassword")
            });
        });

    document.querySelectorAll("#walletTxnId, #productTxnId")
        .forEach(input => {
            input.setAttribute("maxlength", "20");

            input.addEventListener("input", function () {
                this.value = this.value.replace(/\D/g, "").slice(0, 20);
            });
        });

    if (getCurrentUser()) {
        showApp();
    } else {
        showAuthGate();
    }

    updateCartBadge();
    updateNotificationBadge();
});

/* =========================================================
   GLOBAL FUNCTIONS FOR HTML onclick=""
========================================================= */

window.toggleGatePassword = toggleGatePassword;
window.switchGateAuth = switchGateAuth;
window.togglePasswordVisibility = togglePasswordVisibility;
window.formatPhoneInput = formatPhoneInput;

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.selectProductOption = selectProductOption;
window.updateProductQuantity = updateProductQuantity;
window.confirmProductOrder = confirmProductOrder;

window.addSelectedToCart = addSelectedToCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.removeCartItem = removeCartItem;
window.checkoutCart = checkoutCart;

window.submitWalletRecharge = submitWalletRecharge;

window.openNotifModal = openNotifModal;
window.closeNotifModal = closeNotifModal;
window.fetchCustomerNotifications = fetchCustomerNotifications;
window.markCustomerNotificationRead = markCustomerNotificationRead;

window.switchAuthTab = switchAuthTab;
window.socialAuth = socialAuth;

window.openProModal = openProModal;
window.closeProModal = closeProModal;

window.copyToClipboard = copyToClipboard;
window.showPage = showPage;
window.logout = logout;
window.filterProducts = filterProducts;
window.openAccountInformation = openAccountInformation;
window.fetchCustomerOrders = fetchCustomerOrders;
window.renderOrders = renderOrders;
