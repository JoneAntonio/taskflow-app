"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export type PomodoroSessionType = "foco" | "pausa_curta" | "pausa_longa";

export const POMODORO_LABELS: Record<PomodoroSessionType, string> = {
  foco: "Foco",
  pausa_curta: "Pausa",
  pausa_longa: "Pausa longa",
};

export interface PomodoroPlanSegment {
  type: PomodoroSessionType;
  minutes: number;
}

interface PomodoroState {
  isRunning: boolean;
  isActive: boolean;
  /** Segundos restantes, sempre recalculados a partir de segmentEndAt — nunca decrementados "à mão". */
  secondsLeft: number;
  /** Timestamp (Date.now()) em que o bloco atual termina. Fonte da verdade do tempo real. */
  segmentEndAt: number | null;
  segmentStartAt: number | null;
  sessionType: PomodoroSessionType;
  plan: PomodoroPlanSegment[] | null;
  segmentIndex: number;
  selectedTaskId: string | null;
  selectedTaskTitle: string | null;
  customDurations: Record<PomodoroSessionType, number>;
  sessionCount: number;
  intervalId: ReturnType<typeof setInterval> | null;

  configure: (input: {
    plan: PomodoroPlanSegment[] | null;
    sessionType: PomodoroSessionType;
    secondsLeft: number;
    selectedTaskId: string | null;
    selectedTaskTitle: string | null;
  }) => void;
  setCustomDurations: (durations: Record<PomodoroSessionType, number>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

async function logSession(taskId: string | null, type: PomodoroSessionType, minutes: number) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("pomodoro_sessions").insert({
        user_id: user.id,
        task_id: taskId,
        duration_minutes: minutes,
        session_type: type,
        completed_at: new Date().toISOString(),
      });
    }
  } catch {
    // silencioso
  }
}

function startNextSegment(
  set: (partial: Partial<PomodoroState>) => void,
  seconds: number
) {
  const now = Date.now();
  set({ secondsLeft: seconds, segmentStartAt: now, segmentEndAt: now + seconds * 1000 });
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  isRunning: false,
  isActive: false,
  secondsLeft: 25 * 60,
  segmentEndAt: null,
  segmentStartAt: null,
  sessionType: "foco",
  plan: null,
  segmentIndex: 0,
  selectedTaskId: null,
  selectedTaskTitle: null,
  customDurations: { foco: 25, pausa_curta: 5, pausa_longa: 15 },
  sessionCount: 0,
  intervalId: null,

  configure: ({ plan, sessionType, secondsLeft, selectedTaskId, selectedTaskTitle }) => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({
      plan,
      sessionType,
      secondsLeft,
      segmentIndex: 0,
      segmentStartAt: null,
      segmentEndAt: null,
      isRunning: false,
      selectedTaskId,
      selectedTaskTitle,
      intervalId: null,
    });
  },

  setCustomDurations: (customDurations) => set({ customDurations }),

  start: () => {
    const { intervalId, isRunning, secondsLeft } = get();
    if (isRunning) return;
    if (intervalId) clearInterval(intervalId);

    const now = Date.now();
    set({ segmentStartAt: now, segmentEndAt: now + secondsLeft * 1000 });

    // O intervalo só serve para FORÇAR um novo cálculo a cada segundo — o
    // valor real vem sempre de segmentEndAt, por isso mesmo que o browser
    // atrase o intervalo (ex: separador em segundo plano), o próximo tick
    // corrige-se sozinho para o tempo real decorrido, sem "perder" tempo.
    const id = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, isActive: true, intervalId: id });
  },

  pause: () => {
    const { intervalId, segmentEndAt } = get();
    if (intervalId) clearInterval(intervalId);
    const remaining = segmentEndAt ? Math.max(0, Math.round((segmentEndAt - Date.now()) / 1000)) : get().secondsLeft;
    set({ isRunning: false, intervalId: null, secondsLeft: remaining, segmentEndAt: null, segmentStartAt: null });
  },

  reset: () => {
    const { intervalId, plan, customDurations, sessionType } = get();
    if (intervalId) clearInterval(intervalId);
    const seconds = plan ? plan[0].minutes * 60 : customDurations[sessionType] * 60;
    set({
      isRunning: false,
      intervalId: null,
      segmentIndex: 0,
      sessionType: plan ? plan[0].type : sessionType,
      secondsLeft: seconds,
      segmentStartAt: null,
      segmentEndAt: null,
    });
  },

  tick: () => {
    const state = get();
    if (!state.segmentEndAt) return;

    // Recalcula sempre a partir do tempo real decorrido, não de um contador manual.
    const remaining = Math.round((state.segmentEndAt - Date.now()) / 1000);
    if (remaining > 0) {
      set({ secondsLeft: remaining });
      return;
    }

    // Bloco terminou
    const { plan, segmentIndex, sessionType, customDurations, selectedTaskId, sessionCount } = state;

    if (plan) {
      const currentSegment = plan[segmentIndex];
      logSession(selectedTaskId, currentSegment.type, currentSegment.minutes);
      const nextIndex = segmentIndex + 1;

      if (nextIndex >= plan.length) {
        toast.success("Pausa terminada — hora de retomar a atividade! 🔔", { duration: 8000 });
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("JAFLOW — Pomodoro", { body: "A pausa terminou. Hora de retomares a atividade." });
        }
        const { intervalId } = get();
        if (intervalId) clearInterval(intervalId);
        set({
          isRunning: false,
          intervalId: null,
          segmentIndex: 0,
          sessionType: plan[0].type,
          secondsLeft: plan[0].minutes * 60,
          segmentStartAt: null,
          segmentEndAt: null,
        });
        return;
      }

      toast.success(
        currentSegment.type === "foco" ? "Bloco de trabalho concluído! Começa a pausa." : "Pausa concluída!"
      );
      set({ segmentIndex: nextIndex, sessionType: plan[nextIndex].type });
      startNextSegment(set, plan[nextIndex].minutes * 60);
      return;
    }

    toast.success(`Sessão de ${POMODORO_LABELS[sessionType]} concluída!`);
    logSession(selectedTaskId, sessionType, customDurations[sessionType]);

    if (sessionType === "foco") {
      const nextCount = sessionCount + 1;
      const next: PomodoroSessionType = nextCount % 4 === 0 ? "pausa_longa" : "pausa_curta";
      set({ sessionCount: nextCount, sessionType: next });
      startNextSegment(set, customDurations[next] * 60);
    } else {
      set({ sessionType: "foco" });
      startNextSegment(set, customDurations.foco * 60);
    }
  },
}));
