import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AcceptLinkInviteButton } from "@/components/teams/accept-link-invite-button";
import type { TeamInvite } from "@/types/database";

export const metadata: Metadata = { title: "Convite — JAFLOW" };

function isExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now.getTime();
}

export default async function ConviteLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const now = new Date();

  const { data } = await supabase
    .from("team_invites")
    .select("*, team:teams(name)")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  const expired = isExpired(data?.expires_at ?? null, now);

  return (
    <div className="mx-auto max-w-sm pt-12">
      {!data || expired ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
          Este link de convite já não é válido. Pede um novo a quem te convidou.
        </p>
      ) : (
        <AcceptLinkInviteButton
          invite={data as TeamInvite}
          teamName={(data as unknown as { team: { name: string } | null }).team?.name ?? "Equipa"}
        />
      )}
    </div>
  );
}
