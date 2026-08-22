// Service worker mínimo do JAFLOW.
// Por agora só regista a app como "instalável"; cache offline pode ser
// adicionado depois se for preciso (ex: com a biblioteca Workbox).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Passa tudo diretamente à rede por agora (sem cache offline ainda).
});

// Recebe uma notificação push real, enviada pelo servidor do JAFLOW, e
// mostra-a mesmo que este separador esteja fechado.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "JAFLOW", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "JAFLOW", {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/dashboard" },
    })
  );
});

// Clicar na notificação abre (ou foca) a app na página relevante.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
