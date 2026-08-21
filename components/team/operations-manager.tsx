"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamOperationsService } from "@/services/team-operations.service";
import { OPERATION_COLORS } from "@/types/team-maturity";
import { cn } from "@/lib/utils";
import type { TeamOperation } from "@/types/team-maturity";

export function OperationsManager({ initialOperations }: { initialOperations: TeamOperation[] }) {
  const [operations, setOperations] = useState(initialOperations);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(OPERATION_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleColorChange(operation: TeamOperation, color: string) {
    setOperations((prev) => prev.map((op) => (op.id === operation.id ? { ...op, color } : op)));
    try {
      await teamOperationsService.updateOperation(operation.id, { color });
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar a cor.");
    }
  }

  async function handleDelete(operation: TeamOperation) {
    if (
      !confirm(
        `Remover "${operation.name}" da lista de operações? Os agentes mantêm o texto, só perdem a cor personalizada.`
      )
    )
      return;
    setOperations((prev) => prev.filter((op) => op.id !== operation.id));
    try {
      await teamOperationsService.deleteOperation(operation.id);
      toast.success("Operação removida");
      router.refresh();
    } catch {
      toast.error("Não foi possível remover.");
      router.refresh();
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await teamOperationsService.createOperation(newName.trim(), newColor);
      setOperations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "pt")));
      setNewName("");
      toast.success("Operação criada");
      router.refresh();
    } catch {
      toast.error("Não foi possível criar (talvez já exista uma com este nome).");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="mb-1 text-sm font-medium text-[var(--color-ink)]">Operações</p>
      <p className="mb-4 text-xs text-[var(--color-ink-muted)]">
        A cor escolhida aqui aparece em todos os agentes dessa operação.
      </p>

      <div className="space-y-2">
        {operations.map((operation) => (
          <div
            key={operation.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2"
          >
            <span className="flex-1 text-sm text-[var(--color-ink)]">{operation.name}</span>
            <div className="flex gap-1">
              {OPERATION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorChange(operation, c)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-transform",
                    operation.color === c ? "scale-110 border-[var(--color-ink)]" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <button
              onClick={() => handleDelete(operation)}
              aria-label={`Remover ${operation.name}`}
              className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {operations.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--color-ink-muted)]">
            Ainda sem operações personalizadas — os nomes que escreveres ao criar agentes já ganham uma cor automática.
          </p>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da operação (ex: SIMAR)"
          className="flex-1"
        />
        <div className="flex gap-1">
          {OPERATION_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                newColor === c ? "scale-110 border-[var(--color-ink)]" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </form>
    </div>
  );
}
