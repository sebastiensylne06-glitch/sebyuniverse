/* =========================================================
   SEBY UNIVERSE
   MAIN SCRIPT
   English Default • Translation Compatible
========================================================= */

"use strict";

/* =========================================================
   STORAGE
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

const WHATSAPP_NUMBER = "50937155313";
const WHATSAPP_DISPLAY = "+509 37 15 53 13";

const NATCASH_NUMBER = "+509 40 09 8873";
const NATCASH_CLEAN = "50940098873";

/* =========================================================
   PRODUCTS
========================================================= */

const PRODUCTS = {

    /* ================= FREE FIRE ================= */

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

    /* ================= TIKTOK ================= */

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

    /* ================= NETFLIX ================= */

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

    /* ================= EFOOTBALL ================= */

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

    /* ================= DLS DIAMONDS ================= */

    dls_gems: {
        id: "dls_gems",
        name: "DLS Diamonds",
        category: "game",
        description: "Upgrade your stadium and unlock great superstars!",
        fields: ["email", "password", "whatsapp", "transaction"],
        options: [
            { id: "dlsd1", label: "90 GEMS", price: 500 },
            { id: "dlsd2", label: "400 GEMS", price: 1750 },
            { id: "dlsd3", label: "910 GEMS", price: 3500 },
            { id: "dlsd4", label: "2 700 GEMS", price: 8950 },
            { id: "dlsd5", label: "6 000 GEMS", price: 21000 }
        ]
    },

    /* ================= DLS COINS ================= */

    dls_coins: {
        id: "dls_coins",
        name: "DLS Coins",
        category: "game",
        description: "Increase your team level quickly in Dream League Football!",
        fields: ["email", "password", "whatsapp", "transaction"],
        options: [
            { id: "dlsc900", label: "900 COINS", price: 500 },
            { id: "dlsc1950", label: "1 950 COINS", price: 1000 },
            { id: "dlsc3450", label: "3 450 COINS", price: 1600 },
            { id: "dlsc6700", label: "6 700 COINS", price: 2500 },
            { id: "dlsc14000", label: "14 000 COINS", price: 4500 },
            { id: "dlsc40500", label: "40 500 COINS", price: 10000 }
        ]
    },

    /* ================= FLEX GOLD ================= */

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

    /* ================= FLEX DIAMONDS ================= */

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
    } catch (error) {
        return fallback;
    }
}

function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
    return "SU-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 7).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

    const old = document.querySelector(".seby-toast");

    if (old) {
        old.remove();
    }

    const toast = document.createElement("div");

    toast.className = "seby-toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/* =========================================================
   AUTH GATE
========================================================= */

function showApp() {

    const gate = document.getElementById("sebyAuthGate");
    const app = document.getElementById("sebyApp");

    if (gate) {
        gate.style.display = "none";
    }

    if (app) {
        app.classList.add("app-visible");
    }

    loadProfile();
    renderOrders();
    renderWallet();
    updateCartBadge();
    updateNotificationBadge();
}

function showAuthGate() {

    const gate = document.getElementById("sebyAuthGate");
    const app = document.getElementById("sebyApp");

    if (gate) {
        gate.style.display = "flex";
    }

    if (app) {
        app.classList.remove("app-visible");
    }
}

function switchGateAuth(type) {

    const loginForm =
        document.getElementById("gateLoginForm");

    const registerForm =
        document.getElementById("gateRegisterForm");

    const title =
        document.getElementById("gateAuthTitle");

    const subtitle =
        document.getElementById("gateAuthSubtitle");

    if (type === "register") {

        loginForm?.classList.remove("active");
        registerForm?.classList.add("active");

        if (title) {
            title.textContent =
                "Create your SEBY UNIVERSE account";
        }

        if (subtitle) {
            subtitle.textContent =
                "Create your account to continue.";
        }

    } else {

        registerForm?.classList.remove("active");
        loginForm?.classList.add("active");

        if (title) {
            title.textContent =
                "Welcome to SEBY UNIVERSE";
        }

        if (subtitle) {
            subtitle.textContent =
                "Sign in or create your account to continue.";
        }
    }
}

/* =========================================================
   PASSWORD
========================================================= */

function toggleGatePassword(id, button) {

    const input =
        document.getElementById(id);

    if (!input) {
        return;
    }

    if (input.type === "password") {

        input.type = "text";

        if (button) {
            button.innerHTML =
                '<i class="fa-regular fa-eye-slash"></i>';
        }

    } else {

        input.type = "password";

        if (button) {
            button.innerHTML =
                '<i class="fa-regular fa-eye"></i>';
        }
    }
}

