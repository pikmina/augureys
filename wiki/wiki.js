// ===============================
// CONFIG
// ===============================
// Añadimos per_page=100 para evitar el límite por defecto de WordPress (10 posts)
const API_CATEGORIES = "https://saxagenia.com/wp-json/wp/v2/doc_category?per_page=100";
const API_DOCS = "https://saxagenia.com/wp-json/wp/v2/docs?per_page=100";
const API_DOC = id => `https://saxagenia.com/wp-json/wp/v2/docs/${id}`;

let ALL_DOCS = [];
let ALL_CATEGORIES = [];

// ===============================
// INITIAL LOAD
// ===============================
async function initWiki() {
    try {
        const [cats, docs] = await Promise.all([
            fetch(API_CATEGORIES).then(r => r.ok ? r.json() : []),
            fetch(API_DOCS).then(r => r.ok ? r.json() : [])
        ]);

        ALL_CATEGORIES = Array.isArray(cats) ? cats : [];
        ALL_DOCS = Array.isArray(docs) ? docs : [];

        renderSidebar(ALL_CATEGORIES);
        
        // Si la URL no tiene parámetros, renderizamos la lista completa
        if (!checkURLForAutoLoad()) {
            renderDocs(ALL_DOCS);
        }
    } catch (error) {
        console.error("Error inicializando la Wiki:", error);
        document.getElementById("wiki-list").innerHTML = "Error al conectar con el servidor.";
    }
}

// ===============================
// SIDEBAR (CATEGORIES)
// ===============================
function renderSidebar(categories) {
    const side = document.getElementById("wiki-sidebar");
    if (!side) return;

    let html = "<h3>Wiki</h3><ul class='wiki-tree'>";

    categories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
        const docsForCat = ALL_DOCS
            .filter(doc => {
                const catsField = doc.docs_category ?? doc.doc_category ?? [];
                return Array.isArray(catsField) && catsField.includes(cat.id);
            })
            .sort((a, b) => (a.title?.rendered || '').localeCompare(b.title?.rendered || ''));

        html += `
        <li class="wiki-cat" data-cat="${cat.id}">
            <div class="wiki-cat-title" style="cursor:pointer; font-weight:bold;">${cat.name}</div>
            <ul class="wiki-sublist">
        `;

        if (docsForCat.length === 0) {
            html += `<li class="wiki-doc-empty"><i>Sin Artículos</i></li>`;
        } else {
            docsForCat.forEach(doc => {
                html += `
                <li class="wiki-doc">
                    <a href="?art=${doc.slug}" data-id="${doc.id}" data-slug="${doc.slug}">
                        ${doc.title.rendered}
                    </a>
                </li>`;
            });
        }
        html += `</ul></li>`;
    });

    side.innerHTML = html + "</ul>";

    // Event Delegation para el Sidebar
    side.addEventListener("click", e => {
        const a = e.target.closest(".wiki-doc a");
        const catTitle = e.target.closest(".wiki-cat-title");

        if (a) {
            e.preventDefault();
            const id = parseInt(a.dataset.id);
            loadArticle(id, true); // true = actualizar historial
        } else if (catTitle) {
            const parent = catTitle.closest(".wiki-cat");
            const catId = parseInt(parent.dataset.cat);
            const cat = ALL_CATEGORIES.find(c => c.id === catId);
            if (cat) {
                filterByCategory(catId);
                history.pushState({ type: 'cat', slug: cat.slug }, "", `?cat=${cat.slug}`);
            }
        }
    });
}

