import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function CalendarioPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Calendário"
      description="Visualizações mensal, semanal e diária, com criação de tarefas por clique e arrastar-e-largar."
      phase="Fase 4"
    />
  );
}