function togglePasswordVisibility(id, element) {

    const input =
        document.getElementById(id);

    if (!input) {
        return;
    }

    if (input.type === "password") {

        input.type = "text";

        element.classList.remove("fa-eye");
        element.classList.add("fa-eye-slash");

    } else {

        input.type = "password";

        element.classList.remove("fa-eye-slash");
        element.classList.add("fa-eye");
    }
}

/* =========================================================
   PHONE FORMAT
   +509 XX XX XXXX
========================================================= */

function formatPhoneInput(input) {

    let digits =
        input.value.replace(/\D/g, "");

    if (digits.startsWith("509")) {
        digits = digits.substring(3);
    }

    digits = digits.substring(0, 8);

    let result = "+509 ";

    if (digits.length > 0) {
        result += digits.substring(0, 2);
    }

    if (digits.length > 2) {
        result += " " + digits.substring(2, 4);
    }

    if (digits.length > 4) {
        result += " " + digits.substring(4, 8);
    }

    input.value = result;
}

/* =========================================================
   VALIDATION
========================================================= */

function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validTransactionId(id) {

    const value =
        String(id || "").trim();

    if (!value) {
        return false;
    }

    if (!/^\d+$/.test(value)) {
        return false;
    }

    if (value.length < 8) {
        return false;
    }

    const used =
        getJSON(STORAGE_KEYS.USED_TXNS, []);

    return !used.includes(value);
}

function validWhatsApp(number) {

    const digits =
        String(number || "").replace(/\D/g, "");

    return digits.length === 8;
}

/* =========================================================
   REGISTER
========================================================= */

function registerUser(data) {

    const users =
        getJSON(STORAGE_KEYS.USERS, []);

    const email =
        data.email.trim().toLowerCase();

    if (!validEmail(email)) {
        showToast("Invalid email address.");
        return false;
    }

    if (data.password.length < 6) {
        showToast(
            "Password must contain at least 6 characters."
        );
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

        firstName:
            data.firstName.trim(),

        lastName:
            data.lastName.trim(),

        whatsapp:
            data.whatsapp.trim(),

        email,

        password:
            data.password,

        createdAt:
            new Date().toISOString()
    };

    users.push(user);

    setJSON(
        STORAGE_KEYS.USERS,
        users
    );

    const wallet =
        getJSON(STORAGE_KEYS.WALLETS, {});

    wallet[user.id] = 0;

    setJSON(
        STORAGE_KEYS.WALLETS,
        wallet
    );

    saveCurrentUser(user);

    showToast(
        "Account created successfully."
    );

    showApp();

    return true;
}

/* =========================================================
   LOGIN
========================================================= */

function loginUser(email, password) {

    const users =
        getJSON(STORAGE_KEYS.USERS, []);

    const user =
        users.find(
            item =>
                item.email ===
                    email.trim().toLowerCase() &&
                item.password === password
        );

    if (!user) {
        showToast(
            "Incorrect email or password."
        );
        return false;
    }

    saveCurrentUser(user);

    showToast("Welcome back!");

    showApp();

    return true;
}

/* =========================================================
   UPDATE USER
========================================================= */

function updateStoredUser(user) {

    const users =
        getJSON(STORAGE_KEYS.USERS, []);

    const index =
        users.findIndex(
            item => item.id === user.id
        );

    if (index !== -1) {

        users[index] = user;

        setJSON(
            STORAGE_KEYS.USERS,
            users
        );
    }

    saveCurrentUser(user);
}

/* =========================================================
   SIDEBAR
========================================================= */

function openSidebar() {

    document
        .getElementById("sidebar")
        ?.classList.add("open");

    document
        .getElementById("sidebarOverlay")
        ?.classList.add("active");
}

function closeSidebar() {

    document
        .getElementById("sidebar")
        ?.classList.remove("open");

    document
        .getElementById("sidebarOverlay")
        ?.classList.remove("active");
}

/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active");
        });

    const page =
        document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    document
        .querySelectorAll(".nav-item[data-page]")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageId
            );
        });

    if (pageId === "orders-page") {
        renderOrders();
    }

    if (pageId === "wallet-page") {
        renderWallet();
    }

    if (pageId === "profile-page") {
        loadProfile();
    }

    closeSidebar();
}

/* =========================================================
   SETTINGS
========================================================= */

function toggleSettings() {

    const menu =
        document.getElementById("paramsMenu");

    const toggle =
        document.getElementById("paramsToggle");

    menu?.classList.toggle("open");
    toggle?.classList.toggle("open");
}

/* =========================================================
   PRODUCTS FILTER
========================================================= */

