"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Notebook as NotebookIcon, FileText, Trash2 } from "lucide-react";
import { notebooksService, NOTEBOOK_COLORS } from "@/services/notebooks.service";
import { notesService } from "@/services/notes.service";
import { NoteEditor } from "@/components/notes/note-editor";
import { cn } from "@/lib/utils";
import type { Notebook, Note } from "@/types/database";

export function NotesView({ notebooks, notes }: { notebooks: Notebook[]; notes: Note[] }) {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | "all" | null>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const router = useRouter();

  const visibleNotes =
    selectedNotebookId === "all" ? notes : notes.filter((n) => n.notebook_id === selectedNotebookId);
  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  async function handleCreateNotebook(event: React.FormEvent) {
    event.preventDefault();
    if (!newNotebookName.trim()) return;
    try {
      const color = NOTEBOOK_COLORS[notebooks.length % NOTEBOOK_COLORS.length];
      await notebooksService.create(newNotebookName.trim(), color);
      setNewNotebookName("");
      setIsCreatingNotebook(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível criar o caderno.");
    }
  }

  async function handleDeleteNotebook(notebook: Notebook, event: React.MouseEvent) {
    event.stopPropagation();
    if (!confirm(`Apagar o caderno "${notebook.name}"? As notas lá dentro ficam sem caderno.`)) return;
    try {
      await notebooksService.remove(notebook.id);
      if (selectedNotebookId === notebook.id) setSelectedNotebookId("all");
      router.refresh();
    } catch {
      toast.error("Não foi possível apagar o caderno.");
    }
  }

  async function handleCreateNote() {
    try {
      const notebookId = selectedNotebookId === "all" ? null : selectedNotebookId;
      const note = await notesService.create(notebookId);
      setSelectedNoteId(note.id);
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a nota.");
    }
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_280px_1fr] lg:items-start">
      {/* Cadernos */}
      <div className="min-w-0 space-y-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Cadernos</p>
        <button
          onClick={() => {
            setSelectedNotebookId("all");
            setSelectedNoteId(null);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
            selectedNotebookId === "all"
              ? "bg-[var(--color-accent)]/10 font-medium text-[var(--color-ink)]"
              : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
          )}
        >
          <FileText className="h-4 w-4" /> Todas as notas
        </button>
        {notebooks.map((notebook) => (
          <button
            key={notebook.id}
            onClick={() => {
              setSelectedNotebookId(notebook.id);
              setSelectedNoteId(null);
            }}
            className={cn(
              "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selectedNotebookId === notebook.id
                ? "bg-[var(--color-accent)]/10 font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
            )}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: notebook.color }} />
            <span className="flex-1 truncate">{notebook.name}</span>
            <span
              onClick={(e) => handleDeleteNotebook(notebook, e)}
              className="hidden shrink-0 rounded p-0.5 hover:text-[var(--color-danger)] group-hover:block"
            >
              <Trash2 className="h-3 w-3" />
            </span>
          </button>
        ))}

        {isCreatingNotebook ? (
          <form onSubmit={handleCreateNotebook} className="px-1 pt-1">
            <input
              autoFocus
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onBlur={() => !newNotebookName.trim() && setIsCreatingNotebook(false)}
              placeholder="Nome do caderno"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingNotebook(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
          >
            <Plus className="h-4 w-4" /> Novo caderno
          </button>
        )}
      </div>

      {/* Lista de notas */}
      <div className="min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Notas · {visibleNotes.length}
          </p>
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent-ink)]"
          >
            <Plus className="h-3 w-3" /> Nova
          </button>
        </div>
        {visibleNotes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-xs text-[var(--color-ink-muted)]">
            Sem notas aqui ainda.
          </p>
        ) : (
          <div className="space-y-1.5">
            {visibleNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "block w-full rounded-lg border px-3 py-2 text-left transition-colors",
                  selectedNoteId === note.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-transparent bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                )}
              >
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">{note.title}</p>
                <p className="truncate text-xs text-[var(--color-ink-muted)]">
                  {note.content.slice(0, 60).replace(/[#*-]/g, "") || "Nota vazia"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="min-h-[400px] min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 lg:sticky lg:top-20">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onBack={() => setSelectedNoteId(null)}
            onDeleted={() => {
              setSelectedNoteId(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
            <NotebookIcon className="h-8 w-8 text-[var(--color-ink-muted)]" />
            <p className="text-sm text-[var(--color-ink-muted)]">Escolhe uma nota, ou cria uma nova.</p>
          </div>
        )}
      </div>
    </div>
  );
}
