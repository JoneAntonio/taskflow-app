"use client";

import { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import { ChatPanel } from "@/components/chat/chat-panel";

export function TeamChatSection({ teamId, currentUserId }: { teamId: string; currentUserId: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    chatService.getOrCreateTeamConversation(teamId).then((conversation) => setConversationId(conversation.id));
  }, [teamId]);

  if (!conversationId) {
    return <p className="text-sm text-[var(--color-ink-muted)]">A abrir o chat da equipa...</p>;
  }

  return <ChatPanel conversationId={conversationId} currentUserId={currentUserId} />;
}
