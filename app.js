// Livre de recettes — site statique, aucune compilation nécessaire.
// Les recettes sont des fichiers Markdown dans /recettes, listés dans recettes/index.json.

const CATEGORY_ORDER = ["Apéritifs", "Entrées", "Plats", "Accompagnements", "Desserts", "Pâtisseries", "Boissons", "Sauces", "Autres"];
const app = document.getElementById("app");
const search = document.getElementById("search");
let recipes = [];
let activeCat = null;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    else v = v.replace(/^["']|["']$/g, "");
    meta[kv[1]] = v;
  }
  return { meta, body: m[2] };
}

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// Petit rendu Markdown : titres, listes, listes numérotées, citations, paragraphes.
// Les listes sous un titre « Ingrédients » deviennent des cases à cocher.
function renderMarkdown(md) {
  const out = [];
  let list = null, para = [], inIngredients = false;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const openList = (tag, cls = "") => { if (list !== tag) { closeList(); out.push(`<${tag}${cls ? ` class="${cls}"` : ""}>`); list = tag; } };
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    let m;
    if (!line) { flushPara(); closeList(); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara(); closeList();
      const lvl = Math.min(m[1].length + 1, 4);
      inIngredients = /ingr[ée]dient/i.test(m[2]);
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (inIngredients) { openList("ul", "check"); out.push(`<li><label><input type="checkbox"><span>${inline(m[1])}</span></label></li>`); }
      else { openList("ul"); out.push(`<li>${inline(m[1])}</li>`); }
    } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara(); openList("ol"); out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else { closeList(); para.push(line); }
  }
  flushPara(); closeList();
  return out.join("\n");
}

async function loadRecipes() {
  const files = await fetch("recettes/index.json", { cache: "no-cache" }).then((r) => r.json());
  const loaded = await Promise.all(files.map(async (file) => {
    try {
      const text = await fetch(`recettes/${file}`, { cache: "no-cache" }).then((r) => { if (!r.ok) throw r; return r.text(); });
      const { meta, body } = parseFrontmatter(text);
      const tags = Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [];
      return { slug: file.replace(/\.md$/, ""), ...meta, tags, categorie: meta.categorie || "Autres", titre: meta.titre || file, body };
    } catch { console.warn("Recette illisible :", file); return null; }
  }));
  recipes = loaded.filter(Boolean).sort((a, b) => catRank(a.categorie) - catRank(b.categorie) || a.titre.localeCompare(b.titre, "fr"));
}
const catRank = (c) => { const i = CATEGORY_ORDER.indexOf(c); return i === -1 ? 99 : i; };

function matches(r, q) {
  if (!q) return true;
  const hay = norm([r.titre, r.categorie, r.tags.join(" "), r.body].join(" "));
  return norm(q).split(/\s+/).every((w) => hay.includes(w));
}

