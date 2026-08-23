"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIUsageIndicator } from "@/components/ai/ai-usage-indicator";

interface ChatTurn {
  role: "user" | "model";
  text: string;
}

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
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/maturity-insight", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Falha ao gerar análise.");
      setContent(body.content);
      setGeneratedAt(new Date().toISOString());
      setChat([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a análise.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setIsAsking(true);
    const nextChat: ChatTurn[] = [...chat, { role: "user", text: trimmed }];
    setChat(nextChat);
    setQuestion("");
    try {
      const response = await fetch("/api/ai/maturity-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: nextChat }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Falha ao responder.");
      setChat((prev) => [...prev, { role: "model", text: body.answer }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível responder.");
      setChat((prev) => prev.slice(0, -1));
    } finally {
      setIsAsking(false);
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

          {chat.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-[var(--color-accent)]/20 pt-3">
              {chat.map((turn, index) => (
                <p
                  key={index}
                  className={
                    turn.role === "user"
                      ? "text-sm font-medium text-[var(--color-ink)]"
                      : "text-sm text-[var(--color-ink)]"
                  }
                >
                  {turn.role === "user" ? "Tu: " : "IA: "}
                  {turn.text}
                </p>
              ))}
            </div>
          )}

          <form onSubmit={handleAsk} className="mt-3 flex items-center gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pergunta algo sobre esta análise..."
              disabled={isAsking}
              className="h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
            <Button type="submit" size="sm" isLoading={isAsking} disabled={!question.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Pede uma análise à IA sobre a maturidade da tua equipa — quem está perto de subir de nível, tendências ao
          longo do tempo, e uma sugestão de ação para esta semana.
        </p>
      )}

      <div className="mt-3">
        <AIUsageIndicator scope="maturidade" />
      </div>
    </div>
  );
}
