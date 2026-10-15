// Renders every section from the JSON files in /content.
// To change text, edit those files (or use the site editor), not this script.

const FILES = ["profile", "news", "research", "publications", "team", "impact", "teaching", "service", "guide"];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = matchMedia("(pointer: fine)").matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

async function load() {
  const data = {};
  await Promise.all(FILES.map(async (f) => {
    try {
      const res = await fetch(`content/${f}.json`, { cache: "no-cache" });
      data[f] = await res.json();
    } catch (e) {
      if (f === "guide") data[f] = { enabled: false, tips: [] }; else throw e;
    }
  }));
  return data;
}

function figure(p, cls = "", style = "") {
  if (!p || !p.image) return "";
  return `<figure class="${cls}" ${style ? `style="${style}"` : ""} data-full="${esc(p.image)}" data-caption="${esc(p.caption)}">
    <img src="${esc(p.image)}" alt="${esc(p.caption || "")}" loading="lazy">
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
  </figure>`;
}

// Hero -------------------------------------------------------------------
function renderHero({ profile: p }) {
  $("hero-pill").textContent = `Professor · ${p.affiliation}`;
  const [first, ...rest] = p.name.split(" ");
  $("hero-name").innerHTML = `<span class="line">${esc(first)}</span> <span class="line">${esc(rest.join(" "))}</span> <em class="line">(${esc(p.preferred_name)})</em>`;
  $("hero-intro").textContent = p.intro || "";
  $("tagline-prefix").textContent = p.tagline_prefix || "";
  $("hero-photo").src = p.photo;
  $("hero-photo").alt = `Portrait of ${p.name}`;
  $("hero-badge").textContent = p.badge || "";
  $("hero-badge").hidden = !p.badge;
  $("board-title").textContent = p.whiteboard_title || "";
  $("board-lines").innerHTML = (p.whiteboard_lines || []).map((l, i) => {
    const [a, b] = l.split("→");
    return `<li style="--i:${i}"><span class="hw">${esc(a.trim())}</span>${b ? `<span class="arrow">→</span><span class="hw sm">${esc(b.trim())}</span>` : ""}</li>`;
  }).join("");
  const scholar = p.links.find((l) => /scholar/i.test(l.label));
  $("hero-actions").innerHTML =
    `<a class="btn dark" href="#research">Explore research</a>` +
    (scholar ? `<a class="btn outline" href="${esc(scholar.url)}" target="_blank" rel="noopener">Google Scholar</a>` : "") +
    `<a class="btn outline" href="mailto:${esc(p.email)}">Email</a>`;
}

function renderStrip({ profile: p, impact }) {
  $("metrics").innerHTML = impact.metrics.map((m, i) =>
    `<div class="reveal" style="--stagger:${i}"><dt data-count="${esc(m.value)}">0</dt><dd>${esc(m.label)}</dd></div>`).join("");
  $("honours").innerHTML = (p.honours || []).map((h, i) =>
    `<div class="honour reveal" style="--stagger:${i}"><span>${esc(h.role)}</span><strong>${esc(h.outlet)}</strong></div>`).join("");
}

