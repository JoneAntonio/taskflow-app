import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/types/database";

export const notesService = {
  async list(): Promise<Note[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("notes").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Note[];
  },

  async create(notebookId: string | null): Promise<Note> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: user.id, notebook_id: notebookId, title: "Sem título", content: "" })
      .select()
      .single();
    if (error) throw error;
    return data as Note;
  },

  async update(
    id: string,
    input: Partial<{ title: string; content: string; notebookId: string | null }>
  ): Promise<void> {
    const supabase = createClient();
    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.content !== undefined) updates.content = input.content;
    if (input.notebookId !== undefined) updates.notebook_id = input.notebookId;
    const { error } = await supabase.from("notes").update(updates).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) throw error;
  },
};
