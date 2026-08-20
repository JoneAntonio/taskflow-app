"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Flag, Repeat } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HighlightedQuickInput } from "@/components/tasks/highlighted-quick-input";
import { SchedulePopover, type ScheduleValue } from "@/components/tasks/schedule-popover";
import { parseQuickTask, RECURRENCE_LABELS } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";
import { PRIORITY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const EMPTY_SCHEDULE: ScheduleValue = { dueDate: null, dueTime: null, dueTimeEnd: null, priority: null, recurrence: null };

export function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleValue>(EMPTY_SCHEDULE);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const textParsed = useMemo(() => (value.trim() ? parseQuickTask(value) : null), [value]);

  // Os valores escolhidos manualmente no painel têm prioridade sobre o texto interpretado.
  const effective = {
    dueDate: schedule.dueDate ?? textParsed?.dueDate ?? null,
    dueTime: schedule.dueTime ?? textParsed?.dueTime ?? null,
    dueTimeEnd: schedule.dueTimeEnd ?? textParsed?.dueTimeEnd ?? null,
    priority: schedule.priority ?? textParsed?.priority ?? null,
    recurrence: schedule.recurrence ?? textParsed?.recurrence ?? null,
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = textParsed ?? parseQuickTask(value);
    const title = parsed.title || value.trim();
    if (!title) {
      toast.error("Escreve um título para a tarefa.");
      return;
    }

    setIsSubmitting(true);
    try {
      await tasksService.createQuickTask({
        title,
        priority: effective.priority ?? undefined,
        dueDate: effective.dueDate,
        dueTime: effective.dueTime,
        dueTimeEnd: effective.dueTimeEnd,
        recurrence: effective.recurrence,
        tagNames: parsed.tagNames,
      });
      toast.success("Tarefa adicionada à Inbox");
      setValue("");
      setSchedule(EMPTY_SCHEDULE);
      onClose();
    } catch {
      toast.error("Não foi possível criar a tarefa. Tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setPopoverOpen(false);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Adicionar tarefa"
      description="Escreve em linguagem natural, ou usa os botões abaixo para escolher data, hora, prioridade e repetição."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <HighlightedQuickInput
          value={value}
          onChange={setValue}
          autoFocus
          placeholder="Reunião das 14h às 16h toda sexta-feira #trabalho !alta"
        />

        <div className="relative flex flex-wrap items-center gap-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setPopoverOpen((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              effective.dueDate || effective.dueTime
                ? "border-[var(--color-secondary)] text-[var(--color-secondary)]"
                : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {effective.dueDate ? effective.dueDate : "Data e hora"}
            {effective.dueTime ? ` · ${effective.dueTime}` : ""}
            {effective.dueTimeEnd ? `–${effective.dueTimeEnd}` : ""}
          </button>

          {effective.priority && (
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-warning)] px-3 py-1.5 text-xs font-medium text-[var(--color-warning)]">
              <Flag className="h-3.5 w-3.5" /> {PRIORITY_LABELS[effective.priority]}
            </span>
          )}

          {effective.recurrence?.frequency && (
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-success)] px-3 py-1.5 text-xs font-medium text-[var(--color-success)]">
              <Repeat className="h-3.5 w-3.5" /> {RECURRENCE_LABELS[effective.recurrence.frequency]}
            </span>
          )}

          {popoverOpen && (
            <SchedulePopover
              value={schedule}
              onChange={setSchedule}
              onClose={() => setPopoverOpen(false)}
              anchorRef={triggerRef}
            />
          )}
        </div>

        {textParsed?.tagNames && textParsed.tagNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {textParsed.tagNames.map((tag) => (
              <span key={tag} className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)]">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
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