// About ------------------------------------------------------------------
const REEL_ART = [
  // 1 technology: a chip wired to blocks in a chain
  `<svg viewBox="0 0 320 180"><g class="r-wires"><path d="M160 90H60M160 90h100M160 90V30M160 90v60"/></g>
   <g class="r-blocks"><rect x="24" y="74" width="34" height="32" rx="6"/><rect x="262" y="74" width="34" height="32" rx="6"/><rect x="144" y="2" width="32" height="28" rx="6"/><rect x="144" y="150" width="32" height="28" rx="6"/></g>
   <rect x="128" y="60" width="64" height="60" rx="12" class="r-core"/><text x="160" y="96" class="r-label">AI</text>
   <circle r="4" class="r-pkt"><animateMotion dur="2.4s" repeatCount="indefinite" path="M60 90H260"/></circle>
   <circle r="4" class="r-pkt"><animateMotion dur="2s" repeatCount="indefinite" path="M160 30V150"/></circle></svg>`,
  // 2 sustainability: rotating loop around a leaf
  `<svg viewBox="0 0 320 180"><g class="r-spin"><path d="M160 22a68 68 0 0 1 64 46" class="r-arc"/><path d="M226 112a68 68 0 0 1-64 46" class="r-arc"/><path d="M98 112a68 68 0 0 1 0-44" class="r-arc"/>
   <path d="M218 58l8 12 10-10M168 160l-12-4 6-12M94 60l2 12 12-2" class="r-arrow"/></g>
   <path d="M160 124c-26-14-32-40-14-62 22 6 30 36 14 62z" class="r-leaf"/><path d="M160 124c2-18 6-34 0-52" class="r-vein"/></svg>`,
  // 3 consumers: shoppers and rising bars
  `<svg viewBox="0 0 320 180"><g class="r-people"><circle cx="70" cy="62" r="14"/><path d="M44 120c0-22 12-34 26-34s26 12 26 34"/><circle cx="112" cy="70" r="11"/><path d="M92 120c0-18 9-27 20-27s20 9 20 27"/></g>
   <g class="r-bars"><rect x="176" y="96" width="22" height="40" rx="4"/><rect x="206" y="76" width="22" height="60" rx="4"/><rect x="236" y="52" width="22" height="84" rx="4"/><rect x="266" y="30" width="22" height="106" rx="4"/></g>
   <path d="M168 140h132" class="r-axis"/></svg>`,
  // 4 coordination: partners linked by a contract, parcels flowing
  `<svg viewBox="0 0 320 180"><path d="M60 50L160 90L260 50M60 140L160 90L260 140" class="r-link"/>
   <g class="r-nodes"><circle cx="60" cy="50" r="18"/><circle cx="260" cy="50" r="18"/><circle cx="60" cy="140" r="18"/><circle cx="260" cy="140" r="18"/></g>
   <rect x="138" y="64" width="44" height="54" rx="6" class="r-doc"/><path d="M148 80h24M148 90h24M148 100h14" class="r-docline"/>
   <circle r="4" class="r-pkt"><animateMotion dur="2.2s" repeatCount="indefinite" path="M60 50L160 90L260 140"/></circle>
   <circle r="4" class="r-pkt"><animateMotion dur="2.6s" repeatCount="indefinite" path="M260 50L160 90L60 140"/></circle></svg>`,
];

function renderAbout({ profile: p, research: r }) {
  $("bio").textContent = p.bio;
  const areas = r.interests;
  $("reel-stage").innerHTML = areas.map((a, i) => `
    <div class="reel-slide${i === 0 ? " on" : ""}">${REEL_ART[i % REEL_ART.length]}
      <p class="reel-cap"><strong>${esc(a.title)}</strong>${esc(a.headline || a.description)}</p></div>`).join("");
  $("reel-list").innerHTML = areas.map((a, i) => `
    <li><button class="${i === 0 ? "on" : ""}" data-i="${i}"><span class="n">0${i + 1}</span>${esc(a.title)}<span class="bar"></span></button></li>`).join("");
  const slides = [...document.querySelectorAll(".reel-slide")];
  const btns = [...document.querySelectorAll(".reel-list button")];
  let cur = 0, timer;
  const show = (i) => {
    cur = i;
    slides.forEach((s, k) => s.classList.toggle("on", k === i));
    btns.forEach((b, k) => { b.classList.remove("on"); void b.offsetWidth; b.classList.toggle("on", k === i); });
  };
  const auto = () => { clearInterval(timer); if (!REDUCE) timer = setInterval(() => show((cur + 1) % slides.length), 6000); };
  $("reel-list").onclick = (e) => { const b = e.target.closest("button"); if (b) { show(+b.dataset.i); auto(); } };
  auto();

  const stops = p.journey || [];
  $("journey").innerHTML = `
    <svg class="journey-line" viewBox="0 0 1000 4" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="2" x2="1000" y2="2"/></svg>
    <ol>${stops.map((s, i) => `
      <li class="stop" style="--stagger:${i}"><span class="dot"></span><strong>${esc(s.short)}</strong>
        <span class="place">${esc(s.place)}</span><span class="note">${esc(s.note)}</span></li>`).join("")}</ol>`;
}

