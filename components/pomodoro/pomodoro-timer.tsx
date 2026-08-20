"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export interface PomodoroTaskOption {
  id: string;
  title: string;
}

type SessionType = "foco" | "pausa_curta" | "pausa_longa";

const DURATIONS: Record<SessionType, number> = {
  foco: 25,
  pausa_curta: 5,
  pausa_longa: 15,
};

const LABELS: Record<SessionType, string> = {
  foco: "Foco",
  pausa_curta: "Pausa curta",
  pausa_longa: "Pausa longa",
};

export function PomodoroTimer({ tasks = [] }: { tasks?: PomodoroTaskOption[] }) {
  const [sessionType, setSessionType] = useState<SessionType>("foco");
  const [customDurations, setCustomDurations] = useState<Record<SessionType, number>>(DURATIONS);
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.foco * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function switchSession(type: SessionType) {
    setSessionType(type);
    setSecondsLeft(customDurations[type] * 60);
    setIsRunning(false);
  }

  async function handleSessionComplete() {
    setIsRunning(false);
    toast.success(`Sessão de ${LABELS[sessionType]} concluída!`);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("pomodoro_sessions").insert({
          user_id: user.id,
          task_id: selectedTaskId || null,
          duration_minutes: customDurations[sessionType],
          session_type: sessionType,
          completed_at: new Date().toISOString(),
        });
      }
    } catch {
      // silencioso: não bloqueia a experiência do temporizador
    }

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
    setSecondsLeft(customDurations[sessionType] * 60);
    setIsRunning(false);
  }

  function handleDurationChange(type: SessionType, minutes: number) {
    setCustomDurations((prev) => ({ ...prev, [type]: minutes }));
    if (type === sessionType) setSecondsLeft(minutes * 60);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = customDurations[sessionType] * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {tasks.length > 0 && (
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <ListTodo className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
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

      <p className="text-xs text-[var(--color-ink-muted)]">Sessões de foco concluídas hoje: {sessionCount}</p>
    </div>
  );
}
