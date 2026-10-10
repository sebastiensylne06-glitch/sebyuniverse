
"use strict";

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
  .split(",").map(v => v.trim()).filter(Boolean);

fs.mkdirSync(DATA_DIR, { recursive: true });

function emptyDB() {
  return {
    products: [], orders: [], clients: [],
    recharges: [], transactions: [], notifications: []
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
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
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
    if (typeof saved.hash === "string" && /^[a-f0-9]{64}$/i.test(saved.hash)) {
      return saved.hash;
    }
  } catch (_) {}

  if (ADMIN_SECRET.length >= 16) {
    const hash = hashSecret(ADMIN_SECRET);
    fs.writeFileSync(SECRET_FILE, JSON.stringify({ hash }, null, 2), {
      encoding: "utf8",
      mode: 0o600
    });
    return hash;
  }
  return "";
}

let adminSecretHash = loadSecretHash();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origine non autorisée."));
  }
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

function requireAdmin(req, res, next) {
  const match = (req.get("Authorization") || "").match(/^Bearer\s+([a-f0-9]{64})$/i);
  if (!match) {
    return res.status(401).json({ error: "Connexion administrateur requise." });
  }

  const token = match[1];
  const expiresAt = sessions.get(token);

  if (!expiresAt || expiresAt <= Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
  }

  req.admin = { authenticated: true };
  next();
}

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
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
    res.status(429).json({ error: "Trop de tentatives. Réessayez dans 15 minutes." });
    return false;
  }

  item.count++;
  loginAttempts.set(ip, item);
  return true;
}

/* API status */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "SEBY UNIVERSE", time: new Date().toISOString() });
});

/* ADMIN login by secret code */
app.post("/api/admin/login", (req, res) => {
  if (!allowLoginAttempt(req, res)) return;

  if (!adminSecretHash) {
    return res.status(503).json({
      error: "Kòd ADMIN poko konfigire. Ajoute ADMIN_SECRET sou sèvè a."
    });
  }

  const code = req.body && req.body.code;
  if (typeof code !== "string" || code.length > 256 || !matchesSecret(code, adminSecretHash)) {
    return res.status(401).json({ error: "Code administrateur incorrect." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL);
  loginAttempts.delete(req.ip || req.socket.remoteAddress || "unknown");

  res.json({ ok: true, token, expiresIn: SESSION_TTL });
});

/* Chanje kòd ADMIN lan */
app.post("/api/admin/change-secret", requireAdmin, (req, res) => {
  const currentCode = req.body && req.body.currentCode;
  const newCode = req.body && req.body.newCode;

  if (typeof currentCode !== "string" || !matchesSecret(currentCode, adminSecretHash)) {
    return res.status(401).json({ error: "Le code actuel est incorrect." });
  }
  if (typeof newCode !== "string" || newCode.length < 16 || newCode.length > 256) {
    return res.status(400).json({ error: "Le nouveau code doit contenir entre 16 et 256 caractères." });
  }
  if (currentCode === newCode) {
    return res.status(400).json({ error: "Le nouveau code doit être différent de l'ancien." });
  }

  try {
    const nextHash = hashSecret(newCode);
    fs.writeFileSync(SECRET_FILE, JSON.stringify({ hash: nextHash }, null, 2), {
      encoding: "utf8",
      mode: 0o600
    });
    adminSecretHash = nextHash;
    sessions.clear();
    res.json({ ok: true, message: "Code changé. Reconnectez-vous." });
  } catch (error) {
    console.error("Erreur changement code admin:", error);
    res.status(500).json({ error: "Impossible d'enregistrer le nouveau code." });
  }
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const match = (req.get("Authorization") || "").match(/^Bearer\s+([a-f0-9]{64})$/i);
  if (match) sessions.delete(match[1]);
  res.json({ ok: true });
});

/* Catalogue public */
app.get("/api/products", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(db.products.filter(p => p.active !== false));
});

/* Commandes publiques */
app.post("/api/orders", (req, res) => {
  const b = req.body || {};
  const productName = text(b.productName || b.product || b.name, 200);
  const customerName = text(b.customerName || b.nameClient, 200);
  const customerPhone = text(b.customerPhone || b.phone || b.whatsapp, 80);
  const customerEmail = text(b.customerEmail || b.email, 200);
  const amount = Number(b.amount ?? b.price ?? 0);
  const quantity = Math.max(1, Math.min(100, Number(b.quantity) || 1));

  if (!productName) return res.status(400).json({ error: "Le produit est obligatoire." });
  if (!customerName && !customerPhone && !customerEmail) {
    return res.status(400).json({ error: "Ajoutez un contact client." });
  }

  const createdAt = new Date().toISOString();
  const order = {
    id: makeId(), productName, customerName, customerPhone, customerEmail,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    quantity, description: text(b.description, 1000),
    status: "En attente", createdAt
  };

  db.orders.unshift(order);

  const foundClient = db.clients.some(c =>
    (customerPhone && c.phone === customerPhone) ||
    (customerEmail && c.email === customerEmail)
  );

  if (!foundClient) {
    db.clients.unshift({
      id: makeId(), name: customerName, phone: customerPhone,
      email: customerEmail, createdAt
    });
  }

  db.notifications.unshift({
    id: makeId(), title: "Nouvelle commande",
    message: `${productName} — ${customerName || customerPhone || customerEmail}`,
    read: false, createdAt
  });

  saveDB();
  res.status(201).json({ ok: true, order });
});

/* Demande de recharge publique */
app.post("/api/recharges", (req, res) => {
  const b = req.body || {};
  const customerName = text(b.customerName || b.name, 200);
  const phone = text(b.phone || b.whatsapp, 80);
  const amount = Number(b.amount);
  const transactionId = text(b.transactionId || b.reference, 200);

  if (!Number.isFinite(amount) || amount < 150) {
    return res.status(400).json({ error: "Le montant minimum est de 150 Gdes." });
  }
  if (!phone && !customerName) {
    return res.status(400).json({ error: "Ajoutez votre nom ou numéro WhatsApp." });
  }

  const createdAt = new Date().toISOString();
  const recharge = {
    id: makeId(), customerName, phone, amount, transactionId,
    status: "En attente", createdAt
  };

  db.recharges.unshift(recharge);
  db.notifications.unshift({
    id: makeId(), title: "Nouvelle demande de recharge",
    message: `${amount} Gdes — ${customerName || phone}`,
    read: false, createdAt
  });

  saveDB();
  res.status(201).json({ ok: true, recharge });
});

/* Routes de lecture privées */
for (const key of ["products", "orders", "clients", "recharges", "transactions", "notifications"]) {
  app.get(`/api/${key}`, requireAdmin, (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(db[key]);
  });
}

/* CRUD produits */
app.post("/api/products", requireAdmin, (req, res) => {
  const b = req.body || {};
  const name = text(b.name || b.title, 200);
  const price = Number(b.price);

  if (!name) return res.status(400).json({ error: "Le nom du produit est obligatoire." });
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Prix invalide." });

  const product = {
    id: makeId(), name, category: text(b.category, 120),
    description: text(b.description, 1000),
    image: text(b.image || b.imageUrl, 1000), price,
    currency: text(b.currency, 20) || "Gdes",
    active: b.active !== false,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(product);
  saveDB();
  res.status(201).json(product);
});

app.put("/api/products/:id", requireAdmin, (req, res) => {
  const product = db.products.find(p => String(p.id) === req.params.id);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });

  const b = req.body || {};
  if (b.name !== undefined || b.title !== undefined) product.name = text(b.name || b.title, 200);
  if (b.category !== undefined) product.category = text(b.category, 120);
  if (b.description !== undefined) product.description = text(b.description, 1000);
  if (b.image !== undefined || b.imageUrl !== undefined) product.image = text(b.image || b.imageUrl, 1000);

  if (b.price !== undefined) {
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Prix invalide." });
    product.price = price;
  }

  if (b.active !== undefined) product.active = Boolean(b.active);
  product.updatedAt = new Date().toISOString();
  saveDB();
  res.json(product);
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const oldLength = db.products.length;
  db.products = db.products.filter(p => String(p.id) !== req.params.id);
  if (db.products.length === oldLength) return res.status(404).json({ error: "Produit introuvable." });
  saveDB();
  res.json({ ok: true });
});

