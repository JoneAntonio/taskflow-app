"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListTodo, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types/database";

const OPTIONS: { value: AccountType; label: string; description: string; icon: typeof ListTodo }[] = [
  {
    value: "agente",
    label: "Agente",
    description: "Só tarefas e gestão de tempo — sem Método SMART, Equipas ou Maturidade.",
    icon: ListTodo,
  },
  {
    value: "supervisor",
    label: "Supervisor",
    description: "Acesso total — objetivos SMART, criar/gerir equipas, avaliar maturidade.",
    icon: ShieldCheck,
  },
];

export function AccountTypeSelector({ current }: { current: AccountType }) {
  const [value, setValue] = useState(current);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSelect(next: AccountType) {
    if (next === value) return;
    setValue(next);
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("profiles").update({ account_type: next }).eq("id", user.id);
      if (error) throw error;
      toast.success("Tipo de conta atualizado");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar.");
      setValue(current);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={isSaving}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors",
              isActive
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
              )}
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">{option.label}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
