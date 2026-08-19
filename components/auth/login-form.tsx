"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setIsSubmitting(true);
    try {
      await authService.signIn(values);
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      toast.success("Sessão iniciada com sucesso");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? "Credenciais inválidas. Tenta novamente." : "Ocorreu um erro."
      );
    } finally {
      setIsSubmitting(false);
    }
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
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Palavra-passe</Label>
          <Link
            href="/recuperar-password"
            className="mb-1.5 text-xs font-medium text-[var(--color-secondary)] hover:underline"
          >
            Esqueceste-te?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Iniciar sessão
      </Button>
      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        Ainda não tens conta?{" "}
        <Link href="/registo" className="font-medium text-[var(--color-ink)] hover:underline">
          Cria uma agora
        </Link>
      </p>
    </form>
  );
}
