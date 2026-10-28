import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const array = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  return array.buffer as ArrayBuffer;
}

const NEXUS_VAPID_PUBLIC_KEY =
  "BLw0NS86-_T-DrSg-epe002z1L4WoGIApIUIHT_6lPHJx1HGIcr-0hLqJJ_dzXiDPJMMFrt1LQ8BOObO482RaJM";
const SUBSCRIPTIONS_TABLE = "faisca_push_subscriptions";

export const pushService = {
  isSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  },

  async subscribe(): Promise<void> {
    if (!this.isSupported()) throw new Error("Este browser não suporta notificações push.");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permissão de notificações recusada.");

    // Chave do serviço de notificações agendadas (Supabase, a cada minuto).
    const publicKey = NEXUS_VAPID_PUBLIC_KEY;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado.");

    const json = subscription.toJSON();
    const { error } = await supabase.from(SUBSCRIPTIONS_TABLE).upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: "endpoint" }
    );
    if (error) throw error;
  },

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const supabase = createClient();
      await supabase.from(SUBSCRIPTIONS_TABLE).delete().eq("endpoint", subscription.endpoint);
      await subscription.unsubscribe();
    }
  },

  async sendTest(): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("faisca-push", { body: { action: "test" } });
    if (error) throw new Error("Não foi possível enviar a notificação de teste.");
    if (!data?.sent) throw new Error("Nenhum dispositivo ativo recebeu o teste. Volta a ativar as notificações.");
  },
};
