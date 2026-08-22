import "server-only";
import { Resend } from "resend";

/**
 * Envia um email a QUALQUER endereço (@gmail.com, @outlook.com, empresa
 * própria, etc.) através da Resend, um serviço de envio profissional que não
 * tem as limitações do envio automático "grátis" do Supabase.
 *
 * Requer duas variáveis de ambiente na Vercel:
 * - RESEND_API_KEY: a tua chave de API da Resend (grátis em resend.com)
 * - RESEND_FROM_EMAIL: o endereço que aparece como remetente — para
 *   conseguires enviar a QUALQUER destinatário (não só a ti), precisas de
 *   verificar um domínio teu na Resend e usar um email desse domínio aqui
 *   (ex: "JAFLOW <notificacoes@oteudominio.com>"). Sem domínio verificado,
 *   a Resend só entrega ao teu próprio email de signup (modo de teste).
 */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Envio de email não está configurado (falta RESEND_API_KEY ou RESEND_FROM_EMAIL).");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) throw new Error(error.message);
}
