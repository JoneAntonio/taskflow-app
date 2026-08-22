-- ============================================================================
-- JAFLOW — Mais categorias do método SMART
-- Acrescenta Responsável, Prioridade e Plano de Ação aos projetos.
-- (current_value/target_value já existentes passam a ser usados como
-- "Ponto de Partida" e "Meta" na interface, sem precisar de nova coluna.)
-- ============================================================================

alter table public.projects
  add column if not exists responsible text,
  add column if not exists smart_priority task_priority not null default 'sem_prioridade',
  add column if not exists action_plan text;
