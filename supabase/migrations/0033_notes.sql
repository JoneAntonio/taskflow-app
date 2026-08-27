-- ============================================================================
-- JAFLOW — Notas (estilo OneNote)
-- Cadernos organizam notas; cada nota tem título e conteúdo em markdown
-- (negrito, listas, títulos), editável com um pequeno editor com barra de
-- ferramentas. Substitui o Inbox na navegação.
-- ============================================================================

create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#3F6FA8',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notebook_id uuid references public.notebooks (id) on delete set null,
  title text not null default 'Sem título',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_id_idx on public.notes (user_id);
create index notes_notebook_id_idx on public.notes (notebook_id);

alter table public.notebooks enable row level security;
alter table public.notes enable row level security;

create policy "notebooks_all_own" on public.notebooks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes_all_own" on public.notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_updated_at_notes before update on public.notes
  for each row execute procedure public.set_updated_at();
