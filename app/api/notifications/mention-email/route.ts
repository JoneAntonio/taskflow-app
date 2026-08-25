import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escape-html";

/**
 * Envia um email a quem foi mencionado (@Nome), com um link direto para o
 * sítio exato onde foi mencionado — uma conversa ou uma tarefa.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { targetUserId?: string; teamId?: string; snippet?: string; path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { targetUserId, teamId, snippet, path } = body;
  if (!targetUserId || !teamId || !path) {
    return NextResponse.json({ error: "Faltam dados." }, { status: 400 });
  }
  // O link tem de ser um caminho interno do site (ex: "/tarefa/123"), nunca
  // um endereço externo — evita que isto seja usado para phishing.
  if (!path.startsWith("/") || path.startsWith("//")) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  // Só podemos notificar por email alguém que partilhe mesmo uma equipa contigo.
  const { data: isMember } = await supabase.rpc("is_team_member", { _team_id: teamId });
  if (!isMember) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", targetUserId).single();
  if (!profile?.email) {
    return NextResponse.json({ error: "Sem email para este utilizador." }, { status: 404 });
  }

  const { data: senderProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const link = escapeHtml(`${origin}${path}`);
  const safeSenderName = escapeHtml(senderProfile?.full_name ?? "Alguém");
  const safeSnippet = escapeHtml(snippet ?? "");

  try {
    await sendEmail({
      to: profile.email,
      subject: `${safeSenderName} mencionou-te no JAFLOW`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#14151b;">Foste mencionado</h2>
        <p style="color:#3a3a3a;font-size:14px;">${safeSenderName} escreveu:</p>
        <p style="color:#3a3a3a;font-size:14px;background:#f7f7f4;border-radius:8px;padding:12px;">${safeSnippet}</p>
        <a href="${link}" style="display:inline-block;margin-top:12px;background:#f2a93b;color:#14151b;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Ver no JAFLOW</a>
      </div>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao enviar." },
      { status: 500 }
    );
  }
}
