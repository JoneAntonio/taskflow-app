import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nova palavra-passe — TaskFlow" };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Define uma nova palavra-passe" subtitle="Escolhe uma palavra-passe forte para a tua conta.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
