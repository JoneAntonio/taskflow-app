"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Cake, CalendarPlus, Tag, X, Plus } from "lucide-react";
import { agentProfileService } from "@/services/agent-notes.service";
import type { TeamAgent } from "@/types/team-maturity";

export function AgentProfileCard({ agent }: { agent: TeamAgent }) {
  const [phone, setPhone] = useState(agent.phone ?? "");
  const [birthday, setBirthday] = useState(agent.birthday ?? "");
  const [startDate, setStartDate] = useState(agent.start_date ?? "");
  const [skills, setSkills] = useState<string[]>(agent.skills ?? []);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function saveField(input: Parameters<typeof agentProfileService.update>[1]) {
    setIsSaving(true);
    try {
      await agentProfileService.update(agent.id, input);
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  function addSkill(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    const next = [...skills, trimmed];
    setSkills(next);
    setNewSkill("");
    saveField({ skills: next });
  }

  function removeSkill(skill: string) {
    const next = skills.filter((s) => s !== skill);
    setSkills(next);
    saveField({ skills: next });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Ficha de colaborador
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => saveField({ phone: phone.trim() || null })}
            placeholder="Telefone"
            disabled={isSaving}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2">
          <Cake className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            onBlur={() => saveField({ birthday: birthday || null })}
            disabled={isSaving}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2">
          <CalendarPlus className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onBlur={() => saveField({ startDate: startDate || null })}
            disabled={isSaving}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none"
          />
        </label>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <Tag className="h-3 w-3" /> Competências
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-xs text-[var(--color-ink)]"
            >
              {skill}
              <button onClick={() => removeSkill(skill)} aria-label={`Remover ${skill}`}>
                <X className="h-3 w-3 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)]" />
              </button>
            </span>
          ))}
          <form onSubmit={addSkill} className="flex items-center gap-1">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Adicionar..."
              className="w-24 rounded-full border border-dashed border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
            <button type="submit" aria-label="Adicionar competência" className="text-[var(--color-ink-muted)]">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
