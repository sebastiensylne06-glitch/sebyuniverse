
"use strict";

/* =========================================
   SEBY UNIVERSE — MAIN SCRIPT
========================================= */

const API_BASE = "https://sebyuniverse.onrender.com";

/* Mete vrè Google Client ID ou isit la */
const GOOGLE_CLIENT_ID = "METE_GOOGLE_CLIENT_ID_ISIT_LA";

const $ = (id) => document.getElementById(id);

const STORAGE = {
  user: "seby_universe_user",
  orders: "seby_universe_orders"
};

let currentUser = null;
let selectedProduct = null;
let selectedCategory = null;

/* =========================================
   CATALOGUE + PRICES
========================================= */

const catalog = {
  freefire: {
    title: "FREE FIRE",
    fields: [
      { name: "playerId", label: "ID du joueur", type: "text", required: true }
    ],
    offers: [
      ["100 + 10 Diamants", 168],
      ["310 + 31 Diamants", 480],
      ["520 + 52 Diamants", 800],
      ["1 060 + 106 Diamants", 1650],
      ["2 180 + 218 Diamants", 3200],
      ["5 600 + 560 Diamants", 8000]
    ]
  },

  efootball: {
    title: "E FOOTBALL",
    fields: [
      { name: "konamiId", label: "Konami ID", type: "text", required: true },
      { name: "email", label: "E-mail", type: "email", required: true }
    ],
    offers: [
      ["130 Coins", 250],
      ["300 Coins", 600],
      ["550 Coins", 950],
      ["1 040 Coins", 1700],
      ["2 130 Coins", 3200],
      ["12 800 Coins", 16480]
    ]
  },

  dls: {
    title: "DLS",
    fields: [
      { name: "email", label: "E-mail du compte", type: "email", required: true },
      { name: "password", label: "Mot de passe du compte", type: "password", required: true }
    ],
    offers: [
      ["90 Diamants", 500],
      ["400 Diamants", 1750],
      ["910 Diamants", 3500],
      ["2 700 Diamants", 8950],
      ["6 000 Diamants", 21000],
      ["900 Coins", 500],
      ["1 950 Coins", 1000],
      ["3 450 Coins", 1600],
      ["6 700 Coins", 2500],
      ["14 000 Coins", 4500],
      ["40 500 Coins", 10000]
    ]
  },

  flexcity: {
    title: "FLEX CITY",
    fields: [
      { name: "playerId", label: "ID du joueur", type: "text", required: true }
    ],
    offers: [
      ["2 100 Gold", 660],
      ["6 250 Gold", 1900],
      ["17 000 Gold", 4950],
      ["40 000 Gold", 10700],
      ["77 500 Gold", 18900],
      ["360 Diamants", 700],
      ["725 Diamants", 1400],
      ["1 980 Diamants", 3400],
      ["8 470 Diamants", 6750],
      ["17 820 Diamants", 13250],
      ["27 500 Diamants", 31900],
      ["49 500 Diamants", 47850],
      ["70 400 Diamants", 63950]
    ]
  },

  pubg: {
    title: "PUBG MOBILE",
    fields: [
      { name: "playerId", label: "Character ID PUBG", type: "text", required: true }
    ],
    offers: []
  },

  tiktok: {
    title: "TIKTOK",
    fields: [
      { name: "email", label: "E-mail du compte", type: "email", required: true }
    ],
    offers: [
      ["30 Pièces", 125],
      ["70 Pièces", 275],
      ["350 Pièces", 1260],
      ["700 Pièces", 2560],
      ["1 400 Pièces", 5125],
      ["3 500 Pièces", 14250],
      ["7 000 Pièces", 24300],
      ["17 500 Pièces", 55550]
    ]
  },

  netflix: {
    title: "NETFLIX",
    fields: [
      { name: "email", label: "E-mail du compte", type: "email", required: true }
    ],
    offers: [
      ["1 Mois", 500],
      ["2 Mois", 1000],
      ["3 Mois", 1450]
    ]
  }
};

/* =========================================
   TOAST
========================================= */

function toast(message, type = "") {
  const box = $("sebyToast");
  if (!box) return;

  box.textContent = message;
  box.className = "seby-toast " + type;
  box.hidden = false;

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    box.hidden = true;
  }, 3500);
}

