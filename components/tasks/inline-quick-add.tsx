"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { parseQuickTask } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";
import { HighlightedQuickInput } from "@/components/tasks/highlighted-quick-input";
import { SchedulePopover, type ScheduleValue } from "@/components/tasks/schedule-popover";
import { QuickCreatePill } from "@/components/tasks/quick-create-pill";
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

export function InlineQuickAdd({
  placeholder,
  projectId,
}: {
  placeholder?: string;
  projectId?: string;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleValue>(EMPTY_SCHEDULE);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const textParsed = useMemo(() => (value.trim() ? parseQuickTask(value) : null), [value]);
  const hasSchedule = schedule.dueDate || schedule.dueTime || schedule.priority || schedule.reminderMinutesBefore;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = textParsed ?? parseQuickTask(value);
    if (!parsed.title.trim()) return;

    const dueDate = schedule.dueDate ?? parsed.dueDate;
    const dueTime = schedule.dueTime ?? parsed.dueTime;
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
        priority: schedule.priority ?? parsed.priority ?? undefined,
        dueDate,
        dueTime,
        dueTimeEnd: schedule.dueTimeEnd ?? parsed.dueTimeEnd,
        recurrence: schedule.recurrence ?? parsed.recurrence,
        tagNames: parsed.tagNames,
        projectId,
        reminderAt,
        isImportant: schedule.isImportant ?? undefined,
        location: schedule.location,
        estimatedDurationMinutes: schedule.estimatedDurationMinutes,
      });
      setValue("");
      setSchedule(EMPTY_SCHEDULE);
      toast.success("Tarefa adicionada");
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex-1">
        <HighlightedQuickInput
          value={value}
          onChange={setValue}
          placeholder={placeholder ?? "Preparar relatório mensal"}
          disabled={isSubmitting}
        />
      </div>
      <QuickCreatePill visible={!!value.trim()} isLoading={isSubmitting} />
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          aria-label="Data, prioridade e mais"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
            hasSchedule
              ? "border-[var(--color-secondary)] text-[var(--color-secondary)]"
              : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          )}
        >
          <CalendarClock className="h-4 w-4" />
        </button>
        {popoverOpen && (
          <SchedulePopover
            value={schedule}
            onChange={setSchedule}
            onClose={() => setPopoverOpen(false)}
            anchorRef={triggerRef}
          />
        )}
      </div>
    </form>
  );
}
