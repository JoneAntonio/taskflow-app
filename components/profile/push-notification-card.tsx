"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Send, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pushService } from "@/services/push.service";
import { createClient } from "@/lib/supabase/client";
import { emailNotificationsService } from "@/services/email-notifications.service";

type NexusPrefs = { default_hour: number; morning_digest: boolean; habit_nudge: boolean };

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
        checked
          ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      }`}
    >
      <span
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
          checked ? "left-[18px] bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" : "left-0.5 bg-[var(--color-ink-muted)]"
        }`}
      />
    </button>
  );
}

function ScheduledAlertsSettings() {
  const [prefs, setPrefs] = useState<NexusPrefs | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase.from("faisca_prefs").select("*").eq("user_id", data.user.id).maybeSingle();
      setPrefs(row ?? { default_hour: 9, morning_digest: true, habit_nudge: true });
    });
  }, []);

  async function save(patch: Partial<NexusPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase
      .from("faisca_prefs")
      .upsert({ user_id: data.user.id, ...next, updated_at: new Date().toISOString() });
    if (error) toast.error("Não foi possível guardar a preferência.");
  }

  if (!prefs) return null;

  return (
    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
      <p className="text-sm font-medium text-[var(--color-ink)]">Alertas agendados</p>
      <p className="-mt-2 text-xs text-[var(--color-ink-muted)]">
        Verificados a cada minuto: prazo da tarefa (data e hora) e lembretes. Tarefas só com data avisam à hora padrão.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-ink)]">Briefing da manhã <span className="font-mono-data text-xs text-[var(--color-ink-muted)]">08:00</span></span>
        <Toggle label="Briefing da manhã" checked={prefs.morning_digest} onChange={(v) => save({ morning_digest: v })} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-ink)]">Hábitos por registar <span className="font-mono-data text-xs text-[var(--color-ink-muted)]">20:30</span></span>
        <Toggle label="Hábitos por registar" checked={prefs.habit_nudge} onChange={(v) => save({ habit_nudge: v })} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-ink)]">Hora padrão (tarefas sem hora)</span>
        <select
          value={prefs.default_hour}
          onChange={(e) => save({ default_hour: Number(e.target.value) })}
          className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 font-mono-data text-sm text-[var(--color-ink)]"
        >
          {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};

export function PushNotificationCard() {
  // O suporte só se sabe no browser: no servidor assume-se "suportado" e o
  // React confirma depois de hidratar, sem diferença entre servidor e cliente.
  const supported = useSyncExternalStore(noopSubscribe, () => pushService.isSupported(), () => true);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const isLoading = supported && checking;

  useEffect(() => {
    if (!pushService.isSupported()) return;
    pushService
      .isSubscribed()
      .then(setSubscribed)
      .finally(() => setChecking(false));
  }, []);

  async function handleToggle() {
    setIsBusy(true);
    try {
      if (subscribed) {
        await pushService.unsubscribe();
        setSubscribed(false);
        toast.success("Notificações push desativadas");
      } else {
        await pushService.subscribe();
        setSubscribed(true);
        toast.success("Notificações push ativadas neste dispositivo");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTest() {
    setIsBusy(true);
    try {
      await pushService.sendTest();
      toast.success("Notificação de teste enviada — verifica o teu dispositivo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTestEmail() {
    setIsBusy(true);
    try {
      await emailNotificationsService.sendTest();
      toast.success("Email de teste enviado — verifica a tua caixa de entrada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o email.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {supported ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">Notificações push</p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {subscribed
                ? "Ativas neste dispositivo — chegam mesmo com a app fechada."
                : "Recebe alertas neste PC/telemóvel na data e hora de cada tarefa, mesmo com a app fechada."}
            </p>
          </div>
          <div className="flex gap-2">
            {subscribed && (
              <Button variant="outline" size="sm" onClick={handleTest} isLoading={isBusy}>
                <Send className="h-3.5 w-3.5" /> Testar
              </Button>
            )}
            <Button
              variant={subscribed ? "outline" : "primary"}
              size="sm"
              onClick={handleToggle}
              isLoading={isBusy || isLoading}
            >
              {subscribed ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {subscribed ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Este browser não suporta notificações push. Experimenta o Chrome, Edge ou Firefox.
        </p>
      )}

      <ScheduledAlertsSettings />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">Notificações por email</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Recebe alertas no teu email, em qualquer conta.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleTestEmail} isLoading={isBusy}>
          <Mail className="h-3.5 w-3.5" /> Testar
        </Button>
      </div>
    </div>
  );
}
