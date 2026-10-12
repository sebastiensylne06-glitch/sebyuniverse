"use strict";

/* =====================================================
   SEBY UNIVERSE — CONFIGURATION
===================================================== */

const SEBY_API_BASE = "https://sebyuniverse.onrender.com";
const WHATSAPP_NUMBER = "50937155313";
const WHATSAPP_DISPLAY = "+509 37 15 53 13";
const NATCASH_NUMBER = "+509 40 09 8873";

const STORAGE = {
    TOKEN: "seby_customer_token",
    USER: "seby_user",
    CART: "seby_cart",
    LANGUAGE: "sebyLanguage"
};

let currentUser = readJSON(STORAGE.USER, null);
let authToken = localStorage.getItem(STORAGE.TOKEN) || "";
let cartItem = readJSON(STORAGE.CART, null);
let currentSelectedProduct = null;
let currentSelectedPack = null;
let userWallet = 0;
let myOrders = [];
let myRecharges = [];
let myTransactions = [];
let myNotifications = [];
let isSubmitting = false;

/* =====================================================
   PRODUCTS AND PRICES
===================================================== */

const PRODUCTS_DATA = {
    freefire: {
        title: "Free Fire 💎",
        fields: ["id", "region", "transaction", "whatsapp"],
        packs: [
            { name: "100 + 10 Diamonds", price: 168 },
            { name: "310 + 31 Diamonds", price: 480 },
            { name: "520 + 52 Diamonds", price: 800 },
            { name: "1,060 + 106 Diamonds", price: 1650 },
            { name: "2,180 + 218 Diamonds", price: 3200 },
            { name: "5,600 + 560 Diamonds", price: 8000 }
        ]
    },

    tiktok: {
        title: "TikTok Coins 🪙",
        fields: ["email", "transaction", "whatsapp"],
        packs: [
            { name: "30 Coins", price: 125 },
            { name: "70 Coins", price: 275 },
            { name: "350 Coins", price: 1260 },
            { name: "700 Coins", price: 2560 },
            { name: "1,400 Coins", price: 5125 },
            { name: "3,500 Coins", price: 14250 },
            { name: "7,000 Coins", price: 24300 },
            { name: "17,500 Coins", price: 55550 }
        ]
    },

    netflix: {
        title: "Netflix Premium 🎬",
        fields: ["email", "transaction", "whatsapp"],
        packs: [
            { name: "1 Month Premium Subscription", price: 500 },
            { name: "2 Months Premium Subscription", price: 1000 },
            { name: "3 Months Premium Subscription", price: 1450 }
        ]
    },

    efootball: {
        title: "eFootball Coins ⚽",
        fields: ["konami_id", "email", "transaction", "whatsapp"],
        packs: [
            { name: "130 Coins", price: 250 },
            { name: "300 Coins", price: 600 },
            { name: "550 Coins", price: 950 },
            { name: "1,040 Coins", price: 1700 },
            { name: "2,130 Coins", price: 3200 },
            { name: "12,800 Coins", price: 16480 }
        ]
    },

    dls_gems: {
        title: "DLS Gems 💎",
        fields: ["email", "password", "transaction", "whatsapp"],
        packs: [
            { name: "90 GEMS", price: 500 },
            { name: "400 GEMS", price: 1750 },
            { name: "910 GEMS", price: 3500 },
            { name: "2,700 GEMS", price: 8950 },
            { name: "6,000 GEMS", price: 21000 }
        ]
    },

    dls_coins: {
        title: "DLS Coins 🪙",
        fields: ["email", "password", "transaction", "whatsapp"],
        packs: [
            { name: "900 COINS", price: 500 },
            { name: "1,950 COINS", price: 1000 },
            { name: "3,450 COINS", price: 1600 },
            { name: "6,700 COINS", price: 2500 },
            { name: "14,000 COINS", price: 4500 },
            { name: "40,500 COINS", price: 10000 }
        ]
    },

    flex_gold: {
        title: "Flex City Gold 🟡",
        fields: ["id", "transaction", "whatsapp"],
        packs: [
            { name: "2,100 Gold", price: 660 },
            { name: "6,250 Gold", price: 1900 },
            { name: "17,000 Gold", price: 4950 },
            { name: "40,000 Gold", price: 10700 },
            { name: "77,500 Gold", price: 18900 }
        ]
    },

    flex_diamonds: {
        title: "Flex City Diamonds 🔷",
        fields: ["id", "transaction", "whatsapp"],
        packs: [
            { name: "360 Diamonds", price: 700 },
            { name: "725 Diamonds", price: 1400 },
            { name: "1,980 Diamonds", price: 3400 },
            { name: "8,470 Diamonds", price: 6750 },
            { name: "17,820 Diamonds", price: 13250 },
            { name: "27,500 Diamonds", price: 31900 },
            { name: "49,500 Diamonds", price: 47850 },
            { name: "70,400 Diamonds", price: 63950 }
        ]
    }
};

