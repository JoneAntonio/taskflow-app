import type { ReactNode } from "react";
import { Waypoints } from "lucide-react";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca — escondido em ecrãs pequenos */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-ink)] p-12 text-[#f1f1ee] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(180deg, transparent 0%, transparent 70%, rgba(242,169,59,0.25) 100%), radial-gradient(circle at 20% 20%, rgba(242,169,59,0.18), transparent 45%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <Waypoints className="h-6 w-6 text-[var(--color-accent)]" />
          <span className="font-display text-lg font-semibold">TaskFlow</span>
        </div>
        <div className="relative max-w-sm">
          <p className="font-display text-3xl font-semibold leading-tight">
            O teu trabalho, os teus estudos e a tua vida — a fluir num só sítio.
          </p>
          <p className="mt-4 text-sm text-[#a9abb4]">
            Organiza tarefas, projetos e hábitos com um sistema pensado para
            acompanhar o teu ritmo, não para o atrapalhar.
          </p>
        </div>
        <p className="relative text-xs text-[#75778a]">© {new Date().getFullYear()} TaskFlow</p>
      </div>

      {/* Painel do formulário */}
      <div className="flex items-center justify-center bg-[var(--color-bg)] p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Waypoints className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="font-display text-lg font-semibold text-[var(--color-ink)]">
              TaskFlow
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{title}</h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
