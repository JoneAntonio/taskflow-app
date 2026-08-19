"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flame } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { habitsService } from "@/services/habits.service";
import type { Habit } from "@/types/database";

export function HabitCard({
  habit,
  completedTodayLogId,
  streak,
}: {
  habit: Habit;
  completedTodayLogId: string | null;
  streak: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(!!completedTodayLogId);
  const router = useRouter();

  async function handleToggle() {
    setOptimisticDone((prev) => !prev);
    try {
      await habitsService.toggleToday(habit.id, completedTodayLogId);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Não foi possível atualizar o hábito.");
      setOptimisticDone((prev) => !prev);
    }
  }

  return (
    <Card className="flex items-center gap-3 p-4">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          optimisticDone ? "border-transparent" : "border-[var(--color-border)]"
        )}
        style={optimisticDone ? { backgroundColor: habit.color } : undefined}
        aria-label="Marcar hoje"
      >
        {optimisticDone && <Check className="h-5 w-5 text-white" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-ink)]">{habit.name}</p>
        {habit.description && <p className="truncate text-xs text-[var(--color-ink-muted)]">{habit.description}</p>}
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1 text-sm font-medium text-[var(--color-warning)]">
          <Flame className="h-4 w-4" /> {streak}
        </div>
      )}
    </Card>
  );
}
