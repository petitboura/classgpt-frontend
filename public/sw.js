const CACHE = "classgpt-v1";

// Porté de djiguigne-frontend/public/sw.js (09/08, Bourama) : même
// besoin ici -- BoutonInstaller.tsx exige un service worker actif avec
// un handler fetch pour être "installable", et useNotificationsPush.ts
// (déjà présent côté client, jusqu'ici inerte faute de service worker)
// a besoin des handlers push/notificationclick ci-dessous pour
// fonctionner. Volontairement minimal : réseau en priorité, cache en
// secours si hors ligne, pas de stratégie de cache agressive.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Payload envoyé par pywebpush côté backend (core/notifications_push.py,
// partagé avec djiguigne-frontend) : JSON {title, body, url}.
self.addEventListener("push", (event) => {
  let donnees = { title: "Class GPT", body: "" };
  try {
    donnees = event.data.json();
  } catch (e) {
    donnees.body = event.data ? event.data.text() : "";
  }

  event.waitUntil(
    self.registration.showNotification(donnees.title || "Class GPT", {
      body: donnees.body || "",
      icon: "/icone-192.png",
      badge: "/icone-192.png",
      data: { url: donnees.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
