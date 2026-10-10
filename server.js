
"use strict";

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "sebastiensylne06@gmail.com"
).trim().toLowerCase();

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const TEMP_DB_FILE = path.join(DATA_DIR, "db.tmp.json");

const defaultDB = {
  products: [],
  orders: [],
  clients: [],
  recharges: [],
  transactions: [],
  notifications: []
};

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

/* -------------------- CORS -------------------- */

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600
}));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

/* -------------------- PUBLIC FILES -------------------- */

// Sèvi sèlman fichye piblik ki nesesè yo.
// Pa sèvi tout rasin pwojè a ak express.static(__dirname).

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

// Fichye admin yo sèvi sèlman si non yo koresponn.
// Verifye non reyèl fichye yo nan GitHub.
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.css", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.css"));
});

app.get("/admin.js", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.js"));
});

/* -------------------- DATABASE -------------------- */

function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(defaultDB, null, 2),
      "utf8"
    );
  }
}

function readDB() {
  ensureDB();

  const raw = fs.readFileSync(DB_FILE, "utf8");
  const data = JSON.parse(raw);

  return {
    ...defaultDB,
    ...data
  };
}

function writeDB(db) {
  ensureDB();

  fs.writeFileSync(
    TEMP_DB_FILE,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(TEMP_DB_FILE, DB_FILE);
}

function makeId(prefix = "SU") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function clean(value, maxLength = 200) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  return String(value).trim().slice(0, maxLength);
}

function validAmount(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 100000000
  );
}

function validTransactionId(value) {
  return /^\d{4,40}$/.test(clean(value, 40));
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/* -------------------- GOOGLE ADMIN SECURITY -------------------- */

async function requireAdmin(req, res, next) {
  if (!GOOGLE_CLIENT_ID || !ADMIN_EMAIL) {
    return res.status(503).json({
      error: "Google authentication is not configured."
    });
  }

  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Google login required."
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: match[1],
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      payload.email_verified !== true ||
      typeof payload.email !== "string" ||
      payload.email.trim().toLowerCase() !== ADMIN_EMAIL
    ) {
      return res.status(403).json({
        error: "This Google account is not authorized."
      });
    }

    req.admin = {
      email: payload.email,
      googleId: payload.sub
    };

    return next();
  } catch (error) {
    console.error(
      "Google token verification failed:",
      error.message
    );

    return res.status(401).json({
      error: "Invalid or expired Google login. Please sign in again."
    });
  }
}

/* -------------------- PUBLIC WRITE RATE LIMIT -------------------- */

const rateLimits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

function publicWriteLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  let record = rateLimits.get(ip);

  if (!record || now - record.start >= WINDOW_MS) {
    record = { start: now, count: 0 };
  }

  record.count++;
  rateLimits.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  return next();
}

/* -------------------- HEALTH -------------------- */

// Paj dakèy la se index.html.
// API sante a rete disponib nan /api/health.

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "online",
    time: new Date().toISOString()
  });
});

/* -------------------- PRODUCTS -------------------- */

app.get("/api/products", (req, res) => {
  try {
    const db = readDB();

    return res.json(
      db.products.filter(product => product.available !== false)
    );
  } catch (error) {
    console.error("Products read failed:", error.message);

    return res.status(500).json({
      error: "Could not read products."
    });
  }
});

app.post("/api/products", requireAdmin, (req, res) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({
        error: "Invalid request body."
      });
    }

    const name = clean(req.body.name, 120);
    const price = req.body.price;

    if (!name) {
      return res.status(400).json({
        error: "Product name is required."
      });
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000000
    ) {
      return res.status(400).json({
        error: "Invalid product price."
      });
    }

    const db = readDB();
    const now = new Date().toISOString();

    const product = {
      id: makeId("PROD"),
      name,
      category: clean(req.body.category, 80),
      price,
      image: clean(req.body.image, 500),
      description: clean(req.body.description, 1000),
      available: req.body.available !== false,
      createdAt: now,
      updatedAt: now
    };

    db.products.push(product);
    writeDB(db);

    return res.status(201).json(product);
  } catch (error) {
    console.error("Product creation failed:", error.message);

    return res.status(500).json({
      error: "Could not create product."
    });
  }
});

