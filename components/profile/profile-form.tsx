"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/profile.service";
import type { Profile } from "@/types/database";

const TIMEZONES = [
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "America/Sao_Paulo",
  "America/New_York",
  "UTC",
];

interface FormValues {
  fullName: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      fullName: profile.full_name ?? "",
      timezone: profile.timezone,
      notificationsEnabled: profile.notifications_enabled,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await profileService.updateProfile(profile.id, {
        fullName: values.fullName,
        timezone: values.timezone,
        notificationsEnabled: values.notificationsEnabled,
        theme: profile.theme,
      });
      toast.success("Perfil atualizado");
    } catch {
      toast.error("Não foi possível guardar as alterações.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const initials = (profile.full_name || profile.email)
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)] font-display text-xl font-semibold text-[var(--color-accent-ink)]">
          {initials}
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">{profile.email}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            A foto de perfil ficará disponível numa fase futura.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="fullName">Nome</Label>
        <Input id="fullName" {...register("fullName")} />
      </div>

      <div>
        <Label htmlFor="timezone">Fuso horário</Label>
        <select
          id="timezone"
          {...register("timezone")}
          className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3">
        <input
          type="checkbox"
          {...register("notificationsEnabled")}
          className="h-4 w-4 rounded accent-[var(--color-accent)]"
        />
        <span className="text-sm text-[var(--color-ink)]">
          Ativar notificações de lembretes de tarefas
        </span>
      </label>

      <Button type="submit" isLoading={isSubmitting}>
        Guardar alterações
      </Button>
    </form>
  );
}
