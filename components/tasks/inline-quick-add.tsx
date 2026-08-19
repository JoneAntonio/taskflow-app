"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { parseQuickTask } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";

export function InlineQuickAdd({
  placeholder,
  projectId,
}: {
  placeholder?: string;
  projectId?: string;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseQuickTask(value);
    if (!parsed.title.trim()) return;

    setIsSubmitting(true);
    try {
      await tasksService.createQuickTask({
        title: parsed.title,
        priority: parsed.priority ?? undefined,
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        tagNames: parsed.tagNames,
        projectId,
      });
      setValue("");
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3.5 py-2.5 focus-within:border-[var(--color-accent)]"
    >
      <Plus className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? "Preparar relatório mensal"}
        disabled={isSubmitting}
        className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] outline-none"
      />
    </form>
  );
}
