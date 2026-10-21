// Vercel Serverless Function: POST /api/demo-request
// Riceve i contatti dal form della landing GestAuto, salva il lead su Supabase,
// manda le credenziali demo al visitatore e avvisa Lucez via Resend.
//
// Dipendenze: npm i resend @supabase/supabase-js
// Variabili d'ambiente (Vercel > Settings > Environment Variables):
//   RESEND_API_KEY            chiave API Resend
//   RESEND_FROM               mittente su dominio verificato, es. "GestAuto <demo@gestauto.me>"
//   NOTIFY_EMAIL              dove ricevi l'avviso di ogni nuovo lead
//   DEMO_LOGIN_URL            https://app.gestauto.me/login
//   DEMO_EMAIL                demo@bericamotori.it
//   DEMO_PASSWORD             password demo
//   SUPABASE_URL              URL del progetto Supabase che tiene i lead
//   SUPABASE_SERVICE_ROLE_KEY chiave service role (solo lato server, mai nel frontend)
//   ALLOWED_ORIGIN            dominio della landing, es. https://gestauto.me
//
// Il form invia: nome, salone, email, telefono (facoltativo), privacy (obbligatorio),
// marketing (facoltativo) e "sito" (campo trappola per i bot, deve restare vuoto).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function clean(v: unknown, max = 120) {
  // Una riga sola: niente a capo (finirebbero negli oggetti delle email) né caratteri di controllo
  // eslint-disable-next-line no-control-regex
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "";
}

// Dell'IP salviamo solo un'impronta cifrata: serve a fermare chi invia in massa, non a identificare.
function ipHash(req: VercelRequest) {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
  if (!ip) return null;
  return createHash("sha256").update(ip + (process.env.IP_SALT || "gestauto")).digest("hex").slice(0, 32);
}

