"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lightbulb, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksService } from "@/services/tasks.service";
import type { TeamAgent } from "@/types/team-maturity";

interface Recommendation {
  text: string;
  /** Se definido, mostra um botão "+ Criar tarefa" que cria esta tarefa diretamente. */
  actionTitle?: string;
}

function buildGlobalRecommendations(agents: TeamAgent[]): Recommendation[] {
  const total = agents.length;
  if (total === 0) return [];

  const m4 = agents.filter((a) => a.current_maturity === "M4");
  const m1 = agents.filter((a) => a.current_maturity === "M1");
  const m2 = agents.filter((a) => a.current_maturity === "M2");

  const recommendations: Recommendation[] = [];

  if (m4.length > 0) {
    const names = m4
      .slice(0, 3)
      .map((a) => a.name)
      .join(", ");
    recommendations.push({
      text: `Tens ${m4.length} agente${m4.length > 1 ? "s" : ""} em M4 no total (${names}${m4.length > 3 ? "..." : ""}) — são os candidatos certos para delegares tarefas complexas ("Delegar" na Matriz de Eisenhower).`,
    });
    if (m1.length > 0 || m2.length > 0) {
      recommendations.push({
        text: `Considera atribuir agentes M4 como mentores dos agentes em M1/M2 (${m1.length + m2.length} no total).`,
        actionTitle: `Definir plano de mentoria para agentes M1/M2`,
      });
    }
    if (m4.length / total >= 0.4) {
      recommendations.push({
        text: `${Math.round((m4.length / total) * 100)}% da equipa já está em M4 — capacidade instalada para escalar a operação sem perder qualidade.`,
      });
    }
  } else {
    recommendations.push({
      text: "Ainda sem nenhum agente em M4. Procura, entre os que estão em M3, quem tem pontuações mais altas em Autonomia e Ownership — são os melhores candidatos a desenvolver.",
    });
  }

  return recommendations;
}

function buildGroupRecommendations(agents: TeamAgent[]): Recommendation[] {
  const m1 = agents.filter((a) => a.current_maturity === "M1");
  const withoutEvaluation = agents.filter((a) => !a.current_maturity);
  const recommendations: Recommendation[] = [];

  if (m1.length > 0) {
    recommendations.push({
      text: `${m1.length} agente${m1.length > 1 ? "s" : ""} em M1 precisa${m1.length > 1 ? "m" : ""} de orientação próxima (liderança diretiva) — evita delegar-lhes tarefas sem supervisão direta por agora.`,
    });
  }
  if (withoutEvaluation.length > 0) {
    recommendations.push({
      text: `${withoutEvaluation.length} agente${withoutEvaluation.length > 1 ? "s" : ""} ainda sem avaliação — regista a primeira avaliação para teres recomendações mais precisas.`,
    });
  }
  return recommendations;
}

export function MaturityRecommendations({
  groups,
}: {
  groups: { name: string; color: string; agents: TeamAgent[] }[];
}) {
  const [open, setOpen] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState<string | null>(null);
  const router = useRouter();

  const allAgents = groups.flatMap((g) => g.agents);
  const globalRecommendations = buildGlobalRecommendations(allAgents);

  const groupsWithRecommendations = groups
    .map((group) => ({ ...group, recommendations: buildGroupRecommendations(group.agents) }))
    .filter((group) => group.recommendations.length > 0);

  const totalCount =
    globalRecommendations.length + groupsWithRecommendations.reduce((sum, g) => sum + g.recommendations.length, 0);
  if (totalCount === 0) return null;

  async function handleCreateTask(key: string, title: string) {
    setCreatingIndex(key);
    try {
      await tasksService.createQuickTask({ title });
      toast.success("Tarefa criada — já está na tua Inbox");
      router.refresh();
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setCreatingIndex(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          <Lightbulb className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Recomendações ({totalCount})
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--color-ink-muted)] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {globalRecommendations.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-[var(--color-ink)]">Geral (toda a equipa)</p>
              <RecommendationList
                recommendations={globalRecommendations}
                keyPrefix="global"
                creatingIndex={creatingIndex}
                onCreateTask={handleCreateTask}
              />
            </div>
          )}
          {groupsWithRecommendations.map((group) => (
            <div key={group.name}>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                {group.name}
              </p>
              <RecommendationList
                recommendations={group.recommendations}
                keyPrefix={group.name}
                creatingIndex={creatingIndex}
                onCreateTask={handleCreateTask}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationList({
  recommendations,
  keyPrefix,
  creatingIndex,
  onCreateTask,
}: {
  recommendations: Recommendation[];
  keyPrefix: string;
  creatingIndex: string | null;
  onCreateTask: (key: string, title: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {recommendations.map((rec, index) => {
        const key = `${keyPrefix}-${index}`;
        return (
          <li key={key} className="flex items-start gap-2 pl-3.5 text-sm text-[var(--color-ink)]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            <span className="flex-1">{rec.text}</span>
            {rec.actionTitle && (
              <button
                onClick={() => onCreateTask(key, rec.actionTitle!)}
                disabled={creatingIndex === key}
                className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-accent)]/40 px-2 py-1 text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" /> Criar tarefa
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
