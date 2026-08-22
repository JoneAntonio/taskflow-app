"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const CHECK_INTERVAL_MS = 30_000;
const LOOKBACK_MS = 90_000; // margem para não perder lembretes entre verificações

/**
 * Enquanto a app estiver aberta num separador, verifica a cada 30s se alguma
 * tarefa tem um lembrete (reminder_at) a vencer, e avisa por toast + pela
 * Notification API do browser (se autorizada). Não substitui notificações
 * push reais (que exigiriam um worker/servidor de fundo), mas cobre o caso
 * de a app estar aberta.
 */
export function ReminderWatcher() {
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function checkReminders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const lookback = new Date(now.getTime() - LOOKBACK_MS);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, reminder_at")
        .eq("user_id", user.id)
        .in("status", ["pendente", "em_progresso"])
        .not("reminder_at", "is", null)
        .gte("reminder_at", lookback.toISOString())
        .lte("reminder_at", now.toISOString());

      (tasks ?? []).forEach(async (task) => {
        if (notifiedIds.current.has(task.id)) return;
        notifiedIds.current.add(task.id);

        toast(`🔔 ${task.title}`, { description: "Está prestes a começar." });

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("JAFLOW — lembrete", { body: task.title });
        }

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "lembrete",
          title: task.title,
          body: "Está prestes a começar.",
          related_task_id: task.id,
        });
      });
    }

    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
