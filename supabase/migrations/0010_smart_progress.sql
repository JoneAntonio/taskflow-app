-- ============================================================================
-- JAFLOW — Progresso quantificável do objetivo SMART
-- Permite comparar um valor atual com um valor alvo (ex: TMA atual vs TMA
-- alvo), independente das revisões PDCA, para um rastreio mais leve.
-- ============================================================================

alter table public.projects
  add column if not exists current_value numeric,
  add column if not exists target_value numeric,
  add column if not exists lower_is_better boolean not null default false;
