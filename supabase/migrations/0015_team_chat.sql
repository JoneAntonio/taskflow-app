-- ============================================================================
-- JAFLOW — Chat de equipa + Mensagens diretas
-- Uma conversa por equipa (chat de grupo) e conversas 1-para-1 entre dois
-- membros que partilhem pelo menos uma equipa.
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams (id) on delete cascade,
  dm_user_a uuid references auth.users (id) on delete cascade,
  dm_user_b uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_kind check (
    (team_id is not null and dm_user_a is null and dm_user_b is null)
    or (team_id is null and dm_user_a is not null and dm_user_b is not null)
  ),
  unique (team_id),
  unique (dm_user_a, dm_user_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select" on public.conversations for select
  using (
    (team_id is not null and public.is_team_member(team_id))
    or auth.uid() = dm_user_a or auth.uid() = dm_user_b
  );

create policy "conversations_insert_team" on public.conversations for insert
  with check (team_id is not null and public.is_team_admin(team_id));

create policy "conversations_insert_dm" on public.conversations for insert
  with check (team_id is null and (auth.uid() = dm_user_a or auth.uid() = dm_user_b));

create policy "messages_select" on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          (c.team_id is not null and public.is_team_member(c.team_id))
          or auth.uid() = c.dm_user_a or auth.uid() = c.dm_user_b
        )
    )
  );

create policy "messages_insert" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          (c.team_id is not null and public.is_team_member(c.team_id))
          or auth.uid() = c.dm_user_a or auth.uid() = c.dm_user_b
        )
    )
  );

-- Necessário para o Supabase Realtime entregar mensagens novas ao vivo.
alter publication supabase_realtime add table public.messages;
