import { createClient } from "@/lib/supabase/client";
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/validations/auth";

/**
 * Camada de serviço de autenticação. Isola os componentes de UI da API
 * concreta do Supabase, para que o cliente possa ser trocado no futuro
 * sem tocar nos formulários.
 */
export const authService = {
  async signIn({ email, password }: LoginInput) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName }: RegisterInput) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordReset({ email }: ForgotPasswordInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-password`,
    });
    if (error) throw error;
  },

  async updatePassword({ password }: ResetPasswordInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
};
