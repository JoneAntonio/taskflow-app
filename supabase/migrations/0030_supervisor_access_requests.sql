-- ============================================================================
-- JAFLOW — Acesso de Supervisor só por aprovação
-- A partir de agora, contas novas nascem como "agente". Para passar a
-- Supervisor, a pessoa pede — e só um admin de plataforma pode aprovar.
-- Usa um trigger (não só RLS) para comparar o valor ANTIGO com o NOVO e
-- bloquear mesmo a auto-promoção, exceto quando feita por um admin.
-- ============================================================================

alter table public.profiles alter column account_type set default 'agente';

create table public.account_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending', -- pending | approved | denied
  requested_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz
);

create unique index account_access_requests_pending_unique
  on public.account_access_requests (user_id)
  where status = 'pending';

alter table public.account_access_requests enable row level security;

create policy "access_requests_select_own" on public.account_access_requests for select
  using (auth.uid() = user_id or public.is_platform_admin());

create policy "access_requests_insert_own" on public.account_access_requests for insert
  with check (auth.uid() = user_id);

create policy "access_requests_update_admin" on public.account_access_requests for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Impede alguém de se promover a si próprio a "supervisor" — reverte
-- silenciosamente essa mudança específica, a não ser que seja um admin de
-- plataforma a fazê-la (ex: via aprovação de um pedido).
create or replace function public.prevent_self_promote_supervisor()
returns trigger as $$
begin
  if new.account_type = 'supervisor' and old.account_type is distinct from 'supervisor' and not public.is_platform_admin() then
    new.account_type := old.account_type;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_self_promote_supervisor on public.profiles;
create trigger prevent_self_promote_supervisor
  before update on public.profiles
  for each row execute procedure public.prevent_self_promote_supervisor();
