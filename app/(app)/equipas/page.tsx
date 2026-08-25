import type { Metadata } from "next";
import Link from "next/link";
import { Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewTeamButton } from "@/components/teams/new-team-button";
import type { Team } from "@/types/database";

export const metadata: Metadata = { title: "Equipas — JAFLOW" };

export default async function EquipasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: teams }, { data: profile }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("profiles").select("account_type").eq("id", user.id).single(),
  ]);
  const teamList = (teams ?? []) as Team[];
  const isSupervisor = profile?.account_type === "supervisor";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Equipas</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {isSupervisor
              ? "Cria uma equipa e convida pessoas reais para colaborarem contigo."
              : "As equipas onde és membro."}
          </p>
        </div>
        {isSupervisor && <NewTeamButton />}
      </div>

      {teamList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <Users2 className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Ainda sem equipas</p>
          <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
            Cria a tua primeira equipa para começares a convidar pessoas.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teamList.map((team) => (
            <Link
              key={team.id}
              href={`/equipas/${team.id}`}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]/60"
            >
              <p className="text-sm font-medium text-[var(--color-ink)]">{team.name}</p>
              {team.description && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{team.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
