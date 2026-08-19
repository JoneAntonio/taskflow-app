"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tagsService, TAG_COLORS } from "@/services/tags.service";
import { cn } from "@/lib/utils";

export function NewTagForm() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await tagsService.createTag(name, color);
      setName("");
      toast.success("Etiqueta criada");
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a etiqueta (talvez já exista).");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da etiqueta (ex: urgente)"
        className="max-w-xs"
      />
      <div className="flex gap-1.5">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={cn("h-6 w-6 rounded-full border-2", color === c ? "border-[var(--color-ink)]" : "border-transparent")}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
      <Button type="submit" size="sm" isLoading={isSubmitting}>
        <Plus className="h-3.5 w-3.5" /> Criar
      </Button>
    </form>
  );
}
