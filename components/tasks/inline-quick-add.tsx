"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseQuickTask } from "@/utils/parse-quick-task";
import { tasksService } from "@/services/tasks.service";
import { HighlightedQuickInput } from "@/components/tasks/highlighted-quick-input";

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
        dueTimeEnd: parsed.dueTimeEnd,
        recurrence: parsed.recurrence,
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
    <form onSubmit={handleSubmit}>
      <HighlightedQuickInput
        value={value}
        onChange={setValue}
        placeholder={placeholder ?? "Preparar relatório mensal"}
        disabled={isSubmitting}
      />
    </form>
  );
}
