-- ============================================================================
-- JAFLOW — Alerta de transição de maturidade
-- Estende o trigger que já sincroniza current_maturity: se o nível mudar
-- (subir ou descer), cria automaticamente uma notificação a sugerir o novo
-- estilo de liderança adequado (modelo de Hersey-Blanchard).
-- ============================================================================

create or replace function public.sync_agent_current_maturity()
returns trigger as $$
declare
  old_level maturity_level;
  agent_name text;
  agent_owner uuid;
  style text;
begin
  select current_maturity, name, user_id into old_level, agent_name, agent_owner
  from public.team_agents where id = new.agent_id;

  update public.team_agents
  set current_maturity = new.confirmed_maturity,
      updated_at = now()
  where id = new.agent_id;

  if old_level is distinct from new.confirmed_maturity and old_level is not null then
    style := case new.confirmed_maturity
      when 'M1' then 'Diretiva (alta orientação para a tarefa)'
      when 'M2' then 'Coaching (orienta e explica as decisões)'
      when 'M3' then 'Apoio (participa e encoraja, sem impor)'
      when 'M4' then 'Delegação (confia e acompanha à distância)'
    end;

    insert into public.notifications (user_id, type, title, body)
    values (
      agent_owner,
      'transicao_maturidade',
      agent_name || ' passou de ' || old_level || ' para ' || new.confirmed_maturity,
      'Considera ajustar o teu estilo de liderança para: ' || style || '.'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
