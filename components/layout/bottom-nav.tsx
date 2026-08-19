"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/lib/navigation";

export function BottomNav({ onQuickAdd }: { onQuickAdd?: () => void }) {
  const pathname = usePathname();
  const items = mobileNav;
  const midpoint = Math.ceil(items.length / 2);
  const left = items.slice(0, midpoint);
  const right = items.slice(midpoint);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
      {left.map((item) => (
        <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
      ))}

      <button
        onClick={onQuickAdd}
        aria-label="Adicionar tarefa"
        className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-[var(--shadow-md)]"
      >
        <Plus className="h-6 w-6" />
      </button>

      {right.map((item) => (
        <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
      ))}
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
      className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
    >
      <Icon
        className={cn(
          "h-5 w-5",
          isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
        )}
      />
      <span className={isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}>
        {item.label}
      </span>
    </Link>
  );
}
