"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
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
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 py-3 backdrop-blur sm:px-6">
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <input
          name="q"
          placeholder="Pesquisar tarefas, projetos, etiquetas…"
          className="h-9 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <ThemeToggle />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
