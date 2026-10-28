"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/lib/navigation";

/** Doca flutuante para telemóvel — vidro fumado, botão central com brilho. */
export function BottomNav({ onQuickAdd }: { onQuickAdd?: () => void }) {
  const pathname = usePathname();
  const items = mobileNav;
  const midpoint = Math.ceil(items.length / 2);
  const left = items.slice(0, midpoint);
  const right = items.slice(midpoint);

  return (
    <nav
      className="fixed inset-x-3 z-40 lg:hidden"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <div className="nx-glass nx-panel flex items-center justify-around rounded-2xl border border-[var(--color-border)] px-1.5 py-1 shadow-[var(--shadow-lg)]">
        {left.map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
        ))}

        <button
          onClick={onQuickAdd}
          aria-label="Adicionar tarefa"
          className="mx-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-[var(--color-accent-ink)] shadow-[var(--glow)] transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
        </button>

        {right.map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  isActive,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] font-medium transition-colors",
        isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute top-0 h-[2px] w-6 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]"
        />
      )}
      <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-[var(--color-accent)]" : "")} />
      <span>{item.label}</span>
    </Link>
  );
}
