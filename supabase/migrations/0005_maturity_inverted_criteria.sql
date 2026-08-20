-- ============================================================================
-- JAFLOW — Suporte a critérios invertidos na Maturidade da Equipa
-- Alguns critérios (ex: TMA — Tempo Médio de Atendimento) têm a lógica
-- invertida: quanto maior o valor, pior o desempenho. Esta coluna permite
-- marcar esses critérios para que o cálculo ponderado os trate corretamente.
-- ============================================================================

alter table public.maturity_criteria
  add column if not exists inverted boolean not null default false;

-- Marca o critério "TMA" já existente (se houver) como invertido.
update public.maturity_criteria set inverted = true where lower(name) = 'tma';
