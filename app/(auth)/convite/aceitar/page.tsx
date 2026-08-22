import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export const metadata: Metadata = { title: "Aceitar convite — JAFLOW" };

export default function AceitarConvitePage() {
  return (
    <AuthShell title="Convite para uma equipa" subtitle="Confirma os teus dados para entrares na equipa.">
      <AcceptInviteForm />
    </AuthShell>
  );
}