// Featured covers ----------------------------------------------------------
const COVER_COLORS = ["#16244a", "#1d5552", "#3a2350", "#6b2d2d", "#1f3a5f", "#3d4a22", "#4a2f14", "#2b2f4f"];

function titleOf(p) {
  if (p.title) return p.title;
  // APA style: "Authors (2025). Title. JOURNAL"
  const apa = p.citation.match(/\(\d{4}\)\.\s*(.+?[.?!])\s/);
  if (apa) return apa[1].replace(/\.$/, "");
  // "Surname, I., I. Surname. Title. Journal, 12(3), 1-20, 2024": the title is the
  // longest sentence that is not the journal (author names split into short pieces)
  const j = (p.journal || "").toLowerCase();
  const segs = p.citation.split(/(?<=[.?!])\s+/).map((s) => s.replace(/\.$/, ""))
    .filter((s) => s.split(" ").length >= 4 && !(j && s.toLowerCase().includes(j)));
  // A question title and its subtitle arrive as two sentences: join them back
  const joined = segs.map((s, i) => (i > 0 && segs[i - 1].endsWith("?") ? `${segs[i - 1]} ${s}` : s));
  return joined.sort((a, b) => b.length - a.length)[0] || p.citation;
}

function renderFeatured({ publications }) {
  const top = publications.filter((p) => !p.hidden && p.category === CATS[0]).sort((a, b) => b.year - a.year).slice(0, 8);
  $("featured-list").innerHTML = top.map((p, i) => `
    <a class="book reveal" style="--stagger:${i % 4}; --c:${COVER_COLORS[i % COVER_COLORS.length]}" ${p.link ? `href="${esc(p.link)}" target="_blank" rel="noopener"` : `href="#publications"`}>
      <span class="book-j">${esc(p.journal)}</span>
      <span class="book-t">${esc(titleOf(p))}</span>
      <span class="book-y">${esc(p.year)}</span>
      <span class="book-read">Read &rarr;</span>
    </a>`).join("");
}

// Research -----------------------------------------------------------------
function matchesArea(p, keywords) {
  const t = p.citation.toLowerCase();
  return keywords.some((k) => {
    const kk = k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(k.length <= 3 ? `\\b${kk}\\b` : `\\b${kk}`).test(t);
  });
}

