-- ============================================================================
-- JAFLOW — Análises geradas por IA (cache)
-- Guarda o resultado da última análise por âmbito (ex: "maturidade"), para
-- não chamarmos a IA sempre que a página é aberta — só quando a pessoa
-- pedir explicitamente para gerar/atualizar.
-- ============================================================================

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scope text not null,
  content text not null,
  generated_at timestamptz not null default now(),
  unique (user_id, scope)
);

alter table public.ai_insights enable row level security;

create policy "ai_insights_all_own" on public.ai_insights for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
