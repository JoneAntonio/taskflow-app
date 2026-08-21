import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CriteriaManager } from "@/components/team/criteria-manager";
import { DEFAULT_CRITERIA } from "@/types/team-maturity";
import type { MaturityCriterion } from "@/types/team-maturity";

export const metadata: Metadata = { title: "Critérios de avaliação — JAFLOW" };

export default async function CriteriosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: criteria } = await supabase
    .from("maturity_criteria")
    .select("*")
    .eq("archived", false)
    .order("position");

  if (!criteria || criteria.length === 0) {
    const { data: seeded } = await supabase
      .from("maturity_criteria")
      .insert(
        DEFAULT_CRITERIA.map((c, index) => ({
          user_id: user.id,
          name: c.name,
          weight: c.weight,
          inverted: c.inverted,
          position: index,
        }))
      )
      .select();
    criteria = seeded ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/equipa"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Maturidade da Equipa
      </Link>

      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Critérios de avaliação</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Adiciona, ajusta ou remove os critérios usados para avaliar a maturidade dos teus agentes.
        </p>
      </div>

      <CriteriaManager initialCriteria={(criteria ?? []) as MaturityCriterion[]} />
    </div>
  );
}
