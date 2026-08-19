import { FolderKanban } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProjetosPage() {
  return (
    <ComingSoon
      icon={FolderKanban}
      title="Projetos"
      description="Organiza tarefas em projetos e subprojetos, com ícone, cor e progresso próprios."
      phase="Fase 3"
    />
  );
}
