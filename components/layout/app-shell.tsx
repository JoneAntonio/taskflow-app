"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { QuickAddDialog } from "@/components/tasks/quick-add-dialog";
import type { Profile, Project } from "@/types/database";

export function AppShell({
  profile,
  projects,
  children,
}: {
  profile: Pick<Profile, "full_name" | "email" | "avatar_url">;
  projects: Project[];
  children: ReactNode;
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar onQuickAdd={() => setQuickAddOpen(true)} projects={projects} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">{children}</main>
      </div>

      <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
