import { TimerReset } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function PomodoroPage() {
  return (
    <ComingSoon
      icon={TimerReset}
      title="Pomodoro"
      description="Temporizador de foco personalizável, associado às tuas tarefas."
      phase="Fase 5"
    />
  );
}
