-- ============================================================================
-- JAFLOW — Duração estimada da tarefa
-- Permite que o Pomodoro use este valor como limite automático e fixo
-- (não editável) quando a tarefa é selecionada, evitando exceder o tempo
-- previsto para a atividade.
-- ============================================================================

alter table public.tasks
  add column if not exists estimated_duration_minutes integer;
