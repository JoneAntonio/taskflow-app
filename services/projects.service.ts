import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types/database";

export const projectsService = {
  async createProject(input: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string | null;
  }): Promise<Project> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? "#3F6FA8",
        icon: input.icon ?? "folder",
        parent_id: input.parentId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  async updateProject(
    id: string,
    input: Partial<Pick<Project, "name" | "description" | "color" | "icon">> & { parentId?: string | null }
  ): Promise<void> {
    const supabase = createClient();
    const { parentId, ...rest } = input;
    const { error } = await supabase
      .from("projects")
      .update({ ...rest, ...(parentId !== undefined ? { parent_id: parentId } : {}) })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteProject(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};

export const PROJECT_COLORS = [
  "#3F6FA8",
  "#F2A93B",
  "#E2504C",
  "#3F9E6D",
  "#8B5CF6",
  "#EC4899",
  "#0EA5A5",
  "#6B7280",
];
