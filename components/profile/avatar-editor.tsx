"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, ImageUp, Link2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { profileService } from "@/services/profile.service";
import { getGravatarUrl } from "@/lib/gravatar";
import type { Profile } from "@/types/database";

const BUCKET = "avatars";
const OUTPUT_SIZE = 512;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Corta ao centro em quadrado, reduz para 512px e comprime (WebP, ou JPEG se o browser não suportar). */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const size = Math.min(OUTPUT_SIZE, side);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();
  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp", 0.86);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg", 0.88);
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

export function AvatarEditor({ profile }: { profile: Profile }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [manualUrl, setManualUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const previewUrl = avatarUrl.trim() || getGravatarUrl(profile.email, 256);
  const hasOwnPhoto = !!avatarUrl.trim();

  async function removeStoredPhotos(keepPath?: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from(BUCKET).list(profile.id);
    const stale = (data ?? []).map((f) => `${profile.id}/${f.name}`).filter((p) => p !== keepPath);
    if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolhe um ficheiro de imagem (JPG, PNG, HEIC ou WebP).");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error("A imagem tem mais de 15 MB. Escolhe uma mais pequena.");
      return;
    }
    setIsUploading(true);
    try {
      const blob = await prepareImage(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: blob.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await profileService.updateAvatar(profile.id, data.publicUrl);
      setAvatarUrl(data.publicUrl);
      removeStoredPhotos(path).catch(() => {});
      toast.success("Foto de perfil atualizada");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar a foto. Tenta com outra imagem.");
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleRemove() {
    setIsSaving(true);
    try {
      await profileService.updateAvatar(profile.id, null);
      await removeStoredPhotos().catch(() => {});
      setAvatarUrl("");
      toast.success("Foto removida — a usar o avatar associado ao teu email");
      router.refresh();
    } catch {
      toast.error("Não foi possível remover a foto.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveLink(event: React.FormEvent) {
    event.preventDefault();
    const url = manualUrl.trim();
    if (!url) return;
    setIsSaving(true);
    try {
      await profileService.updateAvatar(profile.id, url);
      await removeStoredPhotos().catch(() => {});
      setAvatarUrl(url);
      setManualUrl("");
      toast.success("Foto de perfil atualizada");
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar o link.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={isUploading}
        aria-label="Alterar foto de perfil"
        className={`group relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border transition-[border-color,box-shadow] ${
          isDragging
            ? "border-[var(--color-accent)] shadow-[var(--glow)]"
            : "border-[var(--color-border)] hover:border-[color-mix(in_oklab,var(--color-accent)_55%,var(--color-border))]"
        }`}
      >
        {failedUrl === previewUrl ? (
          <span className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] font-display text-4xl font-semibold text-white">
            {(profile.full_name || profile.email || "?").trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" onError={() => setFailedUrl(previewUrl)} className="h-full w-full object-cover" />
        )}
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[rgba(5,7,13,0.62)] text-[11px] font-medium text-white backdrop-blur-[2px] transition-opacity ${
            isUploading || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          }`}
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          {isUploading ? "A carregar…" : isDragging ? "Larga aqui" : "Alterar"}
        </span>
        <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[var(--shadow-sm)] group-hover:opacity-0 sm:hidden">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="w-full space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => fileInput.current?.click()} isLoading={isUploading}>
            {!isUploading && <ImageUp className="h-4 w-4" />}
            {hasOwnPhoto ? "Trocar foto" : "Carregar foto"}
          </Button>
          {hasOwnPhoto && (
            <Button type="button" variant="outline" size="sm" onClick={handleRemove} isLoading={isSaving && !manualUrl}>
              {!(isSaving && !manualUrl) && <Trash2 className="h-4 w-4" />}
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-[var(--color-ink-muted)]">
          No telemóvel podes tirar uma foto na hora ou escolher da galeria; no computador também podes arrastar a imagem
          para cima da foto. É cortada em quadrado e comprimida automaticamente.
        </p>

        <details className="group/link pt-1">
          <summary className="cursor-pointer list-none text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Usar um link de imagem
            </span>
          </summary>
          <form onSubmit={handleSaveLink} className="mt-2 space-y-1.5">
            <Label htmlFor="avatar-url" className="sr-only">
              URL da foto
            </Label>
            <div className="flex gap-2">
              <Input
                id="avatar-url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                inputMode="url"
              />
              <Button type="submit" size="sm" variant="outline" isLoading={isSaving && !!manualUrl}>
                Guardar
              </Button>
            </div>
          </form>
        </details>
      </div>
    </div>
  );
}
