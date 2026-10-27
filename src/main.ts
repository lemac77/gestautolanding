// Interazioni della landing GestAuto: anteprime,
// calcolatore, filtri del sito demo, FAQ e form di richiesta demo.
import "./fonts";


const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

/* ---------- Prezzi: mensile / annuale nella stessa card ---------- */
function initPricing() {
  const root = document.getElementById("plan-sub");
  if (!root) return;
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-bill]"));
  const price = $("plan-price");
  const unit = $("plan-unit");
  const note = $("plan-note");
  const save = $("plan-save");
  const DATA = {
    m: { p: 79, unit: "/ mese", note: "Per chi preferisce distribuire il costo nel tempo." },
    y: { p: 869, unit: "/ anno", note: "Pagamento annuale anticipato. Tutte le funzionalità del piano mensile." },
  } as const;
  let cur: "m" | "y" = "m";
  let raf = 0;
  const fmt = (n: number) => `${Math.round(n).toLocaleString("it-IT")} €`;
  function set(k: "m" | "y") {
    if (k === cur) return;
    const from = DATA[cur].p;
    cur = k;
    btns.forEach((b) => {
      const on = b.dataset.bill === k;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    unit.textContent = DATA[k].unit;
    note.textContent = DATA[k].note;
    save.classList.toggle("show", k === "y");
    const to = DATA[k].p;
    cancelAnimationFrame(raf);
    if (reduceMotion) { price.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      const e = 1 - Math.pow(1 - p, 3);
      price.textContent = fmt(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.bill as "m" | "y")));
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
const SITE = "https://sito.gestauto.me";
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
    url.textContent = "sito.gestauto.me" + (info.path === "/" ? "" : info.path.replace(/\/0+-.*$/, "/volkswagen-golf"));

    if (live) {
      const iframe = el("iframe", {
        src: SITE + info.path,
        title: "Sito demo Demo GestAuto, navigabile",
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
      alt: `${info.label} del sito Demo GestAuto, versione ${device === "desk" ? "desktop" : "smartphone"}`,
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
  const URLS = ["gestionale · Demo GestAuto", "gestionale · Demo GestAuto · Vendite", "gestionale · Demo GestAuto · Richieste", "gestionale · Demo GestAuto · Trattative", "sito.gestauto.me"];
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

  document.querySelectorAll<HTMLElement>(".feature, .tile, .pack-card, .flow li, .link-card, .plan-life, .next-card, .crm-card").forEach((c) => c.classList.add("spot"));
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
    ".section-head > :not(.h2), .block-title, .chips li, .site-note, .viewer, .pack-card, .flow li, .pack-note, .tile, .range, .fixed-row, .calc-out, .stat, .feature, .next-card, .crm-shot, .crm-card, .cmp-head, .cmp-row, .steps li, .demo-copy > :not(.h2):not(.section-head), .form-card, .plan, .card-dark, .legal, .faq-item, .cta-box > :not(.h2)",
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

/* ---------- Banner contatto ---------- */
function initContact() {
  const dlg = document.getElementById("contact-dialog") as HTMLDialogElement | null;
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  if (!dlg || !form) return;
  const error = $("contact-error");
  const submit = $<HTMLButtonElement>("contact-submit");
  const done = $("contact-done");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.querySelectorAll("[data-open-contact]").forEach((b) =>
    b.addEventListener("click", () => {
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    })
  );
  const chiudi = () => dlg.close();
  $("contact-close").addEventListener("click", chiudi);
  $("contact-ok").addEventListener("click", chiudi);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) chiudi(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      nome: String(data.get("nome") || "").trim(),
      salone: String(data.get("salone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      telefono: String(data.get("telefono") || "").trim(),
      privacy: data.get("privacy") === "on",
      sito: String(data.get("sito") || ""),
    };
    let msg = "";
    if (!payload.nome || !payload.salone) msg = "Inserisci nome e autosalone.";
    else if (!emailRe.test(payload.email)) msg = "Controlla l'indirizzo email.";
    else if (!payload.privacy) msg = "Per essere ricontattato devi confermare di aver letto l'informativa privacy.";
    error.textContent = msg;
    if (msg) return;

    submit.disabled = true;
    submit.textContent = "Invio in corso…";
    try {
      const res = await fetch("/api/richiesta-contatto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({ ok: false, error: "Risposta non valida dal server." }));
      if (!res.ok || !out.ok) throw new Error(out.error || "Qualcosa è andato storto, riprova.");
      form.hidden = true;
      done.hidden = false;
      done.focus();
    } catch (err) {
      error.textContent = err instanceof Error ? err.message : "Qualcosa è andato storto, riprova.";
      submit.disabled = false;
      submit.textContent = "Invia la richiesta";
    }
  });
}

initCalculator();
initPricing();
initViewer();
initFaq();
initForm();
initContact();
initUi();
initShowcase();
initHeroMotion();
