import { createClient } from "@/lib/supabase/client";
import type { AccessRequest } from "@/types/database";

export type { AccessRequest };

export const accessRequestsService = {
  async requestSupervisorAccess(): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { error } = await supabase.from("account_access_requests").insert({ user_id: user.id });
    if (error) throw error;

    fetch("/api/access-requests/notify", { method: "POST" }).catch(() => {});
  },

  async myPendingRequest(): Promise<AccessRequest | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("account_access_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    return data as AccessRequest | null;
  },

  async listPending(): Promise<AccessRequest[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("account_access_requests")
      .select("*, profile:profiles(full_name, email, account_type)")
      .eq("status", "pending")
      .order("requested_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as AccessRequest[];
  },

  async approve(request: AccessRequest): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ account_type: "supervisor" })
      .eq("id", request.user_id);
    if (profileError) throw profileError;

    const { error } = await supabase
      .from("account_access_requests")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) throw error;

    await supabase.from("notifications").insert({
      user_id: request.user_id,
      type: "sistema",
      title: "O teu acesso de Supervisor foi aprovado!",
      body: "Já tens acesso total — Método SMART, Equipas e Maturidade.",
    });
  },

  async deny(request: AccessRequest): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { error } = await supabase
      .from("account_access_requests")
      .update({ status: "denied", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) throw error;
  },
};
