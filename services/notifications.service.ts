import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";

export const notificationsService = {
  async listRecent(limit = 15): Promise<Notification[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  async countUnread(): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw error;
  },

  async markAllRead(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
    if (error) throw error;
  },
};
