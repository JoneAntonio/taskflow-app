import { createClient } from "@/lib/supabase/client";
import type { Notebook } from "@/types/database";

export const NOTEBOOK_COLORS = ["#3F6FA8", "#F2A93B", "#3F9E6D", "#E2504C", "#8B5CF6", "#0EA5A5"];

export const notebooksService = {
  async list(): Promise<Notebook[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("notebooks").select("*").order("position").order("created_at");
    if (error) throw error;
    return (data ?? []) as Notebook[];
  },

  async create(name: string, color: string): Promise<Notebook> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("notebooks")
      .insert({ user_id: user.id, name, color })
      .select()
      .single();
    if (error) throw error;
    return data as Notebook;
  },

  async rename(id: string, name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("notebooks").update({ name }).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("notebooks").delete().eq("id", id);
    if (error) throw error;
  },
};
