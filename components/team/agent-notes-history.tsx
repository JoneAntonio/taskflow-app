"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, MessageSquarePlus } from "lucide-react";
import { agentNotesService } from "@/services/agent-notes.service";
import type { AgentNote } from "@/types/team-maturity";

export function AgentNotesHistory({ agentId, notes }: { agentId: string; notes: AgentNote[] }) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await agentNotesService.create(agentId, newNote.trim());
      setNewNote("");
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar a nota.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await agentNotesService.remove(id);
      router.refresh();
    } catch {
      toast.error("Não foi possível apagar.");
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Regista uma nota de 1-para-1, feedback dado, ou algo importante..."
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newNote.trim()}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3 text-sm font-medium text-[var(--color-accent-ink)] disabled:opacity-50"
        >
          <MessageSquarePlus className="h-4 w-4" /> Registar
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
          Ainda sem notas registadas para esta pessoa.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-[var(--color-ink)]">{note.note}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  {new Date(note.created_at).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="hidden shrink-0 rounded p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] group-hover:block"
                aria-label="Apagar nota"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
