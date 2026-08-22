-- ============================================================================
-- JAFLOW — Corrige o enum de tipos de notificação
-- O tipo "notification_type" só tinha 'lembrete', 'sistema' e 'recorrencia'.
-- As menções (@Nome) e os alertas de prazo do cron usam valores novos que
-- precisam de ser adicionados ao enum antes de poderem ser gravados.
-- ============================================================================

alter type notification_type add value if not exists 'mencao';
alter type notification_type add value if not exists 'alerta_prazo';
