-- ============================================================================
-- JAFLOW — Adiciona o campo "local" às tarefas (usado no Calendário)
-- ============================================================================

alter table public.tasks
  add column if not exists location text;
