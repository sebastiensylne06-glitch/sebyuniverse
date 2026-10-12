
"use strict";

/* =========================================================
   SEBY UNIVERSE — MAIN SCRIPT
   Render API • Customer Orders Sync • Notifications
========================================================= */

/* CONFIGURATION & STORAGE */

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

/* PRODUCTS — PRICES PRESERVED */

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

/* HELPERS */

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

/* RENDER API HELPER */

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

/* TRANSACTION VALIDATION — 10 TO 20 DIGITS */

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

/* PHONE FORMAT */

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

/* AUTH GATE */

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

/* PASSWORD VISIBILITY */

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

/* REGISTER */

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

/* LOGIN & PROFILE STORAGE */

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

    if (pageId === "wallet-page") {
        renderWallet();
    }

    if (pageId === "profile-page") {
        loadProfile();
    }

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
            category === "all" || cardCategory === category
                ? ""
                : "none";
    });
}

/* =========================================================
   PRODUCT FORM FIELDS
========================================================= */

function createProductField(field) {
    const user = getCurrentUser() || {};

    if (field === "region") {
        return `
            <label for="productRegion">Région du compte</label>
            <select id="productRegion" required>
                <option value="">Choisir une région</option>
                <option value="North America">North America</option>
                <option value="United States">United States</option>
                <option value="Europe">Europe</option>
            </select>
        `;
    }

    if (field === "gameId") {
        return `
            <label for="productGameId">Game ID / Player ID</label>
            <input
                id="productGameId"
                type="text"
                inputmode="numeric"
                placeholder="Entre ton Game ID"
                required
            >
        `;
    }

    if (field === "konamiId") {
        return `
            <label for="productKonamiId">Konami ID</label>
            <input
                id="productKonamiId"
                type="text"
                placeholder="Entre ton Konami ID"
                required
            >
        `;
    }

    if (field === "email") {
        return `
            <label for="productAccountEmail">E-mail du compte</label>
            <input
                id="productAccountEmail"
                type="email"
                value="${escapeHTML(user.email || "")}"
                placeholder="E-mail associé au compte"
                required
            >
        `;
    }

    if (field === "whatsapp") {
        return `
            <label for="productWhatsApp">Numéro WhatsApp</label>
            <input
                id="productWhatsApp"
                type="tel"
                value="${escapeHTML(user.whatsapp || "")}"
                placeholder="+509 XX XX XXXX"
                oninput="formatPhoneInput(this)"
                required
            >
        `;
    }

    if (field === "transaction") {
        return `
            <label for="productTxnId">ID de transaction NatCash</label>
            <input
                id="productTxnId"
                type="text"
                inputmode="numeric"
                maxlength="20"
                placeholder="Entre l'ID de transaction"
                oninput="this.value=this.value.replace(/\\D/g,'').slice(0,20)"
                required
            >
            <small>
                Envoie ton paiement au ${NATCASH_NUMBER}.
                L'ID doit contenir entre 10 et 20 chiffres.
                Le paiement doit être vérifié avant validation.
            </small>
        `;
    }

    return "";
}

/* =========================================================
   PRODUCT MODAL
========================================================= */

function openProductModal(productId) {
    const product = PRODUCTS[productId];

    if (!product) {
        showToast("Produit introuvable.", "error");
        return;
    }

    selectedProduct = product;
    selectedOption = product.options?.[0] || null;
    selectedQuantity = 1;

    const modalBody = document.getElementById("modalBody");

    if (!modalBody) {
        showToast("La fenêtre du produit est introuvable.", "error");
        return;
    }

    const optionsHTML = (product.options || []).map((option, index) => `
        <button
            type="button"
            class="product-option ${index === 0 ? "active" : ""}"
            data-option-index="${index}"
            onclick="selectProductOption(${index})"
        >
            <span>${escapeHTML(option.label)}</span>
            <strong>${formatGdes(option.price)} Gdes</strong>
        </button>
    `).join("");

    const fieldsHTML = (product.fields || [])
        .map(field => createProductField(field))
        .join("");

    modalBody.innerHTML = `
        <div class="product-modal-content">
            <h2>${escapeHTML(product.name)}</h2>
            <p>${escapeHTML(product.description || "")}</p>

            <div class="product-options">
                ${optionsHTML}
            </div>

            <div class="product-required-fields">
                ${fieldsHTML}
            </div>

            <label for="productQuantity">Quantité</label>
            <input
                id="productQuantity"
                type="number"
                min="1"
                max="100"
                value="1"
                oninput="updateProductQuantity(this.value)"
            >

            <div class="product-total">
                Total :
                <strong id="productTotal">0 Gdes</strong>
            </div>

            <div class="product-modal-actions">
                <button
                    type="button"
                    onclick="confirmProductOrder()"
                    id="confirmProductOrderBtn"
                >
                    Confirmer la commande
                </button>

                <button
                    type="button"
                    onclick="addSelectedToCart()"
                >
                    Ajouter au panier
                </button>
            </div>
        </div>
    `;

    updateProductTotal();

    document.getElementById("productModal")?.classList.add("active");
    document.getElementById("productModal")?.classList.remove("hidden");
}

