import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { title?: string; body?: string; url?: string; userId?: string };
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

  // Por omissão envia-se a ti próprio (ex: notificação de teste, lembrete).
  // Só é possível enviar a OUTRO utilizador se partilhares uma equipa com ele.
  const targetUserId = body.userId ?? user.id;
  if (targetUserId !== user.id) {
    const { data: shared } = await supabase
      .from("team_memberships")
      .select("team_id")
      .eq("user_id", user.id);
    const teamIds = (shared ?? []).map((m) => m.team_id);
    if (teamIds.length === 0) {
      return NextResponse.json({ error: "Sem permissão para notificar este utilizador." }, { status: 403 });
    }
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contacto@jaflow.app";

  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "Notificações push não estão configuradas no servidor." }, { status: 500 });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", targetUserId);

  const payload = JSON.stringify({
    title: body.title ?? "JAFLOW",
    body: body.body ?? "",
    url: body.url ?? "/dashboard",
  });

  await Promise.all(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        // 404/410 = a subscrição já não existe do lado do browser (ex: desinstalou); limpamos.
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    })
  );

  return NextResponse.json({ success: true });
}
