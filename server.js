/*
|--------------------------------------------------------------------------
| SEBY UNIVERSE BACKEND
|--------------------------------------------------------------------------
| Express API for products, orders, clients, recharges and transactions.
|
| Local persistence:
|   data/db.json
|
| IMPORTANT:
| This JSON database is suitable for local/testing deployment.
| For production on Vercel, replace it with a real database later.
|--------------------------------------------------------------------------
*/

"use strict";

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* =========================================================
   DATABASE
========================================================= */

const defaultDB = {
    products: [],
    orders: [],
    clients: [],
    recharges: [],
    transactions: [],
    notifications: []
};

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

    try {
        const raw = fs.readFileSync(DB_FILE, "utf8");
        const data = JSON.parse(raw);

        return {
            ...defaultDB,
            ...data
        };
    } catch (error) {
        console.error("DB read error:", error);
        return { ...defaultDB };
    }
}

function writeDB(db) {
    ensureDB();

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(db, null, 2),
        "utf8"
    );
}

function makeId(prefix = "SU") {
    return (
        prefix +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8).toUpperCase()
    );
}

function clean(value) {
    return String(value ?? "").trim();
}

function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/", (req, res) => {
    res.json({
        ok: true,
        name: "SEBY UNIVERSE API",
        status: "online",
        version: "1.0.0"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        status: "online",
        time: new Date().toISOString()
    });
});

/* =========================================================
   PRODUCTS
========================================================= */

app.get("/api/products", (req, res) => {
    const db = readDB();
    res.json(db.products);
});

app.post("/api/products", (req, res) => {
    const db = readDB();

    const product = {
        id: makeId("PROD"),
        name: clean(req.body.name),
        category: clean(req.body.category),
        price: number(req.body.price),
        image: clean(req.body.image),
        description: clean(req.body.description),
        available: req.body.available !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (!product.name) {
        return res.status(400).json({
            error: "Product name is required."
        });
    }

    if (product.price < 0) {
        return res.status(400).json({
            error: "Product price is invalid."
        });
    }

    db.products.push(product);
    writeDB(db);

    res.status(201).json(product);
});

app.put("/api/products/:id", (req, res) => {
    const db = readDB();

    const index = db.products.findIndex(
        p => String(p.id) === String(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            error: "Product not found."
        });
    }

    const old = db.products[index];

    const updated = {
        ...old,
        name: clean(req.body.name),
        category: clean(req.body.category),
        price: number(req.body.price),
        image: clean(req.body.image),
        description: clean(req.body.description),
        available: req.body.available !== false,
        updatedAt: new Date().toISOString()
    };

    if (!updated.name) {
        return res.status(400).json({
            error: "Product name is required."
        });
    }

    if (updated.price < 0) {
        return res.status(400).json({
            error: "Product price is invalid."
        });
    }

    db.products[index] = updated;
    writeDB(db);

    res.json(updated);
});

app.delete("/api/products/:id", (req, res) => {
    const db = readDB();

    const index = db.products.findIndex(
        p => String(p.id) === String(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            error: "Product not found."
        });
    }

    const deleted = db.products.splice(index, 1)[0];
    writeDB(db);

    res.json({
        ok: true,
        product: deleted
    });
});

/* =========================================================
   ORDERS
========================================================= */

app.get("/api/orders", (req, res) => {
    const db = readDB();

    const orders = db.orders.slice().reverse();

    res.json(orders);
});

