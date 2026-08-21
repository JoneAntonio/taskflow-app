"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { habitsService, HABIT_COLORS } from "@/services/habits.service";
import { HabitDaySelector } from "@/components/habits/habit-day-selector";
import { HabitPreviewCalendar } from "@/components/habits/habit-preview-calendar";
import { cn } from "@/lib/utils";

export function NewHabitButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [targetDays, setTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || targetDays.length === 0) return;
    setIsSubmitting(true);
    try {
      await habitsService.createHabit({ name: name.trim(), color, targetDays });
      toast.success("Hábito criado");
      setName("");
      setTargetDays([0, 1, 2, 3, 4, 5, 6]);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível criar o hábito.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Novo hábito
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Novo hábito" className="max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="habit-name">Nome</Label>
              <Input
                id="habit-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Beber água"
              />
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      color === c ? "scale-110 border-[var(--color-ink)]" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Em que dias deve ser realizado?</Label>
              <HabitDaySelector selectedDays={targetDays} onChange={setTargetDays} />
              {targetDays.length === 0 && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">Escolhe pelo menos um dia.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting} disabled={targetDays.length === 0}>
                Criar hábito
              </Button>
            </div>
          </div>

          <HabitPreviewCalendar selectedDays={targetDays} color={color} />
        </form>
      </Dialog>
    </>
  );
}