// ===============================
// RENDER LIST (CARDS)
// ===============================
function renderDocs(list) {
    const listBox = document.getElementById("wiki-list");
    const articleBox = document.getElementById("wiki-article");

    listBox.style.display = "block";
    articleBox.style.display = "none";
    // Reiniciar animación
    listBox.classList.remove("wiki-animate");
    
    let htmlContent = "";

    list.sort((a, b) => a.title.rendered.localeCompare(b.title.rendered))
        .forEach(doc => {
            const catId = doc.doc_category?.[0] ?? doc.docs_category?.[0];
            const cat = ALL_CATEGORIES.find(c => c.id === catId);

            htmlContent += `
                <div class="wiki-card" data-id="${doc.id}" style="cursor:pointer; border:1px solid #ccc; margin:5px; padding:10px;">
                    <div class="wiki-card-title"><strong>${doc.title.rendered}</strong></div>
                    <div class="wiki-card-cat"><small>${cat?.name ?? "General"}</small></div>
                </div>
            `;
        });

    listBox.innerHTML = htmlContent || "No se encontraron artículos.";

    // Click en las tarjetas
    listBox.querySelectorAll(".wiki-card").forEach(card => {
        card.onclick = () => loadArticle(parseInt(card.dataset.id), true);
    });
}

// ===============================
// LOAD ARTICLE CONTENT
// ===============================
async function loadArticle(id, updateHistory = false) {
    const list = document.getElementById("wiki-list");
    const box = document.getElementById("wiki-article");

    list.style.display = "none";
    box.style.display = "block";
    // Quitamos la clase por si ya existía de un artículo anterior
    box.classList.remove("wiki-animate");
    box.innerHTML = "<p>Cargando artículo...</p>";

    try {
        const response = await fetch(API_DOC(id));
        const data = await response.json();

        if (updateHistory) {
            history.pushState({ type: 'art', slug: data.slug }, "", `?art=${data.slug}`);
        }

        box.innerHTML = `
            <button onclick="renderDocs(ALL_DOCS)" style="margin-bottom:20px;">← Volver</button>
            <h2>${data.title.rendered}</h2>
            <div id="wiki-toc"></div>
            <div id="wiki-article-body">${data.content.rendered}</div>
        `;

        generateTOC();
        window.scrollTo(0,0);
        
        // Marcar activo en el sidebar
        document.querySelectorAll(".wiki-doc a").forEach(el => {
            el.classList.toggle("active", parseInt(el.dataset.id) === id);
        });

    } catch (error) {
        box.innerHTML = "Error al cargar el artículo.";
    }
}

// ===============================
// TOC, FILTER & SEARCH
// ===============================
function generateTOC() {
    const body = document.getElementById("wiki-article-body");
    const toc = document.getElementById("wiki-toc");
    const headers = [...body.querySelectorAll("h1, h2, h3, h4")];

    if (headers.length === 0) { toc.innerHTML = ""; return; }

    let html = "<div class='toc' style='background:#f9f9f9; padding:10px;'><b>Contenido</b><ul>";
    headers.forEach((h, i) => {
        const id = "section-" + i;
        h.id = id;
        html += `<li><a href="#${id}">${h.textContent}</a></li>`;
    });
    toc.innerHTML = html + "</ul></div>";
}

function filterByCategory(catId) {
    const filtered = ALL_DOCS.filter(doc => {
        const cats = doc.doc_category ?? doc.docs_category ?? [];
        return cats.includes(catId);
    });
    renderDocs(filtered);
}

document.addEventListener("input", e => {
    if (e.target.id === "wiki-search") {
        const q = e.target.value.toLowerCase();
        const filtered = ALL_DOCS.filter(doc =>
            doc.title.rendered.toLowerCase().includes(q)
        );
        renderDocs(filtered);
    }
});

// ===============================
// NAVIGATION ENGINE (URL & BACK BUTTON)
// ===============================
function checkURLForAutoLoad() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("art")) {
        const doc = ALL_DOCS.find(d => d.slug === params.get("art"));
        if (doc) { loadArticle(doc.id, false); return true; }
    }

    if (params.has("cat")) {
        const cat = ALL_CATEGORIES.find(c => c.slug === params.get("cat"));
        if (cat) { filterByCategory(cat.id); return true; }
    }
    return false;
}

// Escuchar el botón Atrás/Adelante del navegador
window.addEventListener("popstate", () => {
    if (!checkURLForAutoLoad()) {
        renderDocs(ALL_DOCS);
    }
});

// Iniciar
initWiki();