const QUOTES = [
  "Não se gere o que não se mede.",
  "A disciplina é a ponte entre metas e resultados.",
  "Feito é melhor que perfeito.",
  "O que é medido, melhora.",
  "Pequenos progressos todos os dias somam grandes resultados.",
  "A produtividade nunca é um acidente — é sempre o resultado de um compromisso.",
  "Prioriza o que importa, não só o que é urgente.",
  "Uma equipa alinhada move-se mais rápido do que uma equipa ocupada.",
];

/**
 * Escolhe uma frase com base no dia do ano, para rodar automaticamente
 * todos os dias sem repetir a mesma seguida, sem precisar de estado.
 */
export function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}