/* =========================================
   LOADER
========================================= */

function hideLoader() {
  const loader = $("sebyLoader");
  if (!loader) return;

  loader.classList.add("hide");
  setTimeout(() => {
    loader.style.display = "none";
  }, 600);
}

/* =========================================
   GOOGLE AUTHENTICATION
========================================= */

function saveUser(user) {
  currentUser = user;
  localStorage.setItem(STORAGE.user, JSON.stringify(user));
  showApplication();
}

function showApplication() {
  $("sebyAuthGate").style.display = "none";
  $("sebyApp").classList.add("visible");

  if (currentUser) {
    const name = currentUser.name || "Utilisateur";
    $("profileName").textContent = name;
    $("profileFullName").textContent = name;
    $("profileEmail").textContent = currentUser.email || "—";
    $("profileWhatsapp").textContent = currentUser.whatsapp || "Non renseigné";
  }

  loadOrders();
}

function decodeGoogleCredential(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(
      Array.from(decoded)
        .map(char => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    ));
  } catch {
    return null;
  }
}

function handleGoogleLogin(response) {
  const data = decodeGoogleCredential(response.credential);

  if (!data || !data.email) {
    toast("Impossible de lire votre compte Google.", "error");
    return;
  }

  saveUser({
    name: data.name || data.given_name || "Utilisateur",
    email: data.email,
    picture: data.picture || "",
    googleId: data.sub
  });
}

function initializeGoogle() {
  if (GOOGLE_CLIENT_ID === "METE_GOOGLE_CLIENT_ID_ISIT_LA") {
    toast("Ajoutez votre Google Client ID dans script.js.", "error");
    return;
  }

  if (!window.google || !google.accounts) {
    toast("Google Login pa disponib. Verifye koneksyon entènèt la.", "error");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin
  });

  google.accounts.id.renderButton($("googleLoginButton"), {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: 270
  });
}

/* =========================================
   LOGOUT
========================================= */

function logout() {
  localStorage.removeItem(STORAGE.user);
  currentUser = null;
  $("sebyApp").classList.remove("visible");
  $("sebyAuthGate").style.display = "flex";
  closeMenu();

  if (window.google && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }

  toast("Vous êtes déconnecté.");
}

/* =========================================
   NAVIGATION
========================================= */

function openMenu() {
  $("sidebar").classList.add("open");
  $("sidebarOverlay").classList.add("show");
}

function closeMenu() {
  $("sidebar").classList.remove("open");
  $("sidebarOverlay").classList.remove("show");
}

