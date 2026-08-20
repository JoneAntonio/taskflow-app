"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamMaturityService } from "@/services/team-maturity.service";

export function NewAgentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [operation, setOperation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const agent = await teamMaturityService.createAgent({
        name: name.trim(),
        operation: operation.trim() || undefined,
      });
      toast.success("Agente adicionado");
      setName("");
      setOperation("");
      onClose();
      router.push(`/equipa/${agent.id}`);
    } catch {
      toast.error("Não foi possível adicionar o agente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Novo agente"
      description="Adiciona um membro da equipa para começares a avaliar a maturidade. Se o agente pertencer a outra equipa/operação mas continuar sob a tua responsabilidade, indica isso no campo Operação."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="agent-name">Nome</Label>
          <Input
            id="agent-name"
            autoFocus
            placeholder="Ex: Ana Capita"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="agent-operation">Operação / equipa (opcional)</Label>
          <Input
            id="agent-operation"
            placeholder="Ex: SIMAR"
            value={operation}
            onChange={(event) => setOperation(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Adicionar agente
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
