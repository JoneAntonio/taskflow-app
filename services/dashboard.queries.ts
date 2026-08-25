import { createClient } from "@/lib/supabase/server";
import { toLocalISODate } from "@/lib/utils";
import { getTodayISO } from "@/lib/server-date";
import type { Task } from "@/types/database";

function toISODate(date: Date): string {
  return toLocalISODate(date);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = domingo
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export interface DashboardData {
  todayTasks: Task[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  teamTasks: (Task & { teamName: string })[];
  completedTodayCount: number;
  pendingCount: number;
  completedCount: number;
  completionRate: number; // 0-100
  weeklyProductivity: { day: string; concluidas: number; atrasadas: number }[];
}

/**
 * Reúne os números do Dashboard com um pequeno conjunto de queries Supabase.
 * Todas as queries são automaticamente filtradas por utilizador via RLS —
 * não é necessário repetir `.eq('user_id', ...)` para leitura, mas mantemos
 * o filtro explícito por clareza e para aproveitar os índices compostos.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const today = await getTodayISO();
  const todayDate = new Date(today + "T00:00:00");
  const in7Days = toISODate(new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  const weekStart = toISODate(startOfWeek(todayDate));

  const [
    { data: todayTasks },
    { data: overdueTasks },
    { data: upcomingTasks },
    { count: pendingCount },
    { count: completedCount },
    { count: completedTodayCount },
    { data: weekCompleted },
    { data: weekOverdue },
    { data: teamTasksRaw },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("due_date", today)
      .in("status", ["pendente", "em_progresso"])
      .order("due_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .lt("due_date", today)
      .in("status", ["pendente", "em_progresso"])
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gt("due_date", today)
      .lte("due_date", in7Days)
      .in("status", ["pendente", "em_progresso"])
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["pendente", "em_progresso"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "concluida"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "concluida")
      .gte("completed_at", `${today}T00:00:00`),
    // Inclui tanto tarefas criadas por ti como tarefas atribuídas a ti numa
    // equipa (assigned_to) — sem isto, uma tarefa de equipa concluída por
    // um agente não aparecia no gráfico, só no número total do mês.
    supabase
      .from("tasks")
      .select("completed_at")
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .eq("status", "concluida")
      .gte("completed_at", `${weekStart}T00:00:00`),
    supabase
      .from("tasks")
      .select("due_date")
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .in("status", ["pendente", "em_progresso"])
      .lt("due_date", today)
      .gte("due_date", weekStart),
    // Tarefas que outra pessoa te atribuiu dentro de uma equipa — distintas
    // das tuas tarefas pessoais (user_id), por isso filtramos por
    // "assigned_to", não por "user_id".
    supabase
      .from("tasks")
      .select("*, team:teams(name)")
      .eq("assigned_to", userId)
      .not("team_id", "is", null)
      .in("status", ["pendente", "em_progresso"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10),
  ]);

  const total = (pendingCount ?? 0) + (completedCount ?? 0);
  const completionRate = total > 0 ? Math.round(((completedCount ?? 0) / total) * 100) : 0;

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weeklyProductivity = dayLabels.map((day) => ({ day, concluidas: 0, atrasadas: 0 }));
  (weekCompleted ?? []).forEach((row) => {
    if (!row.completed_at) return;
    const weekday = new Date(row.completed_at).getDay();
    weeklyProductivity[weekday].concluidas += 1;
  });
  (weekOverdue ?? []).forEach((row) => {
    if (!row.due_date) return;
    const weekday = new Date(row.due_date + "T00:00:00").getDay();
    weeklyProductivity[weekday].atrasadas += 1;
  });

  const teamTasks = (teamTasksRaw ?? []).map((row) => {
    const { team, ...task } = row as Task & { team: { name: string } | null };
    return { ...task, teamName: team?.name ?? "Equipa" };
  });

  return {
    todayTasks: todayTasks ?? [],
    overdueTasks: overdueTasks ?? [],
    upcomingTasks: upcomingTasks ?? [],
    teamTasks,
    completedTodayCount: completedTodayCount ?? 0,
    pendingCount: pendingCount ?? 0,
    completedCount: completedCount ?? 0,
    completionRate,
    weeklyProductivity,
  };
}
