import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sessão — TaskFlow" };

export default function LoginPage() {
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Inicia sessão para continuares o teu fluxo.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
