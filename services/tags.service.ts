import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/types/database";

export const TAG_COLORS = ["#3F6FA8", "#F2A93B", "#E2504C", "#3F9E6D", "#8B5CF6", "#EC4899", "#0EA5A5", "#6B7280"];

export const tagsService = {
  async createTag(name: string, color?: string): Promise<Tag> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: name.toLowerCase().trim(), color: color ?? TAG_COLORS[0] })
      .select()
      .single();
    if (error) throw error;
    return data as Tag;
  },

  async deleteTag(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
  },
};