app.put("/api/products/:id", requireAdmin, (req, res) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({
        error: "Invalid request body."
      });
    }

    const db = readDB();

    const index = db.products.findIndex(
      product => String(product.id) === String(req.params.id)
    );

    if (index < 0) {
      return res.status(404).json({
        error: "Product not found."
      });
    }

    const old = db.products[index];
    const name = clean(req.body.name, 120);
    const price = req.body.price;

    if (!name) {
      return res.status(400).json({
        error: "Product name is required."
      });
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000000
    ) {
      return res.status(400).json({
        error: "Invalid product price."
      });
    }

    db.products[index] = {
      ...old,
      name,
      category: clean(req.body.category, 80),
      price,
      image: clean(req.body.image, 500),
      description: clean(req.body.description, 1000),
      available: req.body.available !== false,
      updatedAt: new Date().toISOString()
    };

    writeDB(db);

    return res.json(db.products[index]);
  } catch (error) {
    console.error("Product update failed:", error.message);

    return res.status(500).json({
      error: "Could not update product."
    });
  }
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  try {
    const db = readDB();

    const index = db.products.findIndex(
      product => String(product.id) === String(req.params.id)
    );

    if (index < 0) {
      return res.status(404).json({
        error: "Product not found."
      });
    }

    const deleted = db.products.splice(index, 1)[0];

    writeDB(db);

    return res.json({
      ok: true,
      product: deleted
    });
  } catch (error) {
    console.error("Product deletion failed:", error.message);

    return res.status(500).json({
      error: "Could not delete product."
    });
  }
});

/* -------------------- CLIENT HELPER -------------------- */

function upsertClient(db, customer, userId = "") {
  const email = clean(customer.email, 254).toLowerCase();

  let client = db.clients.find(item =>
    (userId && String(item.userId) === userId) ||
    (
      email &&
      String(item.email || "").toLowerCase() === email
    )
  );

  if (!client) {
    client = {
      id: makeId("CLI"),
      userId: clean(userId, 120),
      firstName: clean(customer.firstName, 100),
      lastName: clean(customer.lastName, 100),
      email,
      whatsapp: clean(customer.whatsapp, 30),
      balance: 0,
      createdAt: new Date().toISOString()
    };

    db.clients.push(client);
  } else {
    client.firstName =
      clean(customer.firstName, 100) || client.firstName;

    client.lastName =
      clean(customer.lastName, 100) || client.lastName;

    client.whatsapp =
      clean(customer.whatsapp, 30) || client.whatsapp;

    client.email = email || client.email;
  }

  return client;
}

/* -------------------- ORDERS -------------------- */

app.get("/api/orders", requireAdmin, (req, res) => {
  try {
    return res.json(readDB().orders.slice().reverse());
  } catch (error) {
    console.error("Orders read failed:", error.message);

    return res.status(500).json({
      error: "Could not read orders."
    });
  }
});

app.post("/api/orders", publicWriteLimit, (req, res) => {
  try {
    if (
      !isObject(req.body) ||
      !isObject(req.body.customer || {})
    ) {
      return res.status(400).json({
        error: "Invalid order data."
      });
    }

    const transactionId = clean(req.body.transactionId, 40);
    const productName = clean(req.body.productName, 120);
    const price = req.body.price;
    const quantity = req.body.quantity;
    const total = req.body.total;

    if (!validTransactionId(transactionId)) {
      return res.status(400).json({
        error: "Invalid transaction ID."
      });
    }

    if (
      !productName ||
      !validAmount(price) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100 ||
      !validAmount(total)
    ) {
      return res.status(400).json({
        error: "Invalid order details."
      });
    }

    if (Math.abs(total - price * quantity) > 0.01) {
      return res.status(400).json({
        error: "Order total does not match."
      });
    }

    const db = readDB();

    if (
      db.transactions.some(
        item => String(item.transactionId) === transactionId
      )
    ) {
      return res.status(409).json({
        error: "Transaction ID already used."
      });
    }

    const customer = {
      firstName: clean(req.body.customer.firstName, 100),
      lastName: clean(req.body.customer.lastName, 100),
      email: clean(req.body.customer.email, 254),
      whatsapp: clean(req.body.customer.whatsapp, 30)
    };

    const createdAt = new Date().toISOString();

    const order = {
      id: makeId("ORD"),
      userId: clean(req.body.userId, 120),
      customer,
      productId: clean(req.body.productId, 120),
      productName,
      optionId: clean(req.body.optionId, 120),
      optionLabel: clean(req.body.optionLabel, 120),
      quantity,
      price,
      total,
      transactionId,
      region: clean(req.body.region, 100),
      gameId: clean(req.body.gameId, 150),
      konamiId: clean(req.body.konamiId, 150),
      accountEmail: clean(req.body.accountEmail, 254),
      status: "en_cours",
      createdAt
    };

    db.orders.push(order);

    db.transactions.push({
      id: makeId("TXN"),
      transactionId,
      type: "order",
      orderId: order.id,
      userId: order.userId,
      amount: total,
      status: "en_cours",
      createdAt
    });

    upsertClient(db, customer, order.userId);
    writeDB(db);

    return res.status(201).json({
      ok: true,
      order
    });
  } catch (error) {
    console.error("Order creation failed:", error.message);

    return res.status(500).json({
      error: "Could not create order."
    });
  }
});

