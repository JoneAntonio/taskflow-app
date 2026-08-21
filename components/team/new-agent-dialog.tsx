"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamMaturityService } from "@/services/team-maturity.service";
import type { TeamAgent, TeamOperation } from "@/types/team-maturity";

export function NewAgentDialog({
  open,
  onClose,
  agent,
  operations = [],
}: {
  open: boolean;
  onClose: () => void;
  /** Quando fornecido, o diálogo passa a editar este agente em vez de criar um novo. */
  agent?: TeamAgent;
  operations?: TeamOperation[];
}) {
  const [name, setName] = useState(agent?.name ?? "");
  const [operation, setOperation] = useState(agent?.operation ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (agent) {
        await teamMaturityService.updateAgent(agent.id, { name: name.trim(), operation: operation.trim() || null });
        toast.success("Agente atualizado");
        onClose();
        router.refresh();
      } else {
        const created = await teamMaturityService.createAgent({
          name: name.trim(),
          operation: operation.trim() || undefined,
        });
        toast.success("Agente adicionado");
        setName("");
        setOperation("");
        onClose();
        router.push(`/equipa/${created.id}`);
      }
    } catch {
      toast.error("Não foi possível guardar o agente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={agent ? "Editar agente" : "Novo agente"}
      description="Se o agente pertencer a outra equipa/operação mas continuar sob a tua responsabilidade, indica isso no campo Operação."
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
            list="operation-suggestions"
            placeholder="Ex: SIMAR"
            value={operation}
            onChange={(event) => setOperation(event.target.value)}
          />
          <datalist id="operation-suggestions">
            {operations.map((op) => (
              <option key={op.id} value={op.name} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Personaliza a cor de cada operação em{" "}
            <Link href="/equipa/operacoes" className="text-[var(--color-secondary)] hover:underline">
              Operações
            </Link>
            .
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {agent ? "Guardar" : "Adicionar agente"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
