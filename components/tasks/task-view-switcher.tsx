"use client";

import { List, ListChecks, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskViewMode = "lista" | "checklist" | "kanban";

const OPTIONS: { mode: TaskViewMode; label: string; icon: typeof List }[] = [
  { mode: "lista", label: "Lista", icon: List },
  { mode: "checklist", label: "Checklist", icon: ListChecks },
  { mode: "kanban", label: "Quadro", icon: Columns3 },
];

export function TaskViewSwitcher({ value, onChange }: { value: TaskViewMode; onChange: (mode: TaskViewMode) => void }) {
  return (
    <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
      {OPTIONS.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-label={label}
          aria-pressed={value === mode}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === mode
              ? "bg-[var(--color-success)] text-white shadow-[var(--shadow-sm)]"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
