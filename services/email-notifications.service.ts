export const emailNotificationsService = {
  async sendTest(): Promise<void> {
    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Teste de notificação — JAFLOW",
        message: "Este é um email de teste. Se o recebeste, o envio de emails está a funcionar corretamente.",
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Não foi possível enviar o email de teste.");
    }
  },
};
