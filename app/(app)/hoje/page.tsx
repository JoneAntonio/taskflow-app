import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { toLocalISODate } from "@/lib/utils";
import { InlineQuickAdd } from "@/components/tasks/inline-quick-add";
import { HojeView } from "@/components/tasks/hoje-view";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Hoje — JAFLOW" };

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = toLocalISODate(new Date());

  const [{ data: todayTasks }, { data: overdueTasks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("due_date", today)
      .in("status", ["pendente", "em_progresso"])
      .order("due_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .lt("due_date", today)
      .in("status", ["pendente", "em_progresso"])
      .order("due_date", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Hoje</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <InlineQuickAdd placeholder="Adicionar tarefa para hoje" />

      <HojeView todayTasks={(todayTasks ?? []) as Task[]} overdueTasks={(overdueTasks ?? []) as Task[]} />
    </div>
  );
}
