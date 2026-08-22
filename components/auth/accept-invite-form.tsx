"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { teamsService } from "@/services/teams.service";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeamInvite } from "@/types/database";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export function AcceptInviteForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "needsPassword" | "hasSession" | "notFound">("loading");
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("notFound");
        return;
      }

      const needsPassword = user.identities?.some((i) => !i.identity_data?.password_set) ?? true;
      setStatus(needsPassword ? "needsPassword" : "hasSession");

      try {
        const pending = await teamsService.listMyPendingInvites();
        setInvites(pending);
      } catch {
        // silencioso
      }
    }
    check();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });

  async function onSubmitPassword(values: PasswordInput) {
    try {
      await authService.updatePassword({ password: values.password, confirmPassword: values.confirmPassword });
      toast.success("Palavra-passe definida");
      setStatus("hasSession");
      const pending = await teamsService.listMyPendingInvites();
      setInvites(pending);
    } catch {
      toast.error("Não foi possível definir a palavra-passe. O link pode ter expirado.");
    }
  }

  async function handleAccept(invite: TeamInvite) {
    setIsJoining(true);
    try {
      await teamsService.acceptInvite(invite);
      toast.success("Entraste na equipa!");
      router.push("/equipa");
    } catch {
      toast.error("Não foi possível aceitar o convite.");
    } finally {
      setIsJoining(false);
    }
  }

  if (status === "loading") {
    return <p className="text-center text-sm text-[var(--color-ink-muted)]">A verificar o teu convite...</p>;
  }

  if (status === "notFound") {
    return (
      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        Este link já não é válido. Pede um novo convite a quem te convidou.
      </p>
    );
  }

  if (status === "needsPassword") {
    return (
      <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4" noValidate>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Foste convidado para uma equipa no JAFLOW. Define uma palavra-passe para criares a tua conta.
        </p>
        <div>
          <Label htmlFor="password">Palavra-passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmar palavra-passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>
        <Button type="submit" className="w-full">
          Criar conta e continuar
        </Button>
      </form>
    );
  }

  if (invites.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        Não encontrámos nenhum convite pendente para a tua conta.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div key={invite.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-ink)]">
            Foste convidado como <span className="font-semibold">{invite.role === "admin" ? "admin" : "membro"}</span>{" "}
            de uma equipa.
          </p>
          <Button className="mt-3 w-full" onClick={() => handleAccept(invite)} isLoading={isJoining}>
            Aceitar e entrar na equipa
          </Button>
        </div>
      ))}
    </div>
  );
}
