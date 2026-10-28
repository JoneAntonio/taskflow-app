"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNav, organizeNav, focusNav, teamNav } from "@/lib/navigation";
import { NexusMark } from "@/components/layout/nexus-mark";
import { SystemStatus } from "@/components/layout/system-status";
import type { AccountType, Project } from "@/types/database";

function NavGroup({
  title,
  items,
  pathname,
  accountType,
}: {
  title?: string;
  items: { label: string; href: string; icon: React.ElementType; supervisorOnly?: boolean }[];
  pathname: string;
  accountType: AccountType;
}) {
  const visibleItems = items.filter((item) => !item.supervisorOnly || accountType === "supervisor");
  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {title && (
        <p className="flex items-center gap-2 px-3 pb-1.5 pt-5 font-mono-data text-[10.5px] text-[var(--color-ink-muted)]">
          <span className="h-px w-3 bg-[var(--color-border)]" />
          {title}
        </p>
      )}
      {visibleItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] font-medium transition-colors",
              isActive
                ? "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-accent)_14%,transparent),transparent_85%)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]/70 hover:text-[var(--color-ink)]"
            )}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]"
              />
            )}
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]"
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
  accountType,
}: {
  onQuickAdd?: () => void;
  projects?: Project[];
  accountType: AccountType;
}) {
  const pathname = usePathname();

  return (
    <aside className="nx-glass sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[var(--color-border)] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <NexusMark className="h-7 w-7" />
        <div className="min-w-0 leading-none">
          <span className="block font-display text-[15px] font-semibold tracking-[0.04em] text-[var(--color-ink)]">I.D.I.O.T.A.</span>
          <span className="mt-1 block truncate font-mono-data text-[9.5px] text-[var(--color-accent)]">inteligência digital integrada</span>
        </div>
      </div>

      <div className="px-3">
        <button
          onClick={onQuickAdd}
          className="group flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/60 px-3 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-[border-color,box-shadow] hover:border-[color-mix(in_oklab,var(--color-accent)_50%,var(--color-border))] hover:shadow-[var(--glow)]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--color-accent)] text-[var(--color-accent-ink)]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
          Nova tarefa
          <span className="nx-kbd ml-auto">N</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        <NavGroup items={primaryNav} pathname={pathname} accountType={accountType} />
        <NavGroup title="organizar" items={organizeNav} pathname={pathname} accountType={accountType} />
        <NavGroup title="foco" items={focusNav} pathname={pathname} accountType={accountType} />
        <NavGroup title="equipa" items={teamNav} pathname={pathname} accountType={accountType} />

        {accountType === "supervisor" && projects.length > 0 && (
          <div className="space-y-0.5">
            <p className="flex items-center gap-2 px-3 pb-1.5 pt-5 font-mono-data text-[10.5px] text-[var(--color-ink-muted)]">
              <span className="h-px w-3 bg-[var(--color-border)]" />
              projetos
            </p>
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-alt)]/70 hover:text-[var(--color-ink)]"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}` }}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <SystemStatus />
    </aside>
  );
}
