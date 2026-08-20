"use client";

import { ReactNode } from "react";

// Panneau flottant (20/08/2026, demande Bourama : "il y a plein de plein
// écran qui sont comme ça, des carrés, des trucs plats -- change") :
// remplace le pattern `fixed inset-0 bg-dj-fond` (aplat édge-à-édge, sans
// coins ni profondeur) par le vrai langage "carte modale" déjà établi
// ailleurs dans l'app (voir CompteRequisModal.tsx) -- fond assombri en
// retrait, carte flottante à coins légèrement irréguliers
// (rounded-cgpt-carte), ombre, animation cgpt-entree-modal. Composant
// partagé plutôt que dupliqué à chaque écran, pour que toute future
// évolution de ce langage visuel se fasse à un seul endroit.
//
// Volontairement plus large/haut qu'une carte de confirmation classique
// (max-w-3xl, max-h-[88vh]) puisque ces panneaux contiennent un vrai
// espace d'édition (texte long, formulaire), pas juste un message court.

export function PanneauFlottant({
  children,
  onFerme,
  entete,
  large = false,
  pleine = false,
}: {
  children: ReactNode;
  onFerme?: () => void;
  entete?: ReactNode;
  large?: boolean;
  /** Pour les éditeurs qui ont besoin de presque tout l'espace de travail
   * (canvas de dessin, éditeur de code) : garde la carte flottante (coins,
   * ombre, fond assombri) mais avec beaucoup plus de place qu'un panneau de
   * formulaire classique, plutôt que revenir à l'aplat edge-to-edge. */
  pleine?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-dj-fade-in-rapide items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onFerme}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full ${
          pleine ? "max-w-6xl max-h-[94vh]" : large ? "max-w-4xl max-h-[88vh]" : "max-w-2xl max-h-[88vh]"
        } flex-col overflow-hidden rounded-cgpt-carte border border-dj-bordure bg-dj-surface shadow-[0_8px_40px_rgba(0,0,0,0.45)] animate-cgpt-entree-modal`}
      >
        {entete && <div className="flex-shrink-0 border-b border-dj-bordure px-5 py-3 sm:px-6">{entete}</div>}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
