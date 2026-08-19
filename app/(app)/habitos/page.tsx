import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function HabitosPage() {
  return (
    <ComingSoon
      icon={Sparkles}
      title="Hábitos"
      description="Cria hábitos, define frequência e acompanha a tua sequência de dias."
      phase="Fase 5"
    />
  );
}
