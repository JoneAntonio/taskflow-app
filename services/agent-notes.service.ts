import { createClient } from "@/lib/supabase/client";
import type { AgentNote } from "@/types/team-maturity";

export const agentNotesService = {
  async list(agentId: string): Promise<AgentNote[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("agent_notes")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AgentNote[];
  },

  async create(agentId: string, note: string): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");
    const { error } = await supabase.from("agent_notes").insert({ agent_id: agentId, user_id: user.id, note });
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("agent_notes").delete().eq("id", id);
    if (error) throw error;
  },
};

export const agentProfileService = {
  async update(
    agentId: string,
    input: Partial<{ phone: string | null; birthday: string | null; startDate: string | null; skills: string[] }>
  ): Promise<void> {
    const supabase = createClient();
    const updates: Record<string, unknown> = {};
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.birthday !== undefined) updates.birthday = input.birthday;
    if (input.startDate !== undefined) updates.start_date = input.startDate;
    if (input.skills !== undefined) updates.skills = input.skills;
    const { error } = await supabase.from("team_agents").update(updates).eq("id", agentId);
    if (error) throw error;
  },
};
