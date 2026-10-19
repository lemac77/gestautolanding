// Interazioni della landing GestAuto: anteprime, generatore contratti,
// calcolatore, filtri del sito demo, FAQ e form di richiesta demo.
import "./fonts";

type Car = {
  name: string;
  year: string;
  km: string;
  plate: string;
  price: string;
  fuel: "Benzina" | "Diesel" | "Ibrida" | "Elettrica";
  status: "Online" | "Venduta" | "Bozza";
  tone: string;
  img?: string;
};

// Parco auto della demo Berica Motori: stessi dati e stesse foto del seed
// in lemac77/motori (gestionale/sql/demo-setup.sql, brand/auto-demo/).
const CARS: Car[] = [
  { name: "Volkswagen Golf 1.5 eTSI Life", year: "03/2022", km: "34.100 km", plate: "GA 123 BM", price: "€ 24.900", fuel: "Ibrida", status: "Online", tone: "#8E9298", img: "/auto/auto-01.webp" },
  { name: "Jeep Compass 4xe Limited", year: "06/2021", km: "41.200 km", plate: "GB 456 BM", price: "€ 27.900", fuel: "Ibrida", status: "Online", tone: "#D9D6CE", img: "/auto/auto-02.webp" },
  { name: "Fiat 500e Icon", year: "09/2023", km: "14.500 km", plate: "GE 789 BM", price: "€ 18.900", fuel: "Elettrica", status: "Online", tone: "#7FA7C9", img: "/auto/auto-03.webp" },
  { name: "Audi A3 Sportback 30 TDI S line", year: "04/2021", km: "58.000 km", plate: "GC 321 BM", price: "€ 25.900", fuel: "Diesel", status: "Online", tone: "#2B2E33", img: "/auto/auto-04.webp" },
  { name: "Toyota Yaris Cross Hybrid Lounge", year: "02/2023", km: "18.200 km", plate: "GF 654 BM", price: "€ 23.900", fuel: "Ibrida", status: "Online", tone: "#8F1D17", img: "/auto/auto-05.webp" },
  { name: "Peugeot 2008 PureTech Allure Pack", year: "05/2022", km: "29.400 km", plate: "GD 987 BM", price: "€ 20.500", fuel: "Benzina", status: "Online", tone: "#6E7277", img: "/auto/auto-06.webp" },
  { name: "Mercedes-Benz Classe A 180 d Sport", year: "10/2021", km: "52.000 km", plate: "GA 555 BM", price: "€ 28.900", fuel: "Diesel", status: "Online", tone: "#B8BCC2", img: "/auto/auto-07.webp" },
  { name: "Alfa Romeo Giulia 2.2 Veloce", year: "07/2022", km: "43.500 km", plate: "GB 222 BM", price: "€ 34.900", fuel: "Diesel", status: "Bozza", tone: "#8F1D17", img: "/auto/auto-08.webp" },
];

const DOCS = ["Contratto vendita", "Contratto acquisto", "Certificato conformità", "Scheda permuta"];

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function paint(node: HTMLElement, car: Car) {
  node.style.backgroundColor = car.tone;
  if (car.img) node.style.backgroundImage = `url("${car.img}")`;
}

const year = (c: Car) => c.year.split("/")[1];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

/* ---------- Generatore contratti: anteprima live + PDF vero ---------- */
type Doc = { title: string; num: string; fields: [string, string][]; body: string; sign: [string, string] };

const TODAY = new Date().toLocaleDateString("it-IT");
const BRAND_LINE = "Berica Motori · Autosalone dimostrativo";
const FOOT = "Fac-simile dimostrativo generato da GestAuto. Non ha valore legale.";

