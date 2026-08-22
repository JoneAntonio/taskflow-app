"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);
    try {
      await authService.signUp(values, redirectTo);
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível criar a conta."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 text-sm text-[var(--color-ink)]">
        <p className="font-medium">Confirma o teu email</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Enviámos um link de confirmação. Abre-o para ativares a tua conta JAFLOW.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="O teu nome"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
      </div>
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
          placeholder="Repete a palavra-passe"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Criar conta
      </Button>
      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        Já tens conta?{" "}
        <Link
          href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}
          className="font-medium text-[var(--color-ink)] hover:underline"
        >
          Inicia sessão
        </Link>
      </p>
    </form>
  );
}
