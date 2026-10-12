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
  console.log("Nodemailer pa enstale; imèl dezaktive.");
}

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SECRET_FILE = path.join(DATA_DIR, "admin-secret.json");

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const SESSION_TTL = 8 * 60 * 60 * 1000;
const CUSTOMER_SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const adminSessions = new Map();
const customerSessions = new Map();
const loginAttempts = new Map();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",").map(v => v.trim()).filter(Boolean);

fs.mkdirSync(DATA_DIR, { recursive: true });

function emptyDB() {
  return {
    products: [], orders: [], clients: [], recharges: [],
    transactions: [], wallets: [], notifications: [],
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

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeEmail(value) {
  return text(value, 200).toLowerCase();
}

function normalizeStatus(value) {
  return text(value, 80).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isPending(status) {
  const s = normalizeStatus(status);
  return s.includes("attente") ||
    s.includes("pending") ||
    s.includes("en cours");
}

function isValidated(status) {
  const s = normalizeStatus(status);
  return s.includes("valide") ||
    s.includes("approved") ||
    s.includes("complete") ||
    s.includes("livre") ||
    s.includes("termine");
}

function isRejected(status) {
  const s = normalizeStatus(status);
  return s.includes("refuse") || s.includes("reject");
}

function validateTransactionId(value) {
  return /^\d{10,20}$/.test(text(value, 200));
}

function extractTransactionId(description) {
  const match = String(description || "")
    .match(/Transaction\s*ID\s*:\s*(\d+)/i);
  return match ? match[1] : "";
}

function transactionAlreadyUsed(transactionId) {
  const id = text(transactionId, 200);
  if (!id) return false;

  return db.orders.some(o =>
    (text(o.transactionId, 200) ||
      extractTransactionId(o.description)) === id
  ) || db.recharges.some(r =>
    text(r.transactionId, 200) === id
  );
}

function matchesCustomer(record, email, phone, userId) {
  return (
    (Boolean(email) &&
      normalizeEmail(record.email || record.customerEmail) === email) ||
    (Boolean(phone) &&
      text(record.phone || record.customerPhone || record.whatsapp, 80) === phone) ||
    (Boolean(userId) &&
      text(record.userId, 200) === userId)
  );
}

function hashSecret(value) {
  return crypto.createHash("sha256")
    .update(value, "utf8").digest("hex");
}

function matchesSecret(value, expectedHash) {
  if (typeof value !== "string" || !expectedHash) return false;

  const a = Buffer.from(hashSecret(value), "hex");
  const b = Buffer.from(expectedHash, "hex");

  return a.length === b.length &&
    crypto.timingSafeEqual(a, b);
}

function loadSecretHash() {
  try {
    const saved = JSON.parse(
      fs.readFileSync(SECRET_FILE, "utf8")
    );

    if (
      typeof saved.hash === "string" &&
      /^[a-f0-9]{64}$/i.test(saved.hash)
    ) {
      return saved.hash;
    }
  } catch (_) {}

  if (ADMIN_SECRET.length >= 16) {
    const hash = hashSecret(ADMIN_SECRET);

    try {
      fs.writeFileSync(
        SECRET_FILE,
        JSON.stringify({ hash }, null, 2),
        { encoding: "utf8", mode: 0o600 }
      );
    } catch (error) {
      console.error(
        "Pa kapab sove hash admin lan:",
        error.message
      );
    }

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
app.use(express.urlencoded({
  extended: false,
  limit: "100kb"
}));

function allowLoginAttempt(req, res, bucket = loginAttempts) {
  const ip = req.ip ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  let item = bucket.get(ip);

  if (!item || now - item.start >= 15 * 60 * 1000) {
    item = { start: now, count: 0 };
  }

  if (item.count >= 10) {
    bucket.set(ip, item);
    res.status(429).json({
      error: "Twòp tantativ. Eseye ankò nan 15 minit."
    });
    return false;
  }

  item.count++;
  bucket.set(ip, item);
  return true;
}

function requireAdmin(req, res, next) {
  const match = (
    req.get("Authorization") || ""
  ).match(/^Bearer\s+([a-f0-9]{64})$/i);

  if (!match) {
    return res.status(401).json({
      error: "Koneksyon administratè obligatwa."
    });
  }

  const expiry = adminSessions.get(match[1]);

  if (!expiry || expiry <= Date.now()) {
    adminSessions.delete(match[1]);

    return res.status(401).json({
      error: "Sesyon admin lan ekspire. Konekte ankò."
    });
  }

  req.adminToken = match[1];
  next();
}

function publicCustomer(client) {
  return {
    id: client.id,
    userId: client.userId,
    firstName: client.firstName || "",
    lastName: client.lastName || "",
    name: client.name || "",
    email: client.email || "",
    phone: client.phone || "",
    createdAt: client.createdAt || null
  };
}

function requireCustomer(req, res, next) {
  const match = (
    req.get("Authorization") || ""
  ).match(/^Bearer\s+([a-f0-9]{64})$/i);

  if (!match) {
    return res.status(401).json({
      error: "Konekte sou kont SEBY UNIVERSE ou anvan."
    });
  }

  const session = customerSessions.get(match[1]);

  if (!session || session.expiresAt <= Date.now()) {
    customerSessions.delete(match[1]);

    return res.status(401).json({
      error: "Sesyon ou ekspire. Konekte ankò."
    });
  }

  const client = db.clients.find(
    c => c.id === session.clientId
  );

  if (!client) {
    customerSessions.delete(match[1]);

    return res.status(401).json({
      error: "Kont kliyan an pa disponib."
    });
  }

  req.customer = client;
  req.customerToken = match[1];
  next();
}

function findCustomerWallet(client) {
  let wallet = db.wallets.find(
    w => w.userId === client.userId
  );

  if (!wallet) {
    wallet = {
      id: makeId(),
      userId: client.userId,
      email: client.email,
      phone: client.phone || "",
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.wallets.unshift(wallet);
  } else {
    wallet.email = client.email;
    wallet.phone = client.phone || wallet.phone || "";
  }

  return wallet;
}
function createCustomerSession(client) {
  const token = crypto.randomBytes(32).toString("hex");

  customerSessions.set(token, {
    clientId: client.id,
    expiresAt: Date.now() + CUSTOMER_SESSION_TTL
  });

  return token;
}

function createAdminSession() {
  const token = crypto.randomBytes(32).toString("hex");

  adminSessions.set(
    token,
    Date.now() + SESSION_TTL
  );

  return token;
}

function sanitizeProduct(product) {
  const copy = { ...product };
  delete copy.internalNotes;
  return copy;
}

function customerOrders(client) {
  return db.orders.filter(order =>
    order.userId === client.userId ||
    normalizeEmail(order.email || order.customerEmail) ===
      normalizeEmail(client.email)
  );
}

function customerRecharges(client) {
  return db.recharges.filter(recharge =>
    recharge.userId === client.userId ||
    normalizeEmail(recharge.email) ===
      normalizeEmail(client.email)
  );
}

function customerTransactions(client) {
  return db.transactions.filter(transaction =>
    transaction.userId === client.userId ||
    normalizeEmail(transaction.email) ===
      normalizeEmail(client.email)
  );
}

function customerNotifications(client) {
  return db.customerNotifications.filter(notification =>
    notification.userId === client.userId ||
    normalizeEmail(notification.email) ===
      normalizeEmail(client.email)
  );
}

function addNotification(notification) {
  db.notifications.unshift({
    id: makeId(),
    createdAt: new Date().toISOString(),
    ...notification
  });

  if (db.notifications.length > 500) {
    db.notifications.length = 500;
  }
}

function addCustomerNotification(client, title, message) {
  db.customerNotifications.unshift({
    id: makeId(),
    userId: client.userId,
    email: client.email,
    title: text(title, 200),
    message: text(message, 2000),
    read: false,
    createdAt: new Date().toISOString()
  });
}

function addTransaction(data) {
  const transaction = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    ...data
  };

  db.transactions.unshift(transaction);
  return transaction;
}

function errorHandler(error, req, res, next) {
  console.error("Erreur serveur:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Yon erè entèn rive. Eseye ankò pita."
  });
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "SEBY UNIVERSE API",
    time: new Date().toISOString()
  });
});

/* =========================================================
   CUSTOMER REGISTRATION
========================================================= */

app.post("/api/register", async (req, res) => {
  if (!allowLoginAttempt(req, res)) return;

  const firstName = text(req.body.firstName, 100);
  const lastName = text(req.body.lastName, 100);
  const email = normalizeEmail(req.body.email);
  const phone = text(req.body.phone || req.body.whatsapp, 40);
  const password = typeof req.body.password === "string"
    ? req.body.password
    : "";

  if (!firstName || !lastName) {
    return res.status(400).json({
      error: "Tanpri antre non ak siyati ou."
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: "Adrès imèl la pa valab."
    });
  }

  if (password.length < 8 || password.length > 200) {
    return res.status(400).json({
      error: "Modpas la dwe gen ant 8 ak 200 karaktè."
    });
  }

  if (phone && !/^\+?[\d\s()-]{8,25}$/.test(phone)) {
    return res.status(400).json({
      error: "Nimewo WhatsApp la pa valab."
    });
  }

  const existing = db.clients.find(
    client => normalizeEmail(client.email) === email
  );

  if (existing) {
    return res.status(409).json({
      error: "Gen yon kont ki deja itilize imèl sa a."
    });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) return reject(error);
      resolve(key.toString("hex"));
    });
  }).catch(error => {
    console.error("Erè hash modpas:", error);
    return null;
  });

  if (!passwordHash) {
    return res.status(500).json({
      error: "Nou pa t kapab kreye kont lan. Eseye ankò."
    });
  }

  const client = {
    id: makeId(),
    userId: makeId(),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    passwordSalt: salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.clients.push(client);
  findCustomerWallet(client);
  saveDB();

  const token = createCustomerSession(client);

  res.status(201).json({
    message: "Kont ou kreye ak siksè!",
    token,
    customer: publicCustomer(client)
  });
});

