"use client";

import { useEffect, useState } from "react";

export type TaskDisplayMode = "lista" | "detalhada" | "grelha";

const STORAGE_KEY = "jaflow:task-display-mode";

/**
 * Guarda o modo de visualização escolhido (Lista / Lista detalhada /
 * Grelha) no localStorage, para se manter ao navegar entre páginas —
 * partilhado por toda a app, não por página.
 *
 * Começa sempre em "lista" (para bater certo com o que o servidor
 * renderiza) e só troca para o valor guardado depois de montar no
 * cliente, evitando um erro de hidratação.
 */
export function useTaskDisplayMode(): [TaskDisplayMode, (mode: TaskDisplayMode) => void] {
  const [mode, setMode] = useState<TaskDisplayMode>("lista");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "lista" || stored === "detalhada" || stored === "grelha") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronização inicial com localStorage, só corre uma vez no arranque
      setMode(stored);
    }
  }, []);

  function updateMode(next: TaskDisplayMode) {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return [mode, updateMode];
}
