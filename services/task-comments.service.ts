import { createClient } from "@/lib/supabase/client";
import type { TaskComment, TaskActivity, Profile } from "@/types/database";

export const taskCommentsService = {
  async list(taskId: string): Promise<TaskComment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("task_comments")
      .select("*, author:profiles(*)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as TaskComment[];
  },

  async listActivity(taskId: string): Promise<TaskActivity[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("task_activity")
      .select("*, author:profiles(*)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []) as unknown as TaskActivity[];
  },

  async create(taskId: string, body: string, teamId: string | null): Promise<TaskComment> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("task_comments")
      .insert({ task_id: taskId, user_id: user.id, body })
      .select("*, author:profiles(*)")
      .single();
    if (error) throw error;

    if (teamId) {
      try {
        await notifyMentions({ taskId, teamId, body, authorId: user.id });
      } catch {
        // Uma falha a notificar não deve impedir o comentário de ficar publicado.
      }
    }

    return data as unknown as TaskComment;
  },

  async remove(commentId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("task_comments").delete().eq("id", commentId);
    if (error) throw error;
  },
};

async function notifyMentions(input: { taskId: string; teamId: string; body: string; authorId: string }) {
  const mentionMatches = [...input.body.matchAll(/@([\p{L}\p{N}._-]+(?:\s[\p{L}\p{N}._-]+)?)/gu)].map((m) => m[1]);
  if (mentionMatches.length === 0) return;

  const supabase = createClient();
  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("user_id, profile:profiles(*)")
    .eq("team_id", input.teamId);

  const members = (memberships ?? []) as unknown as { user_id: string; profile: Profile }[];

  for (const mention of mentionMatches) {
    const normalized = mention.trim().toLowerCase();
    const match = members.find((m) => m.profile?.full_name?.toLowerCase().startsWith(normalized));
    if (!match || match.user_id === input.authorId) continue;

    await supabase.from("notifications").insert({
      user_id: match.user_id,
      type: "mencao",
      title: "Foste mencionado numa tarefa",
      body: input.body.slice(0, 140),
      related_task_id: input.taskId,
    });
  }
}
