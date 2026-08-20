"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { parseQuickTask } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";

export function QuadrantQuickAdd({
  important,
  urgent,
  placeholder,
}: {
  important: boolean;
  urgent: boolean;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;

    const parsed = parseQuickTask(value);
    if (!parsed.title.trim()) return;

    // Se o texto não trouxer indicação própria de urgência, aplica a do quadrante:
    // prioridade "alta" força urgente; "baixa" força não-urgente (na ausência de data/prioridade explícita).
    const parsedIsUrgent = parsed.priority === "alta" || parsed.priority === "urgente" || !!parsed.dueDate;
    const priority = parsed.priority ?? (urgent && !parsedIsUrgent ? "alta" : !urgent ? "baixa" : undefined);

    setIsSubmitting(true);
    try {
      await tasksService.createQuickTask({
        title: parsed.title,
        priority,
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        dueTimeEnd: parsed.dueTimeEnd,
        recurrence: parsed.recurrence,
        tagNames: parsed.tagNames,
        isImportant: important,
      });
      setValue("");
      toast.success("Tarefa adicionada");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
    </form>
  );
}
