// Renders every section from the JSON files in /content.
// To change text, edit those files (or use the site editor), not this script.

const FILES = ["profile", "news", "research", "publications", "team", "impact", "teaching", "service"];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = matchMedia("(pointer: fine)").matches;

async function load() {
  const data = {};
  await Promise.all(FILES.map(async (f) => {
    const res = await fetch(`content/${f}.json`, { cache: "no-cache" });
    data[f] = await res.json();
  }));
  return data;
}

function figure(p, cls = "") {
  if (!p || !p.image) return "";
  return `<figure class="${cls}" data-full="${esc(p.image)}" data-caption="${esc(p.caption)}">
    <img src="${esc(p.image)}" alt="${esc(p.caption || "")}" loading="lazy">
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
  </figure>`;
}

// Wraps each letter in a span so the name can rise in letter by letter
function splitLetters(text, start = 0) {
  let i = start;
  return text.split(" ").map((word) => `<span class="word">${[...word].map((ch) =>
    `<span class="ch" style="--i:${i++}">${esc(ch)}</span>`).join("")}</span>`).join(" ");
}

function renderProfile({ profile: p, impact, service }) {
  $("hero-affiliation").textContent = p.affiliation;
  const n = p.name.replace(/\s/g, "").length;
  $("hero-name").innerHTML = `${splitLetters(p.name)} <span class="pref">${splitLetters(`(${p.preferred_name})`, n)}</span>`;
  $("hero-positions").innerHTML = p.positions.map((x, i) => `<li style="--d:${0.9 + i * 0.12}s">${esc(x)}</li>`).join("");
  $("tagline-prefix").textContent = p.tagline_prefix || "";
  $("hero-photo").src = p.photo;
  $("hero-badge").innerHTML = p.badge ? `<span>${esc(p.badge)}</span>` : "";
  $("hero-badge").hidden = !p.badge;
  const scholar = p.links.find((l) => /scholar/i.test(l.label));
  $("hero-actions").innerHTML =
    `<a class="btn gold" href="mailto:${esc(p.email)}">Get in touch</a>` +
    (scholar ? `<a class="btn ghost light" href="${esc(scholar.url)}" target="_blank" rel="noopener">Google Scholar</a>` : "") +
    `<a class="btn ghost light" href="#publications">Publications</a>`;

  $("metrics").innerHTML = impact.metrics.map((m, i) =>
    `<div style="--d:${1.2 + i * 0.1}s"><dt data-count="${esc(m.value)}">0</dt><dd>${esc(m.label)}</dd></div>`).join("");

  $("honours").innerHTML = (p.honours || []).map((h, i) =>
    `<div class="honour reveal" style="--stagger:${i}"><span>${esc(h.role)}</span><strong>${esc(h.outlet)}</strong></div>`).join("");

  $("bio").textContent = p.bio;
  $("about-quick").innerHTML = `<h3>At a glance</h3><ul>
      ${p.positions.map((x) => `<li>${esc(x)}</li>`).join("")}
      <li>${esc(p.affiliation)}</li>
      ${service.roles.slice(0, 2).map((r) => `<li>${esc(r.role)}, <em>${esc(r.detail.split(";")[0])}</em></li>`).join("")}
    </ul>`;

  const stops = p.journey || [];
  $("journey").innerHTML = `
    <svg class="journey-line" viewBox="0 0 1000 4" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="2" x2="1000" y2="2"/></svg>
    <ol>${stops.map((s, i) => `
      <li class="stop" style="--stagger:${i}">
        <span class="dot"></span>
        <strong>${esc(s.short)}</strong>
        <span class="place">${esc(s.place)}</span>
        <span class="note">${esc(s.note)}</span>
      </li>`).join("")}</ol>`;

  $("contact-main").innerHTML = `
    <p class="contact-line"><span>Email</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
    <p class="contact-line"><span>Phone</span>${esc(p.phone)}</p>
    <p class="contact-line"><span>Address</span>${esc(p.address)}</p>
    <div class="link-list">${p.links.map((l) => `<a class="btn ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>`;
  $("contact-ids").innerHTML = `<h3>Researcher identifiers</h3><ul>
      ${p.identifiers.map((i) => `<li><span class="muted small">${esc(i.label)}</span><br>${esc(i.value)}</li>`).join("")}
    </ul>`;
  $("footer-updated").textContent = `© ${new Date().getFullYear()} ${p.name}. Last updated ${p.last_updated}.`;
}

