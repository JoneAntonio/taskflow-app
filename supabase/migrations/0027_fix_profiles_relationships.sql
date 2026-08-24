-- ============================================================================
-- JAFLOW — Corrige junções em falta com "profiles"
-- Várias tabelas guardam um user_id que referencia auth.users, mas o
-- Supabase precisa de uma referência EXPLÍCITA a public.profiles para
-- conseguir juntar nome/email/avatar numa só consulta (select("*, x:profiles(*)")).
-- Sem isto, essas consultas falhavam silenciosamente (erro PGRST200),
-- devolvendo listas vazias em vez de um erro visível — foi o que causava
-- "Membros (0)" mesmo com membros a existir, e nomes em branco no chat e
-- comentários.
-- ============================================================================

alter table public.team_memberships
  add constraint team_memberships_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.messages
  add constraint messages_sender_id_profiles_fkey
  foreign key (sender_id) references public.profiles (id) on delete cascade;

alter table public.task_comments
  add constraint task_comments_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.task_activity
  add constraint task_activity_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;
