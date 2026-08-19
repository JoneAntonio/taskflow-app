"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectsService, PROJECT_COLORS } from "@/services/projects.service";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

export function ProjectDialog({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
}) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      if (project) {
        await projectsService.updateProject(project.id, { name: name.trim(), description: description || null, color });
        toast.success("Projeto atualizado");
      } else {
        await projectsService.createProject({ name: name.trim(), description: description || undefined, color });
        toast.success("Projeto criado");
      }
      onClose();
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={project ? "Editar projeto" : "Novo projeto"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="project-name">Nome</Label>
          <Input id="project-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Trabalho" />
        </div>
        <div>
          <Label htmlFor="project-description">Descrição (opcional)</Label>
          <Input id="project-description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-[var(--color-ink)]" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {project ? "Guardar" : "Criar projeto"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
