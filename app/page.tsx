import { redirect } from "next/navigation";

// Refonte "Mon espace = l'app" (15/08/2026, demande Bourama). Avant cette
// refonte, cette page ÉTAIT le chat (voir historique git) -- toute cette
// logique (détail agent, streaming, mode invité) vit désormais dans
// components/chat/ChatFlottant.tsx, monté globalement par AppShell.tsx,
// plus jamais liée à une route précise.
//
// "/" n'a donc plus de contenu propre : redirige vers la section par
// défaut choisie par Bourama ("Mon programme").
export default function PageAccueil() {
  redirect("/programme");
}
