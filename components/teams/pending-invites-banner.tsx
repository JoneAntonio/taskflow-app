"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamsService } from "@/services/teams.service";
import type { TeamInvite } from "@/types/database";

export function PendingInvitesBanner() {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    teamsService
      .listMyPendingInvites()
      .then(setInvites)
      .catch(() => {});
  }, []);

  async function handleAccept(invite: TeamInvite) {
    setBusyId(invite.id);
    try {
      await teamsService.acceptInvite(invite);
      toast.success("Entraste na equipa!");
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      router.refresh();
    } catch {
      toast.error("Não foi possível aceitar o convite.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(invite: TeamInvite) {
    setBusyId(invite.id);
    try {
      await teamsService.declineInvite(invite.id);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch {
      toast.error("Não foi possível recusar o convite.");
    } finally {
      setBusyId(null);
    }
  }

  if (invites.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-4 py-3"
        >
          <Users className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
          <p className="flex-1 text-sm text-[var(--color-ink)]">
            Foste convidado como {invite.role === "admin" ? "admin" : "membro"} de uma equipa.
          </p>
          <Button size="sm" onClick={() => handleAccept(invite)} isLoading={busyId === invite.id}>
            Aceitar
          </Button>
          <button
            onClick={() => handleDecline(invite)}
            disabled={busyId === invite.id}
            aria-label="Recusar convite"
            className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
