"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIInsightCard({
  initialContent,
  initialGeneratedAt,
}: {
  initialContent: string | null;
  initialGeneratedAt: string | null;
}) {
  const [content, setContent] = useState(initialContent);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/maturity-insight", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Falha ao gerar análise.");
      setContent(body.content);
      setGeneratedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a análise.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          <Sparkles className="h-3.5 w-3.5" /> Análise por IA
        </p>
        <Button variant="outline" size="sm" onClick={handleGenerate} isLoading={isLoading}>
          <RefreshCw className="h-3 w-3" /> {content ? "Atualizar" : "Gerar análise"}
        </Button>
      </div>

      {content ? (
        <>
          <p className="whitespace-pre-line text-sm text-[var(--color-ink)]">{content}</p>
          {generatedAt && (
            <p className="mt-2 text-[11px] text-[var(--color-ink-muted)]">
              Gerado em{" "}
              {new Date(generatedAt).toLocaleString("pt-PT", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Pede uma análise à IA sobre a maturidade da tua equipa — quem está perto de subir de nível, padrões a
          assinalar, e uma sugestão de ação para esta semana.
        </p>
      )}
    </div>
  );
}