/* =====================================================
   HELPERS
===================================================== */

function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (_) {
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function byId(id) {
    return document.getElementById(id);
}

function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function money(value) {
    return `${(Number(value) || 0).toLocaleString("en-US")} Gdes`;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        String(value || "").trim()
    );
}

function isValidPhone(value) {
    return /^\+509 \d{2} \d{2} \d{4}$/.test(
        String(value || "").trim()
    );
}

function formatPhoneInput(input) {
    if (!input) return;

    let digits = String(input.value || "").replace(/\D/g, "");

    if (digits.startsWith("509")) digits = digits.slice(3);
    digits = digits.slice(0, 8);

    let formatted = "+509";
    if (digits.length) formatted += " " + digits.slice(0, 2);
    if (digits.length > 2) formatted += " " + digits.slice(2, 4);
    if (digits.length > 4) formatted += " " + digits.slice(4, 8);

    input.value = formatted;
}

function alertMessage(message) {
    window.alert(message);
}

/* =====================================================
   API CONNECTION
===================================================== */

async function apiRequest(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    let response;

    try {
        response = await fetch(`${SEBY_API_BASE}${path}`, {
            ...options,
            headers
        });
    } catch (error) {
        throw new Error(
            "Nou pa ka konekte ak sèvè a. Verifye entènèt ou epi eseye ankò."
        );
    }

    const raw = await response.text();
    let data = {};

    try {
        data = raw ? JSON.parse(raw) : {};
    } catch (_) {
        data = {};
    }

    if (!response.ok) {
        if (response.status === 401 && authToken) {
            authToken = "";
            localStorage.removeItem(STORAGE.TOKEN);
        }

        throw new Error(
            data.error || `Erè sèvè (${response.status}).`
        );
    }

    return data;
}

function requireLogin() {
    if (authToken && currentUser) return true;

    showSebyAuthGate();
    switchGateAuth("login");
    alertMessage("Tanpri konekte sou kont SEBY UNIVERSE ou anvan.");
    return false;
}

/* =====================================================
   LANGUAGE
===================================================== */

const SCRIPT_TRANSLATIONS = {
    ht: {
        login: "Konekte",
        register: "Enskri",
        chooseAmount: "Chwazi kantite ou vle an:",
        requiredInfo: "Enfòmasyon obligatwa",
        accountId: "ID Kont",
        region: "Rejyon",
        whatsapp: "Nimewo WhatsApp",
        transaction: "ID Transaction",
        confirmOrder: "Konfime kòmand",
        noOrders: "Ou poko gen okenn kòmand.",
        loginRequired: "Tanpri konekte anvan.",
        emptyCart: "Panye ou vid.",
        accountCreated: "Kont ou kreye ak siksè!",
        loginSuccess: "Koneksyon reyisi!",
        passwordMin: "Modpas la dwe gen omwen 8 karaktè.",
        passwordsDifferent: "Modpas yo pa menm.",
        invalidEmail: "Adrès imèl la pa valab.",
        fillName: "Tanpri mete non ak siyati ou.",
        enterPassword: "Tanpri mete modpas ou.",
        walletSent: "Demann recharge a voye pou verifikasyon."
    },
    fr: {
        login: "Connexion",
        register: "Inscription",
        chooseAmount: "Choisissez la quantité souhaitée :",
        requiredInfo: "Informations obligatoires",
        accountId: "ID du compte",
        region: "Région",
        whatsapp: "Numéro WhatsApp",
        transaction: "ID Transaction",
        confirmOrder: "Confirmer la commande",
        noOrders: "Vous n'avez pas encore de commande.",
        loginRequired: "Veuillez vous connecter d'abord.",
        emptyCart: "Votre panier est vide.",
        accountCreated: "Votre compte a été créé avec succès !",
        loginSuccess: "Connexion réussie !",
        passwordMin: "Le mot de passe doit contenir au moins 8 caractères.",
        passwordsDifferent: "Les mots de passe ne correspondent pas.",
        invalidEmail: "L'adresse e-mail n'est pas valide.",
        fillName: "Veuillez entrer votre prénom et votre nom.",
        enterPassword: "Veuillez entrer votre mot de passe.",
        walletSent: "La demande de recharge a été envoyée."
    },
    en: {
        login: "Login",
        register: "Register",
        chooseAmount: "Choose the amount you want:",
        requiredInfo: "Required information",
        accountId: "Account ID",
        region: "Region",
        whatsapp: "WhatsApp Number",
        transaction: "Transaction ID",
        confirmOrder: "Confirm Order",
        noOrders: "You don't have any orders yet.",
        loginRequired: "Please log in first.",
        emptyCart: "Your cart is empty.",
        accountCreated: "Your account has been created successfully!",
        loginSuccess: "Login successful!",
        passwordMin: "Password must contain at least 8 characters.",
        passwordsDifferent: "Passwords do not match.",
        invalidEmail: "The email address is invalid.",
        fillName: "Please enter your first and last name.",
        enterPassword: "Please enter your password.",
        walletSent: "Your recharge request has been sent."
    }
};

