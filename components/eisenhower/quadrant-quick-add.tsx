"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { parseQuickTask } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";
import { SchedulePopover, type ScheduleValue } from "@/components/tasks/schedule-popover";
import { cn } from "@/lib/utils";

const EMPTY_SCHEDULE: ScheduleValue = {
  dueDate: null,
  dueTime: null,
  dueTimeEnd: null,
  priority: null,
  recurrence: null,
  reminderMinutesBefore: null,
  isImportant: null,
  location: null,
  estimatedDurationMinutes: null,
};

export function QuadrantQuickAdd({
  important,
  urgent,
  placeholder,
  projectId,
}: {
  important: boolean;
  urgent: boolean;
  placeholder: string;
  projectId?: string | null;
}) {
  const [value, setValue] = useState("");
  const [schedule, setSchedule] = useState<ScheduleValue>(EMPTY_SCHEDULE);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const hasSchedule = schedule.dueDate || schedule.dueTime;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;

    const parsed = parseQuickTask(value);
    if (!parsed.title.trim()) return;

    const dueDate = schedule.dueDate ?? parsed.dueDate;
    const dueTime = schedule.dueTime ?? parsed.dueTime;

    // Se nada indicar urgência (nem o texto, nem uma data/hora escolhida no painel),
    // aplica a urgência do quadrante onde a tarefa está a ser criada.
    const explicitlyUrgent =
      parsed.priority === "alta" || parsed.priority === "urgente" || !!dueDate;
    const priority =
      schedule.priority ?? parsed.priority ?? (urgent && !explicitlyUrgent ? "alta" : !urgent ? "baixa" : undefined);

    let reminderAt: string | null = null;
    if (schedule.reminderMinutesBefore && dueDate && dueTime) {
      const due = new Date(`${dueDate}T${dueTime}:00`);
      due.setMinutes(due.getMinutes() - schedule.reminderMinutesBefore);
      reminderAt = due.toISOString();
    }

    setIsSubmitting(true);
    try {
      await tasksService.createQuickTask({
        title: parsed.title,
        priority,
        dueDate,
        dueTime,
        dueTimeEnd: schedule.dueTimeEnd ?? parsed.dueTimeEnd,
        recurrence: schedule.recurrence ?? parsed.recurrence,
        tagNames: parsed.tagNames,
        isImportant: important,
        location: schedule.location,
        estimatedDurationMinutes: schedule.estimatedDurationMinutes,
        reminderAt,
        projectId: projectId ?? undefined,
      });
      setValue("");
      setSchedule(EMPTY_SCHEDULE);
      toast.success("Tarefa adicionada");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] px-2.5 py-1.5"
      >
        <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="w-full bg-transparent text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] outline-none"
        />
        {value.trim() && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="shrink-0 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent-ink)]"
          >
            {isSubmitting ? "..." : "Criar"}
          </button>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          aria-label="Escolher dia e hora"
          className={cn(
            "shrink-0 rounded-md p-1 transition-colors",
            hasSchedule ? "text-[var(--color-secondary)]" : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" />
        </button>
      </form>

      {hasSchedule && (
        <p className="mt-1 pl-1 text-[10px] text-[var(--color-secondary)]">
          {schedule.dueDate}
          {schedule.dueTime ? ` · ${schedule.dueTime}` : ""}
        </p>
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
  );
}
