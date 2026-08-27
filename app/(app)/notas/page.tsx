import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NotesView } from "@/components/notes/notes-view";
import type { Notebook, Note } from "@/types/database";

export const metadata: Metadata = { title: "Notas — JAFLOW" };

export default async function NotasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: notebooks }, { data: notes }] = await Promise.all([
    supabase.from("notebooks").select("*").order("position").order("created_at"),
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Notas</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Organiza as tuas notas em cadernos, com títulos, negrito e listas.
        </p>
      </div>

      <NotesView notebooks={(notebooks ?? []) as Notebook[]} notes={(notes ?? []) as Note[]} />
    </div>
  );
}