function buildDoc(car: Car, docIdx: number, n: number): Doc {
  const base: [string, string][] = [
    ["Veicolo", car.name],
    ["Targa", car.plate],
    ["Immatricolazione", car.year],
    ["Chilometri", car.km],
    ["Cliente", "Mario Rossi"],
    ["Importo", car.price],
  ];
  const num = `N. 2026/${String(n).padStart(3, "0")}`;
  switch (docIdx) {
    case 1:
      base[4] = ["Venditore", "Mario Rossi"];
      base[5] = ["Prezzo di acquisto", car.price];
      return { title: "Contratto di acquisto", num, fields: base, sign: ["L'acquirente", "Il venditore"], body: "Berica Motori acquista dal venditore il veicolo sopra descritto, nello stato in cui si trova, al prezzo concordato. Il venditore dichiara di esserne il legittimo proprietario e che il veicolo è libero da gravami." };
    case 2:
      base[5] = ["Data di consegna", TODAY];
      return { title: "Certificato di conformità", num, fields: base, sign: ["Il responsabile", "Per ricevuta"], body: "Si attesta che il veicolo descritto è stato consegnato in conformità alle caratteristiche riportate nella scheda e nella documentazione allegata, dopo i controlli previsti prima della consegna." };
    case 3:
      base[5] = ["Valutazione permuta", "€ 3.200"];
      return { title: "Scheda permuta", num, fields: base, sign: ["Il venditore", "Il cliente"], body: "Il veicolo ritirato in permuta (Fiat Punto 1.2 Street, 2014, 98.000 km) viene valutato e dedotto dal prezzo del veicolo acquistato. La valutazione è soggetta a verifica dello stato effettivo al momento del ritiro." };
    default:
      return { title: "Contratto di vendita", num, fields: base, sign: ["Il venditore", "L'acquirente"], body: "Il venditore cede all'acquirente il veicolo sopra descritto, nello stato in cui si trova e con i chilometri indicati, al prezzo concordato. La consegna avviene alla firma del presente contratto. Il veicolo è coperto da garanzia di 12 mesi secondo le condizioni allegate." };
  }
}

// Piccolo scrittore di PDF: una pagina A4, font standard Helvetica, nessuna libreria.
function winAnsi(s: string): string {
  let out = "";
  for (const ch of s) {
    let c = ch.codePointAt(0)!;
    if (ch === "€") c = 0x80;
    else if (ch === "’" || ch === "‘") c = 0x27;
    else if (ch === "“" || ch === "”") c = 0x22;
    else if (ch === "–" || ch === "—") c = 0x2d;
    else if (c > 255) c = 0x3f;
    if (c === 0x28 || c === 0x29 || c === 0x5c) out += "\\" + String.fromCharCode(c);
    else if (c < 32 || c > 126) out += "\\" + c.toString(8).padStart(3, "0");
    else out += String.fromCharCode(c);
  }
  return out;
}

