"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListTodo, ShieldCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accessRequestsService } from "@/services/access-requests.service";
import { Button } from "@/components/ui/button";
import type { AccountType } from "@/types/database";

export function AccountTypeSelector({
  current,
  hasPendingRequest,
}: {
  current: AccountType;
  hasPendingRequest: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pending, setPending] = useState(hasPendingRequest);
  const router = useRouter();

  async function handleRequestSupervisor() {
    setIsSubmitting(true);
    try {
      await accessRequestsService.requestSupervisorAccess();
      setPending(true);
      toast.success("Pedido enviado — vais receber uma notificação assim que for aprovado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDowngrade() {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("profiles").update({ account_type: "agente" }).eq("id", user.id);
      if (error) throw error;
      toast.success("Passaste a conta Agente");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (current === "supervisor") {
    return (
      <div className="flex items-start gap-3 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-ink)]">Supervisor</p>
          <p className="mb-2 text-xs text-[var(--color-ink-muted)]">
            Acesso total — Método SMART, Equipas, Maturidade.
          </p>
          <Button variant="ghost" size="sm" onClick={handleDowngrade} isLoading={isSubmitting}>
            Passar para conta Agente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 rounded-xl border-2 border-[var(--color-border)] p-3">
        <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-ink)]">Agente</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Só tarefas e gestão de tempo.</p>
        </div>
      </div>

      {pending ? (
        <p className="flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2.5 text-xs text-[var(--color-ink-muted)]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Pedido de acesso de Supervisor enviado — a aguardar aprovação.
        </p>
      ) : (
        <Button size="sm" onClick={handleRequestSupervisor} isLoading={isSubmitting} className="w-full">
          <ShieldCheck className="h-3.5 w-3.5" /> Solicitar acesso de Supervisor
        </Button>
      )}
    </div>
  );
}
