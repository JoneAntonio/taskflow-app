"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waypoints, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNav, organizeNav, focusNav, teamNav } from "@/lib/navigation";
import type { Project } from "@/types/database";

function NavGroup({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: { label: string; href: string; icon: React.ElementType }[];
  pathname: string;
}) {
  return (
    <div className="space-y-0.5">
      {title && (
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--color-surface-alt)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({
  onQuickAdd,
  projects = [],
}: {
  onQuickAdd?: () => void;
  projects?: Project[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
      {/* Marca + linha de fluxo (elemento assinatura) */}
      <div className="relative flex items-center gap-2 px-5 pb-4 pt-6">
        <Waypoints className="h-5 w-5 text-[var(--color-accent)]" />
        <span className="font-display text-base font-semibold text-[var(--color-ink)]">
          TaskFlow
        </span>
      </div>

      <div className="px-3">
        <button
          onClick={onQuickAdd}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
        >
          <Plus className="h-4 w-4" />
          Adicionar tarefa
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <NavGroup items={primaryNav} pathname={pathname} />
        <NavGroup title="Organizar" items={organizeNav} pathname={pathname} />
        <NavGroup title="Foco" items={focusNav} pathname={pathname} />
        <NavGroup title="Equipa" items={teamNav} pathname={pathname} />

        {projects.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Projetos
            </p>
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Linha de fluxo vertical — assinatura visual do TaskFlow */}
      <div
        aria-hidden
        className="mx-5 mb-5 h-1 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--color-accent) 0%, var(--color-secondary) 100%)",
        }}
      />
    </aside>
  );
}
