"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamsService } from "@/services/teams.service";
import type { TeamRole } from "@/types/database";

export function InviteMemberForm({ teamId }: { teamId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await teamsService.inviteMember(teamId, email.trim(), role);
      toast.success(`Convite enviado para ${email.trim()}`);
      setEmail("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemplo.com"
        className="flex-1"
        required
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as TeamRole)}
        className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)]"
      >
        <option value="member">Membro</option>
        <option value="admin">Admin</option>
      </select>
      <Button type="submit" isLoading={isSubmitting}>
        <Send className="h-3.5 w-3.5" /> Convidar
      </Button>
    </form>
  );
}
