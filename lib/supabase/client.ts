import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser (Client Components).
 * Usa as chaves públicas — nunca a service_role key aqui.
 *
 * Nota: não parametrizamos o cliente com o tipo `Database` porque a forma
 * manual definida em `types/database.ts` ainda não segue o formato exato
 * (Row/Insert/Update/Relationships) que o supabase-js espera para inferir
 * tipos nas queries — fazê-lo incorretamente resulta em tipos `never`.
 * Os tipos de `types/database.ts` são usados para tipar o valor de retorno
 * nos services. Quando o esquema estabilizar, substituir por tipos gerados
 * com `supabase gen types typescript`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
