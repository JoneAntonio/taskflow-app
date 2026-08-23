-- ============================================================================
-- JAFLOW — Adiciona o tipo de notificação para transições de maturidade
-- (separado do trigger que a usa, numa migração à parte)
-- ============================================================================

alter type notification_type add value if not exists 'transicao_maturidade';
