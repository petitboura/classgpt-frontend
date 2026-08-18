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
// Icônes (icone-192.png, icone-512.png) régénérées le 18/08 (demande
// Bourama) : fond toujours plein (jamais transparent, cf. note du
// 17/08 plus haut) mais coins désormais arrondis (rayon ~18% du côté)
// au lieu d'un carré à angles droits.
//
// icone-192-maskable.png / icone-512-maskable.png (purpose
// "maskable", ajoutées le 18/08) : mêmes couleurs, logo resserré dans
// la zone de sécurité centrale (~50% du côté, sous les 80%
// recommandés par la spec W3C), fond plein bord à bord SANS coins
// arrondis -- c'est volontaire, le système (Android notamment) est
// censé découper lui-même la forme finale (rond, carré arrondi,
// squircle...) selon le launcher/thème de l'appareil. On ne choisit
// pas cette forme depuis le dépôt, on donne juste au système la
// matière première pour le faire. Les navigateurs/OS qui ne
// supportent pas "maskable" retombent sur les icônes "any"
// ci-dessus (coins arrondis fixes).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Clovis",
    short_name: "Clovis",
    description: "Ton compagnon d'études pour la classe.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f0d0b",
    theme_color: "#0f0d0b",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icone-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
