
"use strict";

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (_) {
  console.log("Nodemailer pa enstale. Imèl dezaktive.");
}

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SECRET_FILE = path.join(DATA_DIR, "admin-secret.json");

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const SESSION_TTL = 8 * 60 * 60 * 1000;
const sessions = new Map();
const loginAttempts = new Map();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(v => v.trim())
  .filter(Boolean);

fs.mkdirSync(DATA_DIR, { recursive: true });

function emptyDB() {
  return {
    products: [],
    orders: [],
    clients: [],
    recharges: [],
    transactions: [],
    notifications: [],
    customerNotifications: []
  };
}

function readDB() {
  try {
    const saved = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    const base = emptyDB();

    for (const key of Object.keys(base)) {
      if (!Array.isArray(saved[key])) saved[key] = [];
    }

    return { ...base, ...saved };
  } catch (_) {
    return emptyDB();
  }
}

let db = readDB();

function saveDB() {
  const temp = `${DB_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(temp, DB_FILE);
}

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

function hashSecret(value) {
  return crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function matchesSecret(value, expectedHash) {
  if (typeof value !== "string" || !expectedHash) return false;

  const actual = Buffer.from(hashSecret(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected);
}

function loadSecretHash() {
  try {
    const saved = JSON.parse(fs.readFileSync(SECRET_FILE, "utf8"));

    if (
      typeof saved.hash === "string" &&
      /^[a-f0-9]{64}$/i.test(saved.hash)
    ) {
      return saved.hash;
    }
  } catch (_) {}

  if (ADMIN_SECRET.length >= 16) {
    const hash = hashSecret(ADMIN_SECRET);

    fs.writeFileSync(
      SECRET_FILE,
      JSON.stringify({ hash }, null, 2),
      { encoding: "utf8", mode: 0o600 }
    );

    return hash;
  }

  return "";
}

let adminSecretHash = loadSecretHash();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(cors({
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error("Origine non autorisée."));
  }
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

function requireAdmin(req, res, next) {
  const match = (
    req.get("Authorization") || ""
  ).match(/^Bearer\s+([a-f0-9]{64})$/i);

  if (!match) {
    return res.status(401).json({
      error: "Connexion administrateur requise."
    });
  }

  const token = match[1];
  const expiresAt = sessions.get(token);

  if (!expiresAt || expiresAt <= Date.now()) {
    sessions.delete(token);

    return res.status(401).json({
      error: "Session expirée. Reconnectez-vous."
    });
  }

  req.admin = { authenticated: true };
  next();
}

function text(value, max = 500) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function normalizeEmail(value) {
  return text(value, 200).toLowerCase();
}

function normalizeStatus(value) {
  return text(value, 80)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPending(status) {
  const value = normalizeStatus(status);

  return value.includes("attente") ||
    value.includes("pending") ||
    value.includes("en cours");
}

function isValidated(status) {
  const value = normalizeStatus(status);

  return value.includes("valide") ||
    value.includes("approved") ||
    value.includes("complete") ||
    value.includes("livre") ||
    value.includes("termine");
}

function allowLoginAttempt(req, res) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let item = loginAttempts.get(ip);

  if (!item || now - item.start >= 15 * 60 * 1000) {
    item = { start: now, count: 0 };
  }

  if (item.count >= 5) {
    loginAttempts.set(ip, item);

    res.status(429).json({
      error: "Trop de tentatives. Réessayez dans 15 minutes."
    });

    return false;
  }

  item.count++;
  loginAttempts.set(ip, item);

  return true;
}

/* =====================================================
   IMÈL SMTP — KONFIGIRASYON OPSYONÈL
===================================================== */

function getMailTransport() {
  if (
    !nodemailer ||
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendCustomerEmail(email, title, message) {
  const transport = getMailTransport();

  if (!transport) {
    return {
      sent: false,
      reason: "SMTP pa konfigire oswa nodemailer pa enstale."
    };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transport.sendMail({
      from,
      to: email,
      subject: title,
      text: message
    });

    return { sent: true };
  } catch (error) {
    console.error("Erè imèl:", error.message);

    return {
      sent: false,
      reason: "Voye imèl la echwe."
    };
  }
}

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "SEBY UNIVERSE",
    time: new Date().toISOString()
  });
});

/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post("/api/admin/login", (req, res) => {
  if (!allowLoginAttempt(req, res)) return;

  if (!adminSecretHash) {
    return res.status(503).json({
      error: "Kòd ADMIN poko konfigire. Ajoute ADMIN_SECRET sou sèvè a."
    });
  }

  const code = req.body && req.body.code;

  if (
    typeof code !== "string" ||
    code.length > 256 ||
    !matchesSecret(code, adminSecretHash)
  ) {
    return res.status(401).json({
      error: "Code administrateur incorrect."
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, Date.now() + SESSION_TTL);
  loginAttempts.delete(req.ip || req.socket.remoteAddress || "unknown");

  res.json({
    ok: true,
    token,
    expiresIn: SESSION_TTL
  });
});

/* Chanje kòd ADMIN lan */
app.post("/api/admin/change-secret", requireAdmin, (req, res) => {
  const currentCode = req.body && req.body.currentCode;
  const newCode = req.body && req.body.newCode;

  if (
    typeof currentCode !== "string" ||
    !matchesSecret(currentCode, adminSecretHash)
  ) {
    return res.status(401).json({
      error: "Le code actuel est incorrect."
    });
  }

  if (
    typeof newCode !== "string" ||
    newCode.length < 16 ||
    newCode.length > 256
  ) {
    return res.status(400).json({
      error: "Le nouveau code doit contenir entre 16 et 256 caractères."
    });
  }

  if (currentCode === newCode) {
    return res.status(400).json({
      error: "Le nouveau code doit être différent de l'ancien."
    });
  }

  try {
    const nextHash = hashSecret(newCode);

    fs.writeFileSync(
      SECRET_FILE,
      JSON.stringify({ hash: nextHash }, null, 2),
      { encoding: "utf8", mode: 0o600 }
    );

    adminSecretHash = nextHash;
    sessions.clear();

    res.json({
      ok: true,
      message: "Code changé. Reconnectez-vous."
    });
  } catch (error) {
    console.error("Erreur changement code admin:", error);

    res.status(500).json({
      error: "Impossible d'enregistrer le nouveau code."
    });
  }
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const match = (
    req.get("Authorization") || ""
  ).match(/^Bearer\s+([a-f0-9]{64})$/i);

  if (match) sessions.delete(match[1]);

  res.json({ ok: true });
});

/* =====================================================
   CATALOGUE PUBLIC
===================================================== */

app.get("/api/products", (req, res) => {
  res.set("Cache-Control", "no-store");

  res.json(
    db.products.filter(p => p.active !== false)
  );
});

/* =====================================================
   COMMANDES PUBLIQUES
===================================================== */

app.post("/api/orders", (req, res) => {
  const b = req.body || {};

  const productName = text(
    b.productName || b.product || b.name,
    200
  );

  const customerName = text(
    b.customerName || b.nameClient,
    200
  );

  const customerPhone = text(
    b.customerPhone || b.phone || b.whatsapp,
    80
  );

  const customerEmail = normalizeEmail(
    b.customerEmail || b.email
  );

  const amount = Number(b.amount ?? b.price ?? 0);

  const quantity = Math.max(
    1,
    Math.min(100, Number(b.quantity) || 1)
  );

  if (!productName) {
    return res.status(400).json({
      error: "Le produit est obligatoire."
    });
  }

  if (!customerName && !customerPhone && !customerEmail) {
    return res.status(400).json({
      error: "Ajoutez un contact client."
    });
  }

  const createdAt = new Date().toISOString();

  const order = {
    id: makeId(),
    productName,
    customerName,
    customerPhone,
    customerEmail,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    quantity,
    description: text(b.description, 1000),
    status: "En attente",
    createdAt
  };

  db.orders.unshift(order);

  const foundClient = db.clients.some(c =>
    (
      customerPhone &&
      text(c.phone, 80) === customerPhone
    ) ||
    (
      customerEmail &&
      normalizeEmail(c.email) === customerEmail
    )
  );

  if (!foundClient) {
    db.clients.unshift({
      id: makeId(),
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      createdAt
    });
  }

  db.notifications.unshift({
    id: makeId(),
    title: "Nouvelle commande",
    message: `${productName} — ${customerName || customerPhone || customerEmail}`,
    read: false,
    createdAt
  });

  saveDB();

  res.status(201).json({ ok: true, order });
});

/* =====================================================
   DEMANDE DE RECHARGE PUBLIQUE
===================================================== */

app.post("/api/recharges", (req, res) => {
  const b = req.body || {};

  const customerName = text(
    b.customerName || b.name,
    200
  );

  const phone = text(
    b.phone || b.whatsapp,
    80
  );

  const amount = Number(b.amount);

  const transactionId = text(
    b.transactionId || b.reference,
    200
  );

  if (!Number.isFinite(amount) || amount < 150) {
    return res.status(400).json({
      error: "Le montant minimum est de 150 Gdes."
    });
  }

  if (!phone && !customerName) {
    return res.status(400).json({
      error: "Ajoutez votre nom ou numéro WhatsApp."
    });
  }

  const createdAt = new Date().toISOString();

  const recharge = {
    id: makeId(),
    customerName,
    phone,
    amount,
    transactionId,
    status: "En attente",
    createdAt
  };

  db.recharges.unshift(recharge);

  db.notifications.unshift({
    id: makeId(),
    title: "Nouvelle demande de recharge",
    message: `${amount} Gdes — ${customerName || phone}`,
    read: false,
    createdAt
  });

  saveDB();

  res.status(201).json({ ok: true, recharge });
});

/* =====================================================
   MESAJ ADMIN POU KLIYAN
===================================================== */

/*
  POST /api/admin/messages

  audience:
    all       = tout kliyan
    pending   = kliyan ki gen kòmand an atant
    validated = kliyan ki gen kòmand valide
    new       = kliyan ki anrejistre nan 7 dènye jou yo
    specific  = kliyan presi selon imèl

  Header:
    Authorization: Bearer TOKEN_ADMIN

  Body:
    {
      "audience": "all",
      "email": "",
      "title": "Enfòmasyon",
      "message": "Men mesaj ADMIN nan."
    }
*/

function buildCustomerDirectory() {
  const directory = new Map();

  function addCustomer(data) {
    const email = normalizeEmail(data.email);
    const phone = text(data.phone, 80);
    const name = text(data.name, 200);

    if (!email && !phone) return;

    const key = email
      ? `email:${email}`
      : `phone:${phone}`;

    const old = directory.get(key) || {
      email,
      phone,
      name,
      createdAt: data.createdAt || null,
      orders: []
    };

    if (!old.email && email) old.email = email;
    if (!old.phone && phone) old.phone = phone;
    if (!old.name && name) old.name = name;

    if (
      data.createdAt &&
      (
        !old.createdAt ||
        new Date(data.createdAt) < new Date(old.createdAt)
      )
    ) {
      old.createdAt = data.createdAt;
    }

    if (data.order) old.orders.push(data.order);

    directory.set(key, old);
  }

  for (const client of db.clients) {
    addCustomer({
      email: client.email,
      phone: client.phone,
      name: client.name,
      createdAt: client.createdAt
    });
  }

  for (const order of db.orders) {
    addCustomer({
      email: order.customerEmail || order.email,
      phone: order.customerPhone || order.phone || order.whatsapp,
      name: order.customerName || order.nameClient,
      createdAt: order.createdAt,
      order
    });
  }

  return Array.from(directory.values());
}

app.post("/api/admin/messages", requireAdmin, async (req, res) => {
  const b = req.body || {};

  const audience = text(b.audience, 30).toLowerCase();
  const title = text(b.title, 160);
  const message = text(b.message, 5000);
  const targetEmail = normalizeEmail(b.email);

  const allowedAudiences = [
    "all",
    "pending",
    "validated",
    "new",
    "specific"
  ];

  if (!allowedAudiences.includes(audience)) {
    return res.status(400).json({
      error: "Chwazi yon kategori kliyan ki valab."
    });
  }

  if (!title || !message) {
    return res.status(400).json({
      error: "Tit ak mesaj la obligatwa."
    });
  }

  if (audience === "specific" && !targetEmail) {
    return res.status(400).json({
      error: "Mete imèl kliyan ou vle kontakte a."
    });
  }

  const customers = buildCustomerDirectory();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  let selected = customers;

  if (audience === "specific") {
    selected = customers.filter(
      c => c.email === targetEmail
    );

    if (selected.length === 0) {
      return res.status(404).json({
        error: "Nou pa jwenn kliyan sa a. Verifye imèl la."
      });
    }
  } else if (audience === "pending") {
    selected = customers.filter(
      c => c.orders.some(o => isPending(o.status))
    );
  } else if (audience === "validated") {
    selected = customers.filter(
      c => c.orders.some(o => isValidated(o.status))
    );
  } else if (audience === "new") {
    selected = customers.filter(c => {
      if (!c.createdAt) return false;

      const created = new Date(c.createdAt).getTime();

      return Number.isFinite(created) &&
        created <= now &&
        now - created <= sevenDays;
    });
  }

  if (selected.length === 0) {
    return res.status(404).json({
      error: "Pa gen kliyan nan kategori sa a."
    });
  }

  const createdAt = new Date().toISOString();
  const results = {
    audience,
    recipients: selected.length,
    notificationsSaved: 0,
    emailsSent: 0,
    emailsFailed: 0,
    emailsSkipped: 0
  };

  for (const customer of selected) {
    const notification = {
      id: makeId(),
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      customerName: customer.name || "",
      title,
      message,
      read: false,
      createdAt
    };

    db.customerNotifications.unshift(notification);
    results.notificationsSaved++;

    if (!customer.email) {
      results.emailsSkipped++;
      continue;
    }

    const emailResult = await sendCustomerEmail(
      customer.email,
      title,
      message
    );

    if (emailResult.sent) {
      results.emailsSent++;
      notification.emailSent = true;
      notification.emailSentAt = new Date().toISOString();
    } else {
      results.emailsFailed++;
      notification.emailSent = false;
    }
  }

  saveDB();

  res.status(201).json({
    ok: true,
    message: "Mesaj ADMIN nan anrejistre.",
    results
  });
});

/* =====================================================
   NOTIFIKASYON KLIYAN
===================================================== */

/*
  Aplikasyon kliyan an ka rele:
  GET /api/customer-notifications?email=imel_kliyan

  Oswa:
  GET /api/customer-notifications?phone=numero_kliyan

  Endpoint sa a retounen notifikasyon ki koresponn
  ak imèl oswa nimewo kliyan an bay la.
*/

app.get("/api/customer-notifications", (req, res) => {
  res.set("Cache-Control", "no-store");

  const email = normalizeEmail(req.query.email);
  const phone = text(req.query.phone, 80);

  if (!email && !phone) {
    return res.status(400).json({
      error: "Bay imèl kliyan an oswa nimewo telefòn li."
    });
  }

  const items = db.customerNotifications.filter(n => {
    return (
      email &&
      normalizeEmail(n.customerEmail) === email
    ) || (
      phone &&
      text(n.customerPhone, 80) === phone
    );
  });

  res.json(items);
});

/* Make yon notifikasyon kliyan li */
app.patch(
  "/api/customer-notifications/:id",
  (req, res) => {
    const email = normalizeEmail(req.body && req.body.email);
    const phone = text(req.body && req.body.phone, 80);

    if (!email && !phone) {
      return res.status(400).json({
        error: "Bay imèl oswa telefòn kliyan an."
      });
    }

    const item = db.customerNotifications.find(n =>
      String(n.id) === req.params.id &&
      (
        (email && normalizeEmail(n.customerEmail) === email) ||
        (phone && text(n.customerPhone, 80) === phone)
      )
    );

    if (!item) {
      return res.status(404).json({
        error: "Notifikasyon introuvable."
      });
    }

    item.read = Boolean(req.body && req.body.read);
    saveDB();

    res.json({ ok: true, notification: item });
  }
);

/* =====================================================
   ROUTES ADMIN PRIVEES
===================================================== */

for (const key of [
  "products",
  "orders",
  "clients",
  "recharges",
  "transactions",
  "notifications",
  "customer-notifications"
]) {
  const dbKey = key === "customer-notifications"
    ? "customerNotifications"
    : key;

  app.get(`/api/${key}`, requireAdmin, (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(db[dbKey]);
  });
}

/* =====================================================
   CRUD PWODUI
===================================================== */

app.post("/api/products", requireAdmin, (req, res) => {
  const b = req.body || {};
  const name = text(b.name || b.title, 200);
  const price = Number(b.price);

  if (!name) {
    return res.status(400).json({
      error: "Le nom du produit est obligatoire."
    });
  }

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({
      error: "Prix invalide."
    });
  }

  const product = {
    id: makeId(),
    name,
    category: text(b.category, 120),
    description: text(b.description, 1000),
    image: text(b.image || b.imageUrl, 1000),
    price,
    currency: text(b.currency, 20) || "Gdes",
    active: b.active !== false,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(product);
  saveDB();

  res.status(201).json(product);
});

app.put("/api/products/:id", requireAdmin, (req, res) => {
  const product = db.products.find(
    p => String(p.id) === req.params.id
  );

  if (!product) {
    return res.status(404).json({
      error: "Produit introuvable."
    });
  }

  const b = req.body || {};

  if (b.name !== undefined || b.title !== undefined) {
    product.name = text(b.name || b.title, 200);
  }

  if (b.category !== undefined) {
    product.category = text(b.category, 120);
  }

  if (b.description !== undefined) {
    product.description = text(b.description, 1000);
  }

  if (b.image !== undefined || b.imageUrl !== undefined) {
    product.image = text(b.image || b.imageUrl, 1000);
  }

  if (b.price !== undefined) {
    const price = Number(b.price);

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        error: "Prix invalide."
      });
    }

    product.price = price;
  }

  if (b.active !== undefined) {
    product.active = Boolean(b.active);
  }

  product.updatedAt = new Date().toISOString();

  saveDB();
  res.json(product);
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const oldLength = db.products.length;

  db.products = db.products.filter(
    p => String(p.id) !== req.params.id
  );

  if (db.products.length === oldLength) {
    return res.status(404).json({
      error: "Produit introuvable."
    });
  }

  saveDB();
  res.json({ ok: true });
});

/* =====================================================
   CHANJE ESTATI KÒMAND AK RECHAJ
===================================================== */

app.patch("/api/orders/:id", requireAdmin, (req, res) => {
  const item = db.orders.find(
    o => String(o.id) === req.params.id
  );

  if (!item) {
    return res.status(404).json({
      error: "Commande introuvable."
    });
  }

  if (req.body && req.body.status !== undefined) {
    item.status = text(req.body.status, 80);
  }

  item.updatedAt = new Date().toISOString();

  saveDB();
  res.json(item);
});

app.patch("/api/recharges/:id", requireAdmin, (req, res) => {
  const item = db.recharges.find(
    r => String(r.id) === req.params.id
  );

  if (!item) {
    return res.status(404).json({
      error: "Recharge introuvable."
    });
  }

  if (req.body && req.body.status !== undefined) {
    item.status = text(req.body.status, 80);
  }

  item.updatedAt = new Date().toISOString();

  saveDB();
  res.json(item);
});

/* =====================================================
   ADMIN NOTIFICATIONS
===================================================== */

app.patch("/api/notifications/:id", requireAdmin, (req, res) => {
  const item = db.notifications.find(
    n => String(n.id) === req.params.id
  );

  if (!item) {
    return res.status(404).json({
      error: "Notification introuvable."
    });
  }

  item.read = Boolean(req.body && req.body.read);

  saveDB();
  res.json(item);
});

app.delete("/api/notifications/:id", requireAdmin, (req, res) => {
  const before = db.notifications.length;

  db.notifications = db.notifications.filter(
    n => String(n.id) !== req.params.id
  );

  if (before === db.notifications.length) {
    return res.status(404).json({
      error: "Notification introuvable."
    });
  }

  saveDB();
  res.json({ ok: true });
});

/* =====================================================
   SÈVI SIT LA
===================================================== */

app.use(express.static(ROOT, { index: "index.html" }));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(ROOT, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(ROOT, "admin.html"));
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route introuvable."
  });
});

app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);

  if (res.headersSent) return next(err);

  res.status(500).json({
    error: "Erreur interne du serveur."
  });
});

app.listen(PORT, () => {
  console.log(`SEBY UNIVERSE API demare sou port ${PORT}`);
  console.log("Admin secret configured:", Boolean(adminSecretHash));
  console.log("SMTP configured:", Boolean(getMailTransport()));
});