function filterProducts(category) {

    document
        .querySelectorAll(".cat-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.cat === category
            );
        });

    document
        .querySelectorAll(".product-card")
        .forEach(card => {

            const cardCategory =
                card.dataset.category;

            card.style.display =
                category === "all" ||
                cardCategory === category
                    ? ""
                    : "none";
        });
}

/* =========================================================
   PRODUCT MODAL
========================================================= */

let selectedProduct = null;
let selectedOption = null;
let selectedQuantity = 1;

function createProductField(field) {

    const user =
        getCurrentUser();

    /* ================= REGION ================= */

    if (field === "region") {

        return `
            <div class="form-group">

                <label>
                    Region
                </label>

                <select id="productRegion">

                    <option value="">
                        Select Region
                    </option>

                    <option value="Amérique du Nord">
                        Amérique du Nord
                    </option>

                    <option value="États-Unis">
                        États-Unis
                    </option>

                    <option value="Europe">
                        Europe
                    </option>

                </select>

            </div>
        `;
    }

    /* ================= GAME ID ================= */

    if (field === "gameId") {

        return `
            <div class="form-group">

                <label>
                    ID
                </label>

                <input
                    type="text"
                    id="productGameId"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Enter ID"
                    oninput="this.value=this.value.replace(/\\D/g,'')"
                >

            </div>
        `;
    }

    /* ================= KONAMI ID ================= */

    if (field === "konamiId") {

        return `
            <div class="form-group">

                <label>
                    Konami ID
                </label>

                <input
                    type="text"
                    id="productKonamiId"
                    autocomplete="off"
                    placeholder="Enter Konami ID"
                >

            </div>
        `;
    }

    /* ================= EMAIL ================= */

    if (field === "email") {

        return `
            <div class="form-group">

                <label>
                    E-mail
                </label>

                <input
                    type="email"
                    id="productEmail"
                    autocomplete="email"
                    value="${escapeHTML(user?.email || "")}"
                    placeholder="Enter your e-mail"
                >

            </div>
        `;
    }

    /* ================= PASSWORD ================= */

    if (field === "password") {

        return `
            <div class="form-group">

                <label>
                    Password
                </label>

                <input
                    type="password"
                    id="productPassword"
                    autocomplete="current-password"
                    placeholder="Enter your password"
                >

            </div>
        `;
    }

    /* ================= WHATSAPP ================= */

    if (field === "whatsapp") {

        return `
            <div class="form-group">

                <label>
                    WhatsApp Number
                </label>

                <input
                    type="text"
                    id="productWhatsapp"
                    inputmode="tel"
                    value="${escapeHTML(user?.whatsapp || "+509 ")}"
                    oninput="formatPhoneInput(this)"
                    placeholder="+509 XX XX XXXX"
                >

            </div>
        `;
    }

    /* ================= TRANSACTION ================= */

    if (field === "transaction") {

        return `
            <div class="form-group">

                <label>
                    ID Transaction
                </label>

                <input
                    type="text"
                    id="productTxnId"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Enter NatCash transaction ID"
                    oninput="this.value=this.value.replace(/\\D/g,'')"
                >

                <small class="hint-text">
                    Envoyez le paiement au NatCash ${NATCASH_NUMBER}.
                    Copiez l'ID affiché après votre paiement.
                </small>

            </div>
        `;
    }

    return "";
}

function openProductModal(productId) {

    const product =
        PRODUCTS[productId];

    if (!product) {
        return;
    }

    selectedProduct = product;
    selectedOption = null;
    selectedQuantity = 1;

    const modal =
        document.getElementById("productModal");

    const body =
        document.getElementById("modalBody");

    if (!modal || !body) {
        return;
    }

    body.innerHTML = `

        <h2 class="product-modal-title">
            ${escapeHTML(product.name)}
        </h2>

        <p class="product-modal-description">
            ${escapeHTML(product.description)}
        </p>

        <div class="product-options">

            ${product.options.map(option => `

                <div
                    class="product-option"
                    data-option-id="${escapeHTML(option.id)}"
                    onclick="selectProductOption('${escapeHTML(option.id)}')"
                >

                    <span>
                        ${escapeHTML(option.label)}
                    </span>

                    <strong>
                        ${formatGdes(option.price)}
                    </strong>

                </div>

            `).join("")}

        </div>

        <div class="order-fields">

            ${product.fields
                .map(field => createProductField(field))
                .join("")}

            <div class="form-group">

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    id="productQuantity"
                    min="1"
                    value="1"
                    onchange="updateProductQuantity()"
                >

            </div>

            <div
                id="productTotal"
                style="
                    padding:13px;
                    border-radius:10px;
                    background:#f0f9ff;
                    color:#0284c7;
                    font-weight:900;
                    margin-bottom:12px;
                "
            >
                Select a package
            </div>

        </div>

        <div class="modal-actions">

            <button
                class="btn-primary"
                onclick="confirmProductOrder()"
            >
                Commander
            </button>

            <button
                class="btn-whatsapp"
                onclick="addSelectedToCart()"
            >
                <i class="fa-solid fa-cart-plus"></i>
                Add to Cart
            </button>

        </div>
    `;

    modal.classList.add("active");
}

