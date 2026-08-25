"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tasksService } from "@/services/tasks.service";
import { cn } from "@/lib/utils";
import type { TeamMembership } from "@/types/database";

export function TeamTaskCreator({
  teamId,
  membersWithLoad,
  canAssign = true,
}: {
  teamId: string;
  membersWithLoad: { membership: TeamMembership; activeTaskCount: number }[];
  /** Contas "agente" podem criar tarefas, mas nunca atribuir a outra pessoa. */
  canAssign?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [showNote, setShowNote] = useState(false);
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
        description: description.trim() || undefined,
      });
      toast.success("Tarefa criada");
      setTitle("");
      setDueDate("");
      setDescription("");
      setShowNote(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa da equipa..."
          className="flex-1"
        />
        {canAssign && (
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
        )}
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
        <button
          type="button"
          onClick={() => setShowNote((prev) => !prev)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors",
            showNote || description
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          )}
        >
          <FileText className="h-3.5 w-3.5" /> Nota
        </button>
        <Button type="submit" isLoading={isSubmitting}>
          <Plus className="h-4 w-4" /> Criar
        </Button>
      </div>
      {showNote && (
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes ou contexto sobre esta tarefa..."
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      )}
    </form>
  );
}
