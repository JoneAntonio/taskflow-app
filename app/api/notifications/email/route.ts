import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escape-html";

export async function POST(request: Request) {
  let body: { subject?: string; message?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Por omissão envia-se para o próprio email do utilizador autenticado.
  // Só é possível indicar outro destinatário se for um colega de equipa.
  let to = body.to;
  if (!to) {
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();
    to = profile?.email;
  } else if (to) {
    const { data: shared } = await supabase.from("team_memberships").select("team_id").eq("user_id", user.id);
    const teamIds = (shared ?? []).map((m) => m.team_id);
    if (teamIds.length === 0) {
      return NextResponse.json({ error: "Sem permissão para notificar este destinatário." }, { status: 403 });
    }
  }

  if (!to) {
    return NextResponse.json({ error: "Sem destinatário." }, { status: 400 });
  }

  try {
    await sendEmail({
      to,
      subject: body.subject ?? "JAFLOW",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #14151b;">JAFLOW</h2>
          <p style="color: #3a3a3a; font-size: 15px; line-height: 1.6;">${escapeHtml(body.message ?? "")}</p>
        </div>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao enviar." }, { status: 500 });
  }
}
