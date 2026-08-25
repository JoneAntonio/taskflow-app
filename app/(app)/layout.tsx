import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("projects").select("*").is("parent_id", null).order("position"),
  ]);

  return (
    <AppShell
      profile={{
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? user.email ?? "",
        avatar_url: profile?.avatar_url ?? null,
        account_type: profile?.account_type ?? "supervisor",
      }}
      projects={projects ?? []}
    >
      {children}
    </AppShell>
  );
}
