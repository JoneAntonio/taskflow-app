import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function EstatisticasPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Estatísticas"
      description="Taxa de conclusão, horas de produtividade, sessões Pomodoro e hábitos concluídos."
      phase="Fase 5"
    />
  );
}
