import { Search } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function PesquisaPage() {
  return (
    <ComingSoon
      icon={Search}
      title="Pesquisa global"
      description="Pesquisa tarefas, projetos e etiquetas, com filtros por data, prioridade, estado e projeto."
      phase="Fase 3"
    />
  );
}
