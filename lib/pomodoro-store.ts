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
  secondsLeft: number;
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

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  isRunning: false,
  isActive: false,
  secondsLeft: 25 * 60,
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
      isRunning: false,
      selectedTaskId,
      selectedTaskTitle,
      intervalId: null,
    });
  },

  setCustomDurations: (customDurations) => set({ customDurations }),

  start: () => {
    const { intervalId, isRunning } = get();
    if (isRunning) return;
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, isActive: true, intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null });
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
    });
  },

  tick: () => {
    const state = get();
    if (state.secondsLeft > 1) {
      set({ secondsLeft: state.secondsLeft - 1 });
      return;
    }

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
        });
        return;
      }

      toast.success(
        currentSegment.type === "foco" ? "Bloco de trabalho concluído! Começa a pausa." : "Pausa concluída!"
      );
      set({
        segmentIndex: nextIndex,
        sessionType: plan[nextIndex].type,
        secondsLeft: plan[nextIndex].minutes * 60,
      });
      return;
    }

    toast.success(`Sessão de ${POMODORO_LABELS[sessionType]} concluída!`);
    logSession(selectedTaskId, sessionType, customDurations[sessionType]);

    if (sessionType === "foco") {
      const nextCount = sessionCount + 1;
      const next: PomodoroSessionType = nextCount % 4 === 0 ? "pausa_longa" : "pausa_curta";
      set({ sessionCount: nextCount, sessionType: next, secondsLeft: customDurations[next] * 60 });
    } else {
      set({ sessionType: "foco", secondsLeft: customDurations.foco * 60 });
    }
  },
}));
