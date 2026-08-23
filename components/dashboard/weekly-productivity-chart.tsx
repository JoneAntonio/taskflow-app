"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export function WeeklyProductivityChart({
  data,
}: {
  data: { day: string; concluidas: number; atrasadas: number }[];
}) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-alt)" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-ink)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--color-ink-muted)" }}
            formatter={(value) => (value === "concluidas" ? "Concluídas" : "Atrasadas")}
          />
          <Bar dataKey="concluidas" name="concluidas" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="atrasadas" name="atrasadas" fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
