// Conteneur partagé par les 7 sections de l'app (refonte "Mon espace =
// l'app", 15/08/2026). Remplace le conteneur à onglets d'EspaceClovis.tsx
// (lien "Retour au chat" et barre d'onglets en state local) -- la
// navigation entre sections passe désormais par AppSidebar.tsx (vraies
// routes), plus besoin de rien de tout ça ici.
export function SectionPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl animate-dj-fade-in space-y-4 px-4 pb-24 pt-6 md:pt-8">
      <h1 className="font-display text-xl font-bold text-dj-texte">{title}</h1>
      {children}
    </div>
  );
}
