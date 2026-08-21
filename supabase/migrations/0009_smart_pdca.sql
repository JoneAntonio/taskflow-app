-- ============================================================================
-- JAFLOW — SMART + PDCA
-- Adiciona campos de objetivo SMART aos projetos, e uma tabela de revisões
-- periódicas (ciclo PDCA: Planear, Fazer, Verificar, Agir) por projeto.
-- ============================================================================

alter table public.projects
  add column if not exists objective text,
  add column if not exists success_metric text,
  add column if not exists target_date date;

create table public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  review_date date not null default current_date,
  plan_text text,
  do_text text,
  check_text text,
  act_text text,
  created_at timestamptz not null default now()
);

create index project_reviews_project_id_idx on public.project_reviews (project_id, review_date desc);

alter table public.project_reviews enable row level security;

create policy "project_reviews_all_own" on public.project_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
