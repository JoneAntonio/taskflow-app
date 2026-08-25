import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escape-html";

/**
 * Avisa todos os admins de plataforma quando alguém pede acesso de
 * Supervisor — por email e por notificação dentro da app.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const admin = createAdminClient();
  const { data: platformAdmins } = await admin.from("profiles").select("id, email").eq("is_platform_admin", true);

  if (!platformAdmins || platformAdmins.length === 0) {
    return NextResponse.json({ error: "Sem admins de plataforma configurados." }, { status: 404 });
  }

  const requesterName = escapeHtml(requesterProfile?.full_name || requesterProfile?.email || "Alguém");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  for (const platformAdmin of platformAdmins) {
    await admin.from("notifications").insert({
      user_id: platformAdmin.id,
      type: "sistema",
      title: "Pedido de acesso de Supervisor",
      body: `${requesterProfile?.full_name || requesterProfile?.email} pediu acesso de Supervisor.`,
    });

    if (platformAdmin.email) {
      try {
        await sendEmail({
          to: platformAdmin.email,
          subject: "JAFLOW — Pedido de acesso de Supervisor",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#14151b;">Pedido de acesso</h2>
            <p style="color:#3a3a3a;font-size:14px;">${requesterName} pediu para se tornar Supervisor no JAFLOW.</p>
            <a href="${origin}/perfil" style="display:inline-block;margin-top:12px;background:#f2a93b;color:#14151b;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Rever pedidos</a>
          </div>`,
        });
      } catch {
        // não interrompe os restantes envios
      }
    }
  }

  return NextResponse.json({ success: true });
}
