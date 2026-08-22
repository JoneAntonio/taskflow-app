import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/types/database";

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

  async sendMessage(conversationId: string, body: string): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, body });
    if (error) throw error;
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