function renderResearch({ research: r, publications }) {
  const pubs = publications.filter((p) => !p.hidden && p.category !== "Books").sort((a, b) => b.year - a.year);
  $("areas").innerHTML = r.interests.map((a, i) => {
    const mine = pubs.filter((p) => matchesArea(p, a.keywords || []));
    return `<div class="area reveal" style="--stagger:${i}">
      <span class="area-n">0${i + 1}</span>
      <h3>${esc(a.title)}</h3>
      <p class="area-d">${esc(a.description)}</p>
      <p class="area-k">Recent papers <span>${mine.length}</span></p>
      <ul>${mine.slice(0, 4).map((p) => `<li>${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(titleOf(p))}</a>` : esc(titleOf(p))}<small>${esc(p.journal)} · ${p.year}</small></li>`).join("")}</ul>
    </div>`;
  }).join("");
  const [first, ...rest] = r.statement;
  $("statement").innerHTML = `<p>${esc(first)}</p>
    <div class="more" hidden>${rest.map((x) => `<p>${esc(x)}</p>`).join("")}</div>
    ${rest.length ? `<button class="btn ghost" id="read-more">Read the full research statement</button>` : ""}`;
  const btn = $("read-more");
  if (btn) btn.onclick = () => {
    const more = document.querySelector("#statement .more");
    more.hidden = !more.hidden;
    btn.textContent = more.hidden ? "Read the full research statement" : "Show less";
  };
  $("research-figs").innerHTML = r.images.map((x) => figure(x, "fig")).join("");
  $("vision").innerHTML = (r.vision || "").split(" ").map((w) => `<span>${esc(w)}</span>`).join(" ");
  $("vision-band").hidden = !r.vision;
}

function renderNews({ news }) {
  $("news").innerHTML = news.map((n, i) => `
    <article class="news-item reveal" style="--stagger:${i}">
      ${n.image ? `<div class="news-img"><img src="${esc(n.image)}" alt="" loading="lazy"></div>` : ""}
      <div class="news-body">
        <span class="news-date">${esc(n.date)}</span>
        <h3>${n.link ? `<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>` : esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
      </div>
    </article>`).join("");
}

// Publications ---------------------------------------------------------------
const CATS = ["UTD24 / FT50 journals", "Other ABS 4* journals", "Other selected journals", "Books"];
const NAME_RE = /(T\.?\s?-?\s?M\.?,?\s?Choi|TM Choi|Choi,?\s?T\.(?:\s?-?\s?M\.)?|Choi,?\s?T\.?\s?M\.?)/g;
const pubState = { cat: "All", q: "", journal: "", all: false };

function pubHtml(p) {
  let text = esc(p.citation);
  if (p.journal) {
    const i = text.toLowerCase().indexOf(esc(p.journal).toLowerCase());
    if (i >= 0) {
      const j = esc(p.journal).length;
      text = `${text.slice(0, i)}<em class="journal">${text.slice(i, i + j)}</em>${text.slice(i + j)}`;
    }
  }
  text = text.replace(NAME_RE, "<strong>$1</strong>");
  const tag = p.category === CATS[0] ? `<span class="tag top">UTD24 / FT50</span>` : "";
  const fresh = p.added && Date.now() - Date.parse(p.added) < 90 * 864e5 ? `<span class="tag new">New</span>` : "";
  const link = p.link ? ` <a class="doi" href="${esc(p.link)}" target="_blank" rel="noopener">DOI ↗</a>` : "";
  return `<p class="pub">${fresh}${tag}${text}${link}</p>`;
}

function renderPubs(all) {
  const pubs = all.filter((p) => !p.hidden);
  const q = pubState.q.toLowerCase();
  const list = pubs
    .filter((p) => pubState.cat === "All" || p.category === pubState.cat)
    .filter((p) => !pubState.journal || p.journal === pubState.journal)
    .filter((p) => !q || p.citation.toLowerCase().includes(q))
    .sort((a, b) => b.year - a.year);
  const shown = pubState.all || q || pubState.journal ? list : list.slice(0, 12);
  const years = [...new Set(shown.map((p) => p.year))];
  const box = $("pub-list");
  box.classList.remove("swap"); void box.offsetWidth;
  box.innerHTML = years.map((y) => `
    <div class="year-group"><div class="year-label">${y}</div>
      <div>${shown.filter((p) => p.year === y).map(pubHtml).join("")}</div></div>`).join("")
    || `<p class="muted">No publications match your search.</p>`;
  box.classList.add("swap");
  $("pub-count").textContent = `Showing ${shown.length} of ${list.length} publications`;
  $("pub-more").hidden = shown.length === list.length;
}

function setupPubs({ publications: all }) {
  const pubs = all.filter((p) => !p.hidden);
  const byYear = {};
  pubs.forEach((p) => { byYear[p.year] = (byYear[p.year] || 0) + 1; });
  const years = Object.keys(byYear).sort(), max = Math.max(...Object.values(byYear));
  $("pub-chart").innerHTML = `
    <div class="chart-stats">
      <div><strong data-count="${pubs.length}">0</strong><span>listed publications</span></div>
      <div><strong data-count="${pubs.filter((p) => p.category === CATS[0]).length}">0</strong><span>in UTD24 / FT50 journals</span></div>
    </div>
    <div class="bars">${years.map((y, i) => `
      <div class="bar" style="--h:${(byYear[y] / max) * 100}%; --stagger:${i}">
        <span class="bar-val">${byYear[y]}</span><span class="bar-fill"></span><span class="bar-year">${y}</span></div>`).join("")}</div>`;

  const counts = (c) => pubs.filter((p) => c === "All" || p.category === c).length;
  $("pub-tabs").innerHTML = ["All", ...CATS].filter((c) => counts(c)).map((c) =>
    `<button class="tab" role="tab" data-cat="${esc(c)}" aria-selected="${c === "All"}">${esc(c)}<span>${counts(c)}</span></button>`).join("");
  $("pub-tabs").onclick = (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    pubState.cat = b.dataset.cat; pubState.all = false;
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t === b));
    renderPubs(all);
  };
  const journals = [...new Set(pubs.map((p) => p.journal).filter(Boolean))].sort();
  $("pub-journal").innerHTML = `<option value="">All journals</option>` + journals.map((j) => `<option>${esc(j)}</option>`).join("");
  $("pub-journal").onchange = (e) => { pubState.journal = e.target.value; renderPubs(all); };
  $("pub-search").oninput = (e) => { pubState.q = e.target.value.trim(); renderPubs(all); };
  $("pub-more").onclick = () => { pubState.all = true; renderPubs(all); };
  $("pub-sync").innerHTML = `<span class="live-dot"></span>New publications are added automatically from Google Scholar and OpenAlex every week.`;
  renderPubs(all);

  const freq = {};
  pubs.forEach((p) => { if (p.journal) freq[p.journal] = (freq[p.journal] || 0) + 1; });
  const row = Object.keys(freq).sort((a, b) => freq[b] - freq[a])
    .map((j) => `<span class="mq-item">${esc(j)}</span><span class="mq-sep">✦</span>`).join("");
  $("marquee").innerHTML = row + row;
}

// Other sections -------------------------------------------------------------
function renderRest({ team, impact, teaching, service, profile: p }) {
  $("team-groups").innerHTML = team.groups.map((g, gi) => `
    <div class="team-group card reveal" style="--stagger:${gi}"><h3>${esc(g.title)} <span class="count">${g.members.length}</span></h3><ul class="chips">
      ${g.members.map((m) => `<li><span class="ini">${esc(m.name.split(" ").map((w) => w[0]).slice(0, 2).join(""))}</span>${esc(m.name)}${m.note ? `<small>${esc(m.note)}</small>` : ""}</li>`).join("")}
    </ul></div>`).join("");
  const photos = team.photos.map((x) => figure(x)).join("");
  $("team-photos").innerHTML = `<div class="pm-track">${photos}${photos}</div>`;

  $("highlights").innerHTML = impact.highlights.map((h, i) => `<li class="reveal" style="--stagger:${i}">${esc(h)}</li>`).join("");
  $("projects").innerHTML = [...impact.projects].sort((a, b) => b.year - a.year).map((pr) => `
    <li class="project reveal"><span class="yr">${esc(pr.year)}</span>
      <div><h4>${esc(pr.title)}</h4><p>${esc(pr.amount)} · ${esc(pr.funder)}${pr.note ? ` · ${esc(pr.note)}` : ""}</p></div>
      <span class="role ${/^PI/.test(pr.role) ? "pi" : ""}">${esc(pr.role)}</span></li>`).join("");

  $("courses").innerHTML = teaching.courses.map((c, i) => `
    <div class="course reveal" style="--stagger:${i}"><span class="role">${esc(c.level)}</span><h3>${esc(c.title)}</h3></div>`).join("");
  $("teaching-photos").innerHTML = teaching.photos.map((x, i) => figure(x, "reveal", `--stagger:${i % 4}`)).join("");

  $("roles").innerHTML = service.roles.map((r, i) => `<div class="reveal" style="--stagger:${i}"><dt>${esc(r.role)}</dt><dd>${esc(r.detail)}</dd></div>`).join("");
  $("covers").innerHTML = service.images.map((x, i) => figure(x, "reveal", `--stagger:${i}`)).join("");

  $("contact-main").innerHTML = `
    <p class="contact-line"><span>Email</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
    <p class="contact-line"><span>Phone</span>${esc(p.phone)}</p>
    <p class="contact-line"><span>Address</span>${esc(p.address)}</p>
    <div class="link-list">${p.links.map((l) => `<a class="btn outline" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>`;
  $("contact-ids").innerHTML = `<h3>Researcher identifiers</h3><ul>
      ${p.identifiers.map((i) => `<li><span class="muted small">${esc(i.label)}</span><br>${esc(i.value)}</li>`).join("")}</ul>`;
  $("footer-updated").textContent = `© ${new Date().getFullYear()} ${p.name}. Last updated ${p.last_updated}.`;
}

// Interactions -----------------------------------------------------------------
function setupLightbox() {
  const lb = $("lightbox");
  const close = () => { lb.classList.remove("open"); setTimeout(() => (lb.hidden = true), 250); };
  document.addEventListener("click", (e) => {
    const f = e.target.closest("figure[data-full]");
    if (f) {
      lb.querySelector("img").src = f.dataset.full;
      lb.querySelector("figcaption").textContent = f.dataset.caption || "";
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("open"));
    } else if (e.target === lb || e.target.closest(".lb-close")) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) close(); });
}

const SECTIONS = [["top", "Home"], ["about", "About"], ["featured", "Featured"], ["research", "Research"],
  ["publications", "Publications"], ["team", "Team"], ["impact", "Impact"], ["service", "Service"], ["contact", "Contact"]];

function setupNav() {
  const toggle = document.querySelector(".nav-toggle"), nav = $("nav");
  toggle.onclick = () => toggle.setAttribute("aria-expanded", nav.classList.toggle("open"));
  nav.onclick = (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); };

  $("dots").innerHTML = SECTIONS.map(([id, label]) =>
    `<a href="#${id === "top" ? "top" : id}" data-id="${id}"><span class="dot-label">${label}</span></a>`).join("");

  const header = document.querySelector(".site-header"), bar = $("progress"), top = $("to-top");
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 30);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    top.classList.toggle("show", y > innerHeight);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...nav.querySelectorAll("a")], dots = [...$("dots").querySelectorAll("a")];
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const id = en.target.id === "hero" ? "top" : en.target.id;
    links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${id}`));
    const sec = en.target.dataset.section || id;
    dots.forEach((d) => d.classList.toggle("active", d.dataset.id === sec));
    document.dispatchEvent(new CustomEvent("section", { detail: sec }));
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main > section[id]").forEach((s) => spy.observe(s));
}

function countUp(el, dur = 1600) {
  const raw = el.dataset.count, target = parseInt(raw.replace(/,/g, ""), 10);
  if (!target || REDUCE) { el.textContent = raw; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 4))).toLocaleString("en-GB");
    if (k < 1) requestAnimationFrame(step); else el.textContent = raw;
  };
  requestAnimationFrame(step);
}

function setupReveal() {
  const targets = document.querySelectorAll(".reveal, .big-title, .journey, .pub-chart, .sub-title, .eyebrow, .page-head h2");
  if (REDUCE) { targets.forEach((el) => el.classList.add("in")); document.querySelectorAll("[data-count]").forEach((el) => countUp(el)); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    if (en.target.matches("[data-count]")) countUp(en.target);
    en.target.querySelectorAll("[data-count]").forEach((el) => countUp(el));
    io.unobserve(en.target);
  }), { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
}

function setupVision() {
  const words = [...document.querySelectorAll("#vision span")];
  if (!words.length) return;
  if (REDUCE) { words.forEach((w) => w.classList.add("lit")); return; }
  const band = $("vision-band");
  const update = () => {
    const r = band.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const n = Math.round(k * words.length * 1.15);
    words.forEach((w, i) => w.classList.toggle("lit", i < n));
  };
  addEventListener("scroll", update, { passive: true });
  update();
}

function setupTyped({ profile }) {
  const words = profile.tagline_words || [], el = $("typed");
  if (!words.length) return;
  el.innerHTML = words.map((w, i) => `<span class="${i === 0 ? "on" : ""}">${esc(w)}</span>`).join("");
  if (REDUCE || words.length < 2) return;
  const spans = [...el.children];
  let i = 0;
  setInterval(() => {
    const prev = spans[i];
    prev.classList.remove("on"); prev.classList.add("off");
    setTimeout(() => prev.classList.remove("off"), 700);
    i = (i + 1) % spans.length;
    spans[i].classList.add("on");
  }, 2600);
}

// The hero scene leans gently with the pointer (depth layers)
function setupParallax() {
  if (!FINE_POINTER || REDUCE) return;
  const hero = $("hero");
  const layers = [[".window", 10], [".frame", 18], [".board", 14], [".desk", 24], [".plant", 28]]
    .map(([s, d]) => [hero.querySelector(s), d]).filter(([el]) => el);
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach(([el, d]) => (el.style.translate = `${-x * d}px ${-y * d * 0.6}px`));
  });
  hero.addEventListener("pointerleave", () => layers.forEach(([el]) => (el.style.translate = "")));
}

// The courier: a small truck that drives a little and gives a tip per section
function setupGuide({ guide }) {
  if (!guide || !guide.enabled || !(guide.tips || []).length) return;
  const el = $("guide"), bubble = $("guide-bubble"), toggle = $("guide-toggle");
  const tips = Object.fromEntries(guide.tips.map((t) => [t.section, t.text]));
  let hidden = store.get("guide-hidden") === "1";
  const apply = () => {
    el.hidden = hidden;
    toggle.textContent = hidden ? "Show guide" : "Hide guide";
    toggle.classList.toggle("off", hidden);
  };
  toggle.hidden = false;
  toggle.onclick = () => { hidden = !hidden; store.set("guide-hidden", hidden ? "1" : "0"); apply(); };
  apply();
  let last = "", quiet;
  const say = (sec) => {
    const text = tips[sec];
    if (!text || sec === last) return;
    last = sec;
    clearTimeout(quiet);
    el.classList.remove("drive", "talk"); void el.offsetWidth;
    el.classList.add("drive");
    setTimeout(() => { bubble.textContent = text; el.classList.add("talk"); }, REDUCE ? 0 : 650);
    // Let the bubble fade so it never sits on top of the text for long
    quiet = setTimeout(() => el.classList.remove("talk"), 7000);
  };
  // Clicking the truck repeats the current tip
  el.style.pointerEvents = "auto";
  el.querySelector(".guide-truck").addEventListener("click", () => {
    clearTimeout(quiet); el.classList.add("talk");
    quiet = setTimeout(() => el.classList.remove("talk"), 7000);
  });
  document.addEventListener("section", (e) => say(e.detail));
  setTimeout(() => say("top"), 1800);
}

load().then((data) => {
  renderHero(data);
  renderStrip(data);
  renderAbout(data);
  renderFeatured(data);
  renderResearch(data);
  renderNews(data);
  setupPubs(data);
  renderRest(data);
  setupLightbox();
  setupNav();
  setupReveal();
  setupVision();
  setupTyped(data);
  setupParallax();
  setupGuide(data);
  document.body.classList.add("loaded");
}).catch((err) => {
  console.error(err);
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<p class="wrap" style="padding:24px">Content could not be loaded. Open this site through a web server, not as a local file.</p>`);
});
