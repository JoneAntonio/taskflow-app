"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setIsSubmitting(true);
    try {
      await authService.sendPasswordReset(values);
    } finally {
      // Por segurança, mostramos sempre a mesma mensagem, exista ou não a conta.
      setSent(true);
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 text-sm text-[var(--color-ink)]">
        <p className="font-medium">Verifica o teu email</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Se existir uma conta com este email, vais receber um link para
          definires uma nova palavra-passe.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-[var(--color-secondary)] hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@exemplo.com"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Enviar link de recuperação
      </Button>
      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        <Link href="/login" className="font-medium text-[var(--color-ink)] hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
