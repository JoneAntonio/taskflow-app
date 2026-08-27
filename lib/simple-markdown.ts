import { escapeHtml } from "@/lib/escape-html";

/**
 * Conversor minimalista de markdown para HTML — cobre só o que o editor de
 * notas permite escrever (negrito, títulos, listas). Escapa sempre primeiro
 * o texto do utilizador, para nunca injetar HTML não controlado.
 */
export function renderNoteMarkdown(raw: string): string {
  const lines = escapeHtml(raw).split("\n");
  const html: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const listItem = line.match(/^-\s+(.*)$/);

    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level + 2} class="font-display font-semibold">${inlineFormat(heading[2])}</h${level + 2}>`);
    } else if (listItem) {
      if (!inList) {
        html.push("<ul class='list-disc pl-5'>");
        inList = true;
      }
      html.push(`<li>${inlineFormat(listItem[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
      html.push("<br />");
    } else {
      closeList();
      html.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  closeList();

  return html.join("\n");
}

function inlineFormat(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
