-- ============================================================================
-- JAFLOW — Ficha de colaborador mais completa + histórico de notas
-- Estende team_agents com dados de contacto e competências, e cria uma
-- tabela de notas/interações ao longo do tempo por agente — o "diário de
-- bordo" informal, separado da avaliação formal de maturidade.
-- ============================================================================

alter table public.team_agents
  add column if not exists phone text,
  add column if not exists birthday date,
  add column if not exists start_date date,
  add column if not exists skills text[] not null default '{}';

create table public.agent_notes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.team_agents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index agent_notes_agent_id_idx on public.agent_notes (agent_id, created_at desc);

alter table public.agent_notes enable row level security;

create policy "agent_notes_all_own" on public.agent_notes for all
  using (
    exists (select 1 from public.team_agents where id = agent_id and user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.team_agents where id = agent_id and user_id = auth.uid())
  );
