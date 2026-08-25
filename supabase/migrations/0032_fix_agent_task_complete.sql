-- ============================================================================
-- JAFLOW — Corrige bug introduzido na proteção de atribuição
-- O trigger "prevent_agent_assign_others" disparava sempre que um AGENTE
-- atualizava uma tarefa atribuída a ele (ex: marcar como concluída), porque
-- não distinguia "sou eu a atribuir a tarefa a alguém" de "sou eu o
-- responsável a atualizar o meu próprio estado". Isso impedia-o de a
-- concluir. Corrigido: só se aplica quando quem está a gravar é o DONO
-- (criador) da tarefa, nunca quando é só o responsável a atualizá-la.
-- ============================================================================

create or replace function public.prevent_agent_assign_others()
returns trigger as $$
declare
  creator_account_type text;
begin
  if auth.uid() = new.user_id and new.assigned_to is not null and new.assigned_to is distinct from new.user_id then
    select account_type into creator_account_type from public.profiles where id = auth.uid();
    if creator_account_type = 'agente' then
      new.assigned_to := new.user_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Quem só tem a tarefa ATRIBUÍDA (não é o dono) e é conta "agente" não pode
-- mudar dia, hora, prioridade, recorrência, título, ou outros campos de
-- agendamento — só pode mudar o estado (concluir/reabrir) e a nota.
create or replace function public.prevent_agent_edit_assigned_schedule()
returns trigger as $$
declare
  updater_account_type text;
begin
  if auth.uid() is distinct from old.user_id then
    select account_type into updater_account_type from public.profiles where id = auth.uid();
    if updater_account_type = 'agente' then
      new.title := old.title;
      new.due_date := old.due_date;
      new.due_time := old.due_time;
      new.due_time_end := old.due_time_end;
      new.priority := old.priority;
      new.recurrence := old.recurrence;
      new.is_important := old.is_important;
      new.location := old.location;
      new.estimated_duration_minutes := old.estimated_duration_minutes;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_agent_edit_assigned_schedule on public.tasks;
create trigger prevent_agent_edit_assigned_schedule
  before update on public.tasks
  for each row execute procedure public.prevent_agent_edit_assigned_schedule();