function selectProductOption(optionId) {

    if (!selectedProduct) {
        return;
    }

    selectedOption =
        selectedProduct.options.find(
            option => option.id === optionId
        );

    document
        .querySelectorAll(".product-option")
        .forEach(option => {

            option.classList.toggle(
                "selected",
                option.dataset.optionId === optionId
            );
        });

    updateProductTotal();
}

function updateProductQuantity() {

    const input =
        document.getElementById("productQuantity");

    if (!input) {
        return;
    }

    let quantity =
        parseInt(input.value, 10);

    if (!Number.isFinite(quantity) || quantity < 1) {
        quantity = 1;
    }

    input.value = quantity;

    selectedQuantity = quantity;

    updateProductTotal();
}

function updateProductTotal() {

    const totalElement =
        document.getElementById("productTotal");

    if (!totalElement) {
        return;
    }

    if (!selectedOption) {

        totalElement.textContent =
            "Select a package";

        return;
    }

    const total =
        selectedOption.price *
        selectedQuantity;

    totalElement.textContent =
        "Total: " + formatGdes(total);
}

function closeProductModal() {

    document
        .getElementById("productModal")
        ?.classList.remove("active");

    selectedProduct = null;
    selectedOption = null;
    selectedQuantity = 1;
}

/* =========================================================
   ORDER
========================================================= */

function confirmProductOrder() {

    if (!selectedProduct || !selectedOption) {

        showToast(
            "Please select a package."
        );

        return;
    }

    const user =
        getCurrentUser();

    if (!user) {

        showToast(
            "Please sign in first."
        );

        return;
    }

    /* ================= GET FIELDS ================= */

    const whatsappInput =
        document.getElementById("productWhatsapp");

    const whatsapp =
        whatsappInput?.value.trim() || "";

    const txnInput =
        document.getElementById("productTxnId");

    const txn =
        txnInput?.value.trim() || "";

    const quantityInput =
        document.getElementById("productQuantity");

    const quantity =
        Math.max(
            1,
            parseInt(
                quantityInput?.value || "1",
                10
            )
        );

    const emailInput =
        document.getElementById("productEmail");

    const email =
        emailInput?.value.trim().toLowerCase() || "";

    const passwordInput =
        document.getElementById("productPassword");

    const accountPassword =
        passwordInput?.value || "";

    const regionInput =
        document.getElementById("productRegion");

    const region =
        regionInput?.value || "";

    const gameIdInput =
        document.getElementById("productGameId");

    const gameId =
        gameIdInput?.value.trim() || "";

    const konamiInput =
        document.getElementById("productKonamiId");

    const konamiId =
        konamiInput?.value.trim() || "";

    /* ================= WHATSAPP ================= */

    if (!validWhatsApp(whatsapp)) {

        showToast(
            "Enter a valid WhatsApp number."
        );

        return;
    }

    /* ================= PRODUCT FIELDS ================= */

    if (selectedProduct.fields.includes("region") && !region) {

        showToast(
            "Select a region."
        );

        return;
    }

    if (selectedProduct.fields.includes("gameId")) {

        if (!gameId || !/^\d+$/.test(gameId)) {

            showToast(
                "Enter a valid numeric ID."
            );

            return;
        }
    }

    if (selectedProduct.fields.includes("konamiId")) {

        if (!konamiId) {

            showToast(
                "Enter your Konami ID."
            );

            return;
        }
    }

    if (selectedProduct.fields.includes("email")) {

        if (!validEmail(email)) {

            showToast(
                "Enter a valid e-mail."
            );

            return;
        }
    }

    if (selectedProduct.fields.includes("password")) {

        if (!accountPassword) {

            showToast(
                "Enter your password."
            );

            return;
        }
    }

    /* ================= TRANSACTION ================= */

    if (!validTransactionId(txn)) {

        if (txnInput) {
            txnInput.value = "";
        }

        showToast(
            "ID transaction invalide."
        );

        return;
    }

    /* ================= CREATE ORDER ================= */

    const orders =
        getJSON(
            STORAGE_KEYS.ORDERS,
            []
        );

    const total =
        selectedOption.price *
        quantity;

    const order = {

        id:
            generateId(),

        userId:
            user.id,

        customer: {

            firstName:
                user.firstName,

            lastName:
                user.lastName,

            email:
                user.email,

            whatsapp
        },

        productId:
            selectedProduct.id,

        productName:
            selectedProduct.name,

        optionId:
            selectedOption.id,

        optionLabel:
            selectedOption.label,

        quantity,

        price:
            selectedOption.price,

        total,

        transactionId:
            txn,

        region:
            region,

        gameId:
            gameId,

        konamiId:
            konamiId,

        accountEmail:
            email,

        accountPassword:
            accountPassword,

        status:
            "en_cours",

        createdAt:
            new Date().toISOString()
    };

    orders.push(order);

    setJSON(
        STORAGE_KEYS.ORDERS,
        orders
    );

    /* ================= USED TRANSACTION ================= */

    const used =
        getJSON(
            STORAGE_KEYS.USED_TXNS,
            []
        );

    used.push(txn);

    setJSON(
        STORAGE_KEYS.USED_TXNS,
        used
    );

    closeProductModal();

    renderOrders();

    updateNotificationBadge();

    showToast(
        "Commande envoyée. Statut: En cours."
    );

    openWhatsAppOrder(order);
}

