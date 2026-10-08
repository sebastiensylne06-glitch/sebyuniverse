/*
|--------------------------------------------------------------------------
| SEBY UNIVERSE ADMIN
|--------------------------------------------------------------------------
| Même backend que le site.
|
| Produits :
| GET    /api/products
| POST   /api/products
| PUT    /api/products/:id
| DELETE /api/products/:id
|--------------------------------------------------------------------------
*/

const API_BASE = "";

const API = {
    products: `${API_BASE}/api/products`,
    orders: `${API_BASE}/api/orders`,
    clients: `${API_BASE}/api/clients`,
    recharges: `${API_BASE}/api/recharges`,
    transactions: `${API_BASE}/api/transactions`
};


let products = [];


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("productForm")
        .addEventListener("submit", saveProduct);

    loadAll();

});


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(section, button = null) {

    document.querySelectorAll(".section")
        .forEach(el => el.classList.remove("active"));

    const target = document.getElementById(section + "Section");

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".menu-item")
        .forEach(el => el.classList.remove("active"));

    if (button) {
        button.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard",
        orders: "Commandes",
        recharges: "Recharges",
        clients: "Clients",
        notifications: "Notifications",
        products: "Produits & Prix",
        transactions: "Transactions",
        settings: "Paramètres"
    };

    document.getElementById("pageTitle").textContent =
        titles[section] || "Dashboard";

    closeSidebar();

    if (section === "products") {
        loadProducts();
    }
}


function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("show");
}


function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
}


/* =========================================================
   CHARGEMENT GENERAL
========================================================= */

async function loadAll() {

    await loadProducts();

    updateDashboard();

    checkAPI();

}


/* =========================================================
   PRODUITS
========================================================= */

