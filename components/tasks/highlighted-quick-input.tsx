"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { parseQuickTask, type QuickTaskSegmentType } from "@/utils/parse-quick-task";
import { cn } from "@/lib/utils";

const SEGMENT_COLOR_VAR: Record<QuickTaskSegmentType, string> = {
  tag: "--color-ink-muted",
  priority: "--color-warning",
  date: "--color-secondary",
  time: "--color-secondary",
  recurrence: "--color-success",
};

interface HighlightedQuickInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Input de linha única com uma camada visual por baixo que realça, a cores,
 * os trechos que o parser reconhece (etiquetas, prioridade, data/hora,
 * recorrência) — a mesma sensação da entrada rápida do TickTick.
 *
 * Técnica: o <input> real fica com o texto transparente (só o cursor é
 * visível); por baixo, um <div> com a mesma fonte/padding mostra o texto
 * com <span>s coloridos nos trechos reconhecidos.
 */
export function HighlightedQuickInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  disabled,
}: HighlightedQuickInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const parsed = value.trim() ? parseQuickTask(value) : null;
  const segments = parsed?.segments ?? [];

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  function handleScroll() {
    if (inputRef.current) setScrollLeft(inputRef.current.scrollLeft);
  }

  // Constrói os pedaços de texto (reconhecido / normal) por ordem
  const pieces: { text: string; type: QuickTaskSegmentType | null }[] = [];
  let cursor = 0;
  const ordered = [...segments].sort((a, b) => a.start - b.start);
  for (const seg of ordered) {
    if (seg.start > cursor) pieces.push({ text: value.slice(cursor, seg.start), type: null });
    pieces.push({ text: value.slice(seg.start, seg.end), type: seg.type });
    cursor = seg.end;
  }
  if (cursor < value.length) pieces.push({ text: value.slice(cursor), type: null });

  return (
    <div className="relative">
      <div
        ref={overlayRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre rounded-xl px-3.5 text-sm"
        style={{ transform: `translateX(-${scrollLeft}px)` }}
      >
        {value.length === 0 ? (
          <span className="text-[var(--color-ink-muted)]">{placeholder}</span>
        ) : (
          pieces.map((piece, index) =>
            piece.type ? (
              <span
                key={index}
                className="rounded"
                style={{
                  color: `var(${SEGMENT_COLOR_VAR[piece.type]})`,
                  fontWeight: 600,
                }}
              >
                {piece.text}
              </span>
            ) : (
              <span key={index} className="text-[var(--color-ink)]">
                {piece.text}
              </span>
            )
          )
        )}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3.5 text-sm caret-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] disabled:opacity-60",
          "text-transparent placeholder:text-transparent"
        )}
      />
    </div>
  );
}