function selectProductOption(index) {
    if (!selectedProduct || !selectedProduct.options?.[index]) {
        return;
    }

    selectedOption = selectedProduct.options[index];

    document.querySelectorAll(".product-option").forEach((button, i) => {
        button.classList.toggle("active", i === index);
    });

    updateProductTotal();
}

function updateProductQuantity(value) {
    const quantityInput = document.getElementById("productQuantity");
    let quantity = Number.parseInt(value, 10);

    if (!Number.isFinite(quantity) || quantity < 1) {
        quantity = 1;
    }

    if (quantity > 100) {
        quantity = 100;
    }

    selectedQuantity = quantity;

    if (quantityInput && String(quantityInput.value) !== String(quantity)) {
        quantityInput.value = String(quantity);
    }

    updateProductTotal();
}

function updateProductTotal() {
    const totalElement = document.getElementById("productTotal");

    if (!totalElement || !selectedOption) {
        return;
    }

    const quantityInput = document.getElementById("productQuantity");
    const quantity = Math.max(
        1,
        Math.min(100, Number.parseInt(quantityInput?.value || "1", 10) || 1)
    );

    selectedQuantity = quantity;
    totalElement.textContent =
        `${formatGdes(selectedOption.price * quantity)} Gdes`;
}

function closeProductModal() {
    document.getElementById("productModal")?.classList.remove("active");
    document.getElementById("productModal")?.classList.add("hidden");
}

/* =========================================================
   CONFIRM PRODUCT ORDER — API
========================================================= */

async function confirmProductOrder() {
    if (orderSubmitting) {
        return;
    }

    if (!selectedProduct || !selectedOption) {
        showToast("Chwazi yon pwodwi ak yon opsyon anvan.", "error");
        return;
    }

    const user = getCurrentUser();

    if (!user) {
        showToast("Konekte sou kont ou anvan ou pase kòmand.", "error");
        showAuthGate?.();
        return;
    }

    const value = id =>
        (document.getElementById(id)?.value || "").trim();

    const whatsapp = value("productWhatsApp");
    const txn = value("productTxnId");
    const email = value("productAccountEmail").toLowerCase();
    const region = value("productRegion");
    const gameId = value("productGameId");
    const konamiId = value("productKonamiId");
    const quantity = Math.max(
        1,
        Math.min(
            100,
            Number.parseInt(
                document.getElementById("productQuantity")?.value || "1",
                10
            ) || 1
        )
    );

    if (!validWhatsApp(whatsapp)) {
        showToast("Antre yon nimewo WhatsApp ki valab.", "error");
        return;
    }

    const fields = selectedProduct.fields || [];

    if (fields.includes("region") && !region) {
        showToast("Chwazi rejyon kont lan.", "error");
        return;
    }

    if (fields.includes("gameId") && !/^\d+$/.test(gameId)) {
        showToast("Antre yon Game ID ki valab.", "error");
        return;
    }

    if (fields.includes("konamiId") && !konamiId) {
        showToast("Antre Konami ID ou.", "error");
        return;
    }

    if (fields.includes("email") && !validEmail(email)) {
        showToast("Antre yon e-mail kont ki valab.", "error");
        return;
    }

    if (fields.includes("transaction")) {
        if (!/^\d{10,20}$/.test(txn)) {
            showToast("ID tranzaksyon an dwe gen 10 a 20 chif.", "error");
            return;
        }

        if (isTransactionUsed(txn)) {
            showToast("ID tranzaksyon sa a deja anrejistre.", "error");
            return;
        }
    }

    const total = selectedOption.price * quantity;
    const customerName = [
        user.firstName || user.firstname || "",
        user.lastName || user.lastname || ""
    ].filter(Boolean).join(" ") || user.name || user.email || "Client";

    const descriptionParts = [
        "Option: " + selectedOption.label,
        "Transaction ID: " + (txn || "Non fourni"),
        "Customer ID: " + (user.id || ""),
        "WhatsApp: " + whatsapp
    ];

    if (region) {
        descriptionParts.push("Region: " + region);
    }

    if (gameId) {
        descriptionParts.push("Game ID: " + gameId);
    }

    if (konamiId) {
        descriptionParts.push("Konami ID: " + konamiId);
    }

    if (email) {
        descriptionParts.push("Product account email: " + email);
    }

    // CORRECTION : description doit être définie avant l'envoi à l'API.
    const description = descriptionParts.join(" | ");

    const button = document.getElementById("confirmProductOrderBtn");
    const originalButtonText = button?.textContent || "Confirmer la commande";

    orderSubmitting = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Envoi...";
    }

    try {
        const result = await sebyApiPost("/api/orders", {
            productName: `${selectedProduct.name} — ${selectedOption.label}`,
            customerName,
            customerPhone: whatsapp,
            customerEmail: user.email || email,
            amount: total,
            quantity,
            description
        });

        if (!result || result.ok !== true || !result.order) {
            throw new Error(
                result?.message || "Le serveur n'a pas confirmé la commande."
            );
        }

        const serverOrder = result.order;

        const order = {
            id: generateId(),
            remoteOrderId: String(serverOrder.id || serverOrder._id || ""),
            userId: String(user.id || user.email || user.whatsapp || ""),
            customerName,
            customerPhone: whatsapp,
            customerEmail: user.email || email,
            productId: selectedProduct.id || "",
            productName: selectedProduct.name,
            optionLabel: selectedOption.label,
            productOption: selectedOption.label,
            quantity,
            price: selectedOption.price,
            total,
            amount: total,
            transactionId: txn,
            region,
            gameId,
            konamiId,
            accountEmail: email,
            description,
            status: serverOrder.status || "En attente",
            createdAt: serverOrder.createdAt || serverOrder.created_at || new Date().toISOString()
        };

        const orders = getJSON(STORAGE_KEYS.ORDERS, []);
        orders.unshift(order);
        setJSON(STORAGE_KEYS.ORDERS, orders);

        if (txn) {
            markTransactionUsed(txn);
        }

        closeProductModal();
        renderOrders();
        fetchCustomerOrders();

        showToast(
            "Kòmand lan voye. Li rete tann verifikasyon administratè a.",
            "success"
        );

        openWhatsAppOrder(order);
    } catch (error) {
        console.error("SEBY order error:", error);

        showToast(
            error?.message || "Nou pa t kapab voye kòmand lan. Eseye ankò.",
            "error"
        );
    } finally {
        orderSubmitting = false;

        if (button) {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    }
}