/* =========================================================
   WHATSAPP ORDER
========================================================= */

function openWhatsAppOrder(order) {

    let message =
        `Bonjour, mwen vle pase yon komann sou sit la.\n\n` +

        `Produit: ${order.productName}\n` +

        `Offre: ${order.optionLabel}\n` +

        `Quantité: ${order.quantity}\n` +

        `Prix total: ${order.total} Gdes\n` +

        `ID Transaction: ${order.transactionId}\n` +

        `WhatsApp: ${order.customer.whatsapp}\n`;

    if (order.region) {
        message +=
            `Region: ${order.region}\n`;
    }

    if (order.gameId) {
        message +=
            `ID: ${order.gameId}\n`;
    }

    if (order.konamiId) {
        message +=
            `Konami ID: ${order.konamiId}\n`;
    }

    if (order.accountEmail) {
        message +=
            `E-mail: ${order.accountEmail}\n`;
    }

    if (order.accountPassword) {
        message +=
            `Password: ${order.accountPassword}\n`;
    }

    message +=
        `\nStatut: En cours`;

    const url =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(message);

    window.open(
        url,
        "_blank"
    );
}

/* =========================================================
   CART
========================================================= */

function getCart() {

    return getJSON(
        STORAGE_KEYS.CART,
        []
    );
}

function updateCartBadge() {

    const badge =
        document.getElementById("cartBadge");

    if (!badge) {
        return;
    }

    badge.textContent =
        getCart().length;
}

function addSelectedToCart() {

    if (!selectedProduct || !selectedOption) {

        showToast(
            "Please select a package."
        );

        return;
    }

    const cart =
        getCart();

    cart.push({

        id:
            generateId(),

        productId:
            selectedProduct.id,

        productName:
            selectedProduct.name,

        optionId:
            selectedOption.id,

        optionLabel:
            selectedOption.label,

        price:
            selectedOption.price,

        quantity:
            selectedQuantity
    });

    setJSON(
        STORAGE_KEYS.CART,
        cart
    );

    updateCartBadge();

    showToast(
        "Added to cart."
    );
}

function openCartModal() {

    const modal =
        document.getElementById("cartModal");

    const body =
        document.getElementById("cartModalBody");

    if (!modal || !body) {
        return;
    }

    const cart =
        getCart();

    if (cart.length === 0) {

        body.innerHTML = `
            <div class="empty-state">
                Your cart is empty.
            </div>
        `;

        modal.classList.add("active");

        return;
    }

    let total = 0;

    body.innerHTML =
        cart.map((item, index) => {

            const itemTotal =
                item.price *
                item.quantity;

            total += itemTotal;

            return `

                <div class="cart-item">

                    <div class="cart-item-top">

                        <strong>
                            ${escapeHTML(item.productName)}
                        </strong>

                        <button
                            onclick="removeCartItem(${index})"
                            style="
                                border:0;
                                background:none;
                                color:#dc2626;
                            "
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                    <p>
                        ${escapeHTML(item.optionLabel)}
                    </p>

                    <p>
                        Quantity:
                        ${item.quantity}
                    </p>

                    <strong>
                        ${formatGdes(itemTotal)}
                    </strong>

                </div>
            `;

        }).join("");

    body.innerHTML += `

        <div class="cart-total">

            <span>
                Total
            </span>

            <span>
                ${formatGdes(total)}
            </span>

        </div>

        <button
            class="btn-primary full-btn"
            style="margin-top:15px"
            onclick="checkoutCart()"
        >
            Commander
        </button>
    `;

    modal.classList.add("active");
}

