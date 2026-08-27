"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { QuickAddDialog } from "@/components/tasks/quick-add-dialog";
import { ReminderWatcher } from "@/components/notifications/reminder-watcher";
import { PomodoroMiniWidget } from "@/components/pomodoro/pomodoro-mini-widget";
import { InstallAppPrompt } from "@/components/providers/install-app-prompt";
import { PendingInvitesBanner } from "@/components/teams/pending-invites-banner";
import { unlockAlarmAudio } from "@/lib/alarm-sound";
import type { Profile, Project } from "@/types/database";

export function AppShell({
  profile,
  projects,
  children,
}: {
  profile: Pick<Profile, "full_name" | "email" | "avatar_url" | "account_type">;
  projects: Project[];
  children: ReactNode;
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    // Destranca o som do alarme no primeiro clique em qualquer sítio da app
    // — os browsers não deixam tocar som sem uma interação prévia do utilizador.
    function handleFirstInteraction() {
      unlockAlarmAudio();
      window.removeEventListener("click", handleFirstInteraction);
    }
    window.addEventListener("click", handleFirstInteraction);
    return () => window.removeEventListener("click", handleFirstInteraction);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar onQuickAdd={() => setQuickAddOpen(true)} projects={projects} accountType={profile.account_type} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
          <PendingInvitesBanner />
          {children}
        </main>
      </div>

      <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <ReminderWatcher />
      <PomodoroMiniWidget />
      <InstallAppPrompt />
    </div>
  );
}
