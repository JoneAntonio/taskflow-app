import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave de SERVIÇO (service role) — ignora RLS e tem
 * acesso administrativo total, incluindo `auth.admin.*` (ex: enviar
 * convites por email). O import "server-only" impede que este ficheiro seja
 * acidentalmente incluído em código enviado ao browser: o build falha se
 * algum componente cliente o importar.
 *
 * Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY (sem prefixo
 * NEXT_PUBLIC_, para nunca ser exposta ao browser) configurada na Vercel.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não está configurada. Adiciona-a nas variáveis de ambiente da Vercel."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
