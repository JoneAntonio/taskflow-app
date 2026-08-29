"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIUsageIndicator } from "@/components/ai/ai-usage-indicator";

export function Agent1on1PrepCard({ agentId }: { agentId: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/agent-1on1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Falha ao gerar.");
      setContent(body.content);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a preparação.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          <Sparkles className="h-3.5 w-3.5" /> Preparar 1-para-1 com IA
        </p>
        <Button variant="outline" size="sm" onClick={handleGenerate} isLoading={isLoading}>
          <RefreshCw className="h-3 w-3" /> {content ? "Atualizar" : "Gerar"}
        </Button>
      </div>

      {content ? (
        <p className="whitespace-pre-line text-sm text-[var(--color-ink)]">{content}</p>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">
          A IA lê as notas e avaliações desta pessoa dos últimos 3 meses, e sugere um resumo e pontos de conversa
          para o próximo 1-para-1.
        </p>
      )}

      <div className="mt-3">
        <AIUsageIndicator scope="maturidade" />
      </div>
    </div>
  );
}