/* =========================================================
   CUSTOMER LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
  if (!allowLoginAttempt(req, res)) return;

  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === "string"
    ? req.body.password
    : "";

  if (!email || !password) {
    return res.status(400).json({
      error: "Antre imèl ou ak modpas ou."
    });
  }

  const client = db.clients.find(
    item => normalizeEmail(item.email) === email
  );

  if (!client || !client.passwordSalt || !client.passwordHash) {
    return res.status(401).json({
      error: "Imèl oswa modpas la pa kòrèk."
    });
  }

  const verified = await new Promise(resolve => {
    crypto.scrypt(
      password,
      client.passwordSalt,
      64,
      (error, key) => {
        if (error) return resolve(false);

        const actual = Buffer.from(key.toString("hex"), "hex");
        const expected = Buffer.from(client.passwordHash, "hex");

        resolve(
          actual.length === expected.length &&
          crypto.timingSafeEqual(actual, expected)
        );
      }
    );
  });

  if (!verified) {
    return res.status(401).json({
      error: "Imèl oswa modpas la pa kòrèk."
    });
  }

  const token = createCustomerSession(client);

  res.json({
    message: "Koneksyon reyisi!",
    token,
    customer: publicCustomer(client)
  });
});

/* =========================================================
   CUSTOMER LOGOUT / SESSION
========================================================= */