/* -------------------- CLIENTS -------------------- */

app.get("/api/clients", requireAdmin, (req, res) => {
  try {
    return res.json(readDB().clients.slice().reverse());
  } catch (error) {
    console.error("Clients read failed:", error.message);

    return res.status(500).json({
      error: "Could not read clients."
    });
  }
});

/* -------------------- RECHARGES -------------------- */

app.get("/api/recharges", requireAdmin, (req, res) => {
  try {
    return res.json(readDB().recharges.slice().reverse());
  } catch (error) {
    console.error("Recharges read failed:", error.message);

    return res.status(500).json({
      error: "Could not read recharges."
    });
  }
});

app.post("/api/recharges", publicWriteLimit, (req, res) => {
  try {
    if (
      !isObject(req.body) ||
      !isObject(req.body.customer || {})
    ) {
      return res.status(400).json({
        error: "Invalid recharge data."
      });
    }

    const transactionId = clean(req.body.transactionId, 40);
    const amount = req.body.amount;

    if (!validTransactionId(transactionId)) {
      return res.status(400).json({
        error: "Invalid transaction ID."
      });
    }

    if (!validAmount(amount)) {
      return res.status(400).json({
        error: "Invalid recharge amount."
      });
    }

    const db = readDB();

    if (
      db.transactions.some(
        item => String(item.transactionId) === transactionId
      )
    ) {
      return res.status(409).json({
        error: "Transaction ID already used."
      });
    }

    const customer = {
      firstName: clean(req.body.customer.firstName, 100),
      lastName: clean(req.body.customer.lastName, 100),
      email: clean(req.body.customer.email, 254),
      whatsapp: clean(req.body.customer.whatsapp, 30)
    };

    const createdAt = new Date().toISOString();

    const recharge = {
      id: makeId("REC"),
      userId: clean(req.body.userId, 120),
      customer,
      amount,
      transactionId,
      status: "en_cours",
      createdAt
    };

    db.recharges.push(recharge);

    db.transactions.push({
      id: makeId("TXN"),
      transactionId,
      type: "recharge",
      rechargeId: recharge.id,
      userId: recharge.userId,
      amount,
      status: "en_cours",
      createdAt
    });

    upsertClient(db, customer, recharge.userId);
    writeDB(db);

    return res.status(201).json({
      ok: true,
      recharge
    });
  } catch (error) {
    console.error("Recharge creation failed:", error.message);

    return res.status(500).json({
      error: "Could not create recharge."
    });
  }
});

/* -------------------- TRANSACTIONS / NOTIFICATIONS -------------------- */

app.get("/api/transactions", requireAdmin, (req, res) => {
  try {
    return res.json(readDB().transactions.slice().reverse());
  } catch (error) {
    console.error("Transactions read failed:", error.message);

    return res.status(500).json({
      error: "Could not read transactions."
    });
  }
});

app.get("/api/notifications", requireAdmin, (req, res) => {
  try {
    return res.json(readDB().notifications.slice().reverse());
  } catch (error) {
    console.error("Notifications read failed:", error.message);

    return res.status(500).json({
      error: "Could not read notifications."
    });
  }
});

/* -------------------- ERRORS -------------------- */

app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found.",
    path: req.originalUrl
  });
});

app.use((error, req, res, next) => {
  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      error: "Origin not allowed."
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON."
    });
  }

  console.error("Server error:", error.message);

  return res.status(500).json({
    error: "Internal server error."
  });
});

/* -------------------- START -------------------- */

try {
  ensureDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log("SEBY UNIVERSE API running on port", PORT);

    console.log(
      "Google admin authentication configured:",
      Boolean(GOOGLE_CLIENT_ID)
    );

    console.log(
      "Admin email configured:",
      Boolean(ADMIN_EMAIL)
    );

    console.log(
      "CORS origins configured:",
      ALLOWED_ORIGINS.length
    );
  });
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
