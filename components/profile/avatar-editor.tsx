"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/profile.service";
import { getGravatarUrl } from "@/lib/gravatar";
import type { Profile } from "@/types/database";

export function AvatarEditor({ profile }: { profile: Profile }) {
  const [manualUrl, setManualUrl] = useState(profile.avatar_url ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const gravatarUrl = getGravatarUrl(profile.email, 128);
  const previewUrl = manualUrl.trim() || gravatarUrl;

  async function handleUseGravatar() {
    setIsSubmitting(true);
    try {
      await profileService.updateAvatar(profile.id, null);
      setManualUrl("");
      toast.success("A usar o avatar associado ao teu email");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o avatar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveManual(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await profileService.updateAvatar(profile.id, manualUrl.trim() || null);
      toast.success("Avatar atualizado");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o avatar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt="Avatar"
        className="h-20 w-20 shrink-0 rounded-2xl border border-[var(--color-border)] object-cover"
      />
      <div className="w-full space-y-3">
        <Button type="button" variant="outline" size="sm" onClick={handleUseGravatar} isLoading={isSubmitting && !manualUrl}>
          Usar avatar associado ao email
        </Button>
        <form onSubmit={handleSaveManual} className="space-y-1.5">
          <Label htmlFor="avatar-url">Ou cola o URL de uma foto tua</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
              <Input
                id="avatar-url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="pl-9"
              />
            </div>
            <Button type="submit" size="sm" isLoading={isSubmitting && !!manualUrl}>
              Guardar
            </Button>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Sugestão: usa um link de uma foto já alojada (ex: Google Drive público, Imgur).
          </p>
        </form>
      </div>
    </div>
  );
}
