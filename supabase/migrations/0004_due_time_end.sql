-- ============================================================================
-- JAFLOW — Suporte a intervalos de horário nas tarefas
-- ============================================================================

alter table public.tasks
  add column if not exists due_time_end time;
