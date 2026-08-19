import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar palavra-passe — JAFLOW" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar acesso"
      subtitle="Indica o teu email e enviamos-te um link para criares uma nova palavra-passe."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
