import { createClient } from "@/lib/supabase/client";
import type { Profile, ThemePreference } from "@/types/database";

export interface UpdateProfileInput {
  fullName: string;
  timezone: string;
  notificationsEnabled: boolean;
  theme: ThemePreference;
}

export const profileService = {
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: input.fullName,
        timezone: input.timezone,
        notifications_enabled: input.notificationsEnabled,
        theme: input.theme,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};
