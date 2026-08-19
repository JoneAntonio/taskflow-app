import { Tag } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function EtiquetasPage() {
  return (
    <ComingSoon
      icon={Tag}
      title="Etiquetas"
      description="Cria etiquetas personalizadas e filtra tarefas por etiqueta."
      phase="Fase 3"
    />
  );
}