/* =========================================================
   WHATSAPP ORDER MESSAGE
========================================================= */

function openWhatsAppOrder(order) {
    if (!order) {
        return;
    }

    const lines = [
        "Bonjour SEBY UNIVERSE !",
        "",
        "Nouvelle commande",
        "Produit : " + (order.productName || ""),
        "Option : " + (order.optionLabel || order.productOption || ""),
        "Quantité : " + (order.quantity || 1),
        "Total : " + formatGdes(order.total || order.amount || 0) + " Gdes",
        "Transaction ID : " + (order.transactionId || "Non fourni"),
        "WhatsApp client : " + (order.customerPhone || ""),
        "Statut : En attente de vérification"
    ];

    if (order.region) {
        lines.push("Région : " + order.region);
    }

    if (order.gameId) {
        lines.push("Game ID : " + order.gameId);
    }

    if (order.konamiId) {
        lines.push("Konami ID : " + order.konamiId);
    }

    if (order.accountEmail) {
        lines.push("E-mail du compte : " + order.accountEmail);
    }

    lines.push("", "Merci !");

    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================================================
   CART
========================================================= */

function getCart() {
    const cart = getJSON(STORAGE_KEYS.CART, []);
    return Array.isArray(cart) ? cart : [];
}

function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0
    );

    ["cartBadge", "cart-count"].forEach(id => {
        const badge = document.getElementById(id);
        if (badge) {
            badge.textContent = String(count);
            badge.style.display = count > 0 ? "" : "none";
        }
    });
}

function addSelectedToCart() {
    if (!selectedProduct || !selectedOption) {
        showToast("Chwazi yon pwodwi anvan.", "error");
        return;
    }

    const cart = getCart();
    const key = `${selectedProduct.id || selectedProduct.name}|${selectedOption.label}`;

    const existing = cart.find(item => item.key === key);

    if (existing) {
        existing.quantity = Math.min(
            100,
            (Number(existing.quantity) || 1) + (Number(selectedQuantity) || 1)
        );
    } else {
        cart.push({
            key,
            productId: selectedProduct.id || "",
            productName: selectedProduct.name,
            optionLabel: selectedOption.label,
            price: Number(selectedOption.price) || 0,
            quantity: Math.max(1, Number(selectedQuantity) || 1)
        });
    }

    setJSON(STORAGE_KEYS.CART, cart);
    updateCartBadge();
    closeProductModal();
    showToast("Pwodwi a ajoute nan panyen an.", "success");
}

