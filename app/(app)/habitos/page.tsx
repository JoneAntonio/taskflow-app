import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { toLocalISODate } from "@/lib/utils";
import { NewHabitButton } from "@/components/habits/new-habit-button";
import { HabitCard } from "@/components/habits/habit-card";
import { calculateStreak } from "@/services/habits.service";
import type { Habit, HabitLog } from "@/types/database";

export const metadata: Metadata = { title: "Hábitos — JAFLOW" };

export default async function HabitosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = toLocalISODate(new Date());
  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from("habits").select("*").eq("archived", false).order("created_at"),
    supabase.from("habit_logs").select("*").order("log_date", { ascending: false }),
  ]);

  const habitList = (habits ?? []) as Habit[];
  const logList = (logs ?? []) as HabitLog[];

  const logsByHabit = new Map<string, HabitLog[]>();
  logList.forEach((log) => {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Hábitos</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Consistência ao longo do tempo, dia após dia.</p>
        </div>
        <NewHabitButton />
      </div>

      {habitList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <Sparkles className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Ainda sem hábitos</p>
          <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
            Cria o teu primeiro hábito, como &quot;Beber água&quot; ou &quot;Ler 20 minutos&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {habitList.map((habit) => {
            const habitLogs = logsByHabit.get(habit.id) ?? [];
            const todayLog = habitLogs.find((l) => l.log_date === today);
            const streak = calculateStreak(habitLogs.map((l) => l.log_date));
            return (
              <HabitCard key={habit.id} habit={habit} completedTodayLogId={todayLog?.id ?? null} streak={streak} />
            );
          })}
        </div>
      )}
    </div>
  );
}
