"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { projectsService } from "@/services/projects.service";
import type { Project } from "@/types/database";

export function ProjectHeaderActions({ project }: { project: Project }) {
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Eliminar o projeto "${project.name}"? As tarefas ficam sem projeto associado.`)) return;
    setIsDeleting(true);
    try {
      await projectsService.deleteProject(project.id);
      toast.success("Projeto eliminado");
      router.push("/projetos");
      router.refresh();
    } catch {
      toast.error("Não foi possível eliminar o projeto.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" /> Editar
      </Button>
      <Button variant="outline" size="sm" onClick={handleDelete} isLoading={isDeleting}>
        <Trash2 className="h-3.5 w-3.5" /> Eliminar
      </Button>
      <ProjectDialog open={editOpen} onClose={() => setEditOpen(false)} project={project} />
    </div>
  );
}
