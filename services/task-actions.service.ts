import { createClient } from "@/lib/supabase/client";
import { getNextOccurrenceDate } from "@/lib/recurrence";
import type { Task } from "@/types/database";

export const taskActionsService = {
  async toggleImportant(taskId: string, isImportant: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").update({ is_important: isImportant }).eq("id", taskId);
    if (error) throw error;
  },

  /**
   * Marca a tarefa como concluída. Se a tarefa for recorrente, em vez de a
   * arquivar, AVANÇA a data para a próxima ocorrência (mantém-se pendente) —
   * sem isto, "repetir todos os dias" nunca reaparecia no dia seguinte.
   */
  async markComplete(task: Task): Promise<{ recurred: boolean; nextDate?: string }> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (task.recurrence?.frequency && task.due_date) {
      const nextDate = getNextOccurrenceDate(task.due_date, task.recurrence);
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: nextDate, status: "pendente", completed_at: null })
        .eq("id", task.id);
      if (error) throw error;
      await supabase.from("task_activity").insert({
        task_id: task.id,
        user_id: user?.id ?? null,
        action: "concluida",
        detail: `Concluiu esta ocorrência — avançou para ${nextDate}`,
      });
      return { recurred: true, nextDate };
    }

    const { error } = await supabase
      .from("tasks")
      .update({ status: "concluida", completed_at: new Date().toISOString() })
      .eq("id", task.id);
    if (error) throw error;
    await supabase
      .from("task_activity")
      .insert({ task_id: task.id, user_id: user?.id ?? null, action: "concluida", detail: "Marcou como concluída" });
    return { recurred: false };
  },

  async reopenTask(taskId: string): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("tasks")
      .update({ status: "pendente", completed_at: null })
      .eq("id", taskId);
    if (error) throw error;
    await supabase
      .from("task_activity")
      .insert({ task_id: taskId, user_id: user?.id ?? null, action: "reaberta", detail: "Reabriu a tarefa" });
  },

  async deletePermanently(taskId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  },

  async updateDescription(taskId: string, description: string | null): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").update({ description }).eq("id", taskId);
    if (error) throw error;
    await supabase
      .from("task_activity")
      .insert({ task_id: taskId, user_id: user?.id ?? null, action: "nota", detail: "Editou a nota" });
  },
};
