-- Conservazione dei lead: l'informativa privacy promette la cancellazione dopo 24 mesi
-- dall'ultimo contatto. Questo job la rende vera, senza intervento manuale.
-- Da eseguire nel SQL Editor del progetto Supabase che tiene i lead.

create extension if not exists pg_cron;

select cron.unschedule('demo_leads_retention')
where exists (select 1 from cron.job where jobname = 'demo_leads_retention');

select cron.schedule(
  'demo_leads_retention',
  '30 3 * * *',
  $$ delete from public.demo_leads where created_at < now() - interval '24 months' $$
);
