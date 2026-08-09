import type { MetadataRoute } from "next";

// Ajouté le 09/08 (Bourama, priorité #2 après le correctif de la barre
// latérale) : jusqu'ici BoutonInstaller.tsx et useNotificationsPush.ts
// existaient déjà côté client mais restaient totalement inertes, faute
// de manifest + service worker dans ce dépôt (voir commentaires dans
// ces deux fichiers). Next.js génère automatiquement
// /manifest.webmanifest à partir de ce fichier (App Router, aucun
// package supplémentaire) -- couplé à public/sw.js +
// ServiceWorkerRegistration.tsx pour l'installabilité.
//
// Icônes (icone-192.png, icone-512.png) générées à partir du logo
// existant (public/classgpt-logo.svg, chapeau de diplômé), sur fond
// #f4f3ee (couleur de fond actuelle de l'appli, thème clair) pour un
// rendu carré cohérent une fois installée -- jamais de logo flottant
// sur fond transparent, qui rendrait mal selon le launcher.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Class GPT",
    short_name: "Class GPT",
    description: "Ton assistant IA pour la classe.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f3ee",
    theme_color: "#f4f3ee",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
