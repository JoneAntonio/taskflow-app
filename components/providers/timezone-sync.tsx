"use client";

import { useEffect } from "react";

export function TimezoneSync() {
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const current = document.cookie
        .split("; ")
        .find((row) => row.startsWith("tz="))
        ?.split("=")[1];

      if (detected && detected !== current) {
        const isFirstTime = !current;
        document.cookie = `tz=${detected}; path=/; max-age=31536000; SameSite=Lax`;
        // Só recarrega se a cookie ainda não existia (primeira visita), para
        // os Server Components já apanharem o fuso horário certo de imediato,
        // sem andar a recarregar a página sempre que o timezone "muda" por
        // pequenas diferenças de deteção do browser.
        if (isFirstTime) window.location.reload();
      }
    } catch {
      // Intl indisponível — mantém o fuso horário por omissão do servidor.
    }
  }, []);

  return null;
}