function openCartModal() {
    const cart = getCart();
    const modal = document.getElementById("cartModal");
    const body = document.getElementById("cartModalBody")
        || document.getElementById("cartItems")
        || document.getElementById("cartContent");

    if (!modal || !body) {
        showToast("Fenèt panyen an pa jwenn nan HTML la.", "error");
        return;
    }

    if (cart.length === 0) {
        body.innerHTML = `
            <div class="empty-state">
                <p>Panyen ou vid.</p>
            </div>
        `;
    } else {
        const itemsHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div>
                    <strong>${escapeHTML(item.productName || "Produit")}</strong>
                    <p>${escapeHTML(item.optionLabel || "")}</p>
                    <p>Quantité : ${Number(item.quantity) || 1}</p>
                    <strong>
                        ${formatGdes((Number(item.price) || 0) *
                            (Number(item.quantity) || 1))} Gdes
                    </strong>
                </div>
                <button type="button" onclick="removeCartItem(${index})">
                    Retirer
                </button>
            </div>
        `).join("");

        const total = cart.reduce(
            (sum, item) =>
                sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
            0
        );

        body.innerHTML = `
            ${itemsHTML}
            <div class="cart-total">
                Total : <strong>${formatGdes(total)} Gdes</strong>
            </div>
            <button type="button" onclick="checkoutCart()">
                Continuer mes achats
            </button>
        `;
    }

    modal.classList.add("active");
    modal.classList.remove("hidden");
}

function removeCartItem(index) {
    const cart = getCart();

    if (index < 0 || index >= cart.length) {
        return;
    }

    cart.splice(index, 1);
    setJSON(STORAGE_KEYS.CART, cart);
    updateCartBadge();
    openCartModal();
}

function checkoutCart() {
    showToast(
        "Ouvri yon pwodwi, chwazi opsyon an epi antre ID tranzaksyon an pou pase kòmand.",
        "info"
    );
}

function closeCartModal() {
    document.getElementById("cartModal")?.classList.remove("active");
    document.getElementById("cartModal")?.classList.add("hidden");
}

/* =========================================================
   WALLET / NATCASH RECHARGE
========================================================= */

function renderWallet() {
    const user = getCurrentUser();

    if (!user) {
        return;
    }

    const wallets = getJSON(STORAGE_KEYS.WALLETS, {});
    const userKey = String(user.id || user.email || user.whatsapp || "");
    const wallet = wallets[userKey] || { balance: 0, transactions: [] };

    const balance = Number(wallet.balance) || 0;

    const balanceElement = document.getElementById("walletBalance");
    if (balanceElement) {
        balanceElement.textContent = `${formatGdes(balance)} Gdes`;
    }

    const transactions = Array.isArray(wallet.transactions)
        ? wallet.transactions
        : [];

    const transactionContainer =
        document.getElementById("walletTransactions");

    if (transactionContainer) {
        transactionContainer.innerHTML = transactions.length
            ? transactions.map(transaction => `
                <div class="transaction-item">
                    <strong>${escapeHTML(transaction.type || "Transaction")}</strong>
                    <span>${formatGdes(Number(transaction.amount) || 0)} Gdes</span>
                    <small>${escapeHTML(transaction.status || "En attente")}</small>
                </div>
            `).join("")
            : `<p class="empty-state">Pa gen tranzaksyon pou kounye a.</p>`;
    }
}

async function submitWalletRecharge() {
    const user = getCurrentUser();

    if (!user) {
        showToast("Konekte anvan ou fè yon depo.", "error");
        return;
    }

    const amountInput = document.getElementById("walletAmount");
    const txnInput = document.getElementById("walletTxnId");

    const amount = Number(amountInput?.value);
    const txn = (txnInput?.value || "").trim();

    if (!Number.isInteger(amount) || amount < 150) {
        showToast("Montan minimòm depo a se 150 Gdes.", "error");
        return;
    }

    if (!/^\d{10,20}$/.test(txn)) {
        showToast("ID tranzaksyon an dwe gen 10 a 20 chif.", "error");
        return;
    }

    if (isTransactionUsed(txn)) {
        showToast("ID tranzaksyon sa a deja anrejistre.", "error");
        return;
    }

    const button = document.querySelector(
        '[onclick*="submitWalletRecharge"]'
    );
    const originalText = button?.textContent || "Soumettre";

    if (button) {
        button.disabled = true;
        button.textContent = "Envoi...";
    }

    try {
        const customerName = [
            user.firstName || user.firstname || "",
            user.lastName || user.lastname || ""
        ].filter(Boolean).join(" ") || user.name || user.email || "Client";

        const result = await sebyApiPost("/api/recharges", {
            customerName,
            phone: user.whatsapp || "",
            amount,
            transactionId: txn
        });

        if (!result || result.ok !== true || !result.recharge) {
            throw new Error(
                result?.message || "Le serveur n'a pas confirmé le dépôt."
            );
        }

        const recharge = result.recharge;
        const recharges = getJSON(STORAGE_KEYS.RECHARGES, []);

        recharges.unshift({
            id: generateId(),
            remoteId: String(recharge.id || recharge._id || ""),
            userId: String(user.id || user.email || user.whatsapp || ""),
            customerName,
            phone: user.whatsapp || "",
            amount,
            transactionId: txn,
            status: recharge.status || "En attente",
            createdAt: recharge.createdAt || new Date().toISOString()
        });

        setJSON(STORAGE_KEYS.RECHARGES, recharges);
        markTransactionUsed(txn);

        if (amountInput) amountInput.value = "";
        if (txnInput) txnInput.value = "";

        showToast(
            "Demann depo a voye. Li rete tann administratè a verifye peman an.",
            "success"
        );

        renderWallet();
    } catch (error) {
        console.error("SEBY wallet recharge error:", error);
        showToast(
            error?.message || "Nou pa t kapab voye demann depo a.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

/* =========================================================
   ORDER STATUS HELPERS
========================================================= */

function normalizeOrderStatus(status) {
    return String(status || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function statusLabel(status) {
    const normalized = normalizeOrderStatus(status);

    if (
        normalized.includes("refus") ||
        normalized.includes("reject") ||
        normalized.includes("cancel")
    ) {
        return "Refusée";
    }

    if (
        normalized.includes("termine") ||
        normalized.includes("complete") ||
        normalized.includes("delivered")
    ) {
        return "Terminé";
    }

    if (
        normalized.includes("valid") ||
        normalized.includes("approved") ||
        normalized.includes("paid")
    ) {
        return "Validée";
    }

    if (
        normalized.includes("cours") ||
        normalized.includes("process")
    ) {
        return "En cours";
    }

    return "En attente";
}

/* =========================================================
   CUSTOMER ORDERS — API SYNC
========================================================= */

let fetchingCustomerOrders = false;

async function fetchCustomerOrders() {
    if (fetchingCustomerOrders) {
        return;
    }

    const user = getCurrentUser();

    if (!user || (!user.email && !user.whatsapp)) {
        return;
    }

    fetchingCustomerOrders = true;

    try {
        const params = new URLSearchParams();

        if (user.email) {
            params.set("email", user.email);
        }

        if (user.whatsapp) {
            params.set("phone", user.whatsapp);
        }

        const response = await fetch(
            `${SEBY_API_BASE}/api/customer-orders?${params.toString()}`,
            {
                method: "GET",
                headers: { Accept: "application/json" }
            }
        );

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error("Le serveur n'a pas renvoyé de JSON.");
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || "Erreur de chargement des commandes.");
        }

        const remoteOrders = Array.isArray(data)
            ? data
            : Array.isArray(data.orders)
                ? data.orders
                : Array.isArray(data.data)
                    ? data.data
                    : [];

        const currentUser = getCurrentUser();

        if (
            !currentUser ||
            String(currentUser.id || currentUser.email || currentUser.whatsapp) !==
            String(user.id || user.email || user.whatsapp)
        ) {
            return;
        }

        const orders = getJSON(STORAGE_KEYS.ORDERS, []);
        const userId = String(user.id || user.email || user.whatsapp || "");

        remoteOrders.forEach(remote => {
            const remoteId = String(remote.id || remote._id || "");

            if (!remoteId) {
                return;
            }

            const existing = orders.find(order =>
                String(order.remoteOrderId || "") === remoteId
            );

            if (existing) {
                existing.status = remote.status || existing.status;
                existing.updatedAt = remote.updatedAt || new Date().toISOString();

                if (remote.productName || remote.product) {
                    existing.remoteProductName =
                        remote.productName || remote.product;
                }

                if (remote.amount != null) {
                    existing.remoteAmount = Number(remote.amount);
                }

                return;
            }

            orders.unshift({
                id: generateId(),
                remoteOrderId: remoteId,
                userId,
                customerName: remote.customerName || user.name || "",
                customerEmail: remote.customerEmail || user.email || "",
                customerPhone: remote.customerPhone || user.whatsapp || "",
                productName: remote.productName || remote.product || "Commande",
                amount: Number(remote.amount) || 0,
                remoteAmount: Number(remote.amount) || 0,
                quantity: Number(remote.quantity) || 1,
                status: remote.status || "En attente",
                createdAt: remote.createdAt || remote.created_at ||
                    new Date().toISOString()
            });
        });

        setJSON(STORAGE_KEYS.ORDERS, orders);
        renderOrders({ skipRemote: true });
    } catch (error) {
        console.warn("SEBY customer orders sync:", error);
    } finally {
        fetchingCustomerOrders = false;
    }
}

let orderPollingTimer = null;

function startOrderPolling() {
    stopOrderPolling();

    if (!getCurrentUser()) {
        return;
    }

    fetchCustomerOrders();

    orderPollingTimer = setInterval(() => {
        if (!getCurrentUser()) {
            stopOrderPolling();
            return;
        }

        fetchCustomerOrders();
    }, 15000);
}

function stopOrderPolling() {
    if (orderPollingTimer) {
        clearInterval(orderPollingTimer);
        orderPollingTimer = null;
    }
}

function renderOrders(options = {}) {
    const container = document.getElementById("ordersList");

    if (!container) {
        return;
    }

    const user = getCurrentUser();

    if (!user) {
        container.innerHTML = `<p class="empty-state">Konekte pou wè kòmand ou yo.</p>`;
        return;
    }

    const userId = String(user.id || user.email || user.whatsapp || "");
    const orders = getJSON(STORAGE_KEYS.ORDERS, []);

    const customerOrders = orders.filter(order =>
        String(order.userId || "") === userId ||
        (
            !order.userId &&
            (
                (user.email && order.customerEmail === user.email) ||
                (user.whatsapp && order.customerPhone === user.whatsapp)
            )
        )
    );

    if (!options.skipRemote) {
        fetchCustomerOrders();
    }

    if (customerOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Ou poko gen kòmand.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = customerOrders.map(order => {
        const productName =
            order.remoteProductName ||
            order.productName ||
            "Commande";

        const amount = order.remoteAmount != null
            ? Number(order.remoteAmount)
            : Number(order.total ?? order.amount) || 0;

        const status = statusLabel(order.status);
        const statusClass = normalizeOrderStatus(status)
            .replace(/\s+/g, "-");

        const date = order.createdAt
            ? new Date(order.createdAt).toLocaleString("fr-FR")
            : "Date inconnue";

        return `
            <article class="order-card">
                <div class="order-card-header">
                    <strong>${escapeHTML(productName)}</strong>
                    <span class="order-status ${escapeHTML(statusClass)}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                <p>Quantité : ${Number(order.quantity) || 1}</p>
                <p>Total : ${formatGdes(amount)} Gdes</p>
                ${order.transactionId
                    ? `<p>ID transaction : ${escapeHTML(order.transactionId)}</p>`
                    : ""}
                <small>${escapeHTML(date)}</small>
            </article>
        `;
    }).join("");
}

/* =========================================================
   CUSTOMER PROFILE
========================================================= */

function loadProfile() {
    const user = getCurrentUser();
    const container = document.getElementById("profileContent");

    if (!container) {
        return;
    }

    if (!user) {
        container.innerHTML = `<p>Konekte pou wè pwofil ou.</p>`;
        return;
    }

    const firstName = user.firstName || user.firstname || "";
    const lastName = user.lastName || user.lastname || "";

    container.innerHTML = `
        <div class="profile-details">
            <p><strong>Prénom :</strong> ${escapeHTML(firstName)}</p>
            <p><strong>Nom :</strong> ${escapeHTML(lastName)}</p>
            <p><strong>WhatsApp :</strong> ${escapeHTML(user.whatsapp || "")}</p>
            <p><strong>E-mail :</strong> ${escapeHTML(user.email || "")}</p>
            <p><strong>ID client :</strong> ${escapeHTML(String(user.id || ""))}</p>
        </div>
    `;
}

/* =========================================================
   NOTIFICATIONS — LOCAL + REMOTE
========================================================= */

let remoteNotifications = [];
let fetchingCustomerNotifications = false;
let notificationPollingTimer = null;

function getLocalNotifications() {
    const notifications = getJSON(STORAGE_KEYS.NOTIFICATIONS, []);
    return Array.isArray(notifications) ? notifications : [];
}

function getNotifications() {
    const local = getLocalNotifications();
    const remote = Array.isArray(remoteNotifications)
        ? remoteNotifications
        : [];

    const combined = [...remote];

    local.forEach(item => {
        const id = String(item.id || item._id || "");

        if (!combined.some(remoteItem =>
            String(remoteItem.id || remoteItem._id || "") === id
        )) {
            combined.push(item);
        }
    });

    return combined;
}

function notificationRead(item) {
    return Boolean(item.read || item.isRead || item.readAt);
}

function notificationTitle(item) {
    return item.title || item.subject || "Notification SEBY UNIVERSE";
}

function notificationMessage(item) {
    return item.message || item.body || item.description || "";
}

function notificationDate(item) {
    const dateValue = item.createdAt || item.created_at || item.date;

    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString("fr-FR");
}

function updateNotificationBadge() {
    const unread = getNotifications().filter(item => !notificationRead(item)).length;

    ["notificationBadge", "notifBadge", "notification-count"].forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(unread);
            element.style.display = unread > 0 ? "" : "none";
        }
    });
}

function getNotificationContainer() {
    return document.getElementById("notifModalBody")
        || document.getElementById("notificationList")
        || document.getElementById("customerNotificationsList")
        || document.querySelector("#notifModal .seby-notification-list");
}

function renderCustomerNotifications() {
    let container = getNotificationContainer();

    if (!container) {
        const modal = document.getElementById("notifModal");

        if (!modal) {
            updateNotificationBadge();
            return;
        }

        container = document.createElement("div");
        container.className = "seby-notification-list";
        modal.appendChild(container);
    }

    const notifications = getNotifications();

    if (notifications.length === 0) {
        container.innerHTML = `<p class="empty-state">Pa gen notifikasyon pou kounye a.</p>`;
        updateNotificationBadge();
        return;
    }

    container.innerHTML = notifications.map(item => {
        const id = String(item.id || item._id || "");
        const read = notificationRead(item);
        const isRemote = remoteNotifications.some(remote =>
            String(remote.id || remote._id || "") === id
        );

        return `
            <article class="notification-card ${read ? "read" : "unread"}">
                <strong>${escapeHTML(notificationTitle(item))}</strong>
                <p>${escapeHTML(notificationMessage(item))}</p>
                <small>${escapeHTML(notificationDate(item))}</small>
                ${read ? "" : `
                    <button
                        type="button"
                        onclick="markCustomerNotificationRead('${escapeHTML(id)}', ${isRemote})"
                    >
                        Marquer comme lu
                    </button>
                `}
            </article>
        `;
    }).join("");

    updateNotificationBadge();
}

async function fetchCustomerNotifications() {
    if (fetchingCustomerNotifications) {
        return;
    }

    const user = getCurrentUser();

    if (!user?.email) {
        renderCustomerNotifications();
        return;
    }

    fetchingCustomerNotifications = true;

    try {
        const response = await fetch(
            `${SEBY_API_BASE}/api/customer-notifications?email=${encodeURIComponent(user.email)}`,
            { headers: { Accept: "application/json" } }
        );

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error("Réponse de notification non valide.");
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || "Erreur de notification.");
        }

        const list = Array.isArray(data)
            ? data
            : Array.isArray(data.notifications)
                ? data.notifications
                : Array.isArray(data.data)
                    ? data.data
                    : [];

        remoteNotifications = list.filter(item => {
            const target = String(
                item.email || item.customerEmail || item.targetEmail || ""
            ).toLowerCase();

            const audience = String(item.audience || "").toLowerCase();

            return !target ||
                target === user.email.toLowerCase() ||
                audience === "all";
        });

        renderCustomerNotifications();
    } catch (error) {
        console.warn("SEBY notification sync:", error);
        renderCustomerNotifications();
    } finally {
        fetchingCustomerNotifications = false;
    }
}

async function markCustomerNotificationRead(id, isRemote = false) {
    const user = getCurrentUser();

    if (!user) {
        return;
    }

    const targetId = String(id);

    if (isRemote) {
        try {
            const response = await fetch(
                `${SEBY_API_BASE}/api/customer-notifications/${encodeURIComponent(targetId)}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: user.email || "",
                        phone: user.whatsapp || "",
                        read: true
                    })
                }
            );

            if (!response.ok) {
                throw new Error("La notification n'a pas pu être mise à jour.");
            }

            remoteNotifications = remoteNotifications.map(item => {
                const itemId = String(item.id || item._id || "");

                return itemId === targetId
                    ? { ...item, read: true }
                    : item;
            });
        } catch (error) {
            console.warn("SEBY mark notification read:", error);
            showToast("Nou pa t kapab make notifikasyon an kòm li.", "error");
            return;
        }
    } else {
        const local = getLocalNotifications().map(item => {
            const itemId = String(item.id || item._id || "");

            return itemId === targetId
                ? { ...item, read: true }
                : item;
        });

        setJSON(STORAGE_KEYS.NOTIFICATIONS, local);
    }

    renderCustomerNotifications();
}

