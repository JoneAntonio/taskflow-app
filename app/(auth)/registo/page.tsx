import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta — JAFLOW" };

export default function RegisterPage() {
  return (
    <AuthShell title="Cria a tua conta" subtitle="Organiza tudo em minutos. É gratuito para começar.">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
