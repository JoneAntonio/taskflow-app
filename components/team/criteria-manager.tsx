"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamMaturityService } from "@/services/team-maturity.service";
import { cn } from "@/lib/utils";
import type { MaturityCriterion } from "@/types/team-maturity";

export function CriteriaManager({ initialCriteria }: { initialCriteria: MaturityCriterion[] }) {
  const [criteria, setCriteria] = useState(initialCriteria);
  const [newName, setNewName] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newInverted, setNewInverted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const totalWeight = useMemo(() => criteria.reduce((sum, c) => sum + c.weight, 0), [criteria]);

  async function handleWeightChange(criterion: MaturityCriterion, weight: number) {
    setCriteria((prev) => prev.map((c) => (c.id === criterion.id ? { ...c, weight } : c)));
    try {
      await teamMaturityService.updateCriterion(criterion.id, { weight });
    } catch {
      toast.error("Não foi possível guardar o peso.");
      router.refresh();
    }
  }

  async function handleToggleInverted(criterion: MaturityCriterion) {
    const inverted = !criterion.inverted;
    setCriteria((prev) => prev.map((c) => (c.id === criterion.id ? { ...c, inverted } : c)));
    try {
      await teamMaturityService.updateCriterion(criterion.id, { inverted });
    } catch {
      toast.error("Não foi possível atualizar o critério.");
      router.refresh();
    }
  }

  async function handleDelete(criterion: MaturityCriterion) {
    if (!confirm(`Remover o critério "${criterion.name}"? As avaliações já feitas mantêm o histórico.`)) return;
    setCriteria((prev) => prev.filter((c) => c.id !== criterion.id));
    try {
      await teamMaturityService.archiveCriterion(criterion.id);
      toast.success("Critério removido");
    } catch {
      toast.error("Não foi possível remover o critério.");
      router.refresh();
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) {
      toast.error("Dá um nome ao critério.");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await teamMaturityService.createCriterion({
        name: newName.trim(),
        weight: Number(newWeight) || 0,
        inverted: newInverted,
      });
      setCriteria((prev) => [...prev, created]);
      setNewName("");
      setNewWeight("");
      setNewInverted(false);
      toast.success("Critério adicionado");
    } catch {
      toast.error("Não foi possível adicionar o critério.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-ink)]">Critérios de avaliação</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            totalWeight === 100
              ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
              : "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
          )}
        >
          Total: {totalWeight}%
        </span>
      </div>
      <p className="mb-4 text-xs text-[var(--color-ink-muted)]">
        Usados em toda nova avaliação de maturidade. O ideal é somarem 100%.
      </p>

      <div className="border-t border-[var(--color-border)]">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] py-2.5">
            <span className="flex-1 text-sm text-[var(--color-ink)]">
              {criterion.name}
              {criterion.inverted && (
                <span className="ml-1.5 text-xs text-[var(--color-ink-muted)]">(invertido)</span>
              )}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
              <input
                type="checkbox"
                checked={criterion.inverted}
                onChange={() => handleToggleInverted(criterion)}
                className="h-3.5 w-3.5 accent-[var(--color-accent)]"
              />
              Menor é melhor
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={criterion.weight}
              onChange={(e) => handleWeightChange(criterion, Number(e.target.value) || 0)}
              className="h-8 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-right text-sm text-[var(--color-ink)]"
            />
            <span className="text-xs text-[var(--color-ink-muted)]">%</span>
            <button
              onClick={() => handleDelete(criterion)}
              aria-label={`Remover ${criterion.name}`}
              className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {criteria.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--color-ink-muted)]">Ainda sem critérios.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome do critério (ex: Ownership)"
          className="flex-1"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          placeholder="Peso %"
          className="w-24"
        />
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <input
            type="checkbox"
            checked={newInverted}
            onChange={(e) => setNewInverted(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          Menor é melhor
        </label>
        <Button type="submit" isLoading={isSubmitting}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </form>
    </div>
  );
}
