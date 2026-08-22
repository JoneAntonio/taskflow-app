-- ============================================================================
-- JAFLOW — Fase 1: Fundação multi-utilizador (equipas, membros, convites)
-- ============================================================================

create type team_role as enum ('admin', 'member');
create type invite_status as enum ('pending', 'accepted', 'revoked');

-- ----------------------------------------------------------------------------
-- PLATFORM_ADMINS — admins de topo, acima de qualquer equipa
-- ----------------------------------------------------------------------------
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Função auxiliar (SECURITY DEFINER) para evitar recursão nas políticas RLS.
create function public.is_platform_admin(check_user_id uuid)
returns boolean as $$
  select exists (select 1 from public.platform_admins where user_id = check_user_id);
$$ language sql security definer stable set search_path = public;

-- ----------------------------------------------------------------------------
-- TEAMS
-- ----------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TEAM_MEMBERSHIPS
-- ----------------------------------------------------------------------------
create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role team_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create function public.is_team_member(check_team_id uuid, check_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_memberships
    where team_id = check_team_id and user_id = check_user_id
  );
$$ language sql security definer stable set search_path = public;

create function public.is_team_admin(check_team_id uuid, check_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_memberships
    where team_id = check_team_id and user_id = check_user_id and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

-- ----------------------------------------------------------------------------
-- TEAM_INVITES
-- ----------------------------------------------------------------------------
create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text not null,
  role team_role not null default 'member',
  invited_by uuid not null references auth.users (id),
  status invite_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index team_invites_email_idx on public.team_invites (email);

-- Quando um convite é aceite (via callback de auth), cria a membership automaticamente.
create function public.accept_pending_invites()
returns trigger as $$
begin
  insert into public.team_memberships (team_id, user_id, role)
  select team_id, new.id, role
  from public.team_invites
  where email = new.email and status = 'pending'
  on conflict (team_id, user_id) do nothing;

  update public.team_invites
  set status = 'accepted'
  where email = new.email and status = 'pending';

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_user_created_accept_invites
  after insert on public.profiles
  for each row execute procedure public.accept_pending_invites();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.platform_admins enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.team_invites enable row level security;

-- PLATFORM_ADMINS: qualquer admin de plataforma pode gerir a lista.
create policy "platform_admins_select" on public.platform_admins for select
  using (public.is_platform_admin(auth.uid()));
create policy "platform_admins_insert" on public.platform_admins for insert
  with check (public.is_platform_admin(auth.uid()));
create policy "platform_admins_delete" on public.platform_admins for delete
  using (public.is_platform_admin(auth.uid()));

-- TEAMS: membros veem a própria equipa; admins de plataforma veem todas; qualquer
-- utilizador autenticado pode criar uma equipa nova (torna-se admin dela a seguir).
create policy "teams_select" on public.teams for select
  using (public.is_team_member(id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "teams_insert" on public.teams for insert
  with check (auth.uid() = created_by);
create policy "teams_update" on public.teams for update
  using (public.is_team_admin(id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "teams_delete" on public.teams for delete
  using (public.is_team_admin(id, auth.uid()) or public.is_platform_admin(auth.uid()));

-- TEAM_MEMBERSHIPS: membros da equipa veem-se uns aos outros; admins gerem.
create policy "team_memberships_select" on public.team_memberships for select
  using (public.is_team_member(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "team_memberships_insert" on public.team_memberships for insert
  with check (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "team_memberships_update" on public.team_memberships for update
  using (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "team_memberships_delete" on public.team_memberships for delete
  using (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));

-- TEAM_INVITES: só admins da equipa (ou da plataforma) gerem convites.
create policy "team_invites_select" on public.team_invites for select
  using (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "team_invites_insert" on public.team_invites for insert
  with check (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "team_invites_update" on public.team_invites for update
  using (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "team_invites_delete" on public.team_invites for delete
  using (public.is_team_admin(team_id, auth.uid()) or public.is_platform_admin(auth.uid()));

-- ============================================================================
-- IMPORTANTE — passo manual único:
-- Depois de correr esta migração, promove-te a ti (e a quem mais quiseres) a
-- admin da plataforma. Vai a Authentication > Users no Supabase, copia o teu
-- UID, e corre (substituindo o valor):
--
--   insert into public.platform_admins (user_id) values ('o-teu-uid-aqui');
--
-- Sem isto, ninguém consegue aceder a /admin (é mesmo assim de propósito —
-- ninguém se pode autopromover só por escrever código no browser).
-- ============================================================================
