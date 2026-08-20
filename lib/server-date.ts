import { cookies } from "next/headers";

const DEFAULT_TIMEZONE = "Africa/Luanda";

/**
 * Calcula a data de "hoje" (YYYY-MM-DD) no fuso horário do utilizador, a
 * partir de uma cookie definida pelo componente TimezoneSync no primeiro
 * carregamento da app. Sem esta correção, os Server Components calculavam
 * "hoje" no fuso horário do SERVIDOR (UTC, na Vercel), o que atrasava ou
 * adiantava um dia inteiro para utilizadores fora de UTC.
 */
export async function getTodayISO(): Promise<string> {
  const cookieStore = await cookies();
  const timezone = cookieStore.get("tz")?.value || DEFAULT_TIMEZONE;
  return getTodayInTimezone(timezone);
}

export function getTodayInTimezone(timezone: string): string {
  try {
    // O locale "en-CA" formata datas como YYYY-MM-DD diretamente.
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TIMEZONE }).format(new Date());
  }
}