const LIMITE_IP_ORA = 5; // richieste per IP in un'ora
const LIMITE_GLOBALE_GIORNO = 300; // tetto di sicurezza su tutta la landing

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN || "https://gestauto.me";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo non consentito" });

  // Il form parte solo dal nostro sito: se il browser dichiara un'altra origine, si ferma qui.
  const chiamante = req.headers.origin;
  if (chiamante && chiamante !== origin) return res.status(403).json({ ok: false, error: "Richiesta non consentita." });

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ ok: false, error: "Richiesta non valida." });
  }

  // Honeypot: campo nascosto "sito". Se compilato è un bot: rispondiamo ok e non facciamo nulla.
  if (clean(body.sito)) return res.status(200).json({ ok: true });

  const nome = clean(body.nome);
  const salone = clean(body.salone);
  const email = clean(body.email, 160).toLowerCase();
  const telefono = clean(body.telefono, 40).replace(/[^\d+()\s.-]/g, "");
  const privacy = body.privacy === true;
  const marketing = body.marketing === true;

  if (!nome || !salone) return res.status(400).json({ ok: false, error: "Inserisci nome e autosalone." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Controlla l'indirizzo email." });
  if (!privacy) return res.status(400).json({ ok: false, error: "Per inviarti le credenziali devi confermare di aver letto l'informativa privacy." });

  // Limite semplice: massimo 3 richieste per email nelle ultime 24 ore.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const ip = ipHash(req);

  // Limiti anti abuso: per IP (ultima ora) e globale (ultimi 24h). Se il controllo non è
  // disponibile (es. colonna non ancora creata) non blocca l'invio, ma gli altri limiti restano.
  if (ip) {
    const ora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const r = await supabase.from("demo_leads").select("id", { count: "exact", head: true }).eq("ip_hash", ip).gte("created_at", ora);
    if (!r.error && (r.count ?? 0) >= LIMITE_IP_ORA) {
      return res.status(429).json({ ok: false, error: "Hai inviato troppe richieste. Riprova tra un po'." });
    }
  }
  const glob = await supabase.from("demo_leads").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (!glob.error && (glob.count ?? 0) >= LIMITE_GLOBALE_GIORNO) {
    return res.status(429).json({ ok: false, error: "Il servizio è molto richiesto in questo momento. Riprova più tardi." });
  }
  const { count } = await supabase
    .from("demo_leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return res.status(429).json({ ok: false, error: "Ti abbiamo già mandato l'accesso: controlla la posta, anche nello spam." });
  }

  const riga = {
    nome, salone, email, telefono,
    consenso_privacy: privacy,
    consenso_marketing: marketing,
    user_agent: clean(req.headers["user-agent"], 300),
  };
  let { error: dbError } = await supabase.from("demo_leads").insert({ ...riga, ip_hash: ip });
  // Colonna ip_hash non ancora creata: salva comunque il lead senza.
  if (dbError && /ip_hash/.test(dbError.message || "")) {
    ({ error: dbError } = await supabase.from("demo_leads").insert(riga));
  }
  if (dbError) {
    console.error("demo_leads insert", dbError);
    return res.status(500).json({ ok: false, error: "Qualcosa è andato storto, riprova tra un attimo." });
  }

  const loginUrl = process.env.DEMO_LOGIN_URL as string;
  const demoEmail = process.env.DEMO_EMAIL as string;
  const demoPassword = process.env.DEMO_PASSWORD as string;

  const SITE_URL = "https://sito.gestauto.me";
  const primoNome = nome.split(/\s+/)[0] || nome;
  const FONT = "Helvetica,Arial,sans-serif";
  const MONO = "'SFMono-Regular',Menlo,Consolas,monospace";

  const visitorHtml = `<!doctype html>
<html lang="it"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>Le chiavi della demo GestAuto</title>
</head>
<body style="margin:0;padding:0;background:#0B0D10" bgcolor="#0B0D10">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0B0D10;font-size:1px">Email e password per provare il gestionale, pronte all'uso.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0D10" style="background:#0B0D10">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">
    <tr><td style="padding:0 4px 18px"><img src="https://gestauto.me/email/logo.png" width="140" height="30" alt="GestAuto" style="display:block;border:0;width:140px;height:auto"></td></tr>
    <tr><td bgcolor="#151820" style="background:#151820;border:1px solid #262B35;border-radius:14px;padding:32px 28px;font-family:${FONT};color:#F4F5F7">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;font-weight:700;color:#E5392F">ACCESSO DEMO</p>
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700;color:#FFFFFF">Ciao ${esc(primoNome)}, le chiavi sono pronte</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#C3C8D0">Puoi provare il gestionale come se fosse quello di ${esc(salone)}: carica auto, genera contratti, gestisci le richieste. Fai quello che vuoi, non rompi niente.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0D10" style="background:#0B0D10;border:1px solid #262B35;border-radius:10px">
        <tr><td style="padding:14px 18px 4px;font-size:11px;letter-spacing:1.5px;font-weight:700;color:#8A919C">EMAIL</td></tr>
        <tr><td style="padding:0 18px 14px;font-family:${MONO};font-size:16px;font-weight:700;color:#FFFFFF">${esc(demoEmail)}</td></tr>
        <tr><td style="padding:0 18px"><div style="border-top:1px solid #262B35;height:1px;line-height:1px;font-size:1px">&nbsp;</div></td></tr>
        <tr><td style="padding:14px 18px 4px;font-size:11px;letter-spacing:1.5px;font-weight:700;color:#8A919C">PASSWORD</td></tr>
        <tr><td style="padding:0 18px 16px;font-family:${MONO};font-size:16px;font-weight:700;color:#FFFFFF">${esc(demoPassword)}</td></tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px">
        <tr><td bgcolor="#D7261E" style="background:#D7261E;border-radius:8px">
          <a href="${loginUrl}" style="display:inline-block;padding:15px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none">Apri il gestionale</a>
        </td></tr>
      </table>
      <p style="margin:0 0 26px;font-size:14px;line-height:1.6;color:#C3C8D0">Vuoi vedere anche cosa trovano i tuoi clienti? <a href="${SITE_URL}" style="color:#FF6B5F;text-decoration:underline">Guarda il sito vetrina demo</a>.</p>

      <p style="margin:0 0 18px;padding:12px 14px;font-size:13px;line-height:1.55;color:#C3C8D0;background:#1B1F29;border-radius:8px">La demo è condivisa e si azzera ogni notte alle 3: non inserire dati reali.</p>

      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#F4F5F7">Se vuoi una mano a capire se fa per il tuo salone, rispondi a questa email: ti risponde una persona, non un robot.</p>
      <p style="margin:0;font-size:15px;line-height:1.5;color:#F4F5F7"><strong>Andrea Lucietti</strong><br><span style="color:#8A919C">GestAuto</span></p>
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#6B7280">Hai ricevuto questa email perché hai richiesto l'accesso alla demo su gestauto.me.</td></tr>
  </table>
</td></tr>
</table>
</body></html>`;

  const visitorText = `Ciao ${primoNome}, le chiavi della demo GestAuto sono pronte.

Email: ${demoEmail}
Password: ${demoPassword}
Gestionale: ${loginUrl}
Sito vetrina demo: ${SITE_URL}

La demo è condivisa e si azzera ogni notte alle 3: non inserire dati reali.
Se vuoi una mano, rispondi a questa email.

Andrea Lucietti
GestAuto`;

  const notifyHtml = `
  <div style="font-family:${FONT};font-size:15px;line-height:1.6;color:#111317">
    <h2 style="margin:0 0 12px">Nuova richiesta demo GestAuto</h2>
    <p style="margin:0"><strong>Nome:</strong> ${esc(nome)}<br><strong>Autosalone:</strong> ${esc(salone)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Telefono:</strong> ${esc(telefono || "non indicato")}<br><strong>Consenso marketing:</strong> ${marketing ? "sì" : "no"}</p>
    <p style="margin:16px 0 0;color:#4B5059;font-size:13px">Rispondi a questa email per scrivergli direttamente.</p>
  </div>`;

  const [visitor, notify] = await Promise.allSettled([
    resend.emails.send({
      from: process.env.RESEND_FROM as string,
      to: email,
      replyTo: process.env.NOTIFY_EMAIL,
      subject: "Le chiavi della demo GestAuto",
      html: visitorHtml,
      text: visitorText,
    }),
    resend.emails.send({
      from: process.env.RESEND_FROM as string,
      to: process.env.NOTIFY_EMAIL as string,
      replyTo: email,
      subject: `Nuovo lead demo: ${salone}`,
      html: notifyHtml,
    }),
  ]);

  if (visitor.status === "rejected" || (visitor.status === "fulfilled" && visitor.value.error)) {
    console.error("resend visitor", visitor);
    return res.status(502).json({ ok: false, error: "Non riusciamo a mandarti l'email ora, riprova tra poco." });
  }
  if (notify.status === "rejected" || (notify.status === "fulfilled" && notify.value.error)) {
    console.error("resend notify", notify);
  }

  // Le credenziali NON tornano al browser: arrivano solo via email,
  // così chi inserisce un indirizzo finto non entra nel gestionale.
  return res.status(200).json({ ok: true });
}
