import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Ponto de entrada único para "ir diretamente a esta tarefa" — usado pelas
 * notificações (app e email). Descobre onde a tarefa vive (projeto, equipa,
 * ou nenhum dos dois) e reencaminha para lá, já com ?task= para abrir
 * automaticamente o painel de detalhe.
 */
export default async function TarefaRedirectPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase.from("tasks").select("id, project_id, team_id").eq("id", taskId).single();
  if (!task) notFound();

  if (task.project_id) redirect(`/projetos/${task.project_id}?task=${taskId}`);
  if (task.team_id) redirect(`/equipas/${task.team_id}?task=${taskId}`);
  redirect(`/hoje?task=${taskId}`);
}
