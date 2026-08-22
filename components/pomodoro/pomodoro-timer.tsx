"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Pause, RotateCcw, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePomodoroStore, POMODORO_LABELS, type PomodoroSessionType, type PomodoroPlanSegment } from "@/lib/pomodoro-store";

export interface PomodoroTaskOption {
  id: string;
  title: string;
  due_time: string | null;
  due_time_end: string | null;
  estimated_duration_minutes: number | null;
}

const LABELS = POMODORO_LABELS;

function buildSimplePlan(totalMinutes: number, breakMinutes: number): PomodoroPlanSegment[] {
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
  const store = usePomodoroStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(store.selectedTaskId ?? "");
  const [autoPlanEnabled, setAutoPlanEnabled] = useState(!!store.plan);
  const [totalDuration, setTotalDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(10);
  const [notes, setNotes] = useState("");
  const [lockedDuration, setLockedDuration] = useState<number | null>(null);

  const plan = store.plan;
  const isRunning = store.isRunning;
  const sessionType = store.sessionType;
  const segmentIndex = store.segmentIndex;
  const secondsLeft = store.secondsLeft;
  const customDurations = store.customDurations;

  const newPlan = useMemo(
    () => (autoPlanEnabled ? buildSimplePlan(totalDuration, breakDuration) : null),
    [autoPlanEnabled, totalDuration, breakDuration]
  );

  // Só reconfigura o estado global quando o plano/tarefa realmente mudam, e o temporizador não está a correr
  // (para não interromper uma sessão já em curso ao navegares para esta página).
  useEffect(() => {
    if (store.isRunning) return;
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    const planChanged = JSON.stringify(newPlan) !== JSON.stringify(store.plan);
    const taskChanged = (selectedTaskId || null) !== store.selectedTaskId;
    if (planChanged || taskChanged) {
      store.configure({
        plan: newPlan,
        sessionType: newPlan ? newPlan[0].type : "foco",
        secondsLeft: newPlan ? newPlan[0].minutes * 60 : customDurations.foco * 60,
        selectedTaskId: selectedTaskId || null,
        selectedTaskTitle: selectedTask?.title ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPlan, selectedTaskId]);

  function handleTaskChange(taskId: string) {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);

    if (task?.estimated_duration_minutes) {
      // A tarefa já tem uma duração definida: o Pomodoro fica limitado a esse tempo.
      setLockedDuration(task.estimated_duration_minutes);
      setTotalDuration(task.estimated_duration_minutes);
      setAutoPlanEnabled(true);
      return;
    }

    setLockedDuration(null);
    if (task?.due_time && task?.due_time_end) {
      const diff = minutesBetween(task.due_time, task.due_time_end);
      if (diff > 0) setTotalDuration(diff);
    }
  }

  function switchSession(type: PomodoroSessionType) {
    store.pause();
    store.configure({
      plan: null,
      sessionType: type,
      secondsLeft: customDurations[type] * 60,
      selectedTaskId: selectedTaskId || null,
      selectedTaskTitle: tasks.find((t) => t.id === selectedTaskId)?.title ?? null,
    });
  }

  function handleDurationChange(type: PomodoroSessionType, minutes: number) {
    const nextDurations = { ...customDurations, [type]: minutes };
    store.setCustomDurations(nextDurations);
    if (!plan && type === sessionType && !isRunning) {
      store.configure({
        plan: null,
        sessionType,
        secondsLeft: minutes * 60,
        selectedTaskId: selectedTaskId || null,
        selectedTaskTitle: tasks.find((t) => t.id === selectedTaskId)?.title ?? null,
      });
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const currentTotalSeconds = (plan ? plan[segmentIndex]?.minutes ?? customDurations[sessionType] : customDurations[sessionType]) * 60;
  const progress = currentTotalSeconds > 0 ? ((currentTotalSeconds - secondsLeft) / currentTotalSeconds) * 100 : 0;
  const workMinutes = plan ? plan[0].minutes : null;
  const activeTaskTitle = store.selectedTaskTitle;

  return (
    <div className="flex flex-col items-center gap-6">
      {activeTaskTitle && (
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]">
          <ListTodo className="h-4 w-4 text-[var(--color-accent)]" />
          {activeTaskTitle}
        </div>
      )}

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
            disabled={!!lockedDuration}
            onChange={(e) => setAutoPlanEnabled(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-accent)] disabled:opacity-50"
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
                disabled={!!lockedDuration}
                onChange={(e) => setTotalDuration(Math.max(5, Number(e.target.value) || 5))}
                className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-center text-xs text-[var(--color-ink)] disabled:opacity-60"
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

        {lockedDuration && (
          <p className="text-center text-[11px] font-medium text-[var(--color-accent)]">
            🔒 Duração limitada a {lockedDuration} min, definida nesta tarefa. Para mudar, edita a duração estimada
            da tarefa (ou escolhe &quot;Sem tarefa associada&quot;).
          </p>
        )}

        {plan && workMinutes && (
          <p className="text-center text-[11px] text-[var(--color-ink-muted)]">
            {workMinutes} min de trabalho focado, depois {plan[1].minutes} min de pausa. Ao terminares um bloco,
            o próximo arranca sozinho — não precisas de voltar a clicar em Começar.
          </p>
        )}
      </div>

      {!plan && (
        <div className="flex gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
          {(Object.keys(LABELS) as PomodoroSessionType[]).map((type) => (
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

      {store.segmentStartAt && store.segmentEndAt && (
        <p className="-mt-4 font-mono-data text-xs text-[var(--color-ink-muted)]">
          {new Date(store.segmentStartAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
          {" → "}
          {new Date(store.segmentEndAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => store.reset()} aria-label="Reiniciar">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="lg" onClick={() => (isRunning ? store.pause() : store.start())}>
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? "Pausar" : "Começar"}
        </Button>
      </div>

      {!plan && (
        <div className="flex gap-6 text-xs text-[var(--color-ink-muted)]">
          {(Object.keys(LABELS) as PomodoroSessionType[]).map((type) => (
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

      <p className="text-xs text-[var(--color-ink-muted)]">Sessões de foco concluídas hoje: {store.sessionCount}</p>

      <div className="w-full max-w-sm">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Foco em notas
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="O que tens em mente? Regista as tuas ideias enquanto trabalhas..."
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>
    </div>
  );
}
