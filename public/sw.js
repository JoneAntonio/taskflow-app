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
