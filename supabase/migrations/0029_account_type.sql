-- ============================================================================
-- JAFLOW — Tipo de conta: Agente ou Supervisor
-- Agente: acesso limitado a tarefas e gestão de tempo (sem SMART, sem
-- Equipas, sem Maturidade). Supervisor: acesso total.
-- Por defeito fica "supervisor", para não restringir ninguém que já usa a
-- app hoje — cada um escolhe o seu tipo em Perfil.
-- ============================================================================

alter table public.profiles
  add column if not exists account_type text not null default 'supervisor'
  check (account_type in ('agente', 'supervisor'));
