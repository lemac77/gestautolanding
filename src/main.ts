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

/* ---------- Anteprime: gestionale e sito ---------- */
function initPreviews() {
  // Gestionale: lista del parco auto con lo stato di pubblicazione
  const list = $("mock-cars");
  for (const car of [CARS[0], CARS[2], CARS[4], CARS[6], CARS[7]]) {
    const row = el("div", { class: "car-row" });
    const thumb = el("div", { class: "car-thumb", "aria-hidden": "true" });
    paint(thumb, car);
    const info = el("div", { class: "info" });
    info.append(el("div", { class: "car-name" }, car.name), el("div", { class: "car-meta" }, `${year(car)} · ${car.km}`));
    const pillClass = car.status === "Online" ? "pill-online" : car.status === "Venduta" ? "pill-sold" : "pill-draft";
    const label = car.status === "Online" ? "Sul sito" : car.status;
    row.append(thumb, info, el("div", { class: "car-price" }, car.price), el("span", { class: `pill ${pillClass}` }, label));
    list.append(row);
  }

}

/* ---------- Generatore contratti ---------- */
function initGenerator() {
  const cars = [CARS[0], CARS[4], CARS[6]];
  let carIdx = 0;
  let docIdx = 0;
  let counter = 41;

  const carBox = $("gen-cars");
  const docBox = $("gen-docs");
  const carBtns = cars.map((car, i) => {
    const b = el("button", { type: "button", class: "choice", "aria-pressed": String(i === 0) });
    b.append(el("span", {}, car.name), el("span", { class: "mono" }, car.price));
    b.addEventListener("click", () => { carIdx = i; sync(); });
    carBox.append(b);
    return b;
  });
  const docBtns = DOCS.map((d, i) => {
    const b = el("button", { type: "button", class: "choice", "aria-pressed": String(i === 0) }, d);
    b.addEventListener("click", () => { docIdx = i; sync(); });
    docBox.append(b);
    return b;
  });
  function sync() {
    carBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === carIdx)));
    docBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === docIdx)));
  }

  $("gen-go").addEventListener("click", () => {
    counter += 1;
    const car = cars[carIdx];
    $("p-title").textContent = DOCS[docIdx];
    $("p-num").textContent = `N. 2026/${String(counter).padStart(3, "0")}`;
    $("p-car").textContent = car.name;
    $("p-plate").textContent = car.plate;
    $("p-year").textContent = car.year;
    $("p-km").textContent = car.km;
    $("p-price").textContent = car.price;
    $("gen-empty").hidden = true;
    $("gen-paper").hidden = false;
  });
}

/* ---------- Calcolatore ---------- */
function initCalculator() {
  const sold = $<HTMLInputElement>("r-sold");
  const now = $<HTMLInputElement>("r-now");
  const withG = $<HTMLInputElement>("r-with");
  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("it-IT");

  const update = () => {
    const s = Number(sold.value);
    const a = Number(now.value);
    const b = Number(withG.value);
    const diff = Math.max(0, a - b);
    const minutes = s * diff;
    const hours = minutes / 60;
    $("o-sold").textContent = String(s);
    $("o-now").textContent = `${a} min`;
    $("o-with").textContent = `${b} min`;
    $("c-month").textContent = fmt(hours);
    $("c-year").textContent = fmt(hours * 12);
    $("c-days").textContent = fmt((hours * 12) / 8);
    $("c-formula").textContent = `Calcolo: ${s} auto × (${a} − ${b}) min = ${minutes.toLocaleString("it-IT")} min, cioè ${fmt(hours)} ore al mese. All'anno × 12, giornate ÷ 8 ore.`;
  };
  [sold, now, withG].forEach((r) => r.addEventListener("input", update));
  update();
}

/* ---------- Visualizzatore del sito vero ---------- */
const SITE = "https://motori-sito.vercel.app";
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

/* ---------- FAQ ---------- */
function initFaq() {
  document.querySelectorAll<HTMLButtonElement>(".faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      $(btn.getAttribute("aria-controls")!).hidden = open;
    });
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

initPreviews();
initGenerator();
initCalculator();
initViewer();
initFaq();
initForm();
