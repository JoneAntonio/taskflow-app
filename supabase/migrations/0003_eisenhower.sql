-- ============================================================================
-- JAFLOW — Adiciona suporte à Matriz de Eisenhower
-- A matriz cruza urgência (derivada da prioridade existente) com importância
-- (nova coluna booleana, marcada manualmente pelo utilizador).
-- ============================================================================

alter table public.tasks
  add column if not exists is_important boolean not null default false;

create index if not exists tasks_is_important_idx on public.tasks (user_id, is_important);
