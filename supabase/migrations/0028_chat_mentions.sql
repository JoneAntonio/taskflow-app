-- ============================================================================
-- JAFLOW — Menções no chat de equipa
-- A política de notificações de menção só previa menções em tarefas
-- (related_task_id). Esta migração acrescenta suporte a menções no chat,
-- sem tocar na política existente.
-- ============================================================================

alter table public.notifications
  add column if not exists team_id uuid references public.teams (id) on delete cascade;

create policy "notifications_insert_chat_mention" on public.notifications for insert
  with check (type = 'mencao' and team_id is not null and public.is_team_member(team_id));
