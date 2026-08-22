"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamsService } from "@/services/teams.service";
import type { TeamInvite, TeamRole } from "@/types/database";

export function InviteLinkCard({ teamId }: { teamId: string }) {
  const [invite, setInvite] = useState<TeamInvite | null | undefined>(undefined);
  const [role, setRole] = useState<TeamRole>("member");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    teamsService.getActiveInviteLink(teamId).then(setInvite);
  }, [teamId]);

  async function handleGenerate() {
    setIsBusy(true);
    try {
      const created = await teamsService.generateInviteLink(teamId, role);
      setInvite(created);
    } catch {
      toast.error("Não foi possível gerar o link.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRevoke() {
    if (!invite) return;
    setIsBusy(true);
    try {
      await teamsService.revokeInviteLink(invite.id);
      setInvite(null);
      toast.success("Link revogado");
    } catch {
      toast.error("Não foi possível revogar o link.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleCopy() {
    if (!invite) return;
    const url = `${window.location.origin}/convite/${invite.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  if (invite === undefined) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-sm font-medium text-[var(--color-ink)]">Convite por link</p>
      <p className="mb-3 text-xs text-[var(--color-ink-muted)]">
        Qualquer pessoa com este link pode entrar na equipa, mesmo sem receber um email.
      </p>

      {!invite ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            Entram como
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-ink)]"
            >
              <option value="member">Membro</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button size="sm" onClick={handleGenerate} isLoading={isBusy}>
            <Link2 className="h-3.5 w-3.5" /> Gerar link
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-alt)] px-3 py-2">
            <span className="flex-1 truncate text-sm text-[var(--color-secondary)]">
              {typeof window !== "undefined" ? window.location.origin : ""}/convite/{invite.token}
            </span>
            <button onClick={handleCopy} aria-label="Copiar link" className="rounded-md p-1.5 hover:bg-[var(--color-surface)]">
              <Copy className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--color-ink-muted)]">
              Entram como {invite.role === "admin" ? "admin" : "membro"} · válido até{" "}
              {invite.expires_at &&
                new Date(invite.expires_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
            </span>
            <button
              onClick={handleRevoke}
              disabled={isBusy}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-danger)] hover:underline"
            >
              <X className="h-3 w-3" /> Revogar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
