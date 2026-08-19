-- ============================================================================
-- TaskFlow — Migração inicial (Fase 1)
-- Cria o esquema completo de dados, índices e políticas de Row Level Security.
-- Executar via: supabase db push  (ou colar no SQL Editor do projeto Supabase)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type task_status as enum ('pendente', 'em_progresso', 'concluida', 'arquivada');
create type task_priority as enum ('sem_prioridade', 'baixa', 'media', 'alta', 'urgente');
create type recurrence_frequency as enum ('diaria', 'dias_uteis', 'semanal', 'mensal', 'anual', 'personalizada');
create type theme_preference as enum ('light', 'dark', 'system');
create type reminder_channel as enum ('app', 'push', 'email');
create type habit_frequency_type as enum ('diaria', 'semanal', 'personalizada');
create type pomodoro_session_type as enum ('foco', 'pausa_curta', 'pausa_longa');
create type notification_type as enum ('lembrete', 'sistema', 'recorrencia');

-- ----------------------------------------------------------------------------
-- PROFILES  (espelha auth.users, 1:1)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  theme theme_preference not null default 'system',
  timezone text not null default 'Europe/Lisbon',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cria automaticamente um profile quando um utilizador se regista
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- PROJECTS (suporta hierarquia via parent_id, ex: Trabalho > Relatórios)
-- ----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  icon text not null default 'folder',
  color text not null default '#6366F1',
  parent_id uuid references public.projects (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_parent_id_idx on public.projects (parent_id);

-- ----------------------------------------------------------------------------
-- TAGS
-- ----------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#94A3B8',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index tags_user_id_idx on public.tags (user_id);

-- ----------------------------------------------------------------------------
-- TASKS
-- ----------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  due_time time,
  priority task_priority not null default 'sem_prioridade',
  status task_status not null default 'pendente',
  -- recorrência guardada como jsonb para flexibilidade (frequency, interval, by_weekday, until)
  recurrence jsonb,
  reminder_at timestamptz,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_due_date_idx on public.tasks (due_date);
create index tasks_status_idx on public.tasks (status);
create index tasks_user_status_due_idx on public.tasks (user_id, status, due_date);

-- ----------------------------------------------------------------------------
-- TASK_TAGS (N:N entre tasks e tags)
-- ----------------------------------------------------------------------------
create table public.task_tags (
  task_id uuid not null references public.tasks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

create index task_tags_tag_id_idx on public.task_tags (tag_id);

-- ----------------------------------------------------------------------------
-- SUBTASKS
-- ----------------------------------------------------------------------------
create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index subtasks_task_id_idx on public.subtasks (task_id);

-- ----------------------------------------------------------------------------
-- REMINDERS
-- ----------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  remind_at timestamptz not null,
  channel reminder_channel not null default 'app',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index reminders_user_id_idx on public.reminders (user_id);
create index reminders_remind_at_idx on public.reminders (remind_at);

-- ----------------------------------------------------------------------------
-- HABITS
-- ----------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  icon text not null default 'sparkles',
  color text not null default '#22C55E',
  frequency_type habit_frequency_type not null default 'diaria',
  target_days integer[] not null default '{0,1,2,3,4,5,6}',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index habits_user_id_idx on public.habits (user_id);

-- ----------------------------------------------------------------------------
-- HABIT_LOGS  (um registo por hábito por dia)
-- ----------------------------------------------------------------------------
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index habit_logs_user_id_idx on public.habit_logs (user_id);
create index habit_logs_habit_date_idx on public.habit_logs (habit_id, log_date);

-- ----------------------------------------------------------------------------
-- POMODORO_SESSIONS
-- ----------------------------------------------------------------------------
create table public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  duration_minutes integer not null,
  session_type pomodoro_session_type not null default 'foco',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index pomodoro_sessions_user_id_idx on public.pomodoro_sessions (user_id);
create index pomodoro_sessions_task_id_idx on public.pomodoro_sessions (task_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type notification_type not null default 'sistema',
  title text not null,
  body text,
  read boolean not null default false,
  related_task_id uuid references public.tasks (id) on delete set null,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_unread_idx on public.notifications (user_id, read);

-- ----------------------------------------------------------------------------
-- TRIGGERS updated_at
-- ----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at_projects before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at_tasks before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Cada utilizador só pode ler/escrever os seus próprios dados.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tags enable row level security;
alter table public.tasks enable row level security;
alter table public.task_tags enable row level security;
alter table public.subtasks enable row level security;
alter table public.reminders enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.pomodoro_sessions enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- PROJECTS
create policy "projects_all_own" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TAGS
create policy "tags_all_own" on public.tags for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASKS
create policy "tasks_all_own" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK_TAGS (verifica propriedade através da tarefa associada)
create policy "task_tags_all_own" on public.task_tags for all
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

-- SUBTASKS (verifica propriedade através da tarefa-mãe)
create policy "subtasks_all_own" on public.subtasks for all
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

-- REMINDERS
create policy "reminders_all_own" on public.reminders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- HABITS
create policy "habits_all_own" on public.habits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- HABIT_LOGS
create policy "habit_logs_all_own" on public.habit_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- POMODORO_SESSIONS
create policy "pomodoro_sessions_all_own" on public.pomodoro_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTIFICATIONS
create policy "notifications_all_own" on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
