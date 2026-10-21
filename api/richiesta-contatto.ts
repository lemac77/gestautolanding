// Vercel Serverless Function: POST /api/richiesta-contatto
// Chi vuole GestAuto (non solo provare la demo) lascia i contatti dal banner della landing:
// ti arriva una email con i dati e puoi rispondere direttamente.
// Usa le stesse variabili d'ambiente di demo-request (RESEND_API_KEY, RESEND_FROM, NOTIFY_EMAIL, ALLOWED_ORIGIN).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
function clean(v: unknown, max = 120) {
  // eslint-disable-next-line no-control-regex
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "";
}

// Limite semplice in memoria (per istanza): 3 richieste all'ora per IP.
const visti = new Map<string, number[]>();
function troppe(ip: string) {
  const ora = Date.now() - 60 * 60 * 1000;
  const lista = (visti.get(ip) || []).filter((t) => t > ora);
  lista.push(Date.now());
  visti.set(ip, lista);
  if (visti.size > 500) visti.clear();
  return lista.length > 3;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN || "https://gestauto.me";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo non consentito" });

  const chiamante = req.headers.origin;
  if (chiamante && chiamante !== origin) return res.status(403).json({ ok: false, error: "Richiesta non consentita." });

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ ok: false, error: "Richiesta non valida." });
  }

  // Campo trappola per i bot
  if (clean(body.sito)) return res.status(200).json({ ok: true });

  const nome = clean(body.nome);
  const salone = clean(body.salone);
  const email = clean(body.email, 160).toLowerCase();
  const telefono = clean(body.telefono, 40).replace(/[^\d+()\s.-]/g, "");
  const privacy = body.privacy === true;

  if (!nome || !salone) return res.status(400).json({ ok: false, error: "Inserisci nome e autosalone." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Controlla l'indirizzo email." });
  if (!privacy) return res.status(400).json({ ok: false, error: "Per essere ricontattato devi confermare di aver letto l'informativa privacy." });

  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || "").split(",")[0].trim() || "n/d";
  if (troppe(ip)) return res.status(429).json({ ok: false, error: "Hai inviato troppe richieste. Riprova tra un po'." });

  const FONT = "Helvetica,Arial,sans-serif";
  const html = `
  <div style="font-family:${FONT};font-size:15px;line-height:1.6;color:#111317">
    <h2 style="margin:0 0 12px">Richiesta GestAuto dal sito</h2>
    <p style="margin:0 0 6px">Qualcuno vuole essere ricontattato per GestAuto.</p>
    <p style="margin:0"><strong>Nome:</strong> ${esc(nome)}<br><strong>Autosalone:</strong> ${esc(salone)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Telefono:</strong> ${esc(telefono || "non indicato")}</p>
    <p style="margin:16px 0 0;color:#4B5059;font-size:13px">Rispondi a questa email per scrivergli direttamente.</p>
  </div>`;

  const r = await resend.emails.send({
    from: process.env.RESEND_FROM as string,
    to: process.env.NOTIFY_EMAIL as string,
    replyTo: email,
    subject: `Richiesta GestAuto: ${salone}`,
    html,
  }).catch((e) => ({ error: e }));

  if ((r as { error?: unknown }).error) {
    console.error("resend contatto", r);
    return res.status(502).json({ ok: false, error: "Non riusciamo a inviare la richiesta ora. Scrivici a info@studiobrillo.com." });
  }
  return res.status(200).json({ ok: true });
}