function getCurrentLanguage() {
    const language = localStorage.getItem(STORAGE.LANGUAGE) || "ht";
    return SCRIPT_TRANSLATIONS[language] ? language : "ht";
}

function t(key) {
    return SCRIPT_TRANSLATIONS[getCurrentLanguage()][key] ||
        SCRIPT_TRANSLATIONS.ht[key] || key;
}
/* =====================================================
   AUTH GATE
===================================================== */

function showSebyAuthGate() {
    const gate = byId("sebyAuthGate");
    if (gate) gate.classList.remove("hidden");

    document.body.classList.add("auth-gate-active");
    document.documentElement.classList.add("auth-gate-active");
}

function hideSebyAuthGate() {
    const gate = byId("sebyAuthGate");
    if (gate) gate.classList.add("hidden");

    document.body.classList.remove("auth-gate-active");
    document.documentElement.classList.remove("auth-gate-active");
}

function switchGateAuth(type) {
    const login = byId("gateLoginForm");
    const register = byId("gateRegisterForm");
    const loginTab = byId("gateLoginTab");
    const registerTab = byId("gateRegisterTab");

    const showLogin = type === "login";

    login?.classList.toggle("active", showLogin);
    register?.classList.toggle("active", !showLogin);
    loginTab?.classList.toggle("active", showLogin);
    registerTab?.classList.toggle("active", !showLogin);
}

/* =====================================================
   REGISTER — SERVER
===================================================== */

async function handleGateRegister(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const firstName = byId("gateFirstName")?.value.trim() || "";
    const lastName = byId("gateLastName")?.value.trim() || "";
    const email = byId("gateRegisterEmail")?.value.trim().toLowerCase() || "";
    const phone = byId("gateWhatsapp")?.value.trim() || "";
    const password = byId("gateRegisterPassword")?.value || "";
    const confirmPassword = byId("gateConfirmPassword")?.value || "";

    if (!firstName || !lastName) {
        return alertMessage(t("fillName"));
    }

    if (!isValidEmail(email)) {
        return alertMessage(t("invalidEmail"));
    }

    if (!isValidPhone(phone)) {
        return alertMessage("Mete WhatsApp ou nan fòma +509 XX XX XXXX.");
    }

    if (password.length < 8) {
        return alertMessage(t("passwordMin"));
    }

    if (password !== confirmPassword) {
        return alertMessage(t("passwordsDifferent"));
    }

    isSubmitting = true;

    try {
        const result = await apiRequest("/api/customer/register", {
            method: "POST",
            body: JSON.stringify({
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                email,
                phone,
                password
            })
        });

        authToken = result.token;
        currentUser = result.customer;

        localStorage.setItem(STORAGE.TOKEN, authToken);
        saveJSON(STORAGE.USER, currentUser);

        await afterLogin();

        alertMessage(t("accountCreated"));
    } catch (error) {
        alertMessage(error.message);
    } finally {
        isSubmitting = false;
    }
}

/* =====================================================
   LOGIN — SERVER
===================================================== */

