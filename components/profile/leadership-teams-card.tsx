import Link from "next/link";
import { Users2, ArrowRight } from "lucide-react";
import type { Team } from "@/types/database";

export function LeadershipTeamsCard({ teams }: { teams: Team[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">Equipas que lideras</p>
      {teams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
          Ainda não crias nenhuma equipa.{" "}
          <Link href="/equipas" className="font-medium text-[var(--color-accent)] hover:underline">
            Cria a primeira
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/equipas/${team.id}`}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]/60"
            >
              <Users2 className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
              <span className="flex-1 truncate">{team.name}</span>
              <span className="text-xs text-[var(--color-ink-muted)]">Convidar membros</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
