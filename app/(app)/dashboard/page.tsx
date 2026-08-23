import type { Metadata } from "next";
import { ListTodo, AlarmClockOff, CalendarClock, CheckCircle2, TimerReset, Sparkles, Users2, Flame, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/server-date";
import { getDashboardData } from "@/services/dashboard.queries";
import { getDailyQuote } from "@/lib/daily-quote";
import { StatCard } from "@/components/dashboard/stat-card";
import { CompletionRing } from "@/components/dashboard/completion-ring";
import { WeeklyProductivityChart } from "@/components/dashboard/weekly-productivity-chart";
import { ActiveProjectsWidget } from "@/components/dashboard/active-projects-widget";
import { TopPriorityWidget } from "@/components/dashboard/top-priority-widget";
import { CategoryDistributionWidget } from "@/components/dashboard/category-distribution-widget";
import { PerformanceCard } from "@/components/dashboard/performance-card";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Project } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard — JAFLOW" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = await getTodayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartISO = weekStart.toISOString();

  const [
    data,
    { data: profile },
    { count: completedThisMonth },
    { count: pomodoroSessions },
    { count: habitsCompletedToday },
    { data: focusToday },
    { data: focusWeek },
    { data: activeProjects },
    { data: allProjects },
  ] = await Promise.all([
    getDashboardData(user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
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
    supabase
      .from("pomodoro_sessions")
      .select("duration_minutes")
      .eq("session_type", "foco")
      .gte("completed_at", `${today}T00:00:00`),
    supabase.from("pomodoro_sessions").select("duration_minutes").eq("session_type", "foco").gte("completed_at", weekStartISO),
    supabase.from("projects").select("*").not("objective", "is", null).order("target_date", { ascending: true, nullsFirst: false }).limit(5),
    supabase.from("projects").select("id, name"),
  ]);

  const firstName = profile?.full_name?.trim().split(" ")[0] || "";
  const focusMinutesToday = (focusToday ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const focusMinutesWeek = (focusWeek ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  const projectNameById = new Map((allProjects ?? []).map((p) => [p.id, p.name]));
  const distributionCounts = new Map<string, number>();
  [...data.todayTasks, ...data.upcomingTasks].forEach((task) => {
    const label = task.project_id ? projectNameById.get(task.project_id) ?? "Projeto removido" : "Sem projeto";
    distributionCounts.set(label, (distributionCounts.get(label) ?? 0) + 1);
  });
  const distributionEntries = [...distributionCounts.entries()].map(([label, count]) => ({ label, count }));
  const weekCompletedCount = data.weeklyProductivity.reduce((sum, day) => sum + day.concluidas, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
          {firstName ? `Bem-vindo, ${firstName}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm italic text-[var(--color-ink-muted)]">&quot;{getDailyQuote()}&quot;</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ListTodo} label="Tarefas pendentes" value={data.pendingCount} />
        <StatCard
          icon={AlarmClockOff}
          label="Tarefas atrasadas"
          value={data.overdueTasks.length}
          accent={data.overdueTasks.length > 0 ? "danger" : "default"}
        />
        <StatCard icon={CalendarClock} label="Para hoje" value={data.todayTasks.length} accent="accent" />
        <StatCard icon={CheckCircle2} label="Concluídas hoje" value={data.completedTodayCount} accent="success" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={CheckCircle2} label="Concluídas este mês" value={completedThisMonth ?? 0} accent="success" />
        <StatCard icon={TimerReset} label="Sessões Pomodoro" value={pomodoroSessions ?? 0} />
        <StatCard icon={Sparkles} label="Hábitos hoje" value={habitsCompletedToday ?? 0} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={Flame} label="Foco hoje" value={`${(focusMinutesToday / 60).toFixed(1)}h`} accent="accent" />
        <StatCard icon={Clock} label="Foco esta semana" value={`${(focusMinutesWeek / 60).toFixed(1)}h`} />
      </div>

      <TopPriorityWidget tasks={data.todayTasks} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Produtividade semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyProductivityChart data={data.weeklyProductivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de conclusão</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3 pb-6">
            <CompletionRing percentage={data.completionRate} />
            <p className="text-center text-xs text-[var(--color-ink-muted)]">
              {data.completedCount} concluídas de {data.completedCount + data.pendingCount} tarefas totais
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <CategoryDistributionWidget entries={distributionEntries} />
        <div className="space-y-4">
          <ActiveProjectsWidget projects={(activeProjects ?? []) as Project[]} />
          <PerformanceCard weekCompleted={weekCompletedCount} overdueCount={data.overdueTasks.length} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tarefas de hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.todayTasks.length === 0 ? (
              <EmptyRow text="Sem tarefas agendadas para hoje." />
            ) : (
              data.todayTasks.map((task) => <TaskListItem key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas tarefas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingTasks.length === 0 ? (
              <EmptyRow text="Sem tarefas nos próximos 7 dias." />
            ) : (
              data.upcomingTasks.map((task) => <TaskListItem key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>
      </div>

      {data.teamTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-[var(--color-accent)]" />
              Tarefas da equipa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.teamTasks.map((task) => (
              <TaskListItem key={task.id} task={task} assigneeName={task.teamName} />
            ))}
          </CardContent>
        </Card>
      )}

      {data.overdueTasks.length > 0 && (
        <Card className="border-[var(--color-danger)]/30">
          <CardHeader>
            <CardTitle className="text-[var(--color-danger)]">Tarefas atrasadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.overdueTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
      {text}
    </p>
  );
}
