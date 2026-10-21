-- Impronta cifrata dell'IP per i limiti anti abuso della landing (vedi api/demo-request.ts).
-- Da eseguire nel SQL Editor del progetto Supabase che tiene i lead.
alter table public.demo_leads add column if not exists ip_hash text;
create index if not exists demo_leads_ip_hash_idx on public.demo_leads (ip_hash, created_at desc);