function wrapText(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if ((line + " " + w).trim().length > max) { lines.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function makePdf(d: Doc): Blob {
  const INK = "0.07 0.07 0.09";
  const GRAY = "0.38 0.40 0.44";
  const ops: string[] = [];
  const text = (x: number, y: number, size: number, t: string, color = INK, bold = false) =>
    ops.push(`${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${winAnsi(t)}) Tj ET`);
  const rect = (x: number, y: number, w: number, h: number, color: string) => ops.push(`${color} rg ${x} ${y} ${w} ${h} re f`);

  rect(0, 832, 595, 10, "0.843 0.149 0.118");
  text(50, 790, 9, BRAND_LINE, GRAY);
  text(50, 760, 22, d.title, INK, true);
  text(405, 790, 10, d.num, INK, true);
  rect(50, 742, 495, 1.4, INK);

  d.fields.forEach(([label, value], i) => {
    const x = 50 + (i % 2) * 260;
    const y = 705 - Math.floor(i / 2) * 44;
    text(x, y, 8, label.toUpperCase(), GRAY);
    text(x, y - 15, 12, value, INK, true);
  });

  let y = 545;
  for (const line of wrapText(d.body, 88)) { text(50, y, 11, line); y -= 17; }

  rect(50, 200, 200, 0.8, INK);
  rect(310, 200, 200, 0.8, INK);
  text(50, 186, 9, d.sign[0], GRAY);
  text(310, 186, 9, d.sign[1], GRAY);
  text(50, 60, 8, FOOT, GRAY);

  const content = ops.join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function initGenerator() {
  const cars = [CARS[0], CARS[4], CARS[6]];
  let carIdx = 0;
  let docIdx = 0;
  let counter = 41;
  let generated: Doc | null = null;
  let busy = false;

  const carBox = $("gen-cars");
  const docBox = $("gen-docs");
  const paper = $("gen-paper");
  const goBtn = $<HTMLButtonElement>("gen-go");
  const dlBtn = $<HTMLButtonElement>("gen-dl");
  const status = $("gen-status");
  const IDLE = "L'anteprima del documento si aggiorna mentre scegli.";

  const carBtns = cars.map((car, i) => {
    const b = el("button", { type: "button", class: "car-opt", "aria-pressed": String(i === 0) });
    const thumb = el("span", { class: "thumb", "aria-hidden": "true" });
    paint(thumb, car);
    const t = el("span", { class: "t" });
    t.append(el("strong", {}, car.name), el("span", {}, `${car.year} · ${car.km}`));
    b.append(thumb, t, el("span", { class: "p" }, car.price));
    b.addEventListener("click", () => { carIdx = i; changed(); });
    carBox.append(b);
    return b;
  });
  const docBtns = ["Contratto vendita", "Contratto acquisto", "Certificato conformità", "Scheda permuta"].map((d, i) => {
    const b = el("button", { type: "button", class: "doc-opt", "aria-pressed": String(i === 0) }, d);
    b.addEventListener("click", () => { docIdx = i; changed(); });
    docBox.append(b);
    return b;
  });

  function draw(state: "draft" | "done") {
    const d = generated && state === "done" ? generated : buildDoc(cars[carIdx], docIdx, counter + 1);
    const fields = d.fields.map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join("");
    paper.innerHTML = `
      <div class="paper-top"></div>
      <div class="paper-head">
        <div><div class="paper-brand">${esc(BRAND_LINE)}</div><div class="paper-title">${esc(d.title)}</div></div>
        <div class="paper-num${state === "draft" ? " is-draft" : ""}">${state === "draft" ? "Bozza" : esc(d.num)}</div>
      </div>
      <dl class="paper-fields">${fields}</dl>
      <p class="paper-body">${esc(d.body)}</p>
      <div class="paper-sub">Condizioni generali</div>
      <div class="paper-lines" aria-hidden="true"><span></span><span style="width:94%"></span><span style="width:88%"></span><span style="width:96%"></span><span style="width:62%"></span></div>
      <div class="paper-sign"><span>${esc(d.sign[0])}</span><span>${esc(d.sign[1])}</span></div>
      <div class="paper-foot">${esc(FOOT)}</div>
      <div class="paper-stamp" aria-hidden="true">Generato</div>`;
    paper.classList.toggle("is-done", state === "done");
  }

  function changed() {
    carBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === carIdx)));
    docBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === docIdx)));
    generated = null;
    dlBtn.hidden = true;
    status.textContent = IDLE;
    status.classList.remove("is-ok");
    paper.classList.add("is-swap");
    window.setTimeout(() => { draw("draft"); paper.classList.remove("is-swap"); }, reduceMotion ? 0 : 160);
  }

  goBtn.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    goBtn.disabled = true;
    goBtn.replaceChildren(el("span", { class: "spinner", "aria-hidden": "true" }), document.createTextNode("Generazione in corso…"));
    paper.classList.add("is-busy");
    status.classList.remove("is-ok");
    status.textContent = "Recupero i dati dalla scheda dell'auto…";
    window.setTimeout(() => {
      counter += 1;
      generated = buildDoc(cars[carIdx], docIdx, counter);
      paper.classList.remove("is-busy");
      draw("done");
      goBtn.disabled = false;
      goBtn.textContent = "Rigenera il documento";
      dlBtn.hidden = false;
      status.textContent = `Fatto: ${generated.title}, ${generated.num}. Pronto da scaricare.`;
      status.classList.add("is-ok");
      busy = false;
    }, reduceMotion ? 0 : 1100);
  });

  dlBtn.addEventListener("click", () => {
    if (!generated) return;
    const url = URL.createObjectURL(makePdf(generated));
    const a = el("a", { href: url, download: `${generated.title} ${cars[carIdx].plate}.pdf` });
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  draw("draft");
}

/* ---------- Calcolatore ---------- */
function initCalculator() {
  const sold = $<HTMLInputElement>("r-sold");
  const now = $<HTMLInputElement>("r-now");
  const WITH_GESTAUTO = 5; // minuti per pratica con GestAuto: valore fisso di riferimento
  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("it-IT");
  const shown = new Map<string, { value: number; token: number }>();

  function tween(id: string, to: number, format: (n: number) => string) {
    const node = $(id);
    const prev = shown.get(id);
    const token = (prev?.token ?? 0) + 1;
    const from = prev?.value ?? to;
    shown.set(id, { value: to, token });
    if (reduceMotion || from === to) { node.textContent = format(to); return; }
    const t0 = performance.now();
    const step = (t: number) => {
      if (shown.get(id)?.token !== token) return;
      const k = Math.min(1, (t - t0) / 520);
      node.textContent = format(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const update = () => {
    const s = Number(sold.value);
    const a = Number(now.value);
    const b = Math.min(WITH_GESTAUTO, a);
    const nowH = (s * a) / 60;
    const withH = (s * b) / 60;
    const saved = nowH - withH;
    [sold, now].forEach((r) => {
      const pct = ((Number(r.value) - Number(r.min)) / (Number(r.max) - Number(r.min))) * 100;
      r.style.setProperty("--fill", `${pct}%`);
    });
    $("o-sold").textContent = `${s} auto`;
    $("o-now").textContent = `${a} min`;

    const inMinutes = saved < 1;
    $("c-unit").textContent = inMinutes ? "minuti" : "ore";
    tween("c-month", inMinutes ? Math.round(saved * 60) : saved, (n) => (inMinutes ? String(Math.round(n)) : fmt(n)));
    tween("c-days", (saved * 12) / 8, fmt);
    $("b-now-t").textContent = `${fmt(nowH)} ore / mese`;
    $("b-with-t").textContent = `${fmt(withH)} ore / mese`;
    $("b-now").style.width = "100%";
    $("b-with").style.width = `${a > 0 ? (b / a) * 100 : 0}%`;
    $("c-formula").textContent = `${s} auto × (${a} − ${b}) min = ${(s * (a - b)).toLocaleString("it-IT")} min = ${fmt(saved)} ore al mese. Giornate lavorative calcolate su 8 ore.`;
  };
  [sold, now].forEach((r) => r.addEventListener("input", update));
  update();
}

/* ---------- Visualizzatore del sito vero ---------- */
const SITE = "https://sito.gestauto.studiobrillo.com";
const SITE_PAGES = {
  home: { path: "/", label: "Home page", h: { desk: 7230, mob: 16000 } },
  parco: { path: "/parco-auto", label: "Pagina del parco auto", h: { desk: 2283, mob: 11720 } },
  scheda: { path: "/parco-auto/00000000-0000-4000-8000-000000000001", label: "Scheda della Volkswagen Golf", h: { desk: 3492, mob: 12406 } },
} as const;
type SitePage = keyof typeof SITE_PAGES;
type Device = "desk" | "mob";

function initViewer() {
  const frame = $("viewer-frame");
  const scroll = $("viewer-scroll");
  const url = $("viewer-url");
  const hint = $("viewer-hint");
  const liveBtn = $<HTMLButtonElement>("viewer-live");
  const pageBtns = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-page]"));
  const devBtns = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-device]"));
  let page: SitePage = "home";
  let device: Device = "desk";
  let live = false;

  scroll.addEventListener("scroll", () => hint.classList.add("is-gone"), { passive: true });

  function render() {
    const info = SITE_PAGES[page];
    pageBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.page === page)));
    devBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === device)));
    liveBtn.setAttribute("aria-pressed", String(live));
    liveBtn.textContent = live ? "Torna alle schermate" : "Naviga dal vivo";
    frame.dataset.device = device;
    url.textContent = "bericamotori.it" + (info.path === "/" ? "" : info.path.replace(/\/0+-.*$/, "/volkswagen-golf"));

    if (live) {
      const iframe = el("iframe", {
        src: SITE + info.path,
        title: "Sito demo Berica Motori, navigabile",
        loading: "lazy",
        referrerpolicy: "no-referrer",
      });
      scroll.replaceChildren(iframe);
      hint.classList.add("is-gone");
      return;
    }
    const img = el("img", {
      src: `/sito/${device}-${page}.webp`,
      width: device === "desk" ? "1280" : "780",
      height: String(info.h[device]),
      alt: `${info.label} del sito Berica Motori, versione ${device === "desk" ? "desktop" : "smartphone"}`,
      decoding: "async",
    });
    scroll.replaceChildren(img);
    scroll.scrollTop = 0;
    hint.classList.remove("is-gone");
  }

  pageBtns.forEach((b) => b.addEventListener("click", () => { page = b.dataset.page as SitePage; render(); }));
  devBtns.forEach((b) => b.addEventListener("click", () => { device = b.dataset.device as Device; render(); }));
  liveBtn.addEventListener("click", () => { live = !live; render(); });
}

