import type { Metadata } from "next";
import { ListTodo, AlarmClockOff, CalendarClock, CheckCircle2, TimerReset, Sparkles, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/server-date";
import { getDashboardData } from "@/services/dashboard.queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { CompletionRing } from "@/components/dashboard/completion-ring";
import { WeeklyProductivityChart } from "@/components/dashboard/weekly-productivity-chart";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard — JAFLOW" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = await getTodayISO();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [data, { data: profile }, { count: completedThisMonth }, { count: pomodoroSessions }, { count: habitsCompletedToday }] =
    await Promise.all([
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
    ]);

  const firstName = profile?.full_name?.trim().split(" ")[0] || "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
          {firstName ? `Bem-vindo, ${firstName}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm italic text-[var(--color-ink-muted)]">
          &quot;Não se gere o que não se mede.&quot;
        </p>
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
