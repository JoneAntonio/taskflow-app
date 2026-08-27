"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bold, Heading2, List, Eye, EyeOff, Trash2, ArrowLeft } from "lucide-react";
import { notesService } from "@/services/notes.service";
import { renderNoteMarkdown } from "@/lib/simple-markdown";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/database";

export function NoteEditor({ note, onBack, onDeleted }: { note: Note; onBack: () => void; onDeleted: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (title === note.title && content === note.content) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await notesService.update(note.id, { title: title.trim() || "Sem título", content });
        router.refresh();
      } catch {
        toast.error("Não foi possível guardar a nota.");
      }
    }, 800);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  function wrapSelection(before: string, after: string = before) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const next = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + before.length, selectionStart + before.length + selected.length);
    });
  }

  function insertLinePrefix(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, value } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    setContent(next);
    requestAnimationFrame(() => textarea.focus());
  }

  async function handleDelete() {
    if (!confirm("Apagar esta nota?")) return;
    try {
      await notesService.remove(note.id);
      toast.success("Nota apagada");
      onDeleted();
    } catch {
      toast.error("Não foi possível apagar a nota.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] lg:hidden"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da nota"
          className="flex-1 bg-transparent font-display text-lg font-semibold text-[var(--color-ink)] outline-none"
        />
        <button
          onClick={handleDelete}
          className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
          aria-label="Apagar nota"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
        <ToolbarButton icon={Bold} label="Negrito" onClick={() => wrapSelection("**")} />
        <ToolbarButton icon={Heading2} label="Título" onClick={() => insertLinePrefix("## ")} />
        <ToolbarButton icon={List} label="Lista" onClick={() => insertLinePrefix("- ")} />
        <div className="ml-auto">
          <ToolbarButton
            icon={preview ? EyeOff : Eye}
            label={preview ? "Editar" : "Pré-visualizar"}
            onClick={() => setPreview((p) => !p)}
            active={preview}
          />
        </div>
      </div>

      {preview ? (
        <div
          className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink)]"
          dangerouslySetInnerHTML={{
            __html: renderNoteMarkdown(content) || "<p class='text-[var(--color-ink-muted)]'>Nota vazia.</p>",
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreve aqui... usa **negrito**, ## títulos, e - listas."
          className="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      )}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Bold;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
