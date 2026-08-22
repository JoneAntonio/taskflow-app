"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sun, Sunrise, CalendarPlus, Repeat, Check } from "lucide-react";
import { MiniCalendar } from "@/components/tasks/mini-calendar";
import { Button } from "@/components/ui/button";
import { RECURRENCE_LABELS } from "@/utils/parse-quick-task";
import { cn, toLocalISODate } from "@/lib/utils";
import type { TaskPriority, Recurrence, RecurrenceFrequency } from "@/types/database";

export interface ScheduleValue {
  dueDate: string | null;
  dueTime: string | null;
  dueTimeEnd: string | null;
  priority: TaskPriority | null;
  recurrence: Recurrence | null;
  reminderMinutesBefore: number | null;
  isImportant: boolean | null;
  location: string | null;
  estimatedDurationMinutes: number | null;
  description: string | null;
}

const QUICK_DATE_OPTIONS = [
  { label: "Hoje", icon: Sun, getDate: () => new Date() },
  { label: "Amanhã", icon: Sunrise, getDate: () => addDays(new Date(), 1) },
  { label: "Próxima semana", icon: CalendarPlus, getDate: () => addDays(new Date(), 7) },
];

const RECURRENCE_OPTIONS: Exclude<RecurrenceFrequency, null>[] = ["diaria", "dias_uteis", "semanal", "mensal", "anual"];

/**
 * Mapeamento único entre "nível" e quadrante da Matriz — a MESMA escolha
 * define tanto a prioridade como a importância, para a tarefa aparecer
 * sempre no quadrante certo, seja onde for que a crias na app:
 * Alto → Urgente e importante (Fazer) · Médio → Importante, não urgente (Agendar) ·
 * Baixo → Urgente, não importante (Delegar) · Muito Baixo → Nem urgente, nem importante (Eliminar).
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
  return toLocalISODate(date);
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
  const [tab, setTab] = useState<"dados" | "prioridade" | "repetir">("dados");
  const [local, setLocal] = useState<ScheduleValue>(value);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const panelWidth = 320; // w-80
      const margin = 16;
      const estimatedPanelHeight = 560;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow;

      const left = Math.min(rect.left + window.scrollX, window.innerWidth - panelWidth - margin + window.scrollX);
      const top = openUpward ? margin : rect.bottom + window.scrollY + 8;

      // Altura máxima calculada a partir de onde o painel REALMENTE começa
      // (não do ecrã inteiro), para o rodapé "Limpar/OK" nunca ficar
      // inalcançável, seja o painel aberto para cima ou para baixo.
      const maxHeight = openUpward
        ? Math.max(240, spaceAbove - margin - 8)
        : Math.max(240, window.innerHeight - (rect.bottom + 8) - margin);

      setPosition({ top, left: Math.max(margin, left), maxHeight });
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
      location: null,
      estimatedDurationMinutes: null,
      description: null,
    };
    setLocal(cleared);
    onChange(cleared);
    onClose();
  }

  if (typeof document === "undefined" || !position) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[60] w-80 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]"
      style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
    >
      <div className="mb-3 flex gap-1 rounded-full bg-[var(--color-surface-alt)] p-1">
        {(["dados", "prioridade", "repetir"] as const).map((t) => (
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

          {local.recurrence?.frequency && (
            <button
              type="button"
              onClick={() => setTab("repetir")}
              className="flex w-full items-center gap-1.5 rounded-lg bg-[var(--color-accent)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent)]"
            >
              <Repeat className="h-3.5 w-3.5" />
              Repete: {RECURRENCE_LABELS[local.recurrence.frequency]}
            </button>
          )}

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

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-ink-muted)]">Local (opcional)</p>
            <input
              type="text"
              value={local.location ?? ""}
              onChange={(e) => setLocal((prev) => ({ ...prev, location: e.target.value || null }))}
              placeholder="Ex: Sala de reuniões, Escritório SIMAR"
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-ink)]"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-ink-muted)]">
              Duração estimada (opcional)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={480}
                value={local.estimatedDurationMinutes ?? ""}
                onChange={(e) =>
                  setLocal((prev) => ({
                    ...prev,
                    estimatedDurationMinutes: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="Ex: 30"
                className="h-9 w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-ink)]"
              />
              <span className="text-xs text-[var(--color-ink-muted)]">min</span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
              Se definires isto, o Pomodoro fica limitado a este tempo quando associares esta tarefa — não conseguirás
              exceder o limite.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-ink-muted)]">Nota (opcional)</p>
            <textarea
              rows={2}
              value={local.description ?? ""}
              onChange={(e) => setLocal((prev) => ({ ...prev, description: e.target.value || null }))}
              placeholder="Detalhes, contexto ou instruções sobre esta tarefa..."
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>
      )}

      {tab === "prioridade" && (
        <div className="space-y-1.5">
          <p className="mb-2 text-xs text-[var(--color-ink-muted)]">
            Escolhe o nível — determina também onde a tarefa aparece na Matriz de Eisenhower.
          </p>
          {MATRIX_LEVEL_OPTIONS.map((opt) => {
            const isActive = local.priority === opt.priority && local.isImportant === opt.isImportant;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setLocal((prev) => ({ ...prev, priority: opt.priority, isImportant: opt.isImportant }))}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]"
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />
                <span className="flex-1 font-medium">{opt.label}</span>
                <span className="text-xs" style={{ color: opt.color }}>
                  {opt.quadrant}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "repetir" && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setLocal((prev) => ({ ...prev, recurrence: null }))}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              !local.recurrence
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 font-medium text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
            )}
          >
            {!local.recurrence && <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            <Repeat className="h-3.5 w-3.5" /> Não repete
          </button>
          {RECURRENCE_OPTIONS.map((freq) => {
            const isActive = local.recurrence?.frequency === freq;
            return (
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
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 font-medium text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
                )}
              >
                {isActive && <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
                <Repeat className="h-3.5 w-3.5" /> {RECURRENCE_LABELS[freq]}
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