function removeCartItem(index) {

    const cart =
        getCart();

    cart.splice(
        index,
        1
    );

    setJSON(
        STORAGE_KEYS.CART,
        cart
    );

    updateCartBadge();

    openCartModal();
}

function checkoutCart() {

    const cart =
        getCart();

    if (cart.length === 0) {

        showToast(
            "Your cart is empty."
        );

        return;
    }

    showToast(
        "Select a product package and enter its transaction ID to place an order."
    );
}

function closeCartModal() {

    document
        .getElementById("cartModal")
        ?.classList.remove("active");
}

/* =========================================================
   WALLET
========================================================= */

function renderWallet() {

    const user =
        getCurrentUser();

    const balanceElement =
        document.getElementById(
            "userWalletBalance"
        );

    if (!user || !balanceElement) {
        return;
    }

    const wallets =
        getJSON(
            STORAGE_KEYS.WALLETS,
            {}
        );

    const balance =
        Number(
            wallets[user.id] || 0
        );

    balanceElement.textContent =
        balance.toLocaleString("en-US") +
        " Gdes";
}

function submitWalletRecharge() {

    const user =
        getCurrentUser();

    if (!user) {

        showToast(
            "Please sign in first."
        );

        return;
    }

    const amountInput =
        document.getElementById(
            "rechargeAmount"
        );

    const txnInput =
        document.getElementById(
            "walletTxnId"
        );

    const amount =
        Number(
            amountInput?.value || 0
        );

    const txn =
        txnInput?.value.trim() || "";

    if (!amount || amount <= 0) {

        showToast(
            "Enter a valid amount."
        );

        return;
    }

    if (!validTransactionId(txn)) {

        if (txnInput) {
            txnInput.value = "";
        }

        showToast(
            "ID transaction invalide."
        );

        return;
    }

    const recharges =
        getJSON(
            STORAGE_KEYS.RECHARGES,
            []
        );

    recharges.push({

        id:
            generateId(),

        userId:
            user.id,

        customer: {

            firstName:
                user.firstName,

            lastName:
                user.lastName,

            email:
                user.email,

            whatsapp:
                user.whatsapp
        },

        amount,

        transactionId:
            txn,

        status:
            "en_cours",

        createdAt:
            new Date().toISOString()
    });

    setJSON(
        STORAGE_KEYS.RECHARGES,
        recharges
    );

    const used =
        getJSON(
            STORAGE_KEYS.USED_TXNS,
            []
        );

    used.push(txn);

    setJSON(
        STORAGE_KEYS.USED_TXNS,
        used
    );

    if (amountInput) {
        amountInput.value = "";
    }

    if (txnInput) {
        txnInput.value = "";
    }

    showToast(
        "Recharge submitted for validation."
    );
}

/* =========================================================
   ORDERS
========================================================= */

function statusLabel(status) {

    if (status === "validee") {
        return "Validée";
    }

    if (status === "refusee") {
        return "Refusée";
    }

    return "En cours";
}

