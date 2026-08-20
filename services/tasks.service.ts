import { createClient } from "@/lib/supabase/client";
import type { Task, TaskPriority, Recurrence } from "@/types/database";

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  projectId?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  dueTimeEnd?: string | null;
  recurrence?: Recurrence | null;
  priority?: TaskPriority;
  tagNames?: string[];
  isImportant?: boolean;
  reminderAt?: string | null;
  location?: string | null;
}

/**
 * Camada de serviço de tarefas. Fase 1: apenas a criação rápida (Inbox),
 * usada para validar a integração ponta-a-ponta entre a UI e o Supabase.
 * O CRUD completo (editar, concluir, eliminar, subtarefas, filtros) é
 * implementado na Fase 2.
 */
export const tasksService = {
  async createQuickTask(input: CreateTaskInput): Promise<Task> {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Utilizador não autenticado");

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description ?? null,
        project_id: input.projectId ?? null,
        due_date: input.dueDate ?? null,
        due_time: input.dueTime ?? null,
        due_time_end: input.dueTimeEnd ?? null,
        recurrence: input.recurrence ?? null,
        priority: input.priority ?? "sem_prioridade",
        status: "pendente",
        is_important: input.isImportant ?? false,
        reminder_at: input.reminderAt ?? null,
        location: input.location ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    if (input.tagNames && input.tagNames.length > 0) {
      await attachTagsByName(user.id, task.id, input.tagNames);
    }

    return task as Task;
  },
};

async function attachTagsByName(userId: string, taskId: string, tagNames: string[]) {
  const supabase = createClient();

  const tagIds: string[] = [];
  for (const name of tagNames) {
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      tagIds.push(existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("tags")
        .insert({ user_id: userId, name })
        .select("id")
        .single();
      if (!error && created) tagIds.push(created.id);
    }
  }

  if (tagIds.length > 0) {
    await supabase.from("task_tags").insert(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })));
  }
}
