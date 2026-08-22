"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tasksService } from "@/services/tasks.service";
import type { TeamMembership } from "@/types/database";

export function TeamTaskCreator({
  teamId,
  membersWithLoad,
}: {
  teamId: string;
  membersWithLoad: { membership: TeamMembership; activeTaskCount: number }[];
}) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await tasksService.createQuickTask({
        title: title.trim(),
        teamId,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
      });
      toast.success("Tarefa criada");
      setTitle("");
      setDueDate("");
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova tarefa da equipa..."
        className="flex-1"
      />
      <select
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
        className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)]"
      >
        <option value="">Sem responsável</option>
        {membersWithLoad.map(({ membership, activeTaskCount }) => (
          <option key={membership.user_id} value={membership.user_id}>
            {membership.profile?.full_name || membership.profile?.email} ({activeTaskCount}{" "}
            {activeTaskCount === 1 ? "tarefa" : "tarefas"})
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1.5">
        <Label htmlFor="team-task-deadline" className="sr-only">
          Prazo
        </Label>
        <Input
          id="team-task-deadline"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        <Plus className="h-4 w-4" /> Criar
      </Button>
    </form>
  );
}
