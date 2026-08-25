"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accessRequestsService, type AccessRequest } from "@/services/access-requests.service";

export function PendingAccessRequestsCard({ requests }: { requests: AccessRequest[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  if (requests.length === 0) return null;

  async function handleApprove(request: AccessRequest) {
    setBusyId(request.id);
    try {
      await accessRequestsService.approve(request);
      toast.success(`${request.profile?.full_name || request.profile?.email} agora é Supervisor`);
      router.refresh();
    } catch {
      toast.error("Não foi possível aprovar.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeny(request: AccessRequest) {
    setBusyId(request.id);
    try {
      await accessRequestsService.deny(request);
      toast.success("Pedido recusado");
      router.refresh();
    } catch {
      toast.error("Não foi possível recusar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)]">
        <ShieldAlert className="h-4 w-4" /> Pedidos de acesso de Supervisor ({requests.length})
      </p>
      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                {request.profile?.full_name || request.profile?.email}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {new Date(request.requested_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
              </p>
            </div>
            <Button size="sm" onClick={() => handleApprove(request)} isLoading={busyId === request.id}>
              <Check className="h-3.5 w-3.5" /> Aprovar
            </Button>
            <button
              onClick={() => handleDeny(request)}
              disabled={busyId === request.id}
              aria-label="Recusar"
              className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
