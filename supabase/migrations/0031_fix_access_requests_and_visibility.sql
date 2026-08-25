-- ============================================================================
-- JAFLOW — Duas correções importantes
--
-- 1. account_access_requests tinha o mesmo erro que já corrigimos noutras
--    tabelas: faltava a ligação direta a "profiles", por isso o painel de
--    aprovação nunca mostrava os pedidos (falhava silenciosamente).
--
-- 2. is_team_admin()/is_team_member() davam acesso automático a QUALQUER
--    equipa a quem fosse admin de plataforma. Isso fazia com que um admin
--    de plataforma visse todas as equipas de todos, mesmo sem ser membro.
--    Cada supervisor deve só ver as equipas onde é mesmo membro/admin.
-- ============================================================================

alter table public.account_access_requests
  add constraint account_access_requests_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

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
  );
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
  );
$$;

-- ============================================================================
-- Reforço do lado do servidor: contas "agente" nunca podem atribuir uma
-- tarefa a outra pessoa, mesmo que tentem contornar a interface.
-- ============================================================================
create or replace function public.prevent_agent_assign_others()
returns trigger as $$
declare
  creator_account_type text;
begin
  if new.assigned_to is not null and new.assigned_to is distinct from new.user_id then
    select account_type into creator_account_type from public.profiles where id = auth.uid();
    if creator_account_type = 'agente' then
      new.assigned_to := new.user_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_agent_assign_others on public.tasks;
create trigger prevent_agent_assign_others
  before insert or update on public.tasks
  for each row execute procedure public.prevent_agent_assign_others();
