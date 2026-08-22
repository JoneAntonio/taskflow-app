-- ============================================================================
-- JAFLOW — Convite por link partilhável
-- Além do convite por email, um admin pode gerar um link (com token) que
-- qualquer pessoa pode usar para entrar na equipa, sem precisar de indicar
-- o email antecipadamente. Fica válido até expirar ou ser revogado.
-- ============================================================================

alter table public.team_invites
  alter column email drop not null,
  add column if not exists token text unique,
  add column if not exists expires_at timestamptz;

-- Permite a QUALQUER utilizador autenticado ler um convite-por-link pendente
-- pelo token (necessário para mostrar o nome da equipa antes de aceitar,
-- mesmo sem ainda ser membro). Convites por email (sem token) continuam
-- protegidos pelas políticas existentes.
create policy "invites_select_by_token" on public.team_invites for select
  using (token is not null and status = 'pending');
