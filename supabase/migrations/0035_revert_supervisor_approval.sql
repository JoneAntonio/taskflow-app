-- ============================================================================
-- JAFLOW — Reverte o pedido de aprovação de Supervisor
-- Contas novas voltam a nascer com acesso total (supervisor), tal como
-- era antes. Remove o bloqueio que impedia mudar isto livremente, e
-- atualiza contas "agente" já existentes de volta a supervisor.
-- ============================================================================

alter table public.profiles alter column account_type set default 'supervisor';

drop trigger if exists prevent_self_promote_supervisor on public.profiles;
drop function if exists public.prevent_self_promote_supervisor();

update public.profiles set account_type = 'supervisor' where account_type = 'agente';
