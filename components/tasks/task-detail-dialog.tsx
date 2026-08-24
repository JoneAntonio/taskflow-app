"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, Upload, Trash2, Download, X, MessageSquare, Activity, CalendarClock } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchedulePopover, type ScheduleValue } from "@/components/tasks/schedule-popover";
import { attachmentsService } from "@/services/attachments.service";
import { taskActionsService } from "@/services/task-actions.service";
import { taskCommentsService } from "@/services/task-comments.service";
import { tasksService } from "@/services/tasks.service";
import { getGravatarUrl } from "@/lib/gravatar";
import type { Task, TaskAttachment, TaskComment, TaskActivity as TaskActivityRow } from "@/types/database";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskDetailDialog({ task, open, onClose }: { task: Task; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleButtonRef = useRef<HTMLButtonElement>(null);
  const [description, setDescription] = useState(task.description ?? "");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [activity, setActivity] = useState<TaskActivityRow[]>([]);
  const router = useRouter();

  const scheduleValue: ScheduleValue = {
    dueDate: task.due_date,
    dueTime: task.due_time,
    dueTimeEnd: task.due_time_end,
    priority: task.priority,
    recurrence: task.recurrence,
    reminderMinutesBefore: null,
    isImportant: task.is_important,
    location: task.location,
    estimatedDurationMinutes: task.estimated_duration_minutes,
    description: task.description,
  };

  async function handleSaveTitle() {
    if (!title.trim() || title.trim() === task.title) return;
    setIsSavingTitle(true);
    try {
      await tasksService.updateTask(task.id, { title: title.trim() });
      toast.success("Título atualizado");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o título.");
      setTitle(task.title);
    } finally {
      setIsSavingTitle(false);
    }
  }

  async function handleScheduleChange(next: ScheduleValue) {
    setScheduleOpen(false);
    try {
      await tasksService.updateTask(task.id, {
        priority: next.priority ?? "sem_prioridade",
        dueDate: next.dueDate,
        dueTime: next.dueTime,
        dueTimeEnd: next.dueTimeEnd,
        recurrence: next.recurrence,
        location: next.location,
        estimatedDurationMinutes: next.estimatedDurationMinutes,
      });
      toast.success("Agendamento atualizado");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o agendamento.");
    }
  }

  useEffect(() => {
    if (!open) return;
    attachmentsService
      .list(task.id)
      .then(setAttachments)
      .catch(() => {});
    taskCommentsService
      .list(task.id)
      .then(setComments)
      .catch(() => {});
    taskCommentsService
      .listActivity(task.id)
      .then(setActivity)
      .catch(() => {});
  }, [open, task.id]);

  async function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!newComment.trim()) return;
    setIsCommenting(true);
    try {
      const created = await taskCommentsService.create(task.id, newComment.trim(), task.team_id);
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch {
      toast.error("Não foi possível publicar o comentário.");
    } finally {
      setIsCommenting(false);
    }
  }

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
    <Dialog open={open} onClose={onClose} title="Editar tarefa" className="max-w-lg">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              disabled={isSavingTitle}
              className="flex-1 text-base font-medium"
            />
            <Button
              ref={scheduleButtonRef}
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setScheduleOpen(true)}
              aria-label="Agendamento"
            >
              <CalendarClock className="h-4 w-4" />
            </Button>
          </div>
          {scheduleOpen && (
            <SchedulePopover
              value={scheduleValue}
              onChange={handleScheduleChange}
              onClose={() => setScheduleOpen(false)}
              anchorRef={scheduleButtonRef}
            />
          )}
          <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
            Clica no ícone de calendário para mudares data, hora, prioridade ou recorrência.
          </p>
        </div>

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

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)]">
            <MessageSquare className="h-3.5 w-3.5" /> Comentários ({comments.length})
          </p>
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-3 text-center text-xs text-[var(--color-ink-muted)]">
                Sem comentários ainda. Usa @Nome para mencionar alguém da equipa.
              </p>
            ) : (
              comments.map((comment) => {
                const avatarUrl = comment.author?.avatar_url || getGravatarUrl(comment.author?.email ?? "", 48);
                return (
                  <div key={comment.id} className="flex items-start gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0 flex-1 rounded-xl bg-[var(--color-surface-alt)] px-3 py-2">
                      <p className="text-xs font-medium text-[var(--color-ink)]">
                        {comment.author?.full_name || comment.author?.email}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm text-[var(--color-ink)]">{comment.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={handleAddComment} className="mt-2 flex items-center gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreve um comentário... use @Nome para mencionar"
              disabled={isCommenting}
              className="h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
            <Button type="submit" size="sm" isLoading={isCommenting} disabled={!newComment.trim()}>
              Enviar
            </Button>
          </form>
        </div>

        {activity.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)]">
              <Activity className="h-3.5 w-3.5" /> Atividade
            </p>
            <div className="space-y-1.5 border-l-2 border-[var(--color-border)] pl-3">
              {activity.map((entry) => (
                <p key={entry.id} className="text-xs text-[var(--color-ink-muted)]">
                  <span className="font-medium text-[var(--color-ink)]">
                    {entry.author?.full_name || entry.author?.email || "Alguém"}
                  </span>{" "}
                  {entry.detail?.toLowerCase() ?? entry.action} ·{" "}
                  {new Date(entry.created_at).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" /> Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
