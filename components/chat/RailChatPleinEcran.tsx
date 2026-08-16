"use client";

import { useState } from "react";
import { ChevronsLeft, ChevronsRight, MessageSquarePlus, History } from "lucide-react";

// Rail du chat en mode plein écran (15/08/2026, demande Bourama : "le
// sidebar du chat lui doit s'afficher dans le chat en mode plein écran
// mais doit s'adapter à la nouvelle architecture"). Repris de l'ancienne
// SidebarChatLite.tsx (même look rail collapse/expand), mais :
// - PAS de bouton "Mon espace" -- n'a plus de sens, l'app entière EST
//   Mon espace désormais (voir AppSidebar.tsx).
// - PAS de Partager / Avis sur cette IA / Pourquoi Clovis ? / Installer /
//   Se connecter-déconnecter -- ces actions ne sont pas propres au chat,
//   elles vivent maintenant dans AppSidebar.tsx (nav principale de
//   l'app), pas question de les dupliquer ici.
// - PAS de "Mes comportements" en accordéon -- section déjà accessible
//   en entier dans Mon espace (/comportements), inutile de la dupliquer.
// Ne reste donc que ce qui est intrinsèquement lié au FIL de
// conversation en cours : nouvelle conversation, historique des fils.
// Absent en mode mini (pas la place) -- seul le mode plein écran l'a.

type FilConversation = {
  conversation_id: string | null;
  titre: string;
  derniere_activite: string;
};

function LibelleRail({ ouverte, children }: { ouverte: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap text-sm transition-[max-width,opacity] duration-300 ease-out ${
        ouverte ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"
      }`}
    >
      {children}
    </span>
  );
}

export function RailChatPleinEcran({
  aDesMessages,
  conversationActiveId,
  historique,
  onNouvelleConversation,
  onSelectionnerConversation,
}: {
  aDesMessages: boolean;
  conversationActiveId: string | null;
  historique: FilConversation[];
  onNouvelleConversation: () => void;
  onSelectionnerConversation: (fil: FilConversation) => void;
}) {
  const [ouverte, setOuverte] = useState(false);

  return (
    <div
      className={`flex flex-shrink-0 flex-col overflow-hidden border-r border-dj-bordure bg-dj-fond px-2 py-3 transition-[width] duration-300 ease-out ${
        ouverte ? "w-56" : "w-14"
      }`}
    >
      <button
        onClick={() => setOuverte((v) => !v)}
        aria-label={ouverte ? "Replier" : "Déplier"}
        className="flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
          {ouverte ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
        </span>
        <LibelleRail ouverte={ouverte}>Replier</LibelleRail>
      </button>

      <div className="my-2 h-px w-full bg-dj-bordure" />

      {aDesMessages && (
        <button
          onClick={onNouvelleConversation}
          className="flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <MessageSquarePlus size={18} />
          </span>
          <LibelleRail ouverte={ouverte}>Nouvelle conversation</LibelleRail>
        </button>
      )}

      {historique.length > 0 && (
        <div className="mt-1 min-h-0 flex-1 overflow-y-auto rounded-xl">
          <div className="flex items-center gap-2 px-0 py-2 text-dj-texte-muet">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <History size={18} />
            </span>
            <LibelleRail ouverte={ouverte}>Historique</LibelleRail>
          </div>
          {ouverte && (
            <div className="flex flex-col px-1 pb-1">
              {historique.map((fil) => {
                const estActive = fil.conversation_id === conversationActiveId;
                return (
                  <button
                    key={fil.conversation_id ?? "legacy"}
                    onClick={() => !estActive && onSelectionnerConversation(fil)}
                    disabled={estActive}
                    className={`truncate border-b border-white/[0.06] px-2 py-2 text-left text-sm last:border-b-0 ${
                      estActive ? "text-dj-accent-1" : "text-dj-texte hover:text-dj-accent-1"
                    }`}
                  >
                    {estActive ? "● " : ""}
                    {fil.titre}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
