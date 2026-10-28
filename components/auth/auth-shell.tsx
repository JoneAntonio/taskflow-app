import type { ReactNode } from "react";
import { NexusMark } from "@/components/layout/nexus-mark";
import { OrbitField } from "@/components/layout/nexus-backdrop";

const SIGNALS = [
  { k: "tarefas", v: "prazos, prioridades, recorrência" },
  { k: "foco", v: "pomodoro · matriz de Eisenhower" },
  { k: "equipa", v: "maturidade M1–M4 · SMART" },
  { k: "alertas", v: "push à hora certa, no telemóvel" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Painel de marca — sempre escuro, escondido em ecrãs pequenos */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[#1b2436] bg-[#05070d] p-12 text-[#e6edf7] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(125,160,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(125,160,255,0.06) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 70% at 30% 40%, #000 20%, transparent 75%)",
          }}
        />
        <OrbitField id="auth" className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 opacity-80" />

        <div className="relative flex items-center gap-2.5">
          <NexusMark className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-tight">JAFLOW</span>
          <span className="rounded border border-[#1b2436] px-1.5 py-px font-mono-data text-[10px] text-[#3dd9ff]">nexus</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.04em]">
            O teu centro de comando para trabalho, estudo e vida.
          </h2>
          <dl className="mt-10 space-y-3">
            {SIGNALS.map((s) => (
              <div key={s.k} className="flex items-baseline gap-4 border-t border-[#1b2436] pt-3">
                <dt className="w-20 shrink-0 font-mono-data text-[11px] text-[#3dd9ff]">{s.k}</dt>
                <dd className="text-sm text-[#9aa6bf]">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative flex items-center gap-2 font-mono-data text-[11px] text-[#5e6a85]">
          <span className="nx-live-dot" /> sistema operacional · © {new Date().getFullYear()} JAFLOW
        </p>
      </div>

      {/* Painel do formulário */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <NexusMark className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">JAFLOW</span>
            <span className="rounded border border-[var(--color-border)] px-1.5 py-px font-mono-data text-[10px] text-[var(--color-accent)]">nexus</span>
          </div>
          <h1 className="font-display text-[28px] font-semibold leading-tight text-[var(--color-ink)]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
          <div className="nx-panel mt-8 rounded-2xl border border-[var(--color-border)] p-6 shadow-[var(--shadow-md)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
