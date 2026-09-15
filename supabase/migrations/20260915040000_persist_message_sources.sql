alter table public.messages
add column if not exists sources jsonb;
