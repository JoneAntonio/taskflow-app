"use client";

import { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { Profile } from "@/types/database";

export function TeamChatSection({ teamId, currentUserId }: { teamId: string; currentUserId: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mentionableMembers, setMentionableMembers] = useState<{ user_id: string; profile: Profile }[]>([]);

  useEffect(() => {
    chatService.getOrCreateTeamConversation(teamId).then((conversation) => setConversationId(conversation.id));
    chatService.listTeamMembersForMentions(teamId).then(setMentionableMembers);
  }, [teamId]);

  if (!conversationId) {
    return <p className="text-sm text-[var(--color-ink-muted)]">A abrir o chat da equipa...</p>;
  }

  return (
    <ChatPanel
      conversationId={conversationId}
      currentUserId={currentUserId}
      teamId={teamId}
      mentionableMembers={mentionableMembers}
    />
  );
}
