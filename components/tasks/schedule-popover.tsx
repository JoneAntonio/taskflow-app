"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sun, Sunrise, CalendarPlus, Repeat } from "lucide-react";
import { MiniCalendar } from "@/components/tasks/mini-calendar";
import { Button } from "@/components/ui/button";
import { PRIORITY_LABELS } from "@/lib/labels";
import { RECURRENCE_LABELS } from "@/utils/parse-quick-task";
import { cn } from "@/lib/utils";
import type { TaskPriority, Recurrence, RecurrenceFrequency } from "@/types/database";

export interface ScheduleValue {
  dueDate: string | null;
  dueTime: string | null;
  dueTimeEnd: string | null;
  priority: TaskPriority | null;
  recurrence: Recurrence | null;
  reminderMinutesBefore: number | null;
  isImportant: boolean | null;
}

const QUICK_DATE_OPTIONS = [
  { label: "Hoje", icon: Sun, getDate: () => new Date() },
  { label: "Amanhã", icon: Sunrise, getDate: () => addDays(new Date(), 1) },
  { label: "Próxima semana", icon: CalendarPlus, getDate: () => addDays(new Date(), 7) },
];

const PRIORITY_OPTIONS: TaskPriority[] = ["sem_prioridade", "baixa", "media", "alta", "urgente"];
const RECURRENCE_OPTIONS: Exclude<RecurrenceFrequency, null>[] = ["diaria", "dias_uteis", "semanal", "mensal", "anual"];

/**
 * Mapeamento pedido pelo utilizador entre "nível" e quadrante da Matriz:
 * Alto → Urgente e importante · Médio → Importante, não urgente ·
 * Baixo → Urgente, não importante · Muito Baixo → Nem urgente, nem importante.
 * Internamente usamos priority + isImportant para determinar o quadrante
 * (a mesma lógica usada em /matriz), sem depender do texto do nível.
 */
const MATRIX_LEVEL_OPTIONS: { label: string; quadrant: string; priority: TaskPriority; isImportant: boolean; color: string }[] = [
  { label: "Alto", quadrant: "Fazer", priority: "alta", isImportant: true, color: "var(--color-danger)" },
  { label: "Médio", quadrant: "Agendar", priority: "baixa", isImportant: true, color: "var(--color-secondary)" },
  { label: "Baixo", quadrant: "Delegar", priority: "alta", isImportant: false, color: "var(--color-warning)" },
  { label: "Muito Baixo", quadrant: "Eliminar", priority: "baixa", isImportant: false, color: "var(--color-ink-muted)" },
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function SchedulePopover({
  value,
  onChange,
  onClose,
  anchorRef,
}: {
  value: ScheduleValue;
  onChange: (value: ScheduleValue) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"dados" | "prioridade" | "repetir" | "matriz">("dados");
  const [local, setLocal] = useState<ScheduleValue>(value);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
  }, [anchorRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  function apply() {
    onChange(local);
    onClose();
  }

  function clear() {
    const cleared: ScheduleValue = {
      dueDate: null,
      dueTime: null,
      dueTimeEnd: null,
      priority: null,
      recurrence: null,
      reminderMinutesBefore: null,
      isImportant: null,
    };
    setLocal(cleared);
    onChange(cleared);
    onClose();
  }

  if (typeof document === "undefined" || !position) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[60] w-96 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="mb-3 flex gap-1 rounded-full bg-[var(--color-surface-alt)] p-1">
        {(["dados", "prioridade", "repetir", "matriz"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-muted)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_DATE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const dateISO = toISODate(opt.getDate());
              const isActive = local.dueDate === dateISO;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setLocal((prev) => ({ ...prev, dueDate: dateISO }))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors",
                    isActive
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <MiniCalendar
            selectedDate={local.dueDate}
            onSelect={(date) => setLocal((prev) => ({ ...prev, dueDate: date }))}
          />

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-ink-muted)]">Hora</p>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={local.dueTime ?? ""}
                onChange={(e) => setLocal((prev) => ({ ...prev, dueTime: e.target.value || null }))}
                className="h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-ink)]"
              />
              <span className="text-xs text-[var(--color-ink-muted)]">até</span>
              <input
                type="time"
                value={local.dueTimeEnd ?? ""}
                onChange={(e) => setLocal((prev) => ({ ...prev, dueTimeEnd: e.target.value || null }))}
                className="h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-ink)]"
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-ink-muted)]">Lembrete (avisa antes da hora)</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Nenhum", value: null },
                { label: "5 min", value: 5 },
                { label: "15 min", value: 15 },
                { label: "30 min", value: 30 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  disabled={!local.dueDate || !local.dueTime}
                  onClick={() => setLocal((prev) => ({ ...prev, reminderMinutesBefore: opt.value }))}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    local.reminderMinutesBefore === opt.value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-ink-muted)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(!local.dueDate || !local.dueTime) && (
              <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">Define data e hora para poderes ativar um lembrete.</p>
            )}
          </div>
        </div>
      )}

      {tab === "prioridade" && (
        <div className="space-y-1.5">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setLocal((prev) => ({ ...prev, priority: p }))}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                local.priority === p
                  ? "bg-[var(--color-surface-alt)] font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: `var(--color-priority-${p.replace("sem_prioridade", "none")})` }}
              />
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      {tab === "repetir" && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setLocal((prev) => ({ ...prev, recurrence: null }))}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              !local.recurrence
                ? "bg-[var(--color-surface-alt)] font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
            )}
          >
            <Repeat className="h-3.5 w-3.5" /> Não repete
          </button>
          {RECURRENCE_OPTIONS.map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() =>
                setLocal((prev) => ({
                  ...prev,
                  recurrence: { frequency: freq, interval: 1, by_weekday: null, until: null },
                }))
              }
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                local.recurrence?.frequency === freq
                  ? "bg-[var(--color-surface-alt)] font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
              )}
            >
              <Repeat className="h-3.5 w-3.5" /> {RECURRENCE_LABELS[freq]}
            </button>
          ))}
        </div>
      )}

      {tab === "matriz" && (
        <div className="space-y-1.5">
          <p className="mb-2 text-xs text-[var(--color-ink-muted)]">
            Escolhe onde esta tarefa deve aparecer na Matriz de Eisenhower.
          </p>
          {MATRIX_LEVEL_OPTIONS.map((opt) => {
            const isActive = local.priority === opt.priority && local.isImportant === opt.isImportant;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setLocal((prev) => ({ ...prev, priority: opt.priority, isImportant: opt.isImportant }))}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
                    : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                )}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs" style={{ color: opt.color }}>
                  {opt.quadrant}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-between gap-2 border-t border-[var(--color-border)] pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Limpar
        </Button>
        <Button type="button" size="sm" onClick={apply}>
          OK
        </Button>
      </div>
    </div>,
    document.body
  );
}
