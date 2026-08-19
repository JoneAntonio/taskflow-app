"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import type { MaturityEvaluation } from "@/types/team-maturity";

export function EvolutionChart({ evaluations }: { evaluations: MaturityEvaluation[] }) {
  const data = evaluations.map((evaluation) => ({
    date: new Date(evaluation.evaluation_date).toLocaleDateString("pt-PT", {
      month: "short",
      year: "2-digit",
    }),
    resultado: evaluation.weighted_result,
    maturidade: evaluation.confirmed_maturity,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }} />
          <YAxis domain={[1, 5]} tickLine={false} axisLine={false} tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }} width={28} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-ink)" }}
            formatter={(value, _name, props) => [
              `${value} (${props.payload.maturidade})`,
              "Resultado",
            ]}
          />
          <Line
            type="monotone"
            dataKey="resultado"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
