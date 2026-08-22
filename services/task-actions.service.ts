import { createClient } from "@/lib/supabase/client";

export const taskActionsService = {
  async toggleImportant(taskId: string, isImportant: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").update({ is_important: isImportant }).eq("id", taskId);
    if (error) throw error;
  },

  async markComplete(taskId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status: "concluida", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) throw error;
  },

  async reopenTask(taskId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status: "pendente", completed_at: null })
      .eq("id", taskId);
    if (error) throw error;
  },

  async deletePermanently(taskId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  },

  async updateDescription(taskId: string, description: string | null): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").update({ description }).eq("id", taskId);
    if (error) throw error;
  },
};