/* Chanje estati kòmand ak rechaj */
app.patch("/api/orders/:id", requireAdmin, (req, res) => {
  const item = db.orders.find(o => String(o.id) === req.params.id);
  if (!item) return res.status(404).json({ error: "Commande introuvable." });
  if (req.body && req.body.status !== undefined) item.status = text(req.body.status, 80);
  item.updatedAt = new Date().toISOString();
  saveDB();
  res.json(item);
});

app.patch("/api/recharges/:id", requireAdmin, (req, res) => {
  const item = db.recharges.find(r => String(r.id) === req.params.id);
  if (!item) return res.status(404).json({ error: "Recharge introuvable." });
  if (req.body && req.body.status !== undefined) item.status = text(req.body.status, 80);
  item.updatedAt = new Date().toISOString();
  saveDB();
  res.json(item);
});

app.patch("/api/notifications/:id", requireAdmin, (req, res) => {
  const item = db.notifications.find(n => String(n.id) === req.params.id);
  if (!item) return res.status(404).json({ error: "Notification introuvable." });
  item.read = Boolean(req.body && req.body.read);
  saveDB();
  res.json(item);
});

app.delete("/api/notifications/:id", requireAdmin, (req, res) => {
  const before = db.notifications.length;
  db.notifications = db.notifications.filter(n => String(n.id) !== req.params.id);
  if (before === db.notifications.length) return res.status(404).json({ error: "Notification introuvable." });
  saveDB();
  res.json({ ok: true });
});

/* Servir sit la */
app.use(express.static(ROOT, { index: "index.html" }));
app.get("/admin", (req, res) => res.sendFile(path.join(ROOT, "admin.html")));
app.get("/admin.html", (req, res) => res.sendFile(path.join(ROOT, "admin.html")));

app.use((req, res) => res.status(404).json({ error: "Route introuvable." }));

app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

app.listen(PORT, () => {
  console.log(`SEBY UNIVERSE API demare sou port ${PORT}`);
  console.log("Admin secret configured:", Boolean(adminSecretHash));
});
