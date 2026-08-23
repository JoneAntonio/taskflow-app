"use client";

import { useEffect, useState } from "react";

export function AIUsageIndicator({ scope }: { scope: "smart" | "maturidade" }) {
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setUsage({ count: data[scope] ?? 0, limit: data.limit });
      })
      .catch(() => {});
  }, [scope]);

  if (!usage) return null;

  return (
    <p className="text-[10px] text-[var(--color-ink-muted)]">
      {usage.count} pedido{usage.count === 1 ? "" : "s"} de IA hoje · estimativa de ~{usage.limit} gratuitos/dia
      (partilhados por toda a app)
    </p>
  );
}
