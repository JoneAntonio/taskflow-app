-- ============================================================================
-- JAFLOW — Projetos/SMART partilhados com a equipa
-- Um projeto pode passar a pertencer a uma equipa (team_id), em vez de ficar
-- só com o criador. Todos os membros da equipa passam a ver o objetivo
-- SMART e as tarefas; só admins da equipa podem editar o próprio objetivo.
-- ADITIVO: a política pessoal "projects_all_own" mantém-se intacta.
-- ============================================================================

alter table public.projects
  add column if not exists team_id uuid references public.teams (id) on delete set null;

create index if not exists projects_team_id_idx on public.projects (team_id);

create policy "projects_team_select" on public.projects for select
  using (team_id is not null and public.is_team_member(team_id));

create policy "projects_team_update" on public.projects for update
  using (team_id is not null and public.is_team_admin(team_id))
  with check (team_id is not null and public.is_team_admin(team_id));

create policy "projects_team_delete" on public.projects for delete
  using (team_id is not null and public.is_team_admin(team_id));

-- As tarefas de um projeto de equipa também precisam de ficar visíveis a
-- todos os membros da equipa, não só ao responsável (assigned_to) — a
-- política "tasks_team_select" já existente só cobria assigned_to/admin.
create policy "tasks_team_project_select" on public.tasks for select
  using (
    project_id in (
      select id from public.projects where team_id is not null and public.is_team_member(team_id)
    )
  );
