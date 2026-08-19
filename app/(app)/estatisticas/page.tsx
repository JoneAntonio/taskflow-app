import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/services/dashboard.queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyProductivityChart } from "@/components/dashboard/weekly-productivity-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, TimerReset, Sparkles, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Estatísticas — JAFLOW" };

export default async function EstatisticasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

  const [dashboardData, { count: completedThisMonth }, { count: pomodoroSessions }, { count: habitsCompletedToday }] =
    await Promise.all([
      getDashboardData(user.id),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "concluida")
        .gte("completed_at", `${monthStart}T00:00:00`),
      supabase
        .from("pomodoro_sessions")
        .select("id", { count: "exact", head: true })
        .eq("session_type", "foco")
        .not("completed_at", "is", null),
      supabase.from("habit_logs").select("id", { count: "exact", head: true }).eq("log_date", today),
    ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Estatísticas</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">A tua produtividade em números.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Concluídas este mês" value={completedThisMonth ?? 0} accent="success" />
        <StatCard icon={TrendingUp} label="Taxa de conclusão" value={`${dashboardData.completionRate}%`} accent="accent" />
        <StatCard icon={TimerReset} label="Sessões Pomodoro" value={pomodoroSessions ?? 0} />
        <StatCard icon={Sparkles} label="Hábitos hoje" value={habitsCompletedToday ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtividade semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyProductivityChart data={dashboardData.weeklyProductivity} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Tarefas atrasadas" value={dashboardData.overdueTasks.length} accent="danger" />
        <StatCard icon={CheckCircle2} label="Pendentes" value={dashboardData.pendingCount} />
        <StatCard icon={CheckCircle2} label="Concluídas hoje" value={dashboardData.completedTodayCount} accent="success" />
      </div>
    </div>
  );
}
