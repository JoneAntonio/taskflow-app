"use client";

import { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import { ChatPanel } from "@/components/chat/chat-panel";

export function DmChatSection({ otherUserId, currentUserId }: { otherUserId: string; currentUserId: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    chatService.getOrCreateDmConversation(otherUserId).then((conversation) => setConversationId(conversation.id));
  }, [otherUserId]);

  if (!conversationId) {
    return <p className="text-sm text-[var(--color-ink-muted)]">A abrir a conversa...</p>;
  }

  return <ChatPanel conversationId={conversationId} currentUserId={currentUserId} />;
}