async function handleGateLogin(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const email = byId("gateLoginEmail")?.value.trim().toLowerCase() || "";
    const password = byId("gateLoginPassword")?.value || "";

    if (!isValidEmail(email)) {
        return alertMessage(t("invalidEmail"));
    }

    if (!password) {
        return alertMessage(t("enterPassword"));
    }

    isSubmitting = true;

    try {
        const result = await apiRequest("/api/customer/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        authToken = result.token;
        currentUser = result.customer;

        localStorage.setItem(STORAGE.TOKEN, authToken);
        saveJSON(STORAGE.USER, currentUser);

        await afterLogin();

        alertMessage(t("loginSuccess"));
    } catch (error) {
        alertMessage(error.message);
    } finally {
        isSubmitting = false;
    }
}

/* =====================================================
   OLD LOGIN / REGISTER FORM COMPATIBILITY
===================================================== */

async function handleLogin(event) {
    event.preventDefault();

    const email = byId("loginEmail")?.value.trim() || "";
    const password = byId("loginPassword")?.value || "";

    if (byId("gateLoginEmail")) byId("gateLoginEmail").value = email;
    if (byId("gateLoginPassword")) byId("gateLoginPassword").value = password;

    await handleGateLogin({
        preventDefault() {}
    });
}

async function handleRegister(event) {
    event.preventDefault();

    const map = [
        ["regFirstName", "gateFirstName"],
        ["regLastName", "gateLastName"],
        ["regWhatsapp", "gateWhatsapp"],
        ["regEmail", "gateRegisterEmail"],
        ["regPassword", "gateRegisterPassword"],
        ["regConfirmPassword", "gateConfirmPassword"]
    ];

    map.forEach(([from, to]) => {
        if (byId(from) && byId(to)) {
            byId(to).value = byId(from).value;
        }
    });

    await handleGateRegister({
        preventDefault() {}
    });
}

function switchAuthTab(type) {
    const loginForm = byId("loginForm");
    const registerForm = byId("registerForm");

    loginForm?.classList.toggle("active", type === "login");
    registerForm?.classList.toggle("active", type === "register");
}

/* =====================================================
   PASSWORD VISIBILITY
===================================================== */

function toggleGatePassword(fieldId, button) {
    const input = byId(fieldId);
    if (!input) return;

    input.type = input.type === "password" ? "text" : "password";

    const icon = button?.querySelector("i");
    if (icon) {
        icon.classList.toggle("fa-eye", input.type === "password");
        icon.classList.toggle("fa-eye-slash", input.type === "text");
    }
}

function togglePasswordVisibility(fieldId, icon) {
    const input = byId(fieldId);
    if (!input) return;

    input.type = input.type === "password" ? "text" : "password";
    if (icon) {
        icon.classList.toggle("fa-eye", input.type === "password");
        icon.classList.toggle("fa-eye-slash", input.type === "text");
    }
}

/* =====================================================
   LOGIN SUCCESS / LOAD CUSTOMER DATA
===================================================== */

async function afterLogin() {
    hideSebyAuthGate();
    updateUI();

    try {
        await refreshCustomerData();
    } catch (error) {
        console.error("Customer data refresh:", error);
    }

    updateUI();
}

async function refreshCustomerData() {
    if (!authToken) return;

    const results = await Promise.allSettled([
        apiRequest("/api/customer/me"),
        apiRequest("/api/customer-wallet"),
        apiRequest("/api/customer-orders"),
        apiRequest("/api/customer-recharges"),
        apiRequest("/api/customer-transactions"),
        apiRequest("/api/customer-notifications")
    ]);

    if (results[0].status === "fulfilled") {
        currentUser = results[0].value.customer;
        saveJSON(STORAGE.USER, currentUser);
    }

    if (results[1].status === "fulfilled") {
        const data = results[1].value;
        userWallet = Number(data.wallet?.balance) || 0;
    }

    if (results[2].status === "fulfilled") {
        const data = results[2].value;
        myOrders = Array.isArray(data) ? data : data.orders || [];
    }

    if (results[3].status === "fulfilled") {
        const data = results[3].value;
        myRecharges = data.recharges || [];
    }

    if (results[4].status === "fulfilled") {
        const data = results[4].value;
        myTransactions = data.transactions || [];
    }

    if (results[5].status === "fulfilled") {
        const data = results[5].value;
        myNotifications = Array.isArray(data) ? data : [];
    }

    updateUI();
}

/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {
    try {
        if (authToken) {
            await apiRequest("/api/customer/logout", {
                method: "POST",
                body: JSON.stringify({})
            });
        }
    } catch (error) {
        console.warn("Logout API:", error.message);
    }

    authToken = "";
    currentUser = null;
    userWallet = 0;
    myOrders = [];
    myRecharges = [];
    myTransactions = [];
    myNotifications = [];

    localStorage.removeItem(STORAGE.TOKEN);
    localStorage.removeItem(STORAGE.USER);

    toggleSidebar(false);
    updateUI();
    showSebyAuthGate();
    switchGateAuth("login");
}

/* =====================================================
   UI REFRESH
===================================================== */

function updateUI() {
    const wallet = byId("userWalletBalance");
    const cartBadge = byId("cartBadge");
    const notifBadge = byId("notifBadge");

    if (wallet) wallet.textContent = money(userWallet);
    if (cartBadge) cartBadge.textContent = cartItem ? "1" : "0";

    if (notifBadge) {
        const unread = myNotifications.filter(n => !n.read).length;
        notifBadge.textContent = String(unread);
        notifBadge.style.display = unread ? "" : "none";
    }

    renderOrders();
    renderProfile();
}

/* =====================================================
   SIDEBAR / PAGE NAVIGATION
===================================================== */

function toggleSidebar(open) {
    byId("sidebar")?.classList.toggle("active", Boolean(open));

    const overlay = byId("sidebarOverlay");
    if (overlay) overlay.style.display = open ? "block" : "none";
}

function showPage(pageId) {
    if (!requireLogin()) return;

    document.querySelectorAll(".page-section").forEach(page => {
        page.classList.remove("active");
    });

    byId(pageId)?.classList.add("active");

    if (pageId === "wallet-page") loadWalletPage();
    if (pageId === "orders-page") renderOrders();
    if (pageId === "profile-page") renderProfile();
}

/* =====================================================
   PROFILE / ORDERS
===================================================== */

function renderProfile() {
    const profile = byId("profileContent");
    if (!profile) return;

    if (!currentUser) {
        profile.innerHTML = `<p>${safeText(t("loginRequired"))}</p>`;
        return;
    }

    profile.innerHTML = `
        <div class="seby-profile-details">
            <p><strong>Nom :</strong> ${safeText(
                currentUser.name ||
                `${currentUser.firstName || ""} ${currentUser.lastName || ""}`
            )}</p>
            <p><strong>Email :</strong> ${safeText(currentUser.email || "")}</p>
            <p><strong>WhatsApp :</strong> ${safeText(currentUser.phone || "")}</p>
        </div>`;
}

function renderOrders() {
    const list = byId("ordersList");
    if (!list) return;

    if (!authToken) {
        list.innerHTML = `<p>${safeText(t("loginRequired"))}</p>`;
        return;
    }

    if (!myOrders.length) {
        list.innerHTML = `<p>${safeText(t("noOrders"))}</p>`;
        return;
    }

    list.innerHTML = myOrders.map(order => `
        <article class="seby-order-card">
            <h3>${safeText(order.productName || order.product || "Commande")}</h3>
            <p>${money(order.amount)}</p>
            <p>Statut : ${safeText(order.status || "En attente")}</p>
            <small>${safeText(order.createdAt || "")}</small>
        </article>
    `).join("");
}

/* =====================================================
   CART STORAGE
===================================================== */

function saveCart() {
    saveJSON(STORAGE.CART, cartItem);
    updateUI();
}

function clearCart() {
    cartItem = null;
    saveCart();
}
/* =====================================================
   PRODUCT MODAL
===================================================== */

function openProductModal(productKey) {
    if (!requireLogin()) return;

    const product = PRODUCTS_DATA[productKey];
    if (!product) return alertMessage("Pwodwi sa a pa disponib.");

    currentSelectedProduct = productKey;
    currentSelectedPack = null;

    const modal = byId("productModal");
    const body = byId("modalBody");

    if (!modal || !body) {
        return alertMessage("Fenèt pwodwi a pa jwenn nan index.html.");
    }

    const fieldHTML = product.fields.map(field => {
        if (field === "region") {
            return `
                <label for="orderRegion">Région</label>
                <select id="orderRegion" required>
                    <option value="">Chwazi rejyon</option>
                    <option value="Amérique du Nord">Amérique du Nord</option>
                    <option value="États-Unis">États-Unis</option>
                    <option value="Europe">Europe</option>
                </select>`;
        }

        const labels = {
            id: "ID Kont",
            email: "E-mail kont lan",
            password: "Modpas kont lan",
            konami_id: "Konami ID",
            transaction: "ID Transaction",
            whatsapp: "Nimewo WhatsApp"
        };

        const placeholders = {
            id: "Antre ID kont lan",
            email: "example@email.com",
            password: "Antre modpas kont lan",
            konami_id: "Antre Konami ID",
            transaction: "Antre ID Transaction",
            whatsapp: WHATSAPP_DISPLAY
        };

        const type = field === "password" ? "password" :
            field === "email" ? "email" : "text";

        return `
            <label for="order_${field}">${safeText(labels[field] || field)}</label>
            <input
                id="order_${field}"
                type="${type}"
                placeholder="${safeText(placeholders[field] || "")}"
                ${field === "transaction" || field === "whatsapp" ? "required" : ""}
                ${field === "transaction" ? 'inputmode="numeric" maxlength="30"' : ""}
                ${field === "whatsapp" ? 'value="+509 "' : ""}
            >`;
    }).join("");

    body.innerHTML = `
        <h2>${safeText(product.title)}</h2>
        <p>${safeText(t("chooseAmount"))}</p>

        <label for="productPack">Pakè</label>
        <select id="productPack" required>
            <option value="">Chwazi pakè a</option>
            ${product.packs.map((pack, index) => `
                <option value="${index}">
                    ${safeText(pack.name)} — ${money(pack.price)}
                </option>
            `).join("")}
        </select>

        <div id="selectedPackPrice"></div>

        <h3>${safeText(t("requiredInfo"))}</h3>
        ${fieldHTML}

        <button type="button" id="addProductToCartBtn">
            Ajoute nan panye
        </button>
        <button type="button" id="buyProductNowBtn">
            Konfime kòmand
        </button>
    `;

    byId("productPack").addEventListener("change", event => {
        const index = Number(event.target.value);
        currentSelectedPack = Number.isInteger(index) &&
            product.packs[index] ? product.packs[index] : null;

        const price = byId("selectedPackPrice");
        if (price) {
            price.textContent = currentSelectedPack
                ? `Total : ${money(currentSelectedPack.price)}`
                : "";
        }
    });

    const whatsappInput = byId("order_whatsapp");
    if (whatsappInput) {
        whatsappInput.addEventListener("input", () =>
            formatPhoneInput(whatsappInput)
        );
    }

    byId("addProductToCartBtn").onclick = () => addProductToCart();
    byId("buyProductNowBtn").onclick = () => submitProductOrder();

    modal.style.display = "flex";
}

function closeProductModal() {
    if (byId("productModal")) {
        byId("productModal").style.display = "none";
    }
}

function getProductDetails() {
    if (!currentSelectedProduct || !currentSelectedPack) {
        throw new Error("Tanpri chwazi yon pakè.");
    }

    const product = PRODUCTS_DATA[currentSelectedProduct];
    const details = {};

    for (const field of product.fields) {
        const input = byId(`order_${field}`);

        if (field === "region") {
            details.region = byId("orderRegion")?.value || "";
            if (!details.region) throw new Error("Chwazi rejyon an.");
            continue;
        }

        const value = input?.value.trim() || "";

        if (["transaction", "whatsapp"].includes(field) && !value) {
            throw new Error(`Tanpri ranpli ${field}.`);
        }

        if (field === "email" && value && !isValidEmail(value)) {
            throw new Error("Adrès imèl la pa valab.");
        }

        if (field === "whatsapp" && !isValidPhone(value)) {
            throw new Error("WhatsApp dwe nan fòma +509 XX XX XXXX.");
        }

        if (field === "transaction" && !/^\d{8,30}$/.test(value)) {
            throw new Error("ID Transaction dwe gen 8–30 chif.");
        }

        details[field] = value;
    }

    return {
        productKey: currentSelectedProduct,
        productName: product.title,
        packName: currentSelectedPack.name,
        amount: currentSelectedPack.price,
        details
    };
}

function addProductToCart() {
    try {
        cartItem = getProductDetails();
        saveCart();
        closeProductModal();
        alertMessage("Pwodwi a ajoute nan panye a.");
    } catch (error) {
        alertMessage(error.message);
    }
}

async function submitProductOrder() {
    if (!requireLogin() || isSubmitting) return;

    try {
        const item = getProductDetails();

        isSubmitting = true;

        const detailLines = Object.entries(item.details)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");

        const result = await apiRequest("/api/orders", {
            method: "POST",
            body: JSON.stringify({
                productName: `${item.productName} — ${item.packName}`,
                amount: item.amount,
                quantity: 1,
                description: detailLines,
                transactionId: item.details.transaction || ""
            })
        });

        if (result.order) myOrders.unshift(result.order);

        clearCart();
        closeProductModal();

        await refreshCustomerData();
        alertMessage("Kòmand ou an voye pou verifikasyon.");
    } catch (error) {
        alertMessage(error.message);
    } finally {
        isSubmitting = false;
    }
}

/* =====================================================
   CART MODAL
===================================================== */

function openCartModal() {
    if (!requireLogin()) return;

    const modal = byId("cartModal");
    const body = byId("cartModalBody");

    if (!modal || !body) return;

    if (!cartItem) {
        body.innerHTML = `
            <p>${safeText(t("emptyCart"))}</p>
            <button type="button" onclick="closeCartModal()">Fèmen</button>
        `;
    } else {
        body.innerHTML = `
            <h2>${safeText(t("orderSummary"))}</h2>
            <p>${safeText(cartItem.productName)}</p>
            <p>${safeText(cartItem.packName)}</p>
            <h3>${money(cartItem.amount)}</h3>
            <button type="button" onclick="submitCartOrder()">Konfime kòmand</button>
            <button type="button" onclick="clearCart();closeCartModal()">Retire</button>
        `;
    }

    modal.style.display = "flex";
}

function closeCartModal() {
    if (byId("cartModal")) byId("cartModal").style.display = "none";
}

async function submitCartOrder() {
    if (!cartItem || !requireLogin() || isSubmitting) return;

    isSubmitting = true;

    try {
        const result = await apiRequest("/api/orders", {
            method: "POST",
            body: JSON.stringify({
                productName: `${cartItem.productName} — ${cartItem.packName}`,
                amount: cartItem.amount,
                quantity: 1,
                description: JSON.stringify(cartItem.details || {}),
                transactionId: cartItem.details?.transaction || ""
            })
        });

        if (result.order) myOrders.unshift(result.order);

        clearCart();
        closeCartModal();
        await refreshCustomerData();

        alertMessage("Kòmand lan voye pou verifikasyon.");
    } catch (error) {
        alertMessage(error.message);
    } finally {
        isSubmitting = false;
    }
}

/* =====================================================
   WALLET
===================================================== */

async function loadWalletPage() {
    if (!requireLogin()) return;

    try {
        const result = await apiRequest("/api/customer-wallet");
        userWallet = Number(result.wallet?.balance) || 0;

        updateUI();
        renderWalletTransactions();
    } catch (error) {
        alertMessage(error.message);
    }
}

async function submitWalletRecharge() {
    if (!requireLogin() || isSubmitting) return;

    const amount = Number(byId("rechargeAmount")?.value);
    const transactionId = byId("walletTxnId")?.value.trim() || "";
    const phone = byId("natcashNumInput")?.value.trim() || "";

    if (!Number.isFinite(amount) || amount < 150) {
        return alertMessage("Montan minimòm recharge a se 150 Gdes.");
    }

    if (!/^\d{8,30}$/.test(transactionId)) {
        return alertMessage("ID Transaction lan dwe gen 8–30 chif.");
    }

    if (phone && !isValidPhone(phone)) {
        return alertMessage("Verifye nimewo WhatsApp ou a.");
    }

    isSubmitting = true;

    try {
        await apiRequest("/api/recharges", {
            method: "POST",
            body: JSON.stringify({
                amount,
                transactionId,
                phone
            })
        });

        if (byId("rechargeAmount")) byId("rechargeAmount").value = "";
        if (byId("walletTxnId")) byId("walletTxnId").value = "";

        await refreshCustomerData();
        alertMessage(t("walletSent"));
    } catch (error) {
        alertMessage(error.message);
    } finally {
        isSubmitting = false;
    }
}

function renderWalletTransactions() {
    const container = byId("walletTransactions");
    if (!container) return;

    if (!myTransactions.length && !myRecharges.length) {
        container.innerHTML = "<p>Pa gen tranzaksyon pou kounye a.</p>";
        return;
    }

    const rows = [
        ...myTransactions.map(item => ({
            title: item.description || item.type || "Transaction",
            amount: item.amount,
            status: item.status,
            date: item.createdAt
        })),
        ...myRecharges.map(item => ({
            title: `Recharge ${item.transactionId || ""}`,
            amount: item.amount,
            status: item.status,
            date: item.createdAt
        }))
    ];

    container.innerHTML = rows.map(item => `
        <article class="seby-transaction">
            <strong>${safeText(item.title)}</strong>
            <p>${money(item.amount)}</p>
            <p>${safeText(item.status || "En attente")}</p>
            <small>${safeText(item.date || "")}</small>
        </article>
    `).join("");
}

/* =====================================================
   NOTIFICATIONS
===================================================== */

function openNotifications() {
    const modal = byId("notifModal");
    if (!modal) return;

    const unread = myNotifications.filter(item => !item.read);

    modal.style.display = "flex";

    const content = modal.querySelector(".modal-content") || modal;

    const list = unread.length
        ? unread.map(item => `
            <article>
                <strong>${safeText(item.title || "SEBY UNIVERSE")}</strong>
                <p>${safeText(item.message || "")}</p>
            </article>
        `).join("")
        : "<p>Pa gen nouvo notifikasyon.</p>";

    const existing = byId("sebyNotificationList");
    if (existing) {
        existing.innerHTML = list;
    } else {
        const area = document.createElement("div");
        area.id = "sebyNotificationList";
        area.innerHTML = list;
        content.appendChild(area);
    }
}

/* =====================================================
   GOOGLE BUTTON
   Google identity alone is NOT a SEBY backend session.
===================================================== */

function socialAuth(provider) {
    if (String(provider).toLowerCase() !== "google") return;

    alertMessage(
        "Pou kounye a, konekte ak imèl ak modpas SEBY UNIVERSE ou. " +
        "Koneksyon Google mande verifikasyon token sou backend la."
    );
}

/* =====================================================
   PHONE INPUTS / EVENT SETUP
===================================================== */

function setupEventListeners() {
    byId("gateLoginForm")?.addEventListener("submit", handleGateLogin);
    byId("gateRegisterForm")?.addEventListener("submit", handleGateRegister);

    byId("loginForm")?.addEventListener("submit", handleLogin);
    byId("registerForm")?.addEventListener("submit", handleRegister);

    byId("logoutBtn")?.addEventListener("click", event => {
        event.preventDefault();
        logoutUser();
    });

    byId("profileHeaderBtn")?.addEventListener("click", () => {
        if (!requireLogin()) return;
        showPage("profile-page");
    });

    byId("cartBtn")?.addEventListener("click", openCartModal);
    byId("notifBtn")?.addEventListener("click", openNotifications);

    byId("openMenuBtn")?.addEventListener("click", () => toggleSidebar(true));
    byId("closeMenuBtn")?.addEventListener("click", () => toggleSidebar(false));
    byId("sidebarOverlay")?.addEventListener("click", () => toggleSidebar(false));

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.addEventListener("click", event => {
            event.preventDefault();
            showPage(item.dataset.page);
            toggleSidebar(false);
        });
    });

    byId("accountInfosBtn")?.addEventListener("click", event => {
        event.preventDefault();
        showPage("profile-page");
        toggleSidebar(false);
    });

    byId("goProBtn")?.addEventListener("click", event => {
        event.preventDefault();
        const modal = byId("proModal");
        if (modal) modal.style.display = "flex";
    });

    document.querySelectorAll(
        "#gateWhatsapp, #regWhatsapp, #natcashNumInput"
    ).forEach(input => {
        input.addEventListener("input", () => formatPhoneInput(input));
    });

    byId("paramsToggle")?.addEventListener("click", event => {
        event.preventDefault();
        byId("paramsMenu")?.classList.toggle("active");
    });

    document.querySelectorAll("[data-product]").forEach(button => {
        button.addEventListener("click", () => {
            openProductModal(button.dataset.product);
        });
    });

    byId("submitWalletRechargeBtn")?.addEventListener(
        "click", submitWalletRecharge
    );
}