/* ---------- FAQ con apertura morbida ---------- */
function initFaq() {
  document.querySelectorAll<HTMLButtonElement>(".faq-q").forEach((btn) => {
    const answer = $(btn.getAttribute("aria-controls")!);
    const body = el("div", { class: "faq-body" });
    answer.before(body);
    body.append(answer);
    answer.hidden = false;
    const startOpen = btn.getAttribute("aria-expanded") === "true";
    body.classList.toggle("open", startOpen);
    if (!startOpen) body.setAttribute("inert", "");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      body.classList.toggle("open", !open);
      body.toggleAttribute("inert", open);
    });
  });
}

/* ---------- Parole che entrano una a una ---------- */
function splitWords(root: HTMLElement) {
  let i = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of (child.textContent ?? "").split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) frag.append(document.createTextNode(" "));
          else {
            const w = el("span", { class: "w" }, part);
            w.style.setProperty("--i", String(i++));
            frag.append(w);
          }
        }
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName !== "BR") {
        walk(child);
      }
    }
  };
  walk(root);
  root.classList.add("is-split");
}

/* ---------- Hero: tab che ruotano, finestra che si raddrizza ---------- */
function initShowcase() {
  const root = document.getElementById("showcase");
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".show-tab"));
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>(".show-views img"));
  const url = $("show-url");
  const URLS = ["gestionale · Berica Motori", "gestionale · Berica Motori · Vendite", "gestionale · Berica Motori · Richieste", "bericamotori.it"];
  const DUR = 5500;
  let cur = 0;
  let timer = 0;
  let paused = false;

  function schedule() {
    window.clearTimeout(timer);
    if (!paused) timer = window.setTimeout(() => show((cur + 1) % tabs.length), DUR);
  }
  function show(i: number) {
    cur = i;
    tabs.forEach((t, k) => {
      t.classList.toggle("is-active", k === i);
      t.classList.remove("is-timing");
      t.setAttribute("aria-selected", String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    imgs.forEach((m, k) => {
      m.classList.toggle("is-on", k === i);
      m.setAttribute("aria-hidden", String(k !== i));
    });
    url.textContent = URLS[i];
    void tabs[i].offsetWidth;
    if (!paused) tabs[i].classList.add("is-timing");
    schedule();
  }
  tabs.forEach((t, k) => t.addEventListener("click", () => show(k)));
  root.addEventListener("pointerenter", () => { paused = true; window.clearTimeout(timer); tabs[cur].classList.remove("is-timing"); });
  root.addEventListener("pointerleave", () => { paused = false; show(cur); });
  show(0);
}

function initHeroMotion() {
  const hero = document.getElementById("hero");
  const frame = document.getElementById("show-frame");
  if (!hero || !frame) return;
  let queued = false;
  const apply = () => {
    queued = false;
    const y = window.scrollY;
    const p = Math.min(1, y / 420);
    frame.style.setProperty("--rx", `${reduceMotion ? 0 : 12 * (1 - p)}deg`);
    frame.style.setProperty("--sc", String(reduceMotion ? 1 : 0.93 + 0.07 * p));
    hero.style.setProperty("--sy", String(y));
  };
  apply();
  window.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(apply); } }, { passive: true });
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--hx", `${e.clientX - r.left}px`);
    hero.style.setProperty("--hy", `${e.clientY - r.top}px`);
  }, { passive: true });
}