function renderOrders() {

    const list =
        document.getElementById(
            "ordersList"
        );

    const user =
        getCurrentUser();

    if (!list || !user) {
        return;
    }

    const orders =
        getJSON(
            STORAGE_KEYS.ORDERS,
            []
        );

    const userOrders =
        orders.filter(
            order =>
                order.userId === user.id
        );

    if (userOrders.length === 0) {

        list.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-bag-shopping"></i>

                <p>
                    No orders yet.
                </p>

            </div>
        `;

        return;
    }

    list.innerHTML =
        userOrders
            .slice()
            .reverse()
            .map(order => `

                <div class="order-card">

                    <h3>
                        ${escapeHTML(order.productName)}
                    </h3>

                    <p>
                        Offer:
                        ${escapeHTML(order.optionLabel)}
                    </p>

                    <p>
                        Quantity:
                        ${order.quantity}
                    </p>

                    <p>
                        Total:
                        <strong>
                            ${formatGdes(order.total)}
                        </strong>
                    </p>

                    <p>
                        Transaction ID:
                        ${escapeHTML(order.transactionId)}
                    </p>

                    <p>
                        Date:
                        ${new Date(
                            order.createdAt
                        ).toLocaleString()}
                    </p>

                    <span
                        class="status ${escapeHTML(order.status)}"
                    >
                        ${statusLabel(order.status)}
                    </span>

                </div>

            `)
            .join("");
}

/* =========================================================
   PROFILE
========================================================= */

function loadProfile() {

    const user =
        getCurrentUser();

    const content =
        document.getElementById(
            "profileContent"
        );

    if (!user || !content) {
        return;
    }

    content.innerHTML = `

        <div class="profile-row">

            <span class="profile-label">
                First Name
            </span>

            <span class="profile-value">
                ${escapeHTML(user.firstName)}
            </span>

        </div>

        <div class="profile-row">

            <span class="profile-label">
                Last Name
            </span>

            <span class="profile-value">
                ${escapeHTML(user.lastName)}
            </span>

        </div>

        <div class="profile-row">

            <span class="profile-label">
                WhatsApp
            </span>

            <span class="profile-value">
                ${escapeHTML(user.whatsapp)}
            </span>

        </div>

        <div class="profile-row">

            <span class="profile-label">
                Email
            </span>

            <span class="profile-value">
                ${escapeHTML(user.email)}
            </span>

        </div>

        <div class="profile-row">

            <span class="profile-label">
                Customer ID
            </span>

            <span class="profile-value">
                ${escapeHTML(user.id)}
            </span>

        </div>
    `;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function getNotifications() {

    return getJSON(
        STORAGE_KEYS.NOTIFICATIONS,
        []
    );
}

function updateNotificationBadge() {

    const badge =
        document.getElementById(
            "notifBadge"
        );

    if (!badge) {
        return;
    }

    const notifications =
        getNotifications();

    badge.textContent =
        notifications.length || 1;
}

function openNotifModal() {

    const modal =
        document.getElementById(
            "notifModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("active");
}

function closeNotifModal() {

    document
        .getElementById("notifModal")
        ?.classList.remove("active");
}

/* =========================================================
   AUTH MODAL COMPATIBILITY
========================================================= */

function switchAuthTab(type) {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    const loginBtn =
        document.getElementById(
            "tabLoginBtn"
        );

    const registerBtn =
        document.getElementById(
            "tabRegisterBtn"
        );

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
   GOOGLE AUTH
========================================================= */

function socialAuth(provider) {

    showToast(
        provider +
        " login requires Google Identity configuration."
    );
}

/* =========================================================
   PRO
========================================================= */

function openProModal() {

    document
        .getElementById("proModal")
        ?.classList.add("active");
}

function closeProModal() {

    document
        .getElementById("proModal")
        ?.classList.remove("active");
}

/* =========================================================
   COPY
========================================================= */

function copyToClipboard(text) {

    if (navigator.clipboard) {

        navigator.clipboard
            .writeText(text)
            .then(() => {

                showToast(
                    "Copied."
                );

            })
            .catch(() => {

                showToast(
                    "Copy failed."
                );
            });

    } else {

        showToast(
            "Copy is not available."
        );
    }
}

/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        STORAGE_KEYS.CURRENT_USER
    );

    showAuthGate();

    switchGateAuth("login");

    showToast(
        "You have been signed out."
    );
}

/* =========================================================
   ACCOUNT INFORMATION
========================================================= */

function openAccountInformation() {

    const user =
        getCurrentUser();

    if (!user) {
        return;
    }

    showPage(
        "profile-page"
    );
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* ================= LOGIN ================= */

        document
            .getElementById(
                "gateLoginForm"
            )
            ?.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    loginUser(

                        document
                            .getElementById(
                                "gateLoginEmail"
                            )
                            .value,

                        document
                            .getElementById(
                                "gateLoginPassword"
                            )
                            .value
                    );
                }
            );

        /* ================= REGISTER ================= */

        document
            .getElementById(
                "gateRegisterForm"
            )
            ?.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    registerUser({

                        firstName:
                            document
                                .getElementById(
                                    "gateFirstName"
                                )
                                .value,

                        lastName:
                            document
                                .getElementById(
                                    "gateLastName"
                                )
                                .value,

                        whatsapp:
                            document
                                .getElementById(
                                    "gateWhatsapp"
                                )
                                .value,

                        email:
                            document
                                .getElementById(
                                    "gateRegisterEmail"
                                )
                                .value,

                        password:
                            document
                                .getElementById(
                                    "gateRegisterPassword"
                                )
                                .value,

                        confirmPassword:
                            document
                                .getElementById(
                                    "gateConfirmPassword"
                                )
                                .value
                    });
                }
            );

        /* ================= SIDEBAR ================= */

        document
            .getElementById(
                "openMenuBtn"
            )
            ?.addEventListener(
                "click",
                openSidebar
            );

        document
            .getElementById(
                "closeMenuBtn"
            )
            ?.addEventListener(
                "click",
                closeSidebar
            );

        document
            .getElementById(
                "sidebarOverlay"
            )
            ?.addEventListener(
                "click",
                closeSidebar
            );

        /* ================= NAVIGATION ================= */

        document
            .querySelectorAll(
                ".nav-item[data-page]"
            )
            .forEach(item => {

                item.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        showPage(
                            this.dataset.page
                        );
                    }
                );
            });

        /* ================= SETTINGS ================= */

        document
            .getElementById(
                "paramsToggle"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    toggleSettings();
                }
            );

        /* ================= ACCOUNT ================= */

        document
            .getElementById(
                "accountInfosBtn"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openAccountInformation();
                }
            );

        /* ================= LOGOUT ================= */

        document
            .getElementById(
                "logoutBtn"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    logout();
                }
            );

        /* ================= PRO ================= */

        document
            .getElementById(
                "goProBtn"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openProModal();
                }
            );

        /* ================= CART ================= */

        document
            .getElementById(
                "cartBtn"
            )
            ?.addEventListener(
                "click",
                openCartModal
            );

        /* ================= NOTIFICATIONS ================= */

        document
            .getElementById(
                "notifBtn"
            )
            ?.addEventListener(
                "click",
                openNotifModal
            );

        /* ================= PROFILE ================= */

        document
            .getElementById(
                "profileHeaderBtn"
            )
            ?.addEventListener(
                "click",
                function () {

                    showPage(
                        "profile-page"
                    );
                }
            );

        /* ================= CATEGORIES ================= */

        document
            .querySelectorAll(
                ".cat-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        filterProducts(
                            this.dataset.cat
                        );
                    }
                );
            });

        /* ================= OLD LOGIN ================= */

        document
            .getElementById(
                "loginForm"
            )
            ?.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    loginUser(

                        document
                            .getElementById(
                                "loginEmail"
                            )
                            .value,

                        document
                            .getElementById(
                                "loginPassword"
                            )
                            .value
                    );
                }
            );

        /* ================= OLD REGISTER ================= */

        document
            .getElementById(
                "registerForm"
            )
            ?.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    registerUser({

                        firstName:
                            document
                                .getElementById(
                                    "regFirstName"
                                )
                                .value,

                        lastName:
                            document
                                .getElementById(
                                    "regLastName"
                                )
                                .value,

                        whatsapp:
                            document
                                .getElementById(
                                    "regWhatsapp"
                                )
                                .value,

                        email:
                            document
                                .getElementById(
                                    "regEmail"
                                )
                                .value,

                        password:
                            document
                                .getElementById(
                                    "regPassword"
                                )
                                .value,

                        confirmPassword:
                            document
                                .getElementById(
                                    "regConfirmPassword"
                                )
                                .value
                    });
                }
            );

        /* ================= NUMERIC INPUTS ================= */

        document
            .querySelectorAll(
                "#walletTxnId,#productTxnId"
            )
            .forEach(input => {

                input.addEventListener(
                    "input",
                    function () {

                        this.value =
                            this.value.replace(
                                /\D/g,
                                ""
                            );
                    }
                );
            });

        /* ================= INITIAL STATE ================= */

        const currentUser =
            getCurrentUser();

        if (currentUser) {

            showApp();

        } else {

            showAuthGate();
        }

        updateCartBadge();
        updateNotificationBadge();
    }
);

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.toggleGatePassword =
    toggleGatePassword;

window.switchGateAuth =
    switchGateAuth;

window.togglePasswordVisibility =
    togglePasswordVisibility;

window.formatPhoneInput =
    formatPhoneInput;

window.openProductModal =
    openProductModal;

window.closeProductModal =
    closeProductModal;

window.selectProductOption =
    selectProductOption;

window.updateProductQuantity =
    updateProductQuantity;

window.confirmProductOrder =
    confirmProductOrder;

window.addSelectedToCart =
    addSelectedToCart;

window.openCartModal =
    openCartModal;

window.closeCartModal =
    closeCartModal;

window.removeCartItem =
    removeCartItem;

window.checkoutCart =
    checkoutCart;

window.submitWalletRecharge =
    submitWalletRecharge;

window.closeNotifModal =
    closeNotifModal;

window.switchAuthTab =
    switchAuthTab;

window.socialAuth =
    socialAuth;

window.openProModal =
    openProModal;

window.closeProModal =
    closeProModal;

window.copyToClipboard =
    copyToClipboard;

window.showPage =
    showPage;

window.logout =
    logout;