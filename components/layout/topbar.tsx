"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { NexusMark } from "@/components/layout/nexus-mark";
import type { Profile } from "@/types/database";

export function Topbar({ profile }: { profile: Pick<Profile, "full_name" | "email" | "avatar_url"> }) {
  const router = useRouter();

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") || "").trim();
    router.push(query ? `/pesquisa?q=${encodeURIComponent(query)}` : "/pesquisa");
  }

  return (
    <header className="nx-glass nx-hairline-b sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5 sm:px-6">
      <span className="flex items-center gap-2 lg:hidden">
        <NexusMark className="h-6 w-6" />
      </span>
      <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <input
          id="nx-global-search"
          name="q"
          placeholder="Pesquisar…"
          className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/70 pl-9 pr-14 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)] transition-[border-color,box-shadow] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_16%,transparent)]"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
          <span className="nx-kbd">⌘</span>
          <span className="nx-kbd">K</span>
        </span>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
