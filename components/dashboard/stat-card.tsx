import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: "default" | "accent" | "danger" | "success";
}) {
  const accentColor = {
    default: "var(--color-ink-muted)",
    accent: "var(--color-accent)",
    danger: "var(--color-danger)",
    success: "var(--color-success)",
  }[accent];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn("hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] min-[420px]:flex sm:flex")}
          style={{
            background: `color-mix(in oklab, ${accentColor} 12%, var(--color-surface-alt))`,
            boxShadow: accent === "default" ? undefined : `0 0 18px -6px ${accentColor}`,
          }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
          <p className="font-mono-data text-[22px] font-medium leading-tight text-[var(--color-ink)]">{value}</p>
          <p className="line-clamp-2 text-xs leading-tight text-[var(--color-ink-muted)]">{label}</p>
        </div>
      </div>
    </Card>
  );
}
