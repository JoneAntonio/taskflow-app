import { CalendarRange } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProximasPage() {
  return (
    <ComingSoon
      icon={CalendarRange}
      title="Próximas tarefas"
      description="Visualização por Hoje, Amanhã, Esta semana, Próxima semana e Próximo mês."
      phase="Fase 3"
    />
  );
}
