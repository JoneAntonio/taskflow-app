import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarEditor } from "@/components/profile/avatar-editor";
import { PushNotificationCard } from "@/components/profile/push-notification-card";
import { AccountTypeSelector } from "@/components/profile/account-type-selector";
import { LeadershipTeamsCard } from "@/components/profile/leadership-teams-card";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Team } from "@/types/database";

export const metadata: Metadata = { title: "Perfil — JAFLOW" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  let leadershipTeams: Team[] = [];
  if (profile.account_type === "supervisor") {
    const { data: memberships } = await supabase
      .from("team_memberships")
      .select("team:teams(*)")
      .eq("user_id", user.id)
      .eq("role", "admin");
    leadershipTeams = (memberships ?? [])
      .map((m) => (m as unknown as { team: Team | null }).team)
      .filter((t): t is Team => !!t);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Perfil</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Gere os teus dados pessoais e preferências.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm font-medium text-[var(--color-ink)]">Foto de perfil</p>
          <AvatarEditor profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-1 text-sm font-medium text-[var(--color-ink)]">Tipo de conta</p>
          <p className="mb-4 text-xs text-[var(--color-ink-muted)]">Muda a qualquer momento.</p>
          <AccountTypeSelector current={profile.account_type} />
        </CardContent>
      </Card>

      {profile.account_type === "supervisor" && (
        <Card>
          <CardContent className="pt-6">
            <LeadershipTeamsCard teams={leadershipTeams} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <PushNotificationCard />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">Tema</p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Escolhe entre claro, escuro ou seguir o sistema.
            </p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