app.post("/api/orders", (req, res) => {
    const db = readDB();

    const transactionId = clean(req.body.transactionId);

    if (!transactionId || !/^\d+$/.test(transactionId)) {
        return res.status(400).json({
            error: "Invalid transaction ID."
        });
    }

    const alreadyUsed = db.transactions.some(
        t => String(t.transactionId) === transactionId
    );

    if (alreadyUsed) {
        return res.status(409).json({
            error: "Transaction ID already used."
        });
    }

    const order = {
        id: clean(req.body.id) || makeId("ORD"),
        userId: clean(req.body.userId),
        customer: req.body.customer || {},
        productId: clean(req.body.productId),
        productName: clean(req.body.productName),
        optionId: clean(req.body.optionId),
        optionLabel: clean(req.body.optionLabel),
        quantity: Math.max(1, number(req.body.quantity)),
        price: number(req.body.price),
        total: number(req.body.total),
        transactionId,
        region: clean(req.body.region),
        gameId: clean(req.body.gameId),
        konamiId: clean(req.body.konamiId),
        accountEmail: clean(req.body.accountEmail),
        accountPassword: clean(req.body.accountPassword),
        status: "en_cours",
        createdAt: new Date().toISOString()
    };

    db.orders.push(order);

    db.transactions.push({
        id: makeId("TXN"),
        transactionId,
        type: "order",
        orderId: order.id,
        userId: order.userId,
        amount: order.total,
        status: "en_cours",
        createdAt: order.createdAt
    });

    upsertClient(db, order.customer, order.userId);

    writeDB(db);

    res.status(201).json(order);
});

/* =========================================================
   CLIENTS
========================================================= */

function upsertClient(db, customer, userId = "") {
    const email = clean(customer?.email).toLowerCase();

    let client = db.clients.find(
        c =>
            (userId && String(c.userId) === String(userId)) ||
            (email && String(c.email).toLowerCase() === email)
    );

    if (!client) {
        client = {
            id: makeId("CLI"),
            userId: clean(userId),
            firstName: clean(customer?.firstName),
            lastName: clean(customer?.lastName),
            email,
            whatsapp: clean(customer?.whatsapp),
            balance: 0,
            createdAt: new Date().toISOString()
        };

        db.clients.push(client);
    } else {
        client.firstName = clean(customer?.firstName) || client.firstName;
        client.lastName = clean(customer?.lastName) || client.lastName;
        client.whatsapp = clean(customer?.whatsapp) || client.whatsapp;
        client.email = email || client.email;
    }

    return client;
}

app.get("/api/clients", (req, res) => {
    const db = readDB();
    res.json(db.clients.slice().reverse());
});

/* =========================================================
   RECHARGES
========================================================= */

app.get("/api/recharges", (req, res) => {
    const db = readDB();
    res.json(db.recharges.slice().reverse());
});

app.post("/api/recharges", (req, res) => {
    const db = readDB();

    const transactionId = clean(req.body.transactionId);
    const amount = number(req.body.amount);

    if (!transactionId || !/^\d+$/.test(transactionId)) {
        return res.status(400).json({
            error: "Invalid transaction ID."
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            error: "Invalid recharge amount."
        });
    }

    const alreadyUsed = db.transactions.some(
        t => String(t.transactionId) === transactionId
    );

    if (alreadyUsed) {
        return res.status(409).json({
            error: "Transaction ID already used."
        });
    }

    const recharge = {
        id: clean(req.body.id) || makeId("REC"),
        userId: clean(req.body.userId),
        customer: req.body.customer || {},
        amount,
        transactionId,
        status: "en_cours",
        createdAt: new Date().toISOString()
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
        createdAt: recharge.createdAt
    });

    upsertClient(db, recharge.customer, recharge.userId);

    writeDB(db);

    res.status(201).json(recharge);
});

/* =========================================================
   TRANSACTIONS
========================================================= */

app.get("/api/transactions", (req, res) => {
    const db = readDB();
    res.json(db.transactions.slice().reverse());
});

/* =========================================================
   NOTIFICATIONS
========================================================= */

app.get("/api/notifications", (req, res) => {
    const db = readDB();
    res.json(db.notifications.slice().reverse());
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((req, res) => {
    res.status(404).json({
        error: "Route not found.",
        path: req.originalUrl
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    res.status(500).json({
        error: "Internal server error."
    });
});

/* =========================================================
   START
========================================================= */

ensureDB();

app.listen(PORT, "0.0.0.0", () => {
    console.log("==========================================");
    console.log(" SEBY UNIVERSE API");
    console.log("==========================================");
    console.log(` Server running on port ${PORT}`);
    console.log(` http://127.0.0.1:${PORT}`);
    console.log("==========================================");
});
