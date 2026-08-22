"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Send, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pushService } from "@/services/push.service";
import { emailNotificationsService } from "@/services/email-notifications.service";

export function PushNotificationCard() {
  const [supported] = useState(() => pushService.isSupported());
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(() => pushService.isSupported());
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (supported) {
      pushService
        .isSubscribed()
        .then(setSubscribed)
        .finally(() => setIsLoading(false));
    }
  }, [supported]);

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
                ? "Ativas neste dispositivo — chegam mesmo com o JAFLOW fechado."
                : "Recebe alertas neste PC/telemóvel mesmo sem teres o JAFLOW aberto."}
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
