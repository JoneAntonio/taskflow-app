import { createClient } from "@/lib/supabase/client";
import type { TeamOperation } from "@/types/team-maturity";

export const teamOperationsService = {
  async listOperations(): Promise<TeamOperation[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("team_operations").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as TeamOperation[];
  },

  async createOperation(name: string, color: string): Promise<TeamOperation> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("team_operations")
      .insert({ user_id: user.id, name: name.trim(), color })
      .select()
      .single();
    if (error) throw error;
    return data as TeamOperation;
  },

  async updateOperation(id: string, input: Partial<{ name: string; color: string }>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("team_operations").update(input).eq("id", id);
    if (error) throw error;
  },

  async deleteOperation(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("team_operations").delete().eq("id", id);
    if (error) throw error;
  },
};