function renderNews({ news }) {
  $("news").innerHTML = news.map((n, i) => `
    <article class="news-item reveal tilt" style="--stagger:${i}">
      ${n.image ? `<div class="news-img"><img src="${esc(n.image)}" alt="" loading="lazy"></div>` : ""}
      <div class="news-body">
        <span class="news-date">${esc(n.date)}</span>
        <h3>${n.link ? `<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>` : esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
      </div>
    </article>`).join("");
}

const ICONS = [
  // chip: disruptive technologies
  `<svg viewBox="0 0 48 48"><rect x="12" y="12" width="24" height="24" rx="4"/><rect x="19" y="19" width="10" height="10" rx="1"/><path d="M18 6v6M24 6v6M30 6v6M18 36v6M24 36v6M30 36v6M6 18h6M6 24h6M6 30h6M36 18h6M36 24h6M36 30h6"/></svg>`,
  // circular arrows: sustainability
  `<svg viewBox="0 0 48 48"><path d="M38 20a15 15 0 0 0-27-5"/><path d="M10 28a15 15 0 0 0 27 5"/><path d="M11 7v8h8M37 41v-8h-8"/><path d="M24 31c-4-3-6-6-6-9a6 6 0 0 1 12 0c0 3-2 6-6 9z"/></svg>`,
  // people + cart: operations-marketing
  `<svg viewBox="0 0 48 48"><circle cx="17" cy="13" r="5"/><path d="M8 30c0-6 4-9 9-9s9 3 9 9"/><path d="M27 24h4l3 12h9l3-9H33"/><circle cx="35" cy="40" r="2"/><circle cx="43" cy="40" r="2"/></svg>`,
  // network: coordination
  `<svg viewBox="0 0 48 48"><circle cx="10" cy="24" r="5"/><circle cx="38" cy="10" r="5"/><circle cx="38" cy="38" r="5"/><circle cx="26" cy="24" r="3"/><path d="M15 24h8M28 22l6-9M28 26l6 9"/></svg>`,
];

function renderResearch({ research: r }) {
  $("interests").innerHTML = r.interests.map((x, i) => `
    <div class="interest reveal tilt" style="--stagger:${i}">
      <div class="icon">${ICONS[i % ICONS.length]}</div>
      <span class="num">0${i + 1}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>
    </div>`).join("");
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

// Publications ---------------------------------------------------------
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
  const LIMIT = 12;
  const shown = pubState.all || q || pubState.journal ? list : list.slice(0, LIMIT);
  const years = [...new Set(shown.map((p) => p.year))];
  const box = $("pub-list");
  box.classList.remove("swap");
  void box.offsetWidth; // restart the fade-in
  box.innerHTML = years.map((y) => `
    <div class="year-group"><div class="year-label">${y}</div>
      <div>${shown.filter((p) => p.year === y).map(pubHtml).join("")}</div></div>`).join("")
    || `<p class="muted">No publications match your search.</p>`;
  box.classList.add("swap");
  $("pub-count").textContent = `Showing ${shown.length} of ${list.length} publications`;
  $("pub-more").hidden = shown.length === list.length;
}

function renderPubChart(pubs) {
  const byYear = {};
  pubs.forEach((p) => { byYear[p.year] = (byYear[p.year] || 0) + 1; });
  const years = Object.keys(byYear).sort();
  const max = Math.max(...Object.values(byYear));
  const top = pubs.filter((p) => p.category === CATS[0]).length;
  $("pub-chart").innerHTML = `
    <div class="chart-stats">
      <div><strong data-count="${pubs.length}">0</strong><span>listed publications</span></div>
      <div><strong data-count="${top}">0</strong><span>in UTD24 / FT50 journals</span></div>
    </div>
    <div class="bars">${years.map((y, i) => `
      <div class="bar" style="--h:${(byYear[y] / max) * 100}%; --stagger:${i}">
        <span class="bar-val">${byYear[y]}</span><span class="bar-fill"></span><span class="bar-year">${y}</span>
      </div>`).join("")}</div>`;
}

function setupPubs({ publications: all }) {
  const pubs = all.filter((p) => !p.hidden);
  renderPubChart(pubs);
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

  // Journal marquee, most frequent first; it grows as new papers arrive
  const freq = {};
  pubs.forEach((p) => { if (p.journal) freq[p.journal] = (freq[p.journal] || 0) + 1; });
  const names = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const row = names.map((j) => `<span class="mq-item">${esc(j)}</span><span class="mq-sep">✦</span>`).join("");
  $("marquee").innerHTML = row + row;
}

