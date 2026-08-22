-- ============================================================================
-- JAFLOW — Fase 1: Fundação multi-utilizador
-- Equipas reais, com membros que fazem login com a própria conta, papéis
-- (admin/membro), convites por email, e admins de plataforma (vários).
-- Tudo ADITIVO: nenhuma tabela ou política existente é removida ou alterada
-- de forma destrutiva — o uso pessoal da app continua exatamente igual.
-- ============================================================================

-- 1. Admin de plataforma (vários, não é papel de equipa)
alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

-- 2. Equipas
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create type public.team_role as enum ('admin', 'member');

-- 3. Membros de equipa
create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index team_memberships_team_id_idx on public.team_memberships (team_id);
create index team_memberships_user_id_idx on public.team_memberships (user_id);

-- 4. Convites por email
create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text not null,
  role public.team_role not null default 'member',
  invited_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index team_invites_email_idx on public.team_invites (email);
create index team_invites_team_id_idx on public.team_invites (team_id);

-- 5. Funções auxiliares (SECURITY DEFINER) — evitam recursão nas políticas RLS
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_team_admin(_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_memberships
    where team_id = _team_id and user_id = auth.uid() and role = 'admin'
  ) or public.is_platform_admin();
$$;

create or replace function public.is_team_member(_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_memberships
    where team_id = _team_id and user_id = auth.uid()
  ) or public.is_platform_admin();
$$;

-- 6. RLS
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.team_invites enable row level security;

create policy "teams_select_member" on public.teams for select
  using (public.is_team_member(id));

create policy "teams_insert_own" on public.teams for insert
  with check (created_by = auth.uid());

create policy "teams_update_admin" on public.teams for update
  using (public.is_team_admin(id))
  with check (public.is_team_admin(id));

create policy "teams_delete_admin" on public.teams for delete
  using (public.is_team_admin(id));

create policy "memberships_select_team" on public.team_memberships for select
  using (public.is_team_member(team_id));

create policy "memberships_insert_admin" on public.team_memberships for insert
  with check (public.is_team_admin(team_id) or user_id = auth.uid());

create policy "memberships_update_admin" on public.team_memberships for update
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

create policy "memberships_delete_admin" on public.team_memberships for delete
  using (public.is_team_admin(team_id) or user_id = auth.uid());

create policy "invites_select_admin" on public.team_invites for select
  using (public.is_team_admin(team_id));

create policy "invites_select_self" on public.team_invites for select
  using (email = (select email from public.profiles where id = auth.uid()));

create policy "invites_insert_admin" on public.team_invites for insert
  with check (public.is_team_admin(team_id) and invited_by = auth.uid());

create policy "invites_update_admin" on public.team_invites for update
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

-- A própria pessoa convidada pode aceitar (ou recusar) o seu convite pendente
create policy "invites_accept_self" on public.team_invites for update
  using (email = (select email from public.profiles where id = auth.uid()) and status = 'pending')
  with check (email = (select email from public.profiles where id = auth.uid()));

-- 7. Tarefas ganham equipa + responsável — ADITIVO, não mexe no que já existe
alter table public.tasks
  add column if not exists team_id uuid references public.teams (id) on delete set null,
  add column if not exists assigned_to uuid references auth.users (id) on delete set null;

create index if not exists tasks_team_id_idx on public.tasks (team_id);
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);

-- Políticas ADICIONAIS — a política "tasks_all_own" já existente mantém-se
-- intacta; isto só acrescenta mais formas de teres acesso, nunca remove.
create policy "tasks_team_select" on public.tasks for select
  using (
    team_id is not null and (assigned_to = auth.uid() or public.is_team_admin(team_id))
  );

create policy "tasks_team_update" on public.tasks for update
  using (
    team_id is not null and (assigned_to = auth.uid() or public.is_team_admin(team_id))
  )
  with check (
    team_id is not null and (assigned_to = auth.uid() or public.is_team_admin(team_id))
  );
