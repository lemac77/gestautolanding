-- Tabella dei lead della landing GestAuto.
-- Da eseguire nel SQL Editor del progetto Supabase che tiene i lead
-- (meglio NON quello della demo Autosalone Test, che si resetta ogni notte).

create table if not exists public.demo_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nome        text not null,
  salone      text not null,
  email       text not null,
  telefono    text,
  consenso_privacy   boolean not null default false,
  consenso_marketing boolean not null default false,
  user_agent  text,
  contattato  boolean not null default false,
  note        text
);

create index if not exists demo_leads_email_created_idx
  on public.demo_leads (email, created_at desc);

-- RLS attiva e nessuna policy: dal frontend nessuno può leggere o scrivere.
-- La funzione serverless usa la service role key, che bypassa la RLS.
alter table public.demo_leads enable row level security;
