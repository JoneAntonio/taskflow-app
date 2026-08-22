import { cn } from "@/lib/utils";

/**
 * Pequeno botão "Criar" que aparece (com uma transição suave) assim que a
 * pessoa começa a escrever, dando-lhe uma confirmação visual clara de que
 * pode clicar para criar a tarefa, além de poder simplesmente premir Enter.
 */
export function QuickCreatePill({ visible, isLoading = false }: { visible: boolean; isLoading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={!visible || isLoading}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-accent-ink)] transition-all duration-150",
        visible ? "w-[68px] px-3 opacity-100" : "pointer-events-none w-0 px-0 opacity-0"
      )}
    >
      {isLoading ? "..." : "Criar"}
    </button>
  );
}
