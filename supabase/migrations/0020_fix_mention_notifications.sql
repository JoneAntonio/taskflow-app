-- ============================================================================
-- JAFLOW — Corrige notificações de menção
-- A política "notifications_all_own" só deixava cada um criar notificações
-- para si próprio. Isso bloqueava a funcionalidade de menções (@Nome), que
-- precisa de notificar OUTRA pessoa. Esta política adicional só permite
-- isso para notificações de menção ligadas a uma tarefa a que já tens
-- acesso — não abre a porta a notificações arbitrárias para qualquer um.
-- ============================================================================

create policy "notifications_insert_mention" on public.notifications for insert
  with check (type = 'mencao' and related_task_id is not null and public.can_access_task(related_task_id));
