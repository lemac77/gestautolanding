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

/* ---------- Anteprima con tab ---------- */
function initTabs() {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const select = (tab: HTMLButtonElement) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")!).hidden = !on;
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      select(next);
      next.focus();
    });
  });

  const list = $("mock-cars");
  for (const car of [CARS[0], CARS[2], CARS[4], CARS[6], CARS[7]]) {
    const row = el("div", { class: "car-row" });
    const thumb = el("div", { class: "car-thumb", "aria-hidden": "true" });
    paint(thumb, car);
    const info = el("div", { class: "info" });
    info.append(el("div", { class: "car-name" }, car.name), el("div", { class: "car-meta" }, `${year(car)} · ${car.km}`));
    const pillClass = car.status === "Online" ? "pill-online" : car.status === "Venduta" ? "pill-sold" : "pill-draft";
    row.append(thumb, info, el("div", { class: "car-price" }, car.price), el("span", { class: `pill ${pillClass}` }, car.status));
    list.append(row);
  }

  const site = $("mock-site");
  for (const car of CARS.filter((c) => c.status === "Online").slice(0, 2)) {
    const card = el("div", { class: "site-card" });
    const img = el("div", { class: "img", "aria-hidden": "true" });
    paint(img, car);
    const body = el("div", { class: "body" });
    body.append(el("div", { class: "car-name" }, car.name), el("div", { class: "car-meta" }, `${year(car)} · ${car.km}`), el("div", { class: "price" }, car.price));
    card.append(img, body);
    site.append(card);
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

/* ---------- Filtri del telefono ---------- */
function initPhone() {
  const filters = ["Tutte", "Ibrida", "Diesel", "Benzina", "Elettrica"];
  let active = "Tutte";
  const box = $("filters");
  const btns = filters.map((f) => {
    const b = el("button", { type: "button", class: "filter", "aria-pressed": String(f === active) }, f);
    b.addEventListener("click", () => { active = f; render(); });
    box.append(b);
    return b;
  });
  const list = $("phone-list");
  function render() {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === active)));
    const items = CARS.filter((c) => c.status === "Online" && (active === "Tutte" || c.fuel === active));
    $("phone-count").textContent = `${items.length} ${items.length === 1 ? "auto disponibile" : "auto disponibili"}`;
    list.replaceChildren(...items.map((car) => {
      const card = el("div", { class: "phone-card" });
      const img = el("div", { class: "img", "aria-hidden": "true" });
      paint(img, car);
      img.append(el("span", { class: "fuel" }, car.fuel));
      const body = el("div", { class: "body" });
      const left = el("div", {});
      left.append(el("div", { class: "name" }, car.name), el("div", { class: "car-meta" }, `${year(car)} · ${car.km}`));
      body.append(left, el("div", { class: "price" }, car.price));
      card.append(img, body);
      return card;
    }));
  }
  render();
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

initTabs();
initGenerator();
initCalculator();
initPhone();
initFaq();
initForm();