// Other sections -------------------------------------------------------
function renderTeam({ team }) {
  $("team-groups").innerHTML = team.groups.map((g, gi) => `
    <div class="team-group card reveal" style="--stagger:${gi}"><h3>${esc(g.title)} <span class="count">${g.members.length}</span></h3><ul class="chips">
      ${g.members.map((m, i) => `<li style="--i:${i}">${esc(m.name)}${m.note ? `<small>${esc(m.note)}</small>` : ""}</li>`).join("")}
    </ul></div>`).join("");
  const photos = team.photos.map((x) => figure(x)).join("");
  $("team-photos").innerHTML = `<div class="pm-track">${photos}${photos}</div>`;
}

function renderImpact({ impact }) {
  $("highlights").innerHTML = impact.highlights.map((h, i) => `<li class="reveal" style="--stagger:${i}">${esc(h)}</li>`).join("");
  $("projects").innerHTML = [...impact.projects].sort((a, b) => b.year - a.year).map((p) => `
    <li class="project reveal"><span class="yr">${esc(p.year)}</span>
      <div><h4>${esc(p.title)}</h4><p>${esc(p.amount)} · ${esc(p.funder)}${p.note ? ` · ${esc(p.note)}` : ""}</p></div>
      <span class="role ${/^PI/.test(p.role) ? "pi" : ""}">${esc(p.role)}</span></li>`).join("");
}

function renderTeaching({ teaching }) {
  $("courses").innerHTML = teaching.courses.map((c, i) => `
    <div class="course reveal tilt" style="--stagger:${i}"><h3>${esc(c.title)}</h3><span class="role">${esc(c.level)}</span></div>`).join("");
  $("teaching-photos").innerHTML = teaching.photos.map((x, i) => figure({ ...x }, `reveal`).replace("<figure ", `<figure style="--stagger:${i % 4}" `)).join("");
}

function renderService({ service }) {
  $("roles").innerHTML = service.roles.map((r, i) => `<div class="reveal" style="--stagger:${i}"><dt>${esc(r.role)}</dt><dd>${esc(r.detail)}</dd></div>`).join("");
  $("covers").innerHTML = service.images.map((x, i) => figure(x, "cover reveal").replace("<figure ", `<figure style="--stagger:${i}" `)).join("");
}

