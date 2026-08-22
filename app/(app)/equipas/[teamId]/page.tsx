import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MemberList } from "@/components/teams/member-list";
import { InviteMemberForm } from "@/components/teams/invite-member-form";
import type { Team, TeamMembership, TeamInvite } from "@/types/database";

export const metadata: Metadata = { title: "Equipa — JAFLOW" };

export default async function EquipaDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).single();
  if (!team) notFound();

  const [{ data: members }, { data: pendingInvites }, { data: isAdminResult }] = await Promise.all([
    supabase.from("team_memberships").select("*, profile:profiles(*)").eq("team_id", teamId).order("joined_at"),
    supabase.from("team_invites").select("*").eq("team_id", teamId).eq("status", "pending").order("created_at", { ascending: false }),
    supabase.rpc("is_team_admin", { _team_id: teamId }),
  ]);

  const isAdmin = !!isAdminResult;
  const memberList = (members ?? []) as unknown as TeamMembership[];
  const inviteList = (pendingInvites ?? []) as TeamInvite[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/equipas"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Equipas
      </Link>

      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{(team as Team).name}</h1>
        {(team as Team).description && (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{(team as Team).description}</p>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">Convidar novo membro</p>
          <InviteMemberForm teamId={teamId} />
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Membros ({memberList.length})
        </p>
        <MemberList members={memberList} isAdmin={isAdmin} currentUserId={user.id} />
      </div>

      {isAdmin && inviteList.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Convites por aceitar ({inviteList.length})
          </p>
          <div className="space-y-2">
            {inviteList.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink-muted)]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {invite.email} · {invite.role === "admin" ? "admin" : "membro"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