/* =====================================================
   AUTH RESTORE + STARTUP
===================================================== */

async function initializeAuthGate() {
    setupEventListeners();

    if (!authToken) {
        currentUser = null;
        showSebyAuthGate();
        switchGateAuth("login");
        updateUI();
        return;
    }

    try {
        const result = await apiRequest("/api/customer/me");
        currentUser = result.customer;
        saveJSON(STORAGE.USER, currentUser);

        hideSebyAuthGate();
        await refreshCustomerData();
    } catch (error) {
        authToken = "";
        currentUser = null;

        localStorage.removeItem(STORAGE.TOKEN);
        localStorage.removeItem(STORAGE.USER);

        showSebyAuthGate();
        switchGateAuth("login");
    }

    updateUI();
}

document.addEventListener("DOMContentLoaded", () => {
    initializeAuthGate();
});

/* =====================================================
   LANGUAGE SELECT
===================================================== */

const languageSelect = byId("langSelect");

if (languageSelect) {
    languageSelect.value = getCurrentLanguage();

    languageSelect.addEventListener("change", event => {
        localStorage.setItem(STORAGE.LANGUAGE, event.target.value);
        window.dispatchEvent(new Event("languageChanged"));
    });
}

window.addEventListener("languageChanged", () => {
    updateUI();
});

/* =====================================================
   GLOBAL FUNCTIONS USED BY HTML ONCLICK
===================================================== */

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.submitCartOrder = submitCartOrder;
window.submitWalletRecharge = submitWalletRecharge;
window.switchGateAuth = switchGateAuth;
window.toggleGatePassword = toggleGatePassword;
window.togglePasswordVisibility = togglePasswordVisibility;
window.socialAuth = socialAuth;
window.logoutUser = logoutUser;
window.showPage = showPage;
window.openNotifications = openNotifications;