function countUp(node: HTMLElement) {
  const to = Number(node.dataset.count);
  if (!to) return;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 1400);
    node.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  node.textContent = "0";
  requestAnimationFrame(step);
}

/* ---------- Effetti: nav, comparsa allo scroll, luce sulle card ---------- */
function initUi() {
  const nav = document.querySelector<HTMLElement>(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.querySelectorAll<HTMLElement>(".feature, .tile, .pack-card, .flow li, .link-card, .plan-life, .next-card").forEach((c) => c.classList.add("spot"));
  document.addEventListener("pointermove", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".spot");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  // Titolo dell'hero: parola per parola, subito
  const h1 = document.querySelector<HTMLElement>(".hero .h1");
  if (h1) {
    splitWords(h1);
    h1.style.setProperty("--base", "120ms");
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add("in-view")));
  }

  const titles = Array.from(document.querySelectorAll<HTMLElement>("main .h2"));
  titles.forEach((t) => splitWords(t));

  const targets = document.querySelectorAll<HTMLElement>(
    ".section-head > :not(.h2), .block-title, .chips li, .site-note, .viewer, .pack-card, .flow li, .pack-note, .tile, .gen-panel, .gen-out, .range, .fixed-row, .calc-out, .stat, .feature, .next-card, .cmp-head, .cmp-row, .steps li, .demo-copy > :not(.h2):not(.section-head), .form-card, .plan, .card-dark, .legal, .faq-item, .cta-box > :not(.h2)",
  );
  if (!("IntersectionObserver" in window)) {
    titles.forEach((t) => t.classList.add("in-view"));
    document.querySelectorAll(".cmp-row, .tile").forEach((n) => n.classList.add("drawn"));
    return;
  }
  const titleIo = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add("in-view"); titleIo.unobserve(en.target); }
  }, { threshold: 0.35 });
  titles.forEach((t) => titleIo.observe(t));

  const seen = new Map<Element, number>();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const node = en.target as HTMLElement;
      io.unobserve(node);
      node.classList.add("in", "drawn");
      const num = node.querySelector<HTMLElement>(".stat-n[data-count]");
      if (num) countUp(num);
      const delay = Number(node.style.getPropertyValue("--d").replace("ms", "")) || 0;
      window.setTimeout(() => {
        node.removeAttribute("data-reveal");
        node.classList.remove("in");
        node.style.removeProperty("--d");
      }, delay + 1100);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  targets.forEach((node) => {
    const outer = node.parentElement?.closest("[data-reveal]");
    if (outer && outer !== node) return;
    const parent = node.parentElement!;
    const n = seen.get(parent) ?? 0;
    seen.set(parent, n + 1);
    node.style.setProperty("--d", `${Math.min(n, 6) * 90}ms`);
    node.setAttribute("data-reveal", "");
    io.observe(node);
  });
}

