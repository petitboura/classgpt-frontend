"use client";

import { useEffect } from "react";

// Porté de djiguigne-frontend (09/08, Bourama). Monté une fois dans
// app/layout.tsx -- voir public/sw.js pour ce que ce service worker gère.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Échec silencieux : l'appli marche très bien sans service
        // worker, elle perd juste l'installabilité PWA et les
        // notifications push. Pas la peine d'embêter la personne avec ça.
      });
    }
  }, []);

  return null;
}