function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-item[data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================
   PRODUCT CATEGORIES
========================================= */

function showCategory(category) {
  const data = catalog[category];
  if (!data) return;

  selectedCategory = category;

  $("categoryProducts").hidden = false;
  $("categoryTitle").textContent = data.title;

  const offersBox = $("productOffers");
  offersBox.innerHTML = "";

  if (!data.offers.length) {
    offersBox.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-clock"></i>
        <p>Les offres PUBG seront bientôt disponibles.</p>
        <p>Contactez-nous sur WhatsApp pour connaître les prix.</p>
      </div>
    `;
    $("categoryProducts").scrollIntoView({ behavior: "smooth" });
    return;
  }

  data.offers.forEach((offer, index) => {
    const [name, price] = offer;
    const card = document.createElement("div");
    card.className = "offer-card";

    const info = document.createElement("div");
    const title = document.createElement("h4");
    const amount = document.createElement("p");

    title.textContent = name;
    amount.textContent = price.toLocaleString("fr-FR") + " GDES";

    info.append(title, amount);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Acheter";
    button.addEventListener("click", () => {
      openProductOrder(category, index);
    });

    card.append(info, button);
    offersBox.appendChild(card);
  });

  $("categoryProducts").scrollIntoView({ behavior: "smooth" });
}

function closeCategory() {
  $("categoryProducts").hidden = true;
  $("products-page").scrollIntoView({ behavior: "smooth" });
}

/* =========================================
   PRODUCT ORDER MODAL
========================================= */

function openProductOrder(category, index) {
  const data = catalog[category];
  if (!data) return;

  if (!data.offers[index]) {
    toast("Cette offre n'est pas disponible.", "error");
    return;
  }

  selectedProduct = {
    category,
    name: data.offers[index][0],
    price: data.offers[index][1]
  };

  $("selectedProductTitle").textContent = data.title + " — " + selectedProduct.name;
  $("selectedProductDescription").textContent =
    "Prix : " + selectedProduct.price.toLocaleString("fr-FR") + " GDES";

  const fieldsBox = $("productRequiredFields");
  fieldsBox.innerHTML = "";

  data.fields.forEach(field => {
    const group = document.createElement("div");
    group.className = "form-group";

    const label = document.createElement("label");
    label.textContent = field.label + (field.required ? " *" : "");

    const input = document.createElement("input");
    input.name = field.name;
    input.type = field.type;
    input.placeholder = field.label;
    input.required = Boolean(field.required);
    input.autocomplete = "off";

    label.htmlFor = "required_" + field.name;
    input.id = "required_" + field.name;

    group.append(label, input);
    fieldsBox.appendChild(group);
  });

  $("orderWhatsapp").value = currentUser?.whatsapp || "";
  $("orderEmail").value = currentUser?.email || "";

  $("productModal").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  $("productModal").classList.remove("show");
  document.body.style.overflow = "";
}

/* =========================================
   API REQUEST
========================================= */

async function apiRequest(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error("Erreur serveur : " + response.status);
  }

  return response.json();
}

/* =========================================
   ORDERS
========================================= */

function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.orders) || "[]");
  } catch {
    return [];
  }
}

function saveLocalOrder(order) {
  const orders = getLocalOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
}

function displayOrders(orders) {
  const list = $("ordersList");
  list.innerHTML = "";

  if (!orders.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-box-open"></i>
        <p>Aucune commande pour le moment.</p>
      </div>
    `;
    return;
  }

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-item";

    const title = document.createElement("h3");
    title.textContent = order.product || order.name || "Commande";

    const price = document.createElement("p");
    price.textContent = "Prix : " + (order.price || 0) + " GDES";

    const transaction = document.createElement("p");
    transaction.textContent = "Transaction : " + (order.transactionId || "—");

    const status = document.createElement("span");
    status.className = "order-status";
    status.textContent = order.status || "En attente";

    card.append(title, price, transaction, status);
    list.appendChild(card);
  });
}

async function loadOrders() {
  if (!currentUser) return;

  displayOrders(getLocalOrders());

  try {
    const result = await apiRequest(
      "/api/orders?email=" + encodeURIComponent(currentUser.email)
    );

    const orders = Array.isArray(result)
      ? result
      : result.orders || result.data || [];

    if (orders.length) displayOrders(orders);
  } catch (error) {
    console.warn("Chargement API commandes :", error.message);
  }
}

