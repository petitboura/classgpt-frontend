"use client";

import { useRouter } from "next/navigation";
import { FilAriane } from "@/components/FilAriane";

// Conteneur partagé par les sections de l'app (refonte "Mon espace =
// l'app", 15/08/2026). Remplace le conteneur à onglets d'EspaceClovis.tsx
// (lien "Retour au chat" et barre d'onglets en state local) -- la
// navigation entre sections passe désormais par AppSidebar.tsx (vraies
// routes), plus besoin de rien de tout ça ici.
//
// Fil d'Ariane ajouté (22/08/2026, demande Bourama, chantier "grandes
// applis") : Accueil -> Section, cliquable pour remonter. Les
// sous-navigations internes à certaines sections (chapitres de Mon
// programme, pages de Notes) gardent pour l'instant leur propre fil
// d'Ariane local existant, non unifié avec celui-ci -- à revoir séparément
// si besoin, ce sont des composants plus profonds et déjà volumineux.
export function SectionPage({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="mx-auto w-full max-w-2xl animate-dj-fade-in space-y-4 px-4 pb-24 pt-6 md:pt-8">
      <FilAriane elements={[{ label: title }]} onRetour={() => router.push("/")} />
      <h1 className="font-display text-xl font-bold text-dj-texte">{title}</h1>
      {children}
    </div>
  );
}
