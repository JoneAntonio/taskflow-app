"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <div className="fixed bottom-20 left-4 z-30 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-4 pr-2 shadow-[var(--shadow-lg)] lg:bottom-4">
      <span className="text-sm text-[var(--color-ink)]">Instalar o JAFLOW como app?</span>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-ink)]"
      >
        <Download className="h-3.5 w-3.5" /> Instalar
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Fechar"
        className="rounded-full p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
