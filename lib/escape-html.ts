/**
 * Escapa caracteres HTML perigosos antes de inserir texto vindo de
 * utilizadores (comentários, mensagens, nomes, notas) dentro de um email em
 * HTML. Sem isto, alguém podia escrever algo tipo <img src=x onerror=...>
 * numa mensagem e isso ia parar ao HTML do email de quem for notificado.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
