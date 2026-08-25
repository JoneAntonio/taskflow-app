import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message, Profile } from "@/types/database";

export const chatService = {
  async getOrCreateTeamConversation(teamId: string): Promise<Conversation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from("conversations").select("*").eq("team_id", teamId).maybeSingle();
    if (existing) return existing as Conversation;

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ team_id: teamId })
      .select()
      .single();
    if (error) throw error;
    return created as Conversation;
  },

  async getOrCreateDmConversation(otherUserId: string): Promise<Conversation> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const [a, b] = [user.id, otherUserId].sort();

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("dm_user_a", a)
      .eq("dm_user_b", b)
      .maybeSingle();
    if (existing) return existing as Conversation;

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ dm_user_a: a, dm_user_b: b })
      .select()
      .single();
    if (error) throw error;
    return created as Conversation;
  },

  async listMessages(conversationId: string): Promise<Message[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles(*)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as Message[];
  },

  async sendMessage(conversationId: string, body: string, teamId?: string | null): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, body });
    if (error) throw error;

    if (teamId) {
      try {
        await notifyChatMentions({ teamId, body, authorId: user.id });
      } catch {
        // Uma falha a notificar não deve impedir a mensagem de ficar enviada.
      }
    }
  },

  async listTeamMembersForMentions(teamId: string): Promise<{ user_id: string; profile: Profile }[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("team_memberships")
      .select("user_id, profile:profiles(*)")
      .eq("team_id", teamId);
    return (data ?? []) as unknown as { user_id: string; profile: Profile }[];
  },

  subscribeToMessages(conversationId: string, onMessage: (message: Message) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => onMessage(payload.new as Message)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

async function notifyChatMentions(input: { teamId: string; body: string; authorId: string }) {
  const mentionMatches = [...input.body.matchAll(/@([\p{L}\p{N}._-]+(?:\s[\p{L}\p{N}._-]+)?)/gu)].map((m) => m[1]);
  if (mentionMatches.length === 0) return;

  const supabase = createClient();
  const members = await chatService.listTeamMembersForMentions(input.teamId);

  for (const mention of mentionMatches) {
    const normalized = mention.trim().toLowerCase();
    const match = members.find((m) => m.profile?.full_name?.toLowerCase().startsWith(normalized));
    if (!match || match.user_id === input.authorId) continue;

    await supabase.from("notifications").insert({
      user_id: match.user_id,
      type: "mencao",
      title: "Foste mencionado no chat da equipa",
      body: input.body.slice(0, 140),
      team_id: input.teamId,
    });

    fetch("/api/notifications/mention-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: match.user_id,
        teamId: input.teamId,
        snippet: input.body.slice(0, 200),
        path: `/equipas/${input.teamId}`,
      }),
    }).catch(() => {});
  }
}