function openNotifModal() {
    const modal = document.getElementById("notifModal");

    if (!modal) {
        showToast("Fenèt notifikasyon an pa jwenn.", "error");
        return;
    }

    modal.classList.add("active");
    modal.classList.remove("hidden");

    renderCustomerNotifications();
    fetchCustomerNotifications();
}

function closeNotifModal() {
    document.getElementById("notifModal")?.classList.remove("active");
    document.getElementById("notifModal")?.classList.add("hidden");
}

function startNotificationPolling() {
    stopNotificationPolling();

    if (!getCurrentUser()) {
        return;
    }

    fetchCustomerNotifications();

    notificationPollingTimer = setInterval(() => {
        if (!getCurrentUser()) {
            stopNotificationPolling();
            return;
        }

        fetchCustomerNotifications();
    }, 45000);
}

function stopNotificationPolling() {
    if (notificationPollingTimer) {
        clearInterval(notificationPollingTimer);
        notificationPollingTimer = null;
    }
}

/* =========================================================
   AUTH MODAL COMPATIBILITY
========================================================= */

function switchAuthTab(type) {
    const isRegister = type === "register";

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.style.display = isRegister ? "none" : "";
    }

    if (registerForm) {
        registerForm.style.display = isRegister ? "" : "none";
    }

    document.getElementById("loginTab")?.classList.toggle("active", !isRegister);
    document.getElementById("registerTab")?.classList.toggle("active", isRegister);
}

