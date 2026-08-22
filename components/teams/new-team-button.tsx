"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamsService } from "@/services/teams.service";

export function NewTeamButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const team = await teamsService.createTeam({ name: name.trim(), description: description || undefined });
      toast.success("Equipa criada — já és admin dela");
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/equipas/${team.id}`);
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a equipa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nova equipa
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nova equipa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="team-name">Nome</Label>
            <Input id="team-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: SIMAR" />
          </div>
          <div>
            <Label htmlFor="team-description">Descrição (opcional)</Label>
            <Input id="team-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Criar equipa
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
