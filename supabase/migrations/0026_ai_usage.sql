-- ============================================================================
-- JAFLOW — Contagem de utilização diária da IA
-- A quota gratuita do Gemini é partilhada por TODA a app (uma só chave de
-- API), não por utilizador. Esta tabela guarda quantos pedidos já foram
-- feitos hoje, por funcionalidade (SMART / Maturidade), só para mostrar um
-- indicador informativo — não é uma imposição rígida do lado do Google.
-- ============================================================================

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  used_date date not null default current_date,
  count integer not null default 0,
  unique (scope, used_date)
);

alter table public.ai_usage enable row level security;

create policy "ai_usage_select_authenticated" on public.ai_usage for select
  using (auth.role() = 'authenticated');
