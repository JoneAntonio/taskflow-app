"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, User, X } from "lucide-react";
import { teamsService } from "@/services/teams.service";
import { getGravatarUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";
import type { TeamMembership, TeamRole } from "@/types/database";

export function MemberList({
  members,
  isAdmin,
  currentUserId,
}: {
  members: TeamMembership[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function handleRoleChange(membership: TeamMembership, role: TeamRole) {
    setBusyId(membership.id);
    try {
      await teamsService.updateMemberRole(membership.id, role);
      toast.success("Papel atualizado");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(membership: TeamMembership) {
    if (!confirm("Remover este membro da equipa?")) return;
    setBusyId(membership.id);
    try {
      await teamsService.removeMember(membership.id);
      toast.success("Membro removido");
      router.refresh();
    } catch {
      toast.error("Não foi possível remover.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {members.map((membership) => {
        const profile = membership.profile;
        const avatarUrl = profile?.avatar_url || (profile?.email ? getGravatarUrl(profile.email, 64) : "");
        return (
          <div
            key={membership.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                {profile?.full_name || profile?.email || "Utilizador"}
              </p>
              {profile?.full_name && <p className="truncate text-xs text-[var(--color-ink-muted)]">{profile.email}</p>}
            </div>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                membership.role === "admin"
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)]"
              )}
            >
              {membership.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {membership.role === "admin" ? "Admin" : "Membro"}
            </span>
            {isAdmin && membership.user_id !== currentUserId && (
              <>
                <button
                  onClick={() => handleRoleChange(membership, membership.role === "admin" ? "member" : "admin")}
                  disabled={busyId === membership.id}
                  className="text-xs font-medium text-[var(--color-secondary)] hover:underline"
                >
                  {membership.role === "admin" ? "Tornar membro" : "Tornar admin"}
                </button>
                <button
                  onClick={() => handleRemove(membership)}
                  disabled={busyId === membership.id}
                  aria-label="Remover membro"
                  className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
