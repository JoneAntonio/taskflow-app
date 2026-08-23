-- ============================================================================
-- JAFLOW — Unidade de métrica + Valor Atual (separado do Ponto de Partida)
-- Corrige uma confusão conceptual: "current_value" era rotulado como
-- "Ponto de Partida" na interface, mas era usado nos cálculos como se fosse
-- o valor que vai mudando ao longo do tempo. Agora "current_value" fica
-- mesmo fixo (o ponto de partida), e "actual_value" é o valor vivo que se
-- atualiza — sem isso, "progresso" nunca refletia a realidade.
-- ============================================================================

alter table public.projects
  add column if not exists metric_unit text,
  add column if not exists actual_value numeric;
