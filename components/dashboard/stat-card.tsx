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
          className={cn("flex h-9 w-9 items-center justify-center rounded-xl")}
          style={{ backgroundColor: "var(--color-surface-alt)" }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-[var(--color-ink)]">{value}</p>
          <p className="truncate text-xs text-[var(--color-ink-muted)]">{label}</p>
        </div>
      </div>
    </Card>
  );
}
