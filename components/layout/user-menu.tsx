"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";
import { authService } from "@/services/auth.service";
import { getGravatarUrl } from "@/lib/gravatar";
import type { Profile } from "@/types/database";

export function UserMenu({ profile }: { profile: Pick<Profile, "full_name" | "email" | "avatar_url"> }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await authService.signOut();
    router.push("/login");
    router.refresh();
  }

  const avatarUrl = profile.avatar_url || getGravatarUrl(profile.email, 64);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-1 pr-2.5 hover:bg-[var(--color-surface-alt)]"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-accent-ink)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-md)]">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-[var(--color-ink)]">
              {profile.full_name || "Sem nome"}
            </p>
            <p className="truncate text-xs text-[var(--color-ink-muted)]">{profile.email}</p>
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
          >
            <User className="h-4 w-4" /> Perfil
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-alt)]"
          >
            <LogOut className="h-4 w-4" /> Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
