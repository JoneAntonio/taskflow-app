import { createClient } from "@/lib/supabase/client";
import type { Habit } from "@/types/database";

export const HABIT_COLORS = ["#3F9E6D", "#3F6FA8", "#F2A93B", "#E2504C", "#8B5CF6", "#0EA5A5"];

export const habitsService = {
  async createHabit(input: { name: string; description?: string; color?: string }): Promise<Habit> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? HABIT_COLORS[0],
      })
      .select()
      .single();
    if (error) throw error;
    return data as Habit;
  },

  async toggleToday(habitId: string, logId: string | null): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const today = new Date().toISOString().slice(0, 10);

    if (logId) {
      const { error } = await supabase.from("habit_logs").delete().eq("id", logId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("habit_logs")
        .insert({ habit_id: habitId, user_id: user.id, log_date: today, completed: true });
      if (error) throw error;
    }
  },

  async archiveHabit(habitId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("habits").update({ archived: true }).eq("id", habitId);
    if (error) throw error;
  },
};

/** Calcula a sequência atual de dias consecutivos concluídos, terminando hoje ou ontem. */
export function calculateStreak(logDates: string[]): number {
  const sorted = [...new Set(logDates)].sort().reverse();
  if (sorted.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const cursor = new Date(today);

  for (const dateStr of sorted) {
    const cursorISO = cursor.toISOString().slice(0, 10);
    if (dateStr === cursorISO) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      // Permite que a sequência comece ontem se ainda não marcou hoje
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dateStr === yesterday.toISOString().slice(0, 10)) {
        streak += 1;
        cursor.setTime(yesterday.getTime());
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}
