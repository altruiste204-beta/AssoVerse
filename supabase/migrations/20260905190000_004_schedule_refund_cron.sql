-- Programme l'appel quotidien de refund-failed-levee (rien ne le déclenchait
-- automatiquement). Nécessite les extensions pg_cron et pg_net, activables
-- dans Supabase Dashboard -> Database -> Extensions si besoin.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remplace TON-PROJET et TON_CRON_SECRET_ICI avant d'exécuter cette migration.
-- Le secret doit être identique à CRON_SECRET défini dans
-- Supabase Dashboard -> Edge Functions -> refund-failed-levee -> Secrets.
select cron.schedule(
  'refund-failed-main-levees-daily',
  '0 3 * * *',  -- tous les jours à 03h00 UTC
  $$
  select net.http_post(
    url := 'https://TON-PROJET.supabase.co/functions/v1/refund-failed-levee',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'TON_CRON_SECRET_ICI'
    ),
    body := '{}'::jsonb
  );
  $$
);
