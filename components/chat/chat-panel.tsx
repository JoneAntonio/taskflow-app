"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { getGravatarUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/database";

export function ChatPanel({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatService
      .listMessages(conversationId)
      .then(setMessages)
      .finally(() => setIsLoading(false));

    const unsubscribe = chatService.subscribeToMessages(conversationId, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsSending(true);
    setValue("");
    try {
      await chatService.sendMessage(conversationId, trimmed);
    } catch {
      toast.error("Não foi possível enviar a mensagem.");
      setValue(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-center text-sm text-[var(--color-ink-muted)]">A carregar conversa...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-ink-muted)]">Ainda sem mensagens. Diz olá 👋</p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;
            const avatarUrl = message.sender?.avatar_url || getGravatarUrl(message.sender?.email ?? "", 48);
            return (
              <div key={message.id} className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isMine
                      ? "rounded-br-sm bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                      : "rounded-bl-sm bg-[var(--color-surface-alt)] text-[var(--color-ink)]"
                  )}
                >
                  {!isMine && (
                    <p className="mb-0.5 text-[11px] font-medium opacity-70">
                      {message.sender?.full_name || message.sender?.email}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[var(--color-border)] p-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escreve uma mensagem..."
          disabled={isSending}
          className="h-10 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={isSending || !value.trim()}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-ink)] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
