import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MaturityBadge } from "@/components/team/maturity-badge";
import { MaturityTrack } from "@/components/team/maturity-track";
import { CriteriaBar } from "@/components/team/criteria-bar";
import { NewEvaluationButton } from "@/components/team/new-evaluation-button";
import { EvolutionChart } from "@/components/team/evolution-chart";
import { EvaluationHistoryList } from "@/components/team/evaluation-history-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DEFAULT_CRITERIA, MATURITY_DESCRIPTIONS } from "@/types/team-maturity";
import type { MaturityCriterion, MaturityEvaluation, TeamAgent } from "@/types/team-maturity";

export const metadata: Metadata = { title: "Agente — Maturidade da Equipa — JAFLOW" };

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agent } = await supabase.from("team_agents").select("*").eq("id", agentId).single();
  if (!agent) notFound();

  let { data: criteria } = await supabase
    .from("maturity_criteria")
    .select("*")
    .eq("archived", false)
    .order("position");

  // Semeia os critérios por omissão na primeira utilização do módulo.
  if (!criteria || criteria.length === 0) {
    const { data: seeded } = await supabase
      .from("maturity_criteria")
      .insert(DEFAULT_CRITERIA.map((c, index) => ({ user_id: user.id, name: c.name, weight: c.weight, inverted: c.inverted, position: index })))
      .select();
    criteria = seeded ?? [];
  }

  const { data: evaluations } = await supabase
    .from("maturity_evaluations")
    .select("*")
    .eq("agent_id", agentId)
    .order("evaluation_date", { ascending: true });

  const agentData = agent as TeamAgent;
  const evaluationList = (evaluations ?? []) as MaturityEvaluation[];
  const latestEvaluation = evaluationList[evaluationList.length - 1] ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/equipa"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Maturidade da Equipa
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{agentData.name}</h1>
          {agentData.operation && (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{agentData.operation}</p>
          )}
        </div>
        <NewEvaluationButton agentId={agentId} criteria={(criteria ?? []) as MaturityCriterion[]} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-ink-muted)]">Maturidade atual</p>
            <div className="mt-1.5">
              <MaturityBadge level={agentData.current_maturity} size="lg" />
            </div>
          </div>
          {agentData.current_maturity && (
            <div className="max-w-[55%] text-right">
              <p className="text-xs text-[var(--color-ink-muted)]">
                {MATURITY_DESCRIPTIONS[agentData.current_maturity].description}
              </p>
              <p className="mt-1.5 text-xs font-medium text-[var(--color-accent)]">
                Liderança: {MATURITY_DESCRIPTIONS[agentData.current_maturity].leadershipStyle}
              </p>
            </div>
          )}
        </div>
        <div className="mt-5">
          <MaturityTrack current={agentData.current_maturity} />
        </div>
      </Card>

      {latestEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Última avaliação por critério</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestEvaluation.scores.map((entry) => (
              <CriteriaBar key={entry.criterion_id} label={entry.name} value={entry.score} />
            ))}
          </CardContent>
        </Card>
      )}

      {evaluationList.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutionChart evaluations={evaluationList} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <EvaluationHistoryList evaluations={evaluationList} />
        </CardContent>
      </Card>
    </div>
  );
}
