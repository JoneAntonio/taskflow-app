-- ============================================================================
-- JAFLOW — Notificações push a sério
-- Guarda a "subscrição" de cada dispositivo (browser/PC/telemóvel) que
-- autorizou notificações, para conseguirmos enviar-lhe alertas mesmo com o
-- separador do JAFLOW fechado.
-- ============================================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_all_own" on public.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
