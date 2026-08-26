"use client";

import { List, Rows3, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDisplayMode } from "@/lib/use-task-display-mode";

const OPTIONS: { mode: TaskDisplayMode; label: string; icon: typeof List }[] = [
  { mode: "lista", label: "Lista", icon: List },
  { mode: "detalhada", label: "Lista detalhada", icon: Rows3 },
  { mode: "grelha", label: "Grelha", icon: Columns3 },
];

export function TaskDisplayModeSwitcher({
  value,
  onChange,
}: {
  value: TaskDisplayMode;
  onChange: (mode: TaskDisplayMode) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
      {OPTIONS.map(({ mode, label, icon: Icon }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-out",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
