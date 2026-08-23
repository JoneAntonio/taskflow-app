export const METRIC_UNIT_OPTIONS = ["%", "min", "horas", "dias", "€", "Kz", "$", "unidades", "pontos"];

/**
 * Progresso (%) do objetivo SMART, sempre em relação ao PONTO DE PARTIDA —
 * não só à meta. Sem isto, "progresso" não refletia de facto o caminho
 * percorrido desde o início.
 *
 * "Quanto menor, melhor" (ex: reduzir TMA):
 *   Progresso = (PontoPartida − ValorAtual) / (PontoPartida − Meta) × 100
 *
 * "Quanto maior, melhor" (ex: aumentar vendas):
 *   Progresso = (ValorAtual − PontoPartida) / (Meta − PontoPartida) × 100
 *
 * Resultado sempre entre 0 e 100.
 */
export function computeSmartProgress(
  start: number | null,
  target: number | null,
  actual: number | null,
  lowerIsBetter: boolean
): number | null {
  if (start == null || target == null) return null;
  const current = actual ?? start;

  const range = lowerIsBetter ? start - target : target - start;
  if (range === 0) return current === target ? 100 : 0;

  const covered = lowerIsBetter ? start - current : current - start;
  return Math.max(0, Math.min(100, Math.round((covered / range) * 100)));
}

/**
 * Valida a regra: se "quanto menor, melhor" estiver marcado, o ponto de
 * partida tem mesmo de ser maior que a meta (senão não há o que reduzir).
 */
export function validateSmartRange(
  start: number | null,
  target: number | null,
  lowerIsBetter: boolean
): string | null {
  if (start == null || target == null) return null;
  if (lowerIsBetter && start <= target) {
    return "O ponto de partida deve ser maior que a meta, já que reduzir é o objetivo.";
  }
  return null;
}
