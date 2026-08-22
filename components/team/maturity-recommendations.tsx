import { Lightbulb } from "lucide-react";
import type { TeamAgent } from "@/types/team-maturity";

function buildRecommendations(agents: TeamAgent[]): string[] {
  const total = agents.length;
  if (total === 0) return [];

  const m4 = agents.filter((a) => a.current_maturity === "M4");
  const m1 = agents.filter((a) => a.current_maturity === "M1");
  const m2 = agents.filter((a) => a.current_maturity === "M2");
  const withoutEvaluation = agents.filter((a) => !a.current_maturity);

  const recommendations: string[] = [];

  if (m4.length > 0) {
    const names = m4
      .slice(0, 3)
      .map((a) => a.name)
      .join(", ");
    recommendations.push(
      `Tens ${m4.length} agente${m4.length > 1 ? "s" : ""} em M4 (${names}${m4.length > 3 ? "..." : ""}). São os candidatos certos para delegares tarefas complexas ou de maior autonomia — usa o quadrante "Delegar" da Matriz de Eisenhower para lhes atribuíres essas tarefas.`
    );
    if (m1.length > 0 || m2.length > 0) {
      recommendations.push(
        `Considera atribuir agentes M4 como mentores dos agentes em M1/M2 (${m1.length + m2.length} no total) — é uma forma natural de acelerar o desenvolvimento deles sem sobrecarregar-te a ti.`
      );
    }
    if (m4.length / total >= 0.4) {
      recommendations.push(
        `${Math.round((m4.length / total) * 100)}% da tua equipa já está em M4 — isto é sinal de capacidade instalada para escalares a operação (mais volume, ou tarefas mais exigentes) sem perda de qualidade.`
      );
    }
  } else {
    recommendations.push(
      "Ainda não tens nenhum agente em M4. Procura, entre os que estão em M3, quem tem pontuações mais altas em Autonomia e Ownership — são os melhores candidatos a desenvolver para M4 nos próximos ciclos."
    );
  }

  if (m1.length > 0) {
    recommendations.push(
      `${m1.length} agente${m1.length > 1 ? "s" : ""} em M1 precisa${m1.length > 1 ? "m" : ""} de orientação próxima (liderança autocrática) — evita delegar-lhes tarefas sem supervisão direta por agora.`
    );
  }

  if (withoutEvaluation.length > 0) {
    recommendations.push(
      `${withoutEvaluation.length} agente${withoutEvaluation.length > 1 ? "s" : ""} ainda sem avaliação — regista a primeira avaliação para começares a ter recomendações mais precisas sobre ${withoutEvaluation.length > 1 ? "eles" : "este agente"}.`
    );
  }

  return recommendations;
}

export function MaturityRecommendations({ agents }: { agents: TeamAgent[] }) {
  const recommendations = buildRecommendations(agents);
  if (recommendations.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <Lightbulb className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        Recomendações
      </p>
      <ul className="space-y-2.5">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex gap-2 text-sm text-[var(--color-ink)]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            {rec}
          </li>
        ))}
      </ul>
    </div>
  );
}
