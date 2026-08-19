"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { tagsService } from "@/services/tags.service";
import type { Tag } from "@/types/database";

export function TagChip({ tag, taskCount }: { tag: Tag; taskCount: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Eliminar a etiqueta "#${tag.name}"?`)) return;
    setIsDeleting(true);
    try {
      await tagsService.deleteTag(tag.id);
      toast.success("Etiqueta eliminada");
      router.refresh();
    } catch {
      toast.error("Não foi possível eliminar.");
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      style={{ backgroundColor: `color-mix(in srgb, ${tag.color} 16%, transparent)`, color: tag.color }}
    >
      <span>#{tag.name}</span>
      <span className="text-xs opacity-70">{taskCount}</span>
      <button onClick={handleDelete} disabled={isDeleting} aria-label="Eliminar etiqueta" className="opacity-60 hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