function socialAuth(provider) {
    showToast(
        `${provider} login requires Google Identity configuration.`,
        "info"
    );
}

/* =========================================================
   PRO MODAL
========================================================= */

function openProModal() {
    const modal = document.getElementById("proModal");

    if (modal) {
        modal.classList.add("active");
        modal.classList.remove("hidden");
    } else {
        showToast("Fonksyon Pro a poko konfigire.", "info");
    }
}

function closeProModal() {
    document.getElementById("proModal")?.classList.remove("active");
    document.getElementById("proModal")?.classList.add("hidden");
}

/* =========================================================
   CLIPBOARD
========================================================= */

async function copyToClipboard(text) {
    const value = String(text ?? "");

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
        } else {
            const textarea = document.createElement("textarea");

            textarea.value = value;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);
            textarea.select();

            const copied = document.execCommand("copy");
            textarea.remove();

            if (!copied) {
                throw new Error("Copy failed");
            }
        }

        showToast("Kopye avèk siksè.", "success");
    } catch (error) {
        console.error("SEBY clipboard error:", error);
        showToast("Nou pa t kapab kopye tèks la.", "error");
    }
}

/* =========================================================
   LOGOUT / ACCOUNT INFORMATION
========================================================= */

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

    remoteNotifications = [];

    stopOrderPolling();
    stopNotificationPolling();

    showAuthGate();
    switchGateAuth("login");
    updateNotificationBadge();

    showToast("Ou dekonekte sou kont ou.", "success");
}