/* ---------- Form richiesta demo ---------- */
function initForm() {
  const form = $<HTMLFormElement>("demo-form");
  const error = $("form-error");
  const submit = $<HTMLButtonElement>("form-submit");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      nome: String(data.get("nome") || "").trim(),
      salone: String(data.get("salone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      telefono: String(data.get("telefono") || "").trim(),
      privacy: data.get("privacy") === "on",
      marketing: data.get("marketing") === "on",
      sito: String(data.get("sito") || ""),
    };

    let msg = "";
    if (!payload.nome || !payload.salone) msg = "Inserisci nome e autosalone.";
    else if (!emailRe.test(payload.email)) msg = "Controlla l'indirizzo email.";
    else if (!payload.privacy) msg = "Per inviarti le credenziali devi confermare di aver letto l'informativa privacy.";
    error.textContent = msg;
    if (msg) return;

    submit.disabled = true;
    submit.textContent = "Invio in corso…";
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({ ok: false, error: "Risposta non valida dal server." }));
      if (!res.ok || !out.ok) throw new Error(out.error || "Qualcosa è andato storto, riprova.");
      form.hidden = true;
      const done = $("demo-done");
      done.hidden = false;
      done.focus();
    } catch (err) {
      error.textContent = err instanceof Error ? err.message : "Qualcosa è andato storto, riprova.";
      submit.disabled = false;
      submit.textContent = "Inviami le credenziali";
    }
  });
}

initGenerator();
initCalculator();
initViewer();
initFaq();
initForm();
initUi();
initShowcase();
initHeroMotion();
