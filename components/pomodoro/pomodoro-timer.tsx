"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface PomodoroTaskOption {
  id: string;
  title: string;
  due_time: string | null;
  due_time_end: string | null;
}

type SessionType = "foco" | "pausa_curta" | "pausa_longa";

const DURATIONS: Record<SessionType, number> = {
  foco: 25,
  pausa_curta: 5,
  pausa_longa: 15,
};

const LABELS: Record<SessionType, string> = {
  foco: "Foco",
  pausa_curta: "Pausa",
  pausa_longa: "Pausa longa",
};

interface PlanSegment {
  type: SessionType;
  minutes: number;
}

/**
 * Plano automático simples, tal como pedido: uma atividade de duração total
 * X é dividida em UM bloco de trabalho focado + UMA pausa no final, sem
 * repetições. Ex: atividade de 60 min com pausa de 10 min → 50 min de
 * trabalho focado, depois 10 min de pausa; no final, notifica para retomar.
 */
function buildSimplePlan(totalMinutes: number, breakMinutes: number): PlanSegment[] {
  const work = Math.max(1, totalMinutes - breakMinutes);
  return [
    { type: "foco", minutes: work },
    { type: "pausa_curta", minutes: Math.max(1, breakMinutes) },
  ];
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function PomodoroTimer({ tasks = [] }: { tasks?: PomodoroTaskOption[] }) {
  const [customDurations, setCustomDurations] = useState<Record<SessionType, number>>(DURATIONS);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [autoPlanEnabled, setAutoPlanEnabled] = useState(false);
  const [totalDuration, setTotalDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(10);

  const [sessionType, setSessionType] = useState<SessionType>("foco");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.foco * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plan = useMemo(
    () => (autoPlanEnabled ? buildSimplePlan(totalDuration, breakDuration) : null),
    [autoPlanEnabled, totalDuration, breakDuration]
  );

  function handleTaskChange(taskId: string) {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task?.due_time && task?.due_time_end) {
      const diff = minutesBetween(task.due_time, task.due_time_end);
      if (diff > 0) setTotalDuration(diff);
    }
  }

  // Reinicia o plano do zero sempre que ele é (re)gerado (mudou a duração, a pausa, ou foi ativado/desativado)
  useEffect(() => {
    if (plan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSegmentIndex(0);
      setSessionType(plan[0].type);
      setSecondsLeft(plan[0].minutes * 60);
      setIsRunning(false);
    }
  }, [plan]);

  function switchSession(type: SessionType) {
    setSessionType(type);
    setSecondsLeft(customDurations[type] * 60);
    setIsRunning(false);
  }

  async function logSession(type: SessionType, minutes: number) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("pomodoro_sessions").insert({
          user_id: user.id,
          task_id: selectedTaskId || null,
          duration_minutes: minutes,
          session_type: type,
          completed_at: new Date().toISOString(),
        });
      }
    } catch {
      // silencioso: não bloqueia a experiência do temporizador
    }
  }

  async function handleSessionComplete() {
    setIsRunning(false);

    if (plan) {
      const currentSegment = plan[segmentIndex];
      await logSession(currentSegment.type, currentSegment.minutes);

      const nextIndex = segmentIndex + 1;
      if (nextIndex >= plan.length) {
        // Terminou o trabalho E a pausa: notifica para retomar a atividade.
        toast.success("Pausa terminada — hora de retomar a atividade! 🔔", { duration: 8000 });
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("JAFLOW — Pomodoro", { body: "A pausa terminou. Hora de retomares a atividade." });
        }
        setSegmentIndex(0);
        setSessionType(plan[0].type);
        setSecondsLeft(plan[0].minutes * 60);
        return;
      }

      toast.success(
        currentSegment.type === "foco" ? "Bloco de trabalho concluído! Começa a pausa." : "Pausa concluída!"
      );
      setSegmentIndex(nextIndex);
      setSessionType(plan[nextIndex].type);
      setSecondsLeft(plan[nextIndex].minutes * 60);
      setIsRunning(true); // avança automaticamente para o próximo bloco do plano
      return;
    }

    toast.success(`Sessão de ${LABELS[sessionType]} concluída!`);
    await logSession(sessionType, customDurations[sessionType]);

    if (sessionType === "foco") {
      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);
      const next = nextCount % 4 === 0 ? "pausa_longa" : "pausa_curta";
      switchSession(next);
    } else {
      switchSession("foco");
    }
  }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  function handleReset() {
    if (plan) {
      setSegmentIndex(0);
      setSessionType(plan[0].type);
      setSecondsLeft(plan[0].minutes * 60);
    } else {
      setSecondsLeft(customDurations[sessionType] * 60);
    }
    setIsRunning(false);
  }

  function handleDurationChange(type: SessionType, minutes: number) {
    setCustomDurations((prev) => ({ ...prev, [type]: minutes }));
    if (!plan && type === sessionType) setSecondsLeft(minutes * 60);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const currentTotalSeconds = (plan ? plan[segmentIndex]?.minutes ?? customDurations[sessionType] : customDurations[sessionType]) * 60;
  const progress = currentTotalSeconds > 0 ? ((currentTotalSeconds - secondsLeft) / currentTotalSeconds) * 100 : 0;
  const workMinutes = plan ? plan[0].minutes : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-xs space-y-2">
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <ListTodo className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
            <select
              value={selectedTaskId}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--color-ink)] outline-none"
            >
              <option value="">Sem tarefa associada</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <input
            type="checkbox"
            checked={autoPlanEnabled}
            onChange={(e) => setAutoPlanEnabled(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          Plano automático: divide a atividade em trabalho focado + uma pausa no fim
        </label>

        {autoPlanEnabled && (
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
              Duração total
              <input
                type="number"
                min={5}
                max={480}
                value={totalDuration}
                onChange={(e) => setTotalDuration(Math.max(5, Number(e.target.value) || 5))}
                className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-center text-xs text-[var(--color-ink)]"
              />
              min
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
              Pausa
              <input
                type="number"
                min={1}
                max={totalDuration - 1}
                value={breakDuration}
                onChange={(e) => setBreakDuration(Math.min(totalDuration - 1, Math.max(1, Number(e.target.value) || 1)))}
                className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-center text-xs text-[var(--color-ink)]"
              />
              min
            </span>
          </div>
        )}

        {plan && workMinutes && (
          <p className="text-center text-[11px] text-[var(--color-ink-muted)]">
            {workMinutes} min de trabalho focado, depois {plan[1].minutes} min de pausa. No final, avisamos-te para
            retomares.
          </p>
        )}
      </div>

      {!plan && (
        <div className="flex gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
          {(Object.keys(LABELS) as SessionType[]).map((type) => (
            <button
              key={type}
              onClick={() => switchSession(type)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                sessionType === type
                  ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-ink-muted)]"
              }`}
            >
              {LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {plan && (
        <div className="flex items-center gap-2">
          {plan.map((seg, index) => (
            <span
              key={index}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                index === segmentIndex
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                  : index < segmentIndex
                    ? "bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)] line-through"
                    : "bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)]"
              )}
            >
              {LABELS[seg.type]} · {seg.minutes}m
            </span>
          ))}
        </div>
      )}

      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-surface-alt)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono-data text-5xl font-semibold text-[var(--color-ink)]">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs text-[var(--color-ink-muted)]">{LABELS[sessionType]}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={handleReset} aria-label="Reiniciar">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="lg" onClick={() => setIsRunning((prev) => !prev)}>
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? "Pausar" : "Começar"}
        </Button>
      </div>

      {!plan && (
        <div className="flex gap-6 text-xs text-[var(--color-ink-muted)]">
          {(Object.keys(LABELS) as SessionType[]).map((type) => (
            <label key={type} className="flex items-center gap-1.5">
              {LABELS[type]}
              <input
                type="number"
                min={1}
                max={90}
                value={customDurations[type]}
                onChange={(e) => handleDurationChange(type, Number(e.target.value) || 1)}
                className="w-12 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-center text-[var(--color-ink)]"
              />
              min
            </label>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--color-ink-muted)]">Sessões de foco concluídas hoje: {sessionCount}</p>
    </div>
  );
}
