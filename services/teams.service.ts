import { createClient } from "@/lib/supabase/client";
import type { Team, TeamMembership, TeamInvite, TeamRole } from "@/types/database";

export const teamsService = {
  async listMyTeams(): Promise<Team[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("teams").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Team[];
  },

  async createTeam(input: { name: string; description?: string }): Promise<Team> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data: team, error } = await supabase
      .from("teams")
      .insert({ name: input.name, description: input.description ?? null, created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    const { error: membershipError } = await supabase
      .from("team_memberships")
      .insert({ team_id: team.id, user_id: user.id, role: "admin" });
    if (membershipError) throw membershipError;

    return team as Team;
  },

  async listMembers(teamId: string): Promise<TeamMembership[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_memberships")
      .select("*, profile:profiles(*)")
      .eq("team_id", teamId)
      .order("joined_at");
    if (error) throw error;
    return (data ?? []) as unknown as TeamMembership[];
  },

  async listPendingInvites(teamId: string): Promise<TeamInvite[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as TeamInvite[];
  },

  async inviteMember(teamId: string, email: string, role: TeamRole = "member"): Promise<void> {
    const response = await fetch("/api/teams/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, email, role }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Não foi possível enviar o convite.");
  },

  async removeMember(membershipId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("team_memberships").delete().eq("id", membershipId);
    if (error) throw error;
  },

  async updateMemberRole(membershipId: string, role: TeamRole): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("team_memberships").update({ role }).eq("id", membershipId);
    if (error) throw error;
  },

  async listMyPendingInvites(): Promise<TeamInvite[]> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();
    if (!profile) return [];
    const { data, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("email", profile.email)
      .eq("status", "pending");
    if (error) throw error;
    return (data ?? []) as TeamInvite[];
  },

  async acceptInvite(invite: TeamInvite): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { error: membershipError } = await supabase
      .from("team_memberships")
      .insert({ team_id: invite.team_id, user_id: user.id, role: invite.role });
    if (membershipError) throw membershipError;

    const { error: inviteError } = await supabase
      .from("team_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (inviteError) throw inviteError;
  },

  async declineInvite(inviteId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("team_invites").update({ status: "revoked" }).eq("id", inviteId);
    if (error) throw error;
  },
};
