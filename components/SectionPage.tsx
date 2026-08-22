"use client";

// Conteneur partagé par les sections de l'app (refonte "Mon espace =
// l'app", 15/08/2026). Remplace le conteneur à onglets d'EspaceClovis.tsx
// (lien "Retour au chat" et barre d'onglets en state local) -- la
// navigation entre sections passe désormais par AppSidebar.tsx (vraies
// routes), plus besoin de rien de tout ça ici.
//
// Fil d'Ariane ajouté puis retiré le même jour (22/08/2026, demande
// Bourama) : à ce niveau (Accueil -> Section, un seul niveau réel), il ne
// faisait que répéter le titre déjà affiché juste en dessous par le h1 --
// aucune vraie hiérarchie à montrer, donc aucune utilité, juste un
// doublon visuel. Un vrai fil d'Ariane garde son sens uniquement là où il
// y a une vraie profondeur (ex : EspaceProgramme.tsx, programme -> matière
// -> chapitre) -- pas ajouté ici pour cette raison.
export function SectionPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl animate-dj-fade-in space-y-4 px-4 pb-24 pt-6 md:pt-8">
      <h1 className="font-display text-xl font-bold text-dj-texte">{title}</h1>
      {children}
    </div>
  );
}
