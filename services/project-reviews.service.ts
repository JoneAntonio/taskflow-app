import { createClient } from "@/lib/supabase/client";
import type { ProjectReview } from "@/types/database";

export const projectReviewsService = {
  async listReviews(projectId: string): Promise<ProjectReview[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("project_reviews")
      .select("*")
      .eq("project_id", projectId)
      .order("review_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProjectReview[];
  },

  async createReview(input: {
    projectId: string;
    planText?: string;
    doText?: string;
    checkText?: string;
    actText?: string;
  }): Promise<ProjectReview> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("project_reviews")
      .insert({
        user_id: user.id,
        project_id: input.projectId,
        plan_text: input.planText || null,
        do_text: input.doText || null,
        check_text: input.checkText || null,
        act_text: input.actText || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ProjectReview;
  },

  async deleteReview(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("project_reviews").delete().eq("id", id);
    if (error) throw error;
  },
};
