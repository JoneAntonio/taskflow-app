import type { Metadata } from "next";
import Link from "next/link";
import { ListTodo, AlarmClockOff, CalendarClock, CheckCircle2, Inbox, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/services/dashboard.queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { CompletionRing } from "@/components/dashboard/completion-ring";
import { WeeklyProductivityChart } from "@/components/dashboard/weekly-productivity-chart";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { InlineQuickAdd } from "@/components/tasks/inline-quick-add";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard — JAFLOW" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const data = await getDashboardData(user.id);

  const { data: inboxTasks } = await supabase
    .from("tasks")
    .select("*")
    .is("project_id", null)
    .in("status", ["pendente", "em_progresso"])
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          O resumo do teu dia, num relance.
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
        <StatCard
          icon={CheckCircle2}
          label="Concluídas hoje"
          value={data.completedTodayCount}
          accent="success"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[var(--color-accent)]" />
            Inbox
          </CardTitle>
          <Link
            href="/inbox"
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          <InlineQuickAdd placeholder="Captura uma tarefa rapidamente..." />
          {(inboxTasks ?? []).length === 0 ? (
            <EmptyRow text="A tua Inbox está vazia." />
          ) : (
            (inboxTasks as Task[]).map((task) => <TaskListItem key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

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
