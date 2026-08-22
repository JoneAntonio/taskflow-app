-- ============================================================================
-- JAFLOW — Comentários (com menções) e feed de atividade nas tarefas
-- ============================================================================

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index task_comments_task_id_idx on public.task_comments (task_id, created_at);

alter table public.task_comments enable row level security;

create policy "task_comments_select" on public.task_comments for select
  using (public.can_access_task(task_id));

create policy "task_comments_insert" on public.task_comments for insert
  with check (public.can_access_task(task_id) and user_id = auth.uid());

create policy "task_comments_delete" on public.task_comments for delete
  using (user_id = auth.uid());

create table public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index task_activity_task_id_idx on public.task_activity (task_id, created_at);

alter table public.task_activity enable row level security;

create policy "task_activity_select" on public.task_activity for select
  using (public.can_access_task(task_id));

create policy "task_activity_insert" on public.task_activity for insert
  with check (public.can_access_task(task_id));