app.post("/api/logout", requireCustomer, (req, res) => {
  customerSessions.delete(req.customerToken);
  res.json({ ok: true, message: "Ou dekonekte." });
});

app.get("/api/me", requireCustomer, (req, res) => {
  res.json({
    customer: publicCustomer(req.customer)
  });
});

/* =========================================================
   PUBLIC PRODUCTS
========================================================= */

app.get("/api/products", (req, res) => {
  res.json({
    products: db.products.map(sanitizeProduct)
  });
});
app.post("/api/orders", requireCustomer, (req, res) => {
  const b = req.body || {};
  const client = req.customer;
  const productName = text(b.productName || b.product || b.name, 200);
  const amount = Number(b.amount ?? b.price ?? 0);
  const quantity = Math.max(1, Math.min(100, Number(b.quantity) || 1));
  const description = text(b.description, 1000);
  const transactionId = text(b.transactionId || b.reference, 200) || extractTransactionId(description);

  if (!productName) return res.status(400).json({ error: "Pwodwi a obligatwa." });
  if (transactionId && !validateTransactionId(transactionId)) {
    return res.status(400).json({ error: "Kòd tranzaksyon an dwe gen 10–20 chif." });
  }
  if (transactionId && transactionAlreadyUsed(transactionId)) {
    return res.status(409).json({ error: "Kòd tranzaksyon sa a deja itilize." });
  }

  const order = {
    id: makeId(), userId: client.userId, productName,
    customerName: client.name, customerPhone: client.phone,
    customerEmail: client.email,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    quantity, description, transactionId, status: "En attente",
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(order);
  db.notifications.unshift({
    id: makeId(), title: "Nouvelle commande",
    message: `${productName} — ${client.name || client.email}`,
    read: false, createdAt: order.createdAt
  });

  saveDB();
  res.status(201).json({ ok: true, order });
});

app.get("/api/customer-orders", requireCustomer, (req, res) => {
  res.set("Cache-Control", "no-store");
  const c = req.customer;

  res.json(db.orders.filter(o => customerMatchesRecord(o, c)).map(o => ({
    id: o.id,
    userId: o.userId || "",
    productName: o.productName,
    customerName: o.customerName,
    amount: Number(o.amount) || 0,
    quantity: Number(o.quantity) || 1,
    status: o.status || "En attente",
    createdAt: o.createdAt || null,
    updatedAt: o.updatedAt || null
  })));
});

/* =========================
   CUSTOMER WALLET + RECHARGES
========================= */
app.get("/api/customer-wallet", requireCustomer, (req, res) => {
  res.set("Cache-Control", "no-store");
  const wallet = findCustomerWallet(req.customer);
  saveDB();

  res.json({
    ok: true,
    wallet: {
      id: wallet.id,
      userId: wallet.userId,
      email: wallet.email,
      phone: wallet.phone,
      balance: Number(wallet.balance) || 0,
      updatedAt: wallet.updatedAt || null
    }
  });
});

app.post("/api/recharges", requireCustomer, (req, res) => {
  const b = req.body || {};
  const client = req.customer;
  const amount = Number(b.amount);
  const transactionId = text(b.transactionId || b.reference, 200);

  if (!validateTransactionId(transactionId)) {
    return res.status(400).json({
      error: "Kòd tranzaksyon an dwe gen 10–20 chif."
    });
  }

  if (transactionAlreadyUsed(transactionId)) {
    return res.status(409).json({
      error: "Kòd tranzaksyon sa a deja itilize."
    });
  }

  if (!Number.isFinite(amount) || amount < 150 || amount > 1000000) {
    return res.status(400).json({
      error: "Montan minimòm lan se 150 Gdes."
    });
  }

  const now = new Date().toISOString();
  const recharge = {
    id: makeId(),
    userId: client.userId,
    email: client.email,
    customerName: client.name,
    phone: client.phone,
    amount,
    transactionId,
    status: "En attente",
    creditedAt: null,
    createdAt: now
  };

  db.recharges.unshift(recharge);
  findCustomerWallet(client);

  db.notifications.unshift({
    id: makeId(),
    title: "Nouvelle demande de recharge",
    message: `${amount} Gdes — ${client.name || client.email}`,
    read: false,
    createdAt: now
  });

  saveDB();
  res.status(201).json({ ok: true, recharge });
});

app.get("/api/customer-recharges", requireCustomer, (req, res) => {
  res.set("Cache-Control", "no-store");
  const c = req.customer;

  res.json({
    ok: true,
    recharges: db.recharges
      .filter(r => customerMatchesRecord(r, c))
      .map(r => ({
        id: r.id,
        userId: r.userId || "",
        amount: Number(r.amount) || 0,
        transactionId: r.transactionId || "",
        status: r.status || "En attente",
        createdAt: r.createdAt || null,
        updatedAt: r.updatedAt || null,
        creditedAt: r.creditedAt || null
      }))
  });
});

app.get("/api/customer-transactions", requireCustomer, (req, res) => {
  res.set("Cache-Control", "no-store");
  const c = req.customer;

  const rows = db.transactions.filter(t => {
    if (customerMatchesRecord(t, c)) return true;
    if (!t.walletId) return false;

    const wallet = db.wallets.find(w => w.id === t.walletId);
    return Boolean(wallet && wallet.userId === c.userId);
  }).map(t => ({
    id: t.id,
    type: t.type || "",
    amount: Number(t.amount) || 0,
    status: t.status || "",
    description: t.description || "",
    createdAt: t.createdAt || null
  }));

  res.json({ ok: true, transactions: rows });
});

/* =========================
   CUSTOMER NOTIFICATIONS
========================= */
app.get("/api/customer-notifications", requireCustomer, (req, res) => {
  res.set("Cache-Control", "no-store");
  const c = req.customer;

  res.json(db.customerNotifications.filter(n =>
    (n.userId && n.userId === c.userId) ||
    normalizeEmail(n.customerEmail) === c.email
  ));
});

app.patch("/api/customer-notifications/:id", requireCustomer, (req, res) => {
  const c = req.customer;

  const item = db.customerNotifications.find(n =>
    String(n.id) === req.params.id &&
    (
      (n.userId && n.userId === c.userId) ||
      normalizeEmail(n.customerEmail) === c.email
    )
  );

  if (!item) {
    return res.status(404).json({
      error: "Notifikasyon an pa jwenn."
    });
  }

  item.read = Boolean(req.body && req.body.read);
  saveDB();
  res.json({ ok: true, notification: item });
});

/* =========================
   CUSTOMER DIRECTORY + SMTP
========================= */
function getMailTransport() {
  if (
    !nodemailer ||
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) return null;

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
  if (!transport) return { sent: false };

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: title,
      text: message
    });

    return { sent: true };
  } catch (error) {
    console.error("SMTP error:", error.message);
    return { sent: false };
  }
}