async function submitOrder(event) {
  event.preventDefault();

  if (!selectedProduct) {
    toast("Choisissez un produit.", "error");
    return;
  }

  if (!currentUser) {
    toast("Connectez-vous avant de commander.", "error");
    return;
  }

  const form = $("productOrderForm");

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const details = {};

  for (const [key, value] of formData.entries()) {
    details[key] = String(value).trim();
  }

  const order = {
    customerName: currentUser.name,
    email: details.email || currentUser.email,
    product: catalog[selectedProduct.category].title,
    category: selectedProduct.category,
    offer: selectedProduct.name,
    price: selectedProduct.price,
    whatsapp: details.whatsapp,
    transactionId: details.transactionId,
    details,
    status: "En attente",
    createdAt: new Date().toISOString()
  };

  if (!order.whatsapp || !order.transactionId) {
    toast("Remplissez WhatsApp et ID Transaction.", "error");
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Envoi en cours...";

  try {
    await apiRequest("/api/orders", {
      method: "POST",
      body: JSON.stringify(order)
    });

    saveLocalOrder(order);

    currentUser.whatsapp = order.whatsapp;
    localStorage.setItem(STORAGE.user, JSON.stringify(currentUser));

    closeProductModal();
    form.reset();
    selectedProduct = null;

    toast("Commande envoyée. Attendez la validation.", "success");
    loadOrders();
  } catch (error) {
    toast(
      "Impossible d'envoyer la commande au serveur. Vérifiez le backend.",
      "error"
    );
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = "Confirmer ma commande";
  }
}

/* =========================================
   PAYMENT NUMBER
========================================= */

async function copyPaymentNumber() {
  const number = "+50940098873";

  try {
    await navigator.clipboard.writeText(number);
    toast("Numéro de paiement copié.", "success");
  } catch {
    toast("Copiez ce numéro : " + number);
  }
}

/* =========================================
   TRANSACTION FORM
========================================= */

async function submitTransaction(event) {
  event.preventDefault();

  const transactionId = $("transactionId").value.trim();

  if (!transactionId) {
    toast("Entrez votre ID Transaction.", "error");
    return;
  }

  toast(
    "ID saisi. Pour l'associer à un achat, envoyez votre commande depuis le formulaire du produit."
  );
}

/* =========================================
   FEEDBACK
========================================= */

async function submitFeedback(event) {
  event.preventDefault();

  const name = $("feedbackName").value.trim() || currentUser?.name || "Client";
  const message = $("feedbackMessage").value.trim();

  if (!message) {
    toast("Écrivez votre avis avant de l'envoyer.", "error");
    return;
  }

  try {
    await apiRequest("/api/notifications", {
      method: "POST",
      body: JSON.stringify({
        type: "feedback",
        name,
        email: currentUser?.email || "",
        message,
        createdAt: new Date().toISOString()
      })
    });

    $("feedbackForm").reset();
    toast("Merci pour votre avis !", "success");
  } catch (error) {
    toast("Impossible d'envoyer votre avis au serveur.", "error");
    console.error(error);
  }
}

/* =========================================
   CLICK ANIMATIONS
========================================= */

document.addEventListener("click", event => {
  const target = event.target.closest("button, .nav-item, .category-preview");

  if (!target || target.disabled) return;

  target.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(.96)" },
      { transform: "scale(1)" }
    ],
    { duration: 220, easing: "ease-out" }
  );
});

/* =========================================
   EVENTS
========================================= */

function connectEvents() {
  $("openMenuBtn").addEventListener("click", openMenu);
  $("closeMenuBtn").addEventListener("click", closeMenu);
  $("sidebarOverlay").addEventListener("click", closeMenu);

  document.querySelectorAll(".nav-item[data-page]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showPage(link.dataset.page);
    });
  });

  $("viewProductsBtn").addEventListener("click", () => {
    showPage("products-page");
  });

  $("homeLogo").addEventListener("click", event => {
    event.preventDefault();
    showPage("home-page");
  });

  $("profileHeaderBtn").addEventListener("click", () => {
    showPage("profile-page");
  });

  $("notifBtn").addEventListener("click", () => {
    showPage("orders-page");
  });

  $("logoutBtn").addEventListener("click", event => {
    event.preventDefault();
    logout();
  });

  document.querySelectorAll(".product-card[data-category]").forEach(card => {
    card.addEventListener("click", () => {
      showCategory(card.dataset.category);
    });
  });

  $("backToCategories").addEventListener("click", closeCategory);
  $("closeProductModal").addEventListener("click", closeProductModal);

  $("productModal").addEventListener("click", event => {
    if (event.target === $("productModal")) closeProductModal();
  });

  $("productOrderForm").addEventListener("submit", submitOrder);
  $("copyPaymentNumber").addEventListener("click", copyPaymentNumber);
  $("transactionForm").addEventListener("submit", submitTransaction);
  $("feedbackForm").addEventListener("submit", submitFeedback);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
      closeProductModal();
    }
  });
}

/* =========================================
   START APPLICATION
========================================= */

function startApp() {
  connectEvents();

  try {
    currentUser = JSON.parse(localStorage.getItem(STORAGE.user) || "null");
  } catch {
    currentUser = null;
  }

  if (currentUser) {
    showApplication();
  } else {
    $("sebyAuthGate").style.display = "flex";
  }

  if (window.google && google.accounts) {
    initializeGoogle();
  } else {
    window.addEventListener("load", initializeGoogle, { once: true });
  }

  hideLoader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
