"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";

// Fil d'Ariane partagé (22/08/2026, demande Bourama). Même style visuel
// que celui déjà utilisé localement dans EspaceProgramme.tsx pour le
// drill-down programme -> matière -> chapitre, extrait ici pour être
// réutilisable par SectionPage.tsx (fil d'Ariane de premier niveau :
// Accueil -> Section) sans dupliquer le style. Le FilAriane local
// d'EspaceProgramme.tsx n'a pas été touché : il gère un cas différent
// (drill-down interne à une page), reste tel quel pour l'instant.
export function FilAriane({
  elements,
  onRetour,
}: {
  elements: { label: string; onClick?: () => void }[];
  onRetour: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <button
        onClick={onRetour}
        aria-label="Retour"
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-dj-texte-muet transition-colors hover:bg-dj-surface hover:text-dj-texte"
      >
        <ArrowLeft size={14} />
      </button>
      {elements.map((e, i) => {
        const dernier = i === elements.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="text-dj-texte-muet" />}
            {e.onClick && !dernier ? (
              <button
                onClick={e.onClick}
                className="rounded-lg px-1 py-0.5 text-dj-texte-muet transition-colors hover:bg-dj-surface hover:text-dj-texte"
              >
                {e.label}
              </button>
            ) : (
              <span className={dernier ? "font-semibold text-dj-texte" : "text-dj-texte-muet"}>{e.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