function buildCustomerDirectory() {
  const map = new Map();

  const add = data => {
    const email = normalizeEmail(data.email);
    const phone = text(data.phone, 80);

    if (!email && !phone) return;

    const key = email ? `email:${email}` : `phone:${phone}`;

    const old = map.get(key) || {
      email,
      phone,
      name: text(data.name, 200),
      userId: data.userId || "",
      createdAt: data.createdAt || null,
      orders: []
    };

    if (!old.name && data.name) old.name = text(data.name, 200);
    if (!old.userId && data.userId) old.userId = data.userId;
    if (data.order) old.orders.push(data.order);

    map.set(key, old);
  };

  db.clients.forEach(c => add({
    email: c.email,
    phone: c.phone,
    name: c.name,
    userId: c.userId,
    createdAt: c.createdAt
  }));

  db.orders.forEach(o => add({
    email: o.customerEmail || o.email,
    phone: o.customerPhone || o.phone,
    name: o.customerName,
    userId: o.userId,
    createdAt: o.createdAt,
    order: o
  }));

  db.recharges.forEach(r => add({
    email: r.email,
    phone: r.phone,
    name: r.customerName,
    userId: r.userId,
    createdAt: r.createdAt
  }));

  return Array.from(map.values());
}
app.post("/api/admin/messages", requireAdmin, async (req, res) => {
  const b = req.body || {};
  const audience = text(b.audience, 30).toLowerCase();
  const title = text(b.title, 160);
  const message = text(b.message, 5000);
  const targetEmail = normalizeEmail(b.email);

  if (!["all", "pending", "validated", "new", "specific"].includes(audience)) {
    return res.status(400).json({
      error: "Kategori kliyan an pa valab."
    });
  }

  if (!title || !message) {
    return res.status(400).json({
      error: "Tit ak mesaj obligatwa."
    });
  }

  if (audience === "specific" && !targetEmail) {
    return res.status(400).json({
      error: "Mete imèl kliyan an."
    });
  }

  let customers = buildCustomerDirectory();
  const now = Date.now();

  if (audience === "specific") {
    customers = customers.filter(c => c.email === targetEmail);
  }

  if (audience === "pending") {
    customers = customers.filter(c =>
      c.orders.some(o => isPending(o.status))
    );
  }

  if (audience === "validated") {
    customers = customers.filter(c =>
      c.orders.some(o => isValidated(o.status))
    );
  }

  if (audience === "new") {
    customers = customers.filter(c =>
      c.createdAt &&
      now - new Date(c.createdAt).getTime() <= 7 * 86400000
    );
  }

  if (!customers.length) {
    return res.status(404).json({
      error: "Pa gen kliyan nan kategori sa a."
    });
  }

  const createdAt = new Date().toISOString();

  const results = {
    recipients: customers.length,
    notificationsSaved: 0,
    emailsSent: 0,
    emailsFailed: 0
  };

  for (const c of customers) {
    db.customerNotifications.unshift({
      id: makeId(),
      userId: c.userId || "",
      customerEmail: c.email || "",
      customerPhone: c.phone || "",
      customerName: c.name || "",
      title,
      message,
      read: false,
      createdAt
    });

    results.notificationsSaved++;

    if (c.email) {
      const sent = await sendCustomerEmail(
        c.email,
        title,
        message
      );

      if (sent.sent) results.emailsSent++;
      else results.emailsFailed++;
    }
  }

  saveDB();

  res.status(201).json({
    ok: true,
    message: "Mesaj la anrejistre.",
    results
  });
});

