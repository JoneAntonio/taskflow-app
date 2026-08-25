"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, X } from "lucide-react";
import { teamsService } from "@/services/teams.service";
import type { TeamInvite } from "@/types/database";

export function PendingEmailInvitesList({ invites }: { invites: TeamInvite[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel(invite: TeamInvite) {
    if (!confirm(`Cancelar o convite para ${invite.email}?`)) return;
    setBusyId(invite.id);
    try {
      await teamsService.cancelEmailInvite(invite.id);
      toast.success("Convite cancelado");
      router.refresh();
    } catch {
      toast.error("Não foi possível cancelar o convite.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink-muted)]"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            {invite.email} · {invite.role === "admin" ? "admin" : "membro"}
          </span>
          <button
            onClick={() => handleCancel(invite)}
            disabled={busyId === invite.id}
            aria-label="Cancelar convite"
            className="rounded-md p-1.5 hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
