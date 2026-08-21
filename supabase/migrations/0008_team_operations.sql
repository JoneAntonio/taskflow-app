-- ============================================================================
-- JAFLOW — Operações/equipas com cor própria
-- Permite atribuir uma cor a cada operação (ex: "SIMAR", "Suporte Técnico"),
-- para identificar rapidamente a que equipa um agente pertence, e serve de
-- base a um dashboard com estatísticas por operação.
-- ============================================================================

create table public.team_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#3F6FA8',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index team_operations_user_id_idx on public.team_operations (user_id);

alter table public.team_operations enable row level security;

create policy "team_operations_all_own" on public.team_operations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
