"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, Upload, Trash2, Download, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { attachmentsService } from "@/services/attachments.service";
import { taskActionsService } from "@/services/task-actions.service";
import type { Task, TaskAttachment } from "@/types/database";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskDetailDialog({ task, open, onClose }: { task: Task; open: boolean; onClose: () => void }) {
  const [description, setDescription] = useState(task.description ?? "");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    attachmentsService
      .list(task.id)
      .then(setAttachments)
      .catch(() => {});
  }, [open, task.id]);

  async function handleSaveNote() {
    setIsSavingNote(true);
    try {
      await taskActionsService.updateDescription(task.id, description.trim() || null);
      toast.success("Nota guardada");
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar a nota.");
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const attachment = await attachmentsService.upload(task.id, file);
      setAttachments((prev) => [attachment, ...prev]);
      toast.success("Ficheiro anexado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível anexar o ficheiro.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(attachment: TaskAttachment) {
    try {
      const url = await attachmentsService.getDownloadUrl(attachment.file_path);
      window.open(url, "_blank");
    } catch {
      toast.error("Não foi possível abrir o ficheiro.");
    }
  }

  async function handleRemove(attachment: TaskAttachment) {
    if (!confirm(`Remover "${attachment.file_name}"?`)) return;
    try {
      await attachmentsService.remove(attachment);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      toast.success("Ficheiro removido");
    } catch {
      toast.error("Não foi possível remover o ficheiro.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={task.title} className="max-w-lg">
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-xs font-medium text-[var(--color-ink-muted)]">Nota</p>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes, contexto ou instruções sobre esta tarefa..."
            className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={handleSaveNote} isLoading={isSavingNote}>
              Guardar nota
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)]">
              <Paperclip className="h-3.5 w-3.5" /> Anexos ({attachments.length})
            </p>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]">
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? "A enviar..." : "Anexar ficheiro"}
              <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
          </div>

          {attachments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-ink-muted)]">
              Sem anexos ainda. Máximo 10MB por ficheiro.
            </p>
          ) : (
            <div className="space-y-1.5">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--color-ink)]">{attachment.file_name}</p>
                    <p className="text-[10px] text-[var(--color-ink-muted)]">{formatBytes(attachment.file_size)}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(attachment)}
                    aria-label="Transferir"
                    className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(attachment)}
                    aria-label="Remover"
                    className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" /> Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
