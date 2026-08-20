"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaturityBadge } from "@/components/team/maturity-badge";
import { teamMaturityService } from "@/services/team-maturity.service";
import { maturityFromScore, MATURITY_LEVELS, type MaturityCriterion, type MaturityLevel } from "@/types/team-maturity";

export function NewEvaluationDialog({
  open,
  onClose,
  agentId,
  criteria,
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  criteria: MaturityCriterion[];
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(criteria.map((c) => [c.id, 3]))
  );
  const [strength, setStrength] = useState("");
  const [improvementPoint, setImprovementPoint] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [responsible, setResponsible] = useState("");
  const [confirmedMaturity, setConfirmedMaturity] = useState<MaturityLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 100;
  const weightedResult = useMemo(() => {
    const sum = criteria.reduce((acc, c) => {
      const raw = scores[c.id] ?? 0;
      const effective = c.inverted ? 6 - raw : raw;
      return acc + effective * c.weight;
    }, 0);
    return sum / totalWeight;
  }, [criteria, scores, totalWeight]);
  const recommendedMaturity = maturityFromScore(weightedResult);
  const finalMaturity = confirmedMaturity ?? recommendedMaturity;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await teamMaturityService.createEvaluation({
        agentId,
        scores: criteria.map((c) => ({
          criterion_id: c.id,
          name: c.name,
          weight: c.weight,
          inverted: c.inverted,
          score: scores[c.id] ?? 0,
        })),
        confirmedMaturity: finalMaturity,
        strength: strength || undefined,
        improvementPoint: improvementPoint || undefined,
        recommendedAction: recommendedAction || undefined,
        goal: goal || undefined,
        deadline: deadline || undefined,
        responsible: responsible || undefined,
      });
      toast.success("Avaliação registada");
      onClose();
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar a avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nova avaliação"
      description="Atribui uma pontuação de 1 a 5 a cada critério."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
        <div className="space-y-4">
          {criteria.map((criterion) => (
            <div key={criterion.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-ink)]">
                  {criterion.name}{" "}
                  <span className="text-xs font-normal text-[var(--color-ink-muted)]">
                    ({criterion.weight}%)
                  </span>
                  {criterion.inverted && (
                    <span className="ml-1.5 rounded-full bg-[var(--color-surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink-muted)]">
                      quanto menor, melhor
                    </span>
                  )}
                </span>
                <span className="font-mono-data text-[var(--color-ink-muted)]">
                  {(scores[criterion.id] ?? 0).toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={scores[criterion.id] ?? 3}
                onChange={(event) =>
                  setScores((prev) => ({ ...prev, [criterion.id]: Number(event.target.value) }))
                }
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-ink-muted)]">Resultado ponderado</p>
              <p className="font-display text-2xl font-semibold text-[var(--color-ink)]">
                {weightedResult.toFixed(2)} / 5
              </p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-xs text-[var(--color-ink-muted)]">Maturidade recomendada</p>
              <MaturityBadge level={recommendedMaturity} size="lg" />
            </div>
          </div>

          <div className="mt-4">
            <Label>Maturidade confirmada (o supervisor pode ajustar)</Label>
            <div className="flex gap-1.5">
              {MATURITY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfirmedMaturity(level)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition-colors ${
                    finalMaturity === level
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                      : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Ficha de desenvolvimento (opcional)
          </p>
          <div>
            <Label htmlFor="strength">Ponto forte</Label>
            <Input id="strength" value={strength} onChange={(e) => setStrength(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="improvement">Ponto a desenvolver</Label>
            <Input id="improvement" value={improvementPoint} onChange={(e) => setImprovementPoint(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="action">Ação recomendada</Label>
            <Input id="action" value={recommendedAction} onChange={(e) => setRecommendedAction(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="goal">Objetivo</Label>
              <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="deadline">Prazo</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="responsible">Responsável</Label>
            <Input id="responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar avaliação
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