async function loadProducts() {

    const container = document.getElementById("productsList");

    container.innerHTML = `
        <div class="loading">
            Chargement des produits...
        </div>
    `;

    try {

        const response = await fetch(API.products, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Impossible de charger les produits.");
        }

        const data = await response.json();

        /*
         * Supporte :
         * [ ... ]
         *
         * ou :
         * { products: [...] }
         */

        products = Array.isArray(data)
            ? data
            : (data.products || []);

        renderProducts();

        document.getElementById("apiStatus").textContent =
            "API connectée — produits synchronisés.";

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Impossible de charger les produits.</p>
                <small>
                    Vérifiez que /api/products existe sur le serveur.
                </small>
            </div>
        `;

    }

}


function renderProducts() {

    const container = document.getElementById("productsList");

    if (!products.length) {

        container.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-box-open"></i>
                <p>Aucun produit pour le moment.</p>
            </div>
        `;

        return;
    }


    container.innerHTML = products.map(product => {

        const id = product.id || product._id;

        const image = product.image || product.imageUrl;

        const available =
            product.available !== false &&
            product.active !== false;

        return `

            <article class="product-card">

                ${
                    image
                    ?
                    `<img
                        class="product-image"
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(product.name || "Produit")}"
                    >`
                    :
                    `
                    <div class="product-no-image">
                        <i class="fa-solid fa-box"></i>
                    </div>
                    `
                }

                <div class="product-body">

                    <h3>
                        ${escapeHtml(product.name || "Sans nom")}
                    </h3>

                    <div class="product-category">
                        ${escapeHtml(product.category || "Produit")}
                    </div>

                    <div class="product-price">
                        ${formatPrice(product.price)} GDES
                    </div>

                    <span class="product-status ${
                        available ? "available" : "unavailable"
                    }">

                        ${
                            available
                            ? "Disponible"
                            : "Indisponible"
                        }

                    </span>

                    <div class="product-actions">

                        <button
                            class="edit-button"
                            onclick="editProduct('${escapeJs(id)}')"
                        >
                            <i class="fa-solid fa-pen"></i>
                            Modifier
                        </button>

                        <button
                            class="delete-button"
                            onclick="deleteProduct('${escapeJs(id)}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                            Supprimer
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");

}


/* =========================================================
   AJOUT / MODIFICATION
========================================================= */

function openProductModal(product = null) {

    const modal = document.getElementById("productModal");

    document.getElementById("productForm").reset();

    document.getElementById("productAvailable").checked = true;

    if (product) {

        document.getElementById("modalTitle").textContent =
            "Modifier le produit";

        document.getElementById("productId").value =
            product.id || product._id || "";

        document.getElementById("productName").value =
            product.name || "";

        document.getElementById("productCategory").value =
            product.category || "";

        document.getElementById("productPrice").value =
            product.price || "";

        document.getElementById("productImage").value =
            product.image || product.imageUrl || "";

        document.getElementById("productDescription").value =
            product.description || "";

        document.getElementById("productAvailable").checked =
            product.available !== false;

    } else {

        document.getElementById("modalTitle").textContent =
            "Ajouter un produit";

        document.getElementById("productId").value = "";

    }

    modal.classList.add("show");
}


function closeProductModal() {
    document
        .getElementById("productModal")
        .classList.remove("show");
}


function editProduct(id) {

    const product = products.find(p =>
        String(p.id || p._id) === String(id)
    );

    if (!product) {
        showToast("Produit introuvable.");
        return;
    }

    openProductModal(product);
}


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function saveProduct(event) {

    event.preventDefault();

    const id = document.getElementById("productId").value.trim();

    const product = {

        name: document.getElementById("productName").value.trim(),

        category:
            document.getElementById("productCategory").value.trim(),

        price:
            Number(document.getElementById("productPrice").value),

        image:
            document.getElementById("productImage").value.trim(),

        description:
            document.getElementById("productDescription").value.trim(),

        available:
            document.getElementById("productAvailable").checked

    };


    if (!product.name) {
        showToast("Entrez le nom du produit.");
        return;
    }

    if (!product.price || product.price < 0) {
        showToast("Entrez un prix valide.");
        return;
    }


    const isEdit = Boolean(id);

    const url = isEdit
        ? `${API.products}/${encodeURIComponent(id)}`
        : API.products;

    const method = isEdit ? "PUT" : "POST";


    try {

        const response = await fetch(url, {

            method,

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(product)

        });


        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                errorText || "Erreur pendant l'enregistrement."
            );

        }


        closeProductModal();

        showToast(
            isEdit
                ? "Produit modifié avec succès."
                : "Produit ajouté avec succès."
        );

        await loadProducts();

        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            "Erreur API : impossible d'enregistrer le produit."
        );

    }

}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(id) {

    const product = products.find(p =>
        String(p.id || p._id) === String(id)
    );

    const name = product?.name || "ce produit";

    const confirmed = confirm(
        `Voulez-vous vraiment supprimer "${name}" ?`
    );

    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API.products}/${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (!response.ok) {
            throw new Error("Suppression impossible.");
        }


        showToast("Produit supprimé.");

        await loadProducts();

        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            "Erreur : impossible de supprimer le produit."
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    document.getElementById("statOrders").textContent = "0";
    document.getElementById("statPending").textContent = "0";
    document.getElementById("statValidated").textContent = "0";
    document.getElementById("statRejected").textContent = "0";
    document.getElementById("statRecharges").textContent = "0";
    document.getElementById("statClients").textContent = "0";

}


/* =========================================================
   API STATUS
========================================================= */

async function checkAPI() {

    const status = document.getElementById("apiStatus");

    if (!status) return;

    try {

        const response = await fetch(API.products, {
            method: "GET"
        });

        if (response.ok) {

            status.textContent =
                "API connectée — système opérationnel.";

            status.style.background = "#dcf7e5";
            status.style.color = "#15803d";

        } else {

            throw new Error();

        }

    } catch {

        status.textContent =
            "API produits non disponible.";

        status.style.background = "#ffe5e5";
        status.style.color = "#dc2626";

    }

}


/* =========================================================
   SITE CLIENT
========================================================= */

function openSite() {

    /*
     * Admin nan sipoze nan /admin/
     * Sit kliyan an nan /
     */

    window.location.href = "../index.html";

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem("seby_admin_token");
    localStorage.removeItem("seby_admin_user");

    window.location.href = "admin.html";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);

}


/* =========================================================
   FORMAT
========================================================= */

function formatPrice(price) {

    const number = Number(price) || 0;

    return number.toLocaleString("fr-FR");

}


/* =========================================================
   SECURITY HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeJs(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}


/* =========================================================
   MODAL CLICK OUTSIDE
========================================================= */

document
    .getElementById("productModal")
    .addEventListener("click", function(event) {

        if (event.target === this) {
            closeProductModal();
        }

    });