function renderToc() {
  const q = search.value.trim();
  const list = recipes.filter((r) => matches(r, q) && (!activeCat || r.categorie === activeCat));
  const cats = [...new Set(recipes.map((r) => r.categorie))];
  const groups = {};
  list.forEach((r) => (groups[r.categorie] ||= []).push(r));
  app.innerHTML = `
    <section class="cover">
      <h1>Mon Livre de Recettes</h1>
      <p class="subtitle">${recipes.length} recette${recipes.length > 1 ? "s" : ""} gardée${recipes.length > 1 ? "s" : ""} précieusement</p>
    </section>
    <div class="ornament">✦ ✦ ✦</div>
    <nav class="filters">
      <button class="chip ${!activeCat ? "active" : ""}" data-cat="">Tout</button>
      ${cats.map((c) => `<button class="chip ${activeCat === c ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
    </nav>
    <section class="toc">
      ${list.length ? Object.entries(groups).map(([cat, rs]) => `
        <h2>${esc(cat)}</h2>
        <ol>${rs.map((r) => `
          <li><a href="#/recette/${encodeURIComponent(r.slug)}">
            <span class="t">${esc(r.titre)}</span><span class="dots"></span>
            <span class="meta">${esc([r.temps, r.portions && `${r.portions} pers.`].filter(Boolean).join(" · "))}</span>
          </a></li>`).join("")}</ol>`).join("")
      : `<p class="empty">Aucune recette ne correspond${q ? ` à « ${esc(q)} »` : ""}.</p>`}
    </section>`;
  app.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { activeCat = b.dataset.cat || null; renderToc(); }));
}

function renderRecipe(slug) {
  const i = recipes.findIndex((r) => r.slug === slug);
  if (i === -1) { app.innerHTML = `<p class="empty">Recette introuvable. <a href="#/">Retour au sommaire</a></p>`; return; }
  const r = recipes[i], prev = recipes[i - 1], next = recipes[i + 1];
  const facts = [
    r.preparation && `🔪 Préparation : ${r.preparation}`,
    r.cuisson && `🔥 Cuisson : ${r.cuisson}`,
    r.temps && `⏱️ Total : ${r.temps}`,
    r.portions && `🍽️ ${r.portions} personne${r.portions > 1 ? "s" : ""}`,
    r.difficulte && `📊 ${r.difficulte}`,
  ].filter(Boolean);
  app.innerHTML = `
    <article class="recipe">
      <p class="cat">${esc(r.categorie)}</p>
      <h1>${esc(r.titre)}</h1>
      ${facts.length ? `<div class="facts">${facts.map((f) => `<span>${esc(f)}</span>`).join("")}</div>` : ""}
      ${r.tags.length ? `<div class="tags">${r.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      ${r.image ? `<img class="photo" src="${esc(r.image)}" alt="${esc(r.titre)}">` : ""}
      <div class="actions"><a class="btn" href="#/">← Sommaire</a><button class="btn" onclick="window.print()">🖨️ Imprimer</button></div>
      ${renderMarkdown(r.body)}
      ${r.source ? `<p class="source">Source : ${/^https?:/.test(r.source) ? `<a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(r.source)}</a>` : esc(r.source)}</p>` : ""}
      <nav class="pager">
        ${prev ? `<a href="#/recette/${encodeURIComponent(prev.slug)}">← ${esc(prev.titre)}</a>` : "<span></span>"}
        ${next ? `<a href="#/recette/${encodeURIComponent(next.slug)}">${esc(next.titre)} →</a>` : "<span></span>"}
      </nav>
    </article>`;
  document.title = `${r.titre} — Mon Livre de Recettes`;
  window.scrollTo(0, 0);
}

function route() {
  const m = location.hash.match(/^#\/recette\/(.+)$/);
  if (location.hash === "#/nouvelle") { document.title = "Nouvelle recette — Mon Livre de Recettes"; renderNewRecipe(); }
  else if (m) renderRecipe(decodeURIComponent(m[1]));
  else { document.title = "Mon Livre de Recettes"; renderToc(); }
}

search.addEventListener("input", () => { if (location.hash.length > 2) location.hash = "#/"; else renderToc(); });
window.addEventListener("hashchange", route);

loadRecipes().then(route).catch((e) => {
  console.error(e);
  app.innerHTML = `<p class="empty">Impossible de charger les recettes. Ouvre le site via un serveur (GitHub Pages ou <code>python3 -m http.server</code>).</p>`;
});

// ───────────── Nouvelle recette : envoi des captures dans a-traiter/ ─────────────
// Les captures sont déposées dans le dépôt GitHub (dossier a-traiter/) grâce à un jeton
// personnel stocké uniquement sur l'appareil. Claude les met ensuite en page.

const REPO = { owner: "nathanczt", repo: "livre-recette-", branch: "main" };
const TOKEN_KEY = "livre-recettes-github-token";
const store = {
  get() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } },
  set(v) { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch {} },
};
let pendingFiles = [];

