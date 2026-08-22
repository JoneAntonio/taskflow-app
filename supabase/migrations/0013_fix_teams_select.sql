-- ============================================================================
-- JAFLOW — Corrige criação de equipas
-- Ao criar uma equipa, o código lê logo a seguir a linha criada. Nesse
-- instante ainda não existe nenhuma "team_memberships" (é criada a seguir),
-- por isso a política "teams_select_member" bloqueava a leitura e a criação
-- parecia falhar. Esta política adicional permite ao criador ver sempre as
-- equipas que ele próprio criou, independentemente de já ser membro.
-- ============================================================================

create policy "teams_select_own" on public.teams for select
  using (created_by = auth.uid());

-- Sem isto, a lista de membros de uma equipa mostraria nomes/emails em
-- branco: por defeito só vês o TEU próprio perfil (profiles_select_own).
-- Esta política deixa-te ver o perfil de quem partilha uma equipa contigo.
create policy "profiles_select_teammates" on public.profiles for select
  using (
    exists (
      select 1 from public.team_memberships m1
      join public.team_memberships m2 on m1.team_id = m2.team_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );
