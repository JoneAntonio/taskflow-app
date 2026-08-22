"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamsService } from "@/services/teams.service";
import type { TeamInvite } from "@/types/database";

export function AcceptLinkInviteButton({ invite, teamName }: { invite: TeamInvite; teamName: string }) {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  async function handleAccept() {
    setIsJoining(true);
    try {
      await teamsService.acceptLinkInvite(invite);
      toast.success(`Entraste na equipa ${teamName}!`);
      router.push(`/equipas/${invite.team_id}`);
      router.refresh();
    } catch {
      toast.error("Não foi possível entrar na equipa.");
      setIsJoining(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15">
        <Users2 className="h-7 w-7 text-[var(--color-accent)]" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-[var(--color-ink)]">{teamName}</p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Foste convidado a entrar como {invite.role === "admin" ? "admin" : "membro"}.
        </p>
      </div>
      <Button onClick={handleAccept} isLoading={isJoining}>
        Entrar na equipa
      </Button>
    </div>
  );
}
