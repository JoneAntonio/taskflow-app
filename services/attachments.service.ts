import { createClient } from "@/lib/supabase/client";
import type { TaskAttachment } from "@/types/database";

const BUCKET = "task-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const attachmentsService = {
  async list(taskId: string): Promise<TaskAttachment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as TaskAttachment[];
  },

  async upload(taskId: string, file: File): Promise<TaskAttachment> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Ficheiro demasiado grande (máximo 10MB).");
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${taskId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("task_attachments")
      .insert({
        task_id: taskId,
        user_id: user.id,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as TaskAttachment;
  },

  async getDownloadUrl(filePath: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 60 * 5);
    if (error) throw error;
    return data.signedUrl;
  },

  async remove(attachment: TaskAttachment): Promise<void> {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([attachment.file_path]);
    const { error } = await supabase.from("task_attachments").delete().eq("id", attachment.id);
    if (error) throw error;
  },
};
