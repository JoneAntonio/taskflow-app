import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { teamId?: string; email?: string; role?: "admin" | "member" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { teamId, email, role = "member" } = body;
  if (!teamId || !email) {
    return NextResponse.json({ error: "Faltam dados (equipa ou email)." }, { status: 400 });
  }

  // Verifica quem está a pedir, usando a SESSÃO REAL da pessoa (RLS aplicada) —
  // nunca confiamos apenas no que o pedido diz.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_team_admin", { _team_id: teamId });
  if (rpcError || !isAdmin) {
    return NextResponse.json({ error: "Não tens permissão para convidar para esta equipa." }, { status: 403 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const admin = createAdminClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo: `${origin}/convite/aceitar`,
  });

  // Se a pessoa já tem conta, o Supabase recusa reenviar o convite por email —
  // continuamos na mesma: registamos o convite e ela vê-o ao entrar na app.
  if (inviteError && !inviteError.message.toLowerCase().includes("already")) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const { error: insertError } = await admin.from("team_invites").insert({
    team_id: teamId,
    email: normalizedEmail,
    role,
    invited_by: user.id,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
