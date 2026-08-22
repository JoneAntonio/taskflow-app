-- ============================================================================
-- JAFLOW — Anexos de ficheiros nas tarefas
-- Função auxiliar reutilizável para saber se alguém pode aceder a uma
-- tarefa (dono, responsável, ou membro/admin da equipa via team_id/projeto),
-- usada tanto na tabela de anexos como no armazenamento (Storage).
-- ============================================================================

create or replace function public.can_access_task(_task_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = _task_id
      and (
        t.user_id = auth.uid()
        or t.assigned_to = auth.uid()
        or (t.team_id is not null and public.is_team_member(t.team_id))
        or (
          t.project_id is not null and exists (
            select 1 from public.projects p
            where p.id = t.project_id and p.team_id is not null and public.is_team_member(p.team_id)
          )
        )
      )
  );
$$;

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer,
  mime_type text,
  created_at timestamptz not null default now()
);

create index task_attachments_task_id_idx on public.task_attachments (task_id);

alter table public.task_attachments enable row level security;

create policy "task_attachments_select" on public.task_attachments for select
  using (public.can_access_task(task_id));

create policy "task_attachments_insert" on public.task_attachments for insert
  with check (public.can_access_task(task_id) and user_id = auth.uid());

create policy "task_attachments_delete" on public.task_attachments for delete
  using (user_id = auth.uid() or public.can_access_task(task_id));

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

create policy "task_attachments_storage_select" on storage.objects for select
  using (bucket_id = 'task-attachments' and public.can_access_task(((storage.foldername(name))[1])::uuid));

create policy "task_attachments_storage_insert" on storage.objects for insert
  with check (bucket_id = 'task-attachments' and public.can_access_task(((storage.foldername(name))[1])::uuid));

create policy "task_attachments_storage_delete" on storage.objects for delete
  using (bucket_id = 'task-attachments' and public.can_access_task(((storage.foldername(name))[1])::uuid));