function openAccountInformation() {
    loadProfile();

    const profilePage = document.getElementById("profile-page");

    if (profilePage) {
        showPage("profile-page");
    } else {
        showToast("Paj pwofil la pa jwenn.", "error");
    }
}

/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const bindForm = (id, callback) => {
        const form = document.getElementById(id);

        if (form) {
            form.addEventListener("submit", event => {
                event.preventDefault();
                callback(form);
            });
        }
    };

    bindForm("gateLoginForm", form => {
        loginUser(
            form.querySelector('[name="email"]')?.value
                || document.getElementById("gateLoginEmail")?.value
                || "",
            form.querySelector('[name="password"]')?.value
                || document.getElementById("gateLoginPassword")?.value
                || ""
        );
    });

    bindForm("gateRegisterForm", form => {
        registerUser({
            firstName:
                form.querySelector('[name="firstName"]')?.value
                || document.getElementById("gateFirstName")?.value
                || "",
            lastName:
                form.querySelector('[name="lastName"]')?.value
                || document.getElementById("gateLastName")?.value
                || "",
            whatsapp:
                form.querySelector('[name="whatsapp"]')?.value
                || document.getElementById("gateWhatsApp")?.value
                || "",
            email:
                form.querySelector('[name="email"]')?.value
                || document.getElementById("gateRegisterEmail")?.value
                || "",
            password:
                form.querySelector('[name="password"]')?.value
                || document.getElementById("gateRegisterPassword")?.value
                || "",
            confirmPassword:
                form.querySelector('[name="confirmPassword"]')?.value
                || document.getElementById("gateConfirmPassword")?.value
                || ""
        });
    });

    bindForm("loginForm", form => {
        loginUser(
            form.querySelector('[name="email"]')?.value
                || document.getElementById("loginEmail")?.value
                || "",
            form.querySelector('[name="password"]')?.value
                || document.getElementById("loginPassword")?.value
                || ""
        );
    });

    bindForm("registerForm", form => {
        registerUser({
            firstName:
                form.querySelector('[name="firstName"]')?.value
                || document.getElementById("firstName")?.value
                || "",
            lastName:
                form.querySelector('[name="lastName"]')?.value
                || document.getElementById("lastName")?.value
                || "",
            whatsapp:
                form.querySelector('[name="whatsapp"]')?.value
                || document.getElementById("registerWhatsApp")?.value
                || "",
            email:
                form.querySelector('[name="email"]')?.value
                || document.getElementById("registerEmail")?.value
                || "",
            password:
                form.querySelector('[name="password"]')?.value
                || document.getElementById("registerPassword")?.value
                || "",
            confirmPassword:
                form.querySelector('[name="confirmPassword"]')?.value
                || document.getElementById("confirmPassword")?.value
                || ""
        });
    });

    document.getElementById("menuToggle")?.addEventListener("click", openSidebar);
    document.getElementById("closeSidebar")?.addEventListener("click", closeSidebar);
    document.getElementById("sidebarOverlay")?.addEventListener("click", closeSidebar);

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.addEventListener("click", () => {
            showPage(item.dataset.page);
        });
    });

    document.getElementById("paramsToggle")?.addEventListener("click", toggleSettings);
    document.getElementById("accountInformationBtn")?.addEventListener("click", openAccountInformation);
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("goProBtn")?.addEventListener("click", openProModal);
    document.getElementById("cartBtn")?.addEventListener("click", openCartModal);
    document.getElementById("notifBtn")?.addEventListener("click", openNotifModal);
    document.getElementById("profileBtn")?.addEventListener("click", () => showPage("profile-page"));

    document.querySelectorAll(".cat-btn[data-cat]").forEach(button => {
        button.addEventListener("click", () => filterProducts(button.dataset.cat));
    });

    ["walletTxnId", "productTxnId"].forEach(id => {
        const input = document.getElementById(id);

        input?.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, 20);
        });
    });

    const user = getCurrentUser();

    if (user) {
        showApp();
        startOrderPolling();
        startNotificationPolling();
    } else {
        showAuthGate();
    }

    updateCartBadge();
    updateNotificationBadge();
});

/* =========================================================
   GLOBAL FUNCTIONS USED BY INLINE HTML HANDLERS
========================================================= */

Object.assign(window, {
    toggleGatePassword,
    switchGateAuth,
    togglePasswordVisibility,
    formatPhoneInput,

    openSidebar,
    closeSidebar,
    toggleSettings,
    showPage,
    filterProducts,

    openProductModal,
    closeProductModal,
    selectProductOption,
    updateProductQuantity,
    updateProductTotal,
    confirmProductOrder,

    addSelectedToCart,
    openCartModal,
    closeCartModal,
    removeCartItem,
    checkoutCart,

    renderWallet,
    submitWalletRecharge,

    fetchCustomerOrders,
    renderOrders,

    loadProfile,
    openAccountInformation,

    openNotifModal,
    closeNotifModal,
    fetchCustomerNotifications,
    markCustomerNotificationRead,

    switchAuthTab,
    socialAuth,

    openProModal,
    closeProModal,
    copyToClipboard,
    logout
});
