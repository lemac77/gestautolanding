// Vercel Serverless Function: POST /api/demo-request
// Riceve i contatti dal form della landing GestAuto, salva il lead su Supabase,
// manda le credenziali demo al visitatore e avvisa Lucez via Resend.
//
// Dipendenze: npm i resend @supabase/supabase-js
// Variabili d'ambiente (Vercel > Settings > Environment Variables):
//   RESEND_API_KEY            chiave API Resend
//   RESEND_FROM               mittente su dominio verificato, es. "GestAuto <demo@gestauto.studiobrillo.com>"
//   NOTIFY_EMAIL              dove ricevi l'avviso di ogni nuovo lead
//   DEMO_LOGIN_URL            https://app.gestauto.studiobrillo.com/login
//   DEMO_EMAIL                demo@bericamotori.it
//   DEMO_PASSWORD             password demo
//   SUPABASE_URL              URL del progetto Supabase che tiene i lead
//   SUPABASE_SERVICE_ROLE_KEY chiave service role (solo lato server, mai nel frontend)
//   ALLOWED_ORIGIN            dominio della landing, es. https://gestauto.studiobrillo.com
//
// Il form invia: nome, salone, email, telefono (facoltativo), privacy (obbligatorio),
// marketing (facoltativo) e "sito" (campo trappola per i bot, deve restare vuoto).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

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
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo non consentito" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // Honeypot: campo nascosto "sito". Se compilato è un bot: rispondiamo ok e non facciamo nulla.
  if (clean(body.sito)) return res.status(200).json({ ok: true });

  const nome = clean(body.nome);
  const salone = clean(body.salone);
  const email = clean(body.email, 160).toLowerCase();
  const telefono = clean(body.telefono, 40);
  const privacy = body.privacy === true;
  const marketing = body.marketing === true;

  if (!nome || !salone) return res.status(400).json({ ok: false, error: "Inserisci nome e autosalone." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Controlla l'indirizzo email." });
  if (!privacy) return res.status(400).json({ ok: false, error: "Per inviarti le credenziali devi confermare di aver letto l'informativa privacy." });

  // Limite semplice: massimo 3 richieste per email nelle ultime 24 ore.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("demo_leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return res.status(429).json({ ok: false, error: "Ti abbiamo già mandato l'accesso: controlla la posta, anche nello spam." });
  }

  const { error: dbError } = await supabase.from("demo_leads").insert({
    nome, salone, email, telefono,
    consenso_privacy: privacy,
    consenso_marketing: marketing,
    user_agent: clean(req.headers["user-agent"], 300),
  });
  if (dbError) {
    console.error("demo_leads insert", dbError);
    return res.status(500).json({ ok: false, error: "Qualcosa è andato storto, riprova tra un attimo." });
  }

  const loginUrl = process.env.DEMO_LOGIN_URL as string;
  const demoEmail = process.env.DEMO_EMAIL as string;
  const demoPassword = process.env.DEMO_PASSWORD as string;

  const visitorHtml = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111317">
    <h1 style="font-size:22px;margin:0 0 16px">Ciao ${esc(nome)}, ecco le chiavi della demo</h1>
    <p style="font-size:15px;line-height:1.6">Grazie per l'interesse in GestAuto. Puoi provare il gestionale come se fosse quello di ${esc(salone)}: carica auto, genera contratti, prova tutto.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px">
      <tr><td style="padding:10px;border:1px solid #DDE0E4;color:#4B5059">Email</td><td style="padding:10px;border:1px solid #DDE0E4;font-family:monospace"><strong>${esc(demoEmail)}</strong></td></tr>
      <tr><td style="padding:10px;border:1px solid #DDE0E4;color:#4B5059">Password</td><td style="padding:10px;border:1px solid #DDE0E4;font-family:monospace"><strong>${esc(demoPassword)}</strong></td></tr>
    </table>
    <p><a href="${loginUrl}" style="display:inline-block;background:#D7261E;color:#FFFFFF;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:bold">Apri il gestionale</a></p>
    <p style="font-size:14px;line-height:1.6;color:#4B5059">La demo è condivisa e si azzera ogni notte, quindi non inserire dati reali.</p>
    <p style="font-size:15px;line-height:1.6">Se vuoi una mano a capire se fa per il tuo salone, rispondi a questa email: ti risponde una persona, non un robot.</p>
    <p style="font-size:15px;line-height:1.6">Andrea Lucietti<br>GestAuto</p>
  </div>`;

  const notifyHtml = `
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
    <h2 style="margin:0 0 12px">Nuova richiesta demo GestAuto</h2>
    <p><strong>Nome:</strong> ${esc(nome)}<br><strong>Autosalone:</strong> ${esc(salone)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Telefono:</strong> ${esc(telefono || "non indicato")}<br><strong>Consenso marketing:</strong> ${marketing ? "sì" : "no"}</p>
  </div>`;

  const [visitor, notify] = await Promise.allSettled([
    resend.emails.send({
      from: process.env.RESEND_FROM as string,
      to: email,
      replyTo: process.env.NOTIFY_EMAIL,
      subject: "Le chiavi della demo GestAuto",
      html: visitorHtml,
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
