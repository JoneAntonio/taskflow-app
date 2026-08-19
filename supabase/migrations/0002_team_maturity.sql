-- ============================================================================
-- TaskFlow — Módulo "Maturidade da Equipa"
-- Avaliação de agentes segundo o modelo de liderança situacional M1–M4,
-- com critérios ponderados, plano de desenvolvimento e histórico de evolução.
-- ============================================================================

create type maturity_level as enum ('M1', 'M2', 'M3', 'M4');

-- ----------------------------------------------------------------------------
-- TEAM_AGENTS — os membros da equipa avaliados pelo utilizador (supervisor)
-- ----------------------------------------------------------------------------
create table public.team_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  operation text, -- ex: "SIMAR", nome da operação/equipa/departamento
  avatar_url text,
  current_maturity maturity_level, -- desnormalizado a partir da última avaliação, para leitura rápida
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index team_agents_user_id_idx on public.team_agents (user_id);

-- ----------------------------------------------------------------------------
-- MATURITY_CRITERIA — critérios de avaliação e respetivo peso (%), por utilizador
-- Permite personalização; são semeados com os 6 critérios por omissão na
-- primeira utilização (feito pela aplicação, não por esta migração).
-- ----------------------------------------------------------------------------
create table public.maturity_criteria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  weight numeric(5, 2) not null default 0 check (weight >= 0 and weight <= 100),
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index maturity_criteria_user_id_idx on public.maturity_criteria (user_id);

-- ----------------------------------------------------------------------------
-- MATURITY_EVALUATIONS — cada avaliação pontual de um agente
-- ----------------------------------------------------------------------------
create table public.maturity_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid not null references public.team_agents (id) on delete cascade,
  evaluation_date date not null default current_date,
  -- scores por critério: [{ "criterion_id": "...", "name": "Qualidade", "weight": 25, "score": 4.5 }, ...]
  -- guarda-se nome e peso no momento da avaliação para que o histórico não mude
  -- retroativamente se os critérios forem depois editados.
  scores jsonb not null default '[]'::jsonb,
  weighted_result numeric(4, 2) not null,
  recommended_maturity maturity_level not null,
  confirmed_maturity maturity_level not null,
  strength text,
  improvement_point text,
  recommended_action text,
  goal text,
  deadline date,
  responsible text,
  created_at timestamptz not null default now()
);

create index maturity_evaluations_user_id_idx on public.maturity_evaluations (user_id);
create index maturity_evaluations_agent_id_idx on public.maturity_evaluations (agent_id, evaluation_date desc);

-- Mantém team_agents.current_maturity sincronizado com a avaliação mais recente
create function public.sync_agent_current_maturity()
returns trigger as $$
begin
  update public.team_agents
  set current_maturity = new.confirmed_maturity,
      updated_at = now()
  where id = new.agent_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_maturity_evaluation_created
  after insert on public.maturity_evaluations
  for each row execute procedure public.sync_agent_current_maturity();

create trigger set_updated_at_team_agents before update on public.team_agents
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.team_agents enable row level security;
alter table public.maturity_criteria enable row level security;
alter table public.maturity_evaluations enable row level security;

create policy "team_agents_all_own" on public.team_agents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "maturity_criteria_all_own" on public.maturity_criteria for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "maturity_evaluations_all_own" on public.maturity_evaluations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