// Interactions ---------------------------------------------------------
function setupLightbox() {
  const lb = $("lightbox");
  document.addEventListener("click", (e) => {
    const f = e.target.closest("figure[data-full]");
    if (f) {
      lb.querySelector("img").src = f.dataset.full;
      lb.querySelector("figcaption").textContent = f.dataset.caption || "";
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("open"));
    } else if (e.target === lb || e.target.closest(".lb-close")) {
      lb.classList.remove("open"); setTimeout(() => (lb.hidden = true), 250);
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { lb.classList.remove("open"); lb.hidden = true; } });
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = $("nav");
  toggle.onclick = () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  };
  nav.onclick = (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); };
  const header = document.querySelector(".site-header");
  const bar = $("progress"), top = $("to-top");
  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 40);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    top.classList.toggle("show", y > innerHeight);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const links = [...nav.querySelectorAll("a")];
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${en.target.id}`));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const s = document.querySelector(l.getAttribute("href")); if (s) spy.observe(s); });
}

function countUp(el, dur = 1600) {
  const raw = el.dataset.count;
  const target = parseInt(raw.replace(/,/g, ""), 10);
  if (!target || REDUCE) { el.textContent = raw; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 4)));
    el.textContent = v.toLocaleString("en-GB");
    if (k < 1) requestAnimationFrame(step); else el.textContent = raw;
  };
  requestAnimationFrame(step);
}

function setupReveal() {
  const targets = document.querySelectorAll(".reveal, .section-title, .journey, .pub-chart, .sub-title");
  if (REDUCE) { targets.forEach((el) => el.classList.add("in")); document.querySelectorAll("[data-count]").forEach((el) => countUp(el)); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    en.target.querySelectorAll("[data-count]").forEach((el) => countUp(el));
    io.unobserve(en.target);
  }), { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
  // Hero numbers start after the intro animation
  setTimeout(() => document.querySelectorAll("#metrics [data-count]").forEach((el) => countUp(el, 2000)), 1100);
}

// Words of the vision statement light up as it scrolls through the screen
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

// Cycles through the hero words with a soft fade and rise
function setupTyped({ profile }) {
  const words = profile.tagline_words || [];
  const el = $("typed");
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

// Cards lean toward the pointer; a soft light follows it
function setupPointerEffects() {
  if (!FINE_POINTER || REDUCE) return;
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".tilt");
    document.querySelectorAll(".tilt.tilting").forEach((t) => { if (t !== card) { t.classList.remove("tilting"); t.style.transform = ""; } });
    if (card) {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add("tilting");
      card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 4}deg) translateY(-3px)`;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    }
  });

  const portrait = $("portrait");
  const hero = $("hero");
  const glow = $("cursor-glow");
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    portrait.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg)`;
    glow.style.opacity = 1;
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
  hero.addEventListener("pointerleave", () => { portrait.style.transform = ""; glow.style.opacity = 0; });
}

// Supply-chain network in the hero: drifting nodes, glowing parcels travelling
// along the links, and links that reach out to the pointer.
function heroNetwork() {
  const c = $("hero-net"), ctx = c.getContext("2d");
  const hero = $("hero");
  let w, h, nodes = [], parcels = [], mouse = null, visible = true;
  const resize = () => {
    const r = Math.min(devicePixelRatio || 1, 2);
    w = c.offsetWidth; h = c.offsetHeight;
    c.width = w * r; c.height = h * r; ctx.setTransform(r, 0, 0, r, 0, 0);
    const n = Math.round(Math.min(85, w * h / 13000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.8 + .8, hub: Math.random() < .12, p: Math.random() * Math.PI * 2,
    }));
    parcels = [];
  };
  const LINK = 150;
  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          links.push([a, b]);
          ctx.strokeStyle = `rgba(214, 178, 106, ${0.2 * (1 - d / LINK)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse) {
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (d < 200) {
          ctx.strokeStyle = `rgba(120, 220, 210, ${0.35 * (1 - d / 200)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          a.x += (mouse.x - a.x) * 0.002; a.y += (mouse.y - a.y) * 0.002;
        }
      }
    }
    // Spawn parcels on random links
    if (!REDUCE && links.length && parcels.length < 22 && Math.random() < 0.18) {
      const [a, b] = links[(Math.random() * links.length) | 0];
      parcels.push(Math.random() < .5 ? { a, b, k: 0 } : { a: b, b: a, k: 0 });
    }
    parcels = parcels.filter((pc) => {
      pc.k += 0.012;
      const x = pc.a.x + (pc.b.x - pc.a.x) * pc.k, y = pc.a.y + (pc.b.y - pc.a.y) * pc.k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, "rgba(255, 226, 160, .95)"); g.addColorStop(1, "rgba(255, 226, 160, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      return pc.k < 1;
    });
    for (const a of nodes) {
      const pulse = a.hub ? 1 + Math.sin(t / 600 + a.p) * .5 : 1;
      if (a.hub) {
        ctx.strokeStyle = `rgba(120, 220, 210, ${0.25 + 0.15 * Math.sin(t / 600 + a.p)})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, 6 * pulse + 3, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = a.hub ? "rgba(140, 230, 220, .9)" : "rgba(240, 222, 180, .75)";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.hub ? a.r + 1.5 : a.r, 0, Math.PI * 2); ctx.fill();
      if (!REDUCE) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
    }
    if (!REDUCE && visible) requestAnimationFrame(draw);
  };
  resize(); requestAnimationFrame(draw);
  addEventListener("resize", () => { resize(); if (REDUCE) requestAnimationFrame(draw); });
  hero.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  hero.addEventListener("pointerleave", () => (mouse = null));
  // Pause the animation while the hero is off screen
  new IntersectionObserver(([en]) => {
    const was = visible; visible = en.isIntersecting;
    if (visible && !was && !REDUCE) requestAnimationFrame(draw);
  }).observe(hero);
}

load().then((data) => {
  renderProfile(data);
  renderNews(data);
  renderResearch(data);
  setupPubs(data);
  renderTeam(data);
  renderImpact(data);
  renderTeaching(data);
  renderService(data);
  setupLightbox();
  setupNav();
  setupReveal();
  setupVision();
  setupTyped(data);
  setupPointerEffects();
  heroNetwork();
  document.body.classList.add("loaded");
}).catch((err) => {
  console.error(err);
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<p class="wrap" style="padding:24px">Content could not be loaded. Open this site through a web server, not as a local file.</p>`);
});
