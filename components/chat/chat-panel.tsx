"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { getGravatarUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/types/database";

interface MentionableMember {
  user_id: string;
  profile: Profile;
}

function renderWithMentions(text: string) {
  const parts = text.split(/(@[\p{L}\p{N}._-]+(?:\s[\p{L}\p{N}._-]+)?)/gu);
  return parts.map((part, index) =>
    part.startsWith("@") ? (
      <span key={index} className="font-semibold text-[var(--color-accent)]">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function ChatPanel({
  conversationId,
  currentUserId,
  teamId,
  mentionableMembers = [],
}: {
  conversationId: string;
  currentUserId: string;
  /** Se for um chat de equipa, o teamId ativa as notificações de menção. */
  teamId?: string | null;
  /** Membros que podem ser mencionados com @Nome (só faz sentido em chat de equipa). */
  mentionableMembers?: MentionableMember[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null || mentionableMembers.length === 0) return [];
    const normalized = mentionQuery.toLowerCase();
    return mentionableMembers
      .filter((m) => m.user_id !== currentUserId && m.profile?.full_name?.toLowerCase().includes(normalized))
      .slice(0, 5);
  }, [mentionQuery, mentionableMembers, currentUserId]);

  function handleValueChange(next: string) {
    setValue(next);
    const cursor = inputRef.current?.selectionStart ?? next.length;
    const uptoCursor = next.slice(0, cursor);
    const match = uptoCursor.match(/@([\p{L}\p{N}._-]*)$/u);
    setMentionQuery(match ? match[1] : null);
  }

  function handlePickMention(member: MentionableMember) {
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const uptoCursor = value.slice(0, cursor);
    const replaced = uptoCursor.replace(/@([\p{L}\p{N}._-]*)$/u, `@${member.profile.full_name} `);
    setValue(replaced + value.slice(cursor));
    setMentionQuery(null);
    inputRef.current?.focus();
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsSending(true);
    setValue("");
    setMentionQuery(null);
    try {
      await chatService.sendMessage(conversationId, trimmed, teamId);
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
                  <p className="whitespace-pre-wrap break-words">
                    {isMine ? message.body : renderWithMentions(message.body)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="relative border-t border-[var(--color-border)] p-3">
        {mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
            {mentionSuggestions.map((member) => (
              <button
                key={member.user_id}
                type="button"
                onClick={() => handlePickMention(member)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.profile?.avatar_url || getGravatarUrl(member.profile?.email ?? "", 32)}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
                {member.profile?.full_name || member.profile?.email}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={mentionableMembers.length > 0 ? "Escreve uma mensagem... use @Nome para mencionar" : "Escreve uma mensagem..."}
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
        </div>
      </form>
    </div>
  );
}