async function gh(path, opts = {}) {
  const url = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}` + (path ? `/${path}` : "");
  const res = await fetch(url, {
    ...opts,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${store.get()}`, ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}`); err.status = res.status; throw err;
  }
  return res.status === 204 ? null : res.json();
}

const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "recette";

// Réduit les grosses photos (texte toujours lisible) pour garder le dépôt léger.
async function toJpegBase64(file) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88));
    return { data: await blobToBase64(blob), ext: "jpg" };
  } catch {
    return { data: await blobToBase64(file), ext: (file.name.split(".").pop() || "img").toLowerCase() };
  }
}
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(String(fr.result).split(",")[1]);
  fr.onerror = reject;
  fr.readAsDataURL(blob);
});

function renderNewRecipe() {
  pendingFiles = [];
  const hasToken = !!store.get();
  app.innerHTML = `
    <article class="recipe">
      <p class="cat">Ajouter au livre</p>
      <h1>Nouvelle recette</h1>
      <p class="hint">Ajoute tes captures d'écran (et le lien si tu l'as). Elles seront mises de côté,
        puis Claude les mettra en page <strong>sans rien changer</strong> au contenu : mêmes ingrédients, mêmes quantités, mêmes étapes.</p>
      <form class="form" id="new-form">
        <label class="drop" id="drop">
          <input type="file" id="files" accept="image/*" multiple>
          📸 <strong>Choisir des captures d'écran</strong><br><span class="hint">ou les glisser ici</span>
        </label>
        <div class="thumbs" id="thumbs"></div>
        <label><span>Nom de la recette <span class="hint">(facultatif)</span></span>
          <input type="text" id="titre" placeholder="Ex. : Tarte aux pommes de mamie"></label>
        <label><span>Lien de la publication <span class="hint">(facultatif)</span></span>
          <input type="url" id="lien" placeholder="https://www.instagram.com/p/…"></label>
        <label><span>Une note pour Claude <span class="hint">(facultatif)</span></span>
          <textarea id="note" placeholder="Ex. : catégorie Desserts, la recette est dans la 2e capture…"></textarea></label>
        <button class="btn primary" id="send" type="submit">Envoyer au livre</button>
        <div id="msg"></div>
      </form>
      <section class="pending" id="pending"></section>
      <details class="settings" id="settings" ${hasToken ? "" : "open"}>
        <summary id="settings-title">⚙️ Connexion à GitHub ${hasToken ? "✅" : "(à faire une seule fois)"}</summary>
        <p class="hint">Le site a besoin d'un « jeton » GitHub pour déposer tes captures. Il reste enregistré uniquement sur cet appareil.</p>
        <ol>
          <li>Ouvre <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a></li>
          <li><strong>Token name</strong> : « Livre de recettes ». <strong>Expiration</strong> : la plus longue possible.</li>
          <li><strong>Repository access</strong> : <em>Only select repositories</em> → <code>${REPO.repo}</code></li>
          <li><strong>Permissions</strong> → <em>Repository permissions</em> → <strong>Contents</strong> : <em>Read and write</em></li>
          <li>Clique sur <strong>Generate token</strong>, copie-le et colle-le ci-dessous.</li>
        </ol>
        <div class="form">
          <label>Jeton GitHub <input type="password" id="token" placeholder="github_pat_…" value="${esc(store.get())}"></label>
          <div class="actions"><button class="btn" id="save-token" type="button">Enregistrer</button>
          <button class="btn" id="forget-token" type="button" ${hasToken ? "" : "hidden"}>Oublier le jeton</button></div>
          <div id="token-msg"></div>
        </div>
      </details>
      <div class="actions"><a class="btn" href="#/">← Sommaire</a></div>
      <p class="hint" style="text-align:right">version 5</p>
    </article>`;

  const $ = (id) => document.getElementById(id);
  const msg = (text, error = false) => { $("msg").innerHTML = text ? `<p class="status ${error ? "error" : ""}">${text}</p>` : ""; };

  const drawThumbs = () => {
    $("thumbs").innerHTML = pendingFiles.map((f, i) => `
      <figure><img src="${f.url}" alt="Capture ${i + 1}"><button type="button" data-i="${i}" aria-label="Retirer">✕</button></figure>`).join("");
    $("thumbs").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      URL.revokeObjectURL(pendingFiles[b.dataset.i].url); pendingFiles.splice(b.dataset.i, 1); drawThumbs();
    }));
  };
  const addFiles = (list) => {
    [...list].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .forEach((file) => pendingFiles.push({ file, url: URL.createObjectURL(file) }));
    drawThumbs();
  };
  $("files").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  const drop = $("drop");
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); addFiles(e.dataTransfer.files); });

  $("save-token").addEventListener("click", async () => {
    // On met à jour la page sur place pour ne pas perdre les captures déjà ajoutées.
    const tokenMsg = (t, err) => { $("token-msg").innerHTML = `<p class="status ${err ? "error" : ""}">${t}</p>`; };
    const value = $("token").value.trim();
    if (!value) { tokenMsg("Colle d'abord ton jeton dans la case.", true); return; }
    store.set(value); tokenMsg("Vérification…");
    try {
      const info = await gh("");
      if (info.permissions && !info.permissions.push) { const e = new Error("lecture seule"); e.status = "lecture seule"; throw e; }
      tokenMsg("✅ Connecté ! Tu peux maintenant envoyer ta recette.");
      $("settings-title").textContent = "⚙️ Connexion à GitHub ✅";
      $("forget-token").hidden = false; msg("");
      loadPending();
    } catch (err) {
      store.set("");
      tokenMsg("Ce jeton ne fonctionne pas. Vérifie qu'il donne accès au dépôt « " + REPO.repo + " » avec la permission <strong>Contents : Read and write</strong>. " + `<small>(code : ${esc(err.status || err.message)})</small>`, true);
    }
  });
  $("forget-token").addEventListener("click", () => { store.set(""); $("token").value = ""; $("forget-token").hidden = true; $("settings-title").textContent = "⚙️ Connexion à GitHub (à faire une seule fois)"; });

  $("new-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const titre = $("titre").value.trim(), lien = $("lien").value.trim(), note = $("note").value.trim();
    if (!pendingFiles.length && !lien && !note) { msg("Ajoute au moins une capture d'écran (ou un lien).", true); return; }
    if (!store.get()) {
      msg("Il faut d'abord connecter le site à GitHub (une seule fois) : suis les étapes de la section ⚙️ juste en dessous. Tes captures restent là.", true);
      $("settings").open = true; $("settings").scrollIntoView({ behavior: "smooth" });
      return;
    }
    $("send").disabled = true;
    const now = new Date(), pad = (n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const folder = `a-traiter/${stamp}-${slugify(titre)}`;
    const put = (path, content, message) => gh(`contents/${path}`, {
      method: "PUT", body: JSON.stringify({ message, content, branch: REPO.branch }),
    });
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        msg(`Envoi de la capture ${i + 1} sur ${pendingFiles.length}…`);
        const { data, ext } = await toJpegBase64(pendingFiles[i].file);
        await put(`${folder}/capture-${pad(i + 1)}.${ext}`, data, `Capture ${i + 1} pour « ${titre || "nouvelle recette"} »`);
      }
      msg("Finalisation…");
      const md = [
        "# Recette à mettre en page", "",
        `- **Nom proposé** : ${titre || "(non précisé)"}`,
        `- **Lien** : ${lien || "(aucun)"}`,
        `- **Ajoutée le** : ${now.toLocaleString("fr-FR")}`,
        `- **Captures** : ${pendingFiles.length}`, "",
        "## Note", "", note || "(aucune)", "",
      ].join("\n");
      await put(`${folder}/infos.md`, blobToB64Text(md), `Nouvelle recette à traiter : ${titre || stamp}`);
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.url)); pendingFiles = [];
      $("new-form").reset(); drawThumbs();
      msg(`✅ C'est envoyé ! Dis à Claude : <strong>« traite les nouvelles recettes »</strong> pour qu'elle apparaisse dans le livre.`);
      loadPending();
    } catch (err) {
      msg(err.status === 401 || err.status === 403 || err.status === 404
        ? "GitHub a refusé l'envoi : le jeton est peut-être expiré ou n'a pas les bons droits (voir ⚙️ ci-dessous)."
        : "L'envoi a échoué. Vérifie ta connexion et réessaie.", true);
    } finally { $("send").disabled = false; }
  });

  async function loadPending() {
    if (!store.get()) return;
    try {
      const items = (await gh(`contents/a-traiter?ref=${REPO.branch}`)).filter((x) => x.type === "dir");
      $("pending").innerHTML = items.length ? `<h2>En attente de mise en page (${items.length})</h2>
        <ul>${items.map((x) => `<li>${esc(x.name.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, "").replace(/-/g, " "))}</li>`).join("")}</ul>` : "";
    } catch { $("pending").innerHTML = ""; }
  }
  loadPending();
}

const blobToB64Text = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
