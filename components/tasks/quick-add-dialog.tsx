"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HighlightedQuickInput } from "@/components/tasks/highlighted-quick-input";
import { parseQuickTask, RECURRENCE_LABELS } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";
import { PRIORITY_LABELS } from "@/lib/labels";

export function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(() => (value.trim() ? parseQuickTask(value) : null), [value]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    const parsed = parseQuickTask(value);
    if (!parsed.title) {
      toast.error("Escreve um título para a tarefa.");
      return;
    }

    setIsSubmitting(true);
    try {
      await tasksService.createQuickTask({
        title: parsed.title,
        priority: parsed.priority ?? undefined,
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        dueTimeEnd: parsed.dueTimeEnd,
        recurrence: parsed.recurrence,
        tagNames: parsed.tagNames,
      });
      toast.success("Tarefa adicionada à Inbox");
      setValue("");
      onClose();
    } catch {
      toast.error("Não foi possível criar a tarefa. Tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Adicionar tarefa"
      description="Escreve em linguagem natural — datas, horas, #etiquetas, !prioridade e recorrência são reconhecidas automaticamente."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <HighlightedQuickInput
          value={value}
          onChange={setValue}
          autoFocus
          placeholder="Reunião das 14h às 16h toda sexta-feira #trabalho !alta"
        />

        {preview && (
          <div className="flex flex-wrap gap-2 text-xs">
            {preview.title && (
              <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-ink)]">
                {preview.title}
              </span>
            )}
            {preview.dueDate && (
              <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-secondary)]">
                {preview.dueDate}
                {preview.dueTime ? ` · ${preview.dueTime}` : ""}
                {preview.dueTimeEnd ? `–${preview.dueTimeEnd}` : ""}
              </span>
            )}
            {!preview.dueDate && preview.dueTime && (
              <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-secondary)]">
                {preview.dueTime}
                {preview.dueTimeEnd ? `–${preview.dueTimeEnd}` : ""}
              </span>
            )}
            {preview.priority && (
              <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-warning)]">
                {PRIORITY_LABELS[preview.priority]}
              </span>
            )}
            {preview.recurrence?.frequency && (
              <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-success)]">
                {RECURRENCE_LABELS[preview.recurrence.frequency]}
              </span>
            )}
            {preview.tagNames.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-ink-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Adicionar tarefa
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