/* =========================
   ADMIN DATA ROUTES
========================= */
for (const key of [
  "products",
  "orders",
  "clients",
  "recharges",
  "transactions",
  "wallets",
  "notifications",
  "customer-notifications"
]) {
  const dbKey = key === "customer-notifications"
    ? "customerNotifications"
    : key;

  app.get(`/api/${key}`, requireAdmin, (req, res) => {
    res.set("Cache-Control", "no-store");

    if (dbKey === "clients") {
      return res.json(db.clients.map(publicCustomer));
    }

    res.json(db[dbKey]);
  });
}

app.patch("/api/orders/:id", requireAdmin, (req, res) => {
  const item = db.orders.find(
    o => String(o.id) === req.params.id
  );

  if (!item) {
    return res.status(404).json({
      error: "Kòmand lan pa jwenn."
    });
  }

  const status = text(req.body && req.body.status, 80);

  if (!status) {
    return res.status(400).json({
      error: "Estati kòmand lan pa valab."
    });
  }

  item.status = status;
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
      error: "Rechaj la pa jwenn."
    });
  }

  const status = text(req.body && req.body.status, 80);

  if (!status) {
    return res.status(400).json({
      error: "Estati rechaj la pa valab."
    });
  }

  const approved = isValidated(status);

  if (item.creditedAt && !approved) {
    return res.status(409).json({
      error: "Rechaj sa a deja kredite; pa ka retire kredi a nan wout sa a."
    });
  }

  if (approved && !item.creditedAt) {
    const client = db.clients.find(
      c => c.userId === item.userId
    );

    let wallet;

    if (client) {
      wallet = findCustomerWallet(client);
    } else {
      wallet =
        db.wallets.find(w => w.userId === item.userId) ||
        db.wallets.find(
          w => normalizeEmail(w.email) === normalizeEmail(item.email)
        );

      if (!wallet) {
        wallet = {
          id: makeId(),
          userId: item.userId || "",
          email: item.email || "",
          phone: item.phone || "",
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.wallets.unshift(wallet);
      }
    }

    const amount = Number(item.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Montan rechaj la pa valab."
      });
    }

    const now = new Date().toISOString();

    wallet.balance = (Number(wallet.balance) || 0) + amount;
    wallet.updatedAt = now;

    item.creditedAt = now;
    item.creditedAmount = amount;
    item.walletId = wallet.id;
    item.status = status;
    item.updatedAt = now;

    db.transactions.unshift({
      id: makeId(),
      type: "recharge",
      rechargeId: item.id,
      walletId: wallet.id,
      userId: item.userId || wallet.userId || "",
      email: wallet.email || item.email || "",
      phone: wallet.phone || item.phone || "",
      amount,
      status: "Validée",
      description: `Kredi bous pou rechaj ${item.transactionId}`,
      createdAt: now
    });

    db.customerNotifications.unshift({
      id: makeId(),
      userId: item.userId || "",
      customerEmail: item.email || "",
      customerPhone: item.phone || "",
      customerName: item.customerName || "",
      title: "Bous ou kredite",
      message: `${amount} Gdes ajoute nan bous SEBY UNIVERSE ou.`,
      read: false,
      createdAt: now
    });

    db.notifications.unshift({
      id: makeId(),
      title: "Rechaj valide",
      message: `${amount} Gdes kredite pou ${item.customerName || item.email}`,
      read: false,
      createdAt: now
    });

    saveDB();

    return res.json({
      ok: true,
      message: "Rechaj valide; Wallet kliyan an kredite yon sèl fwa.",
      recharge: item,
      wallet: { balance: wallet.balance }
    });
  }

  item.status = status;
  item.updatedAt = new Date().toISOString();

  if (isRejected(status)) {
    db.customerNotifications.unshift({
      id: makeId(),
      userId: item.userId || "",
      customerEmail: item.email || "",
      customerPhone: item.phone || "",
      customerName: item.customerName || "",
      title: "Rechaj refize",
      message: "Rechaj ou a pa valide. Verifye enfòmasyon tranzaksyon an.",
      read: false,
      createdAt: item.updatedAt
    });
  }

  saveDB();
  res.json({ ok: true, recharge: item });
});

app.patch("/api/notifications/:id", requireAdmin, (req, res) => {
  const item = db.notifications.find(
    n => String(n.id) === req.params.id
  );

  if (!item) {
    return res.status(404).json({
      error: "Notifikasyon an pa jwenn."
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
      error: "Notifikasyon an pa jwenn."
    });
  }

  saveDB();
  res.json({ ok: true });
});

/* =========================
   STATIC SITE + ERRORS
========================= */
app.use(express.static(ROOT, { index: "index.html" }));

app.get("/admin", (req, res) =>
  res.sendFile(path.join(ROOT, "admin.html"))
);

app.get("/admin.html", (req, res) =>
  res.sendFile(path.join(ROOT, "admin.html"))
);

app.use((req, res) =>
  res.status(404).json({ error: "Route introuvable." })
);

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (res.headersSent) return next(err);

  res.status(err.status || 500).json({
    error: err.message === "Origine non autorisée."
      ? err.message
      : "Erreur interne du serveur."
  });
});

app.listen(PORT, () => {
  console.log(`SEBY UNIVERSE API demare sou port ${PORT}`);
  console.log("Admin secret configured:", Boolean(adminSecretHash));
  console.log("SMTP configured:", Boolean(getMailTransport()));
});