import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DmChatSection } from "@/components/chat/dm-chat-section";

export const metadata: Metadata = { title: "Mensagens — JAFLOW" };

export default async function MensagensPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: otherProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!otherProfile) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/equipas"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Equipas
      </Link>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
        {otherProfile.full_name || otherProfile.email}
      </h1>
      <DmChatSection otherUserId={userId} currentUserId={user.id} />
    </div>
  );
}
