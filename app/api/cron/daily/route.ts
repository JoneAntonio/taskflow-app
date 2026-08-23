import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { computeSmartProgress } from "@/lib/smart-metrics";

export const maxDuration = 60;

/**
 * Trabalho diário agendado (Vercel Cron, ver vercel.json). Junta três
 * tarefas num único cron para caber no limite do plano gratuito da Vercel
 * (poucos crons, pouco frequentes):
 *
 * 1. Apaga mensagens de chat com mais de 6 meses.
 * 2. Às segundas-feiras, envia um relatório semanal aos admins de cada
 *    equipa com os objetivos SMART que têm.
 * 3. Todos os dias, alerta os admins de equipa sobre objetivos SMART cujo
 *    prazo se aproxima mais depressa do que o progresso.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { deletedMessages: 0, weeklyReports: 0, deadlineAlerts: 0 };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { count: deletedCount } = await supabase
    .from("messages")
    .delete({ count: "exact" })
    .lt("created_at", sixMonthsAgo.toISOString());
  results.deletedMessages = deletedCount ?? 0;

  const isMonday = new Date().getDay() === 1;

  const { data: teams } = await supabase.from("teams").select("id, name");

  for (const team of teams ?? []) {
    const { data: admins } = await supabase
      .from("team_memberships")
      .select("user_id, profile:profiles(*)")
      .eq("team_id", team.id)
      .eq("role", "admin");

    const adminList = (admins ?? []) as unknown as {
      user_id: string;
      profile: { email: string; full_name: string | null } | null;
    }[];
    if (adminList.length === 0) continue;

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", team.id)
      .not("objective", "is", null);

    if (!projects || projects.length === 0) continue;

    if (isMonday) {
      const rows = projects
        .map(
          (p) =>
            `<li><strong>${p.name}</strong> — ${p.objective ?? ""}${
              p.target_date ? ` (prazo: ${new Date(p.target_date).toLocaleDateString("pt-PT")})` : ""
            }</li>`
        )
        .join("");
      for (const admin of adminList) {
        if (!admin.profile?.email) continue;
        try {
          await sendEmail({
            to: admin.profile.email,
            subject: `JAFLOW — Objetivos SMART da equipa ${team.name} esta semana`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#14151b;">Objetivos SMART — ${team.name}</h2>
              <p style="color:#3a3a3a;font-size:14px;">Estes são os objetivos que podem precisar de uma atualização de estado esta semana:</p>
              <ul style="color:#3a3a3a;font-size:14px;line-height:1.6;">${rows}</ul>
            </div>`,
          });
          results.weeklyReports += 1;
        } catch {
          // não interrompe os restantes envios
        }
      }
    }

    for (const project of projects) {
      if (!project.target_date || project.target_value == null || project.current_value == null) continue;

      const start = new Date(project.created_at).getTime();
      const end = new Date(project.target_date + "T23:59:59").getTime();
      const now = Date.now();
      if (now > end) continue;

      const totalDuration = end - start;
      if (totalDuration <= 0) continue;
      const elapsedRatio = (now - start) / totalDuration;

      const progressPercent = computeSmartProgress(
        project.current_value,
        project.target_value,
        project.actual_value,
        project.lower_is_better
      );
      if (progressPercent === null) continue;
      const progressRatio = progressPercent / 100;

      const behindBy = elapsedRatio - progressRatio;
      if (behindBy < 0.2) continue;

      const title = `⚠️ "${project.name}" está atrasado`;
      const body = `Já passou ${Math.round(elapsedRatio * 100)}% do prazo, mas o progresso está em ${Math.round(progressRatio * 100)}%.`;

      for (const admin of adminList) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "alerta_prazo",
          title,
          body,
        });

        if (admin.profile?.email) {
          try {
            await sendEmail({
              to: admin.profile.email,
              subject: title,
              html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;"><p style="color:#3a3a3a;font-size:14px;">${body}</p></div>`,
            });
          } catch {
            // silencioso
          }
        }

        try {
          const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("user_id", admin.user_id);
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          const privateKey = process.env.VAPID_PRIVATE_KEY;
          if (publicKey && privateKey) {
            webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contacto@jaflow.app", publicKey, privateKey);
            for (const sub of subs ?? []) {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  JSON.stringify({ title, body, url: `/projetos/${project.id}` })
                );
              } catch {
                // silencioso
              }
            }
          }
        } catch {
          // silencioso
        }
      }
      results.deadlineAlerts += 1;
    }
  }

  return NextResponse.json({ success: true, ...results });
}
