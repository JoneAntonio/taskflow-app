import { OPERATION_COLORS } from "@/types/team-maturity";
import type { TeamOperation } from "@/types/team-maturity";

/**
 * Devolve a cor de uma operação: usa a cor escolhida pelo utilizador se já
 * existir uma operação com esse nome; caso contrário, gera uma cor estável
 * a partir do nome (a mesma operação fica sempre com a mesma cor, mesmo
 * antes de a personalizares na página "Operações").
 */
export function getOperationColor(name: string | null, operations: TeamOperation[]): string {
  if (!name) return "var(--color-ink-muted)";
  const match = operations.find((op) => op.name.toLowerCase() === name.toLowerCase());
  if (match) return match.color;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return OPERATION_COLORS[Math.abs(hash) % OPERATION_COLORS.length];
}
