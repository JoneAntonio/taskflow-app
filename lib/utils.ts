import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte uma Date para "YYYY-MM-DD" usando o fuso horário LOCAL do
 * utilizador, em vez de `date.toISOString()` (que converte para UTC e pode
 * desviar o dia em até 24h dependendo do fuso horário — por exemplo, para
 * quem está num fuso à frente de UTC, perto da meia-noite local).
 */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
