import { MaturityBadge } from "@/components/team/maturity-badge";
import { Card } from "@/components/ui/card";
import type { MaturityEvaluation } from "@/types/team-maturity";

export function EvaluationHistoryList({ evaluations }: { evaluations: MaturityEvaluation[] }) {
  if (evaluations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
        Ainda sem avaliações registadas.
      </p>
    );
  }

  const sorted = [...evaluations].sort(
    (a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((evaluation) => (
        <Card key={evaluation.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MaturityBadge level={evaluation.confirmed_maturity} />
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {evaluation.weighted_result.toFixed(2)} / 5
              </span>
            </div>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {new Date(evaluation.evaluation_date).toLocaleDateString("pt-PT")}
            </span>
          </div>

          {(evaluation.strength || evaluation.improvement_point || evaluation.recommended_action) && (
            <div className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-3 text-sm">
              {evaluation.strength && (
                <p>
                  <span className="font-medium text-[var(--color-ink)]">Ponto forte: </span>
                  <span className="text-[var(--color-ink-muted)]">{evaluation.strength}</span>
                </p>
              )}
              {evaluation.improvement_point && (
                <p>
                  <span className="font-medium text-[var(--color-ink)]">A desenvolver: </span>
                  <span className="text-[var(--color-ink-muted)]">{evaluation.improvement_point}</span>
                </p>
              )}
              {evaluation.recommended_action && (
                <p>
                  <span className="font-medium text-[var(--color-ink)]">Ação: </span>
                  <span className="text-[var(--color-ink-muted)]">{evaluation.recommended_action}</span>
                </p>
              )}
              {evaluation.goal && (
                <p>
                  <span className="font-medium text-[var(--color-ink)]">Objetivo: </span>
                  <span className="text-[var(--color-ink-muted)]">
                    {evaluation.goal}
                    {evaluation.deadline &&
                      ` · até ${new Date(evaluation.deadline).toLocaleDateString("pt-PT")}`}
                  </span>
                </p>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
