"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronsLeft,
  ChevronsRight,
  MessageSquarePlus,
  History,
  LogOut,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appelerApi } from "@/lib/api";
import { Logo } from "@/components/Logo";

// Sidebar de Class GPT (partie 3 du brief) -- version délibérément réduite
// de SidebarChat.tsx (djiguigne-frontend) : reprend le même comportement
// de rail (collapse/expand, panneau plein écran sur mobile, transitions
// jamais brutales) mais SANS aucun des éléments qui révéleraient
// l'écosystème Djiguignè -- pas de "Changer d'IA", pas de "Voir l'IA",
// pas d'"Avis sur cet agent", pas de lien "Retour à la vitrine". Les
// fonctionnalités "espace utilisateur" (inviter, suivi élèves, diffusion)
// appartiennent à la partie 4 du brief, pas à ce composant.
//
// Logo (chapeau de diplômé, identité graphique) : branché depuis la
// partie 5 (composant Logo.tsx), remplace l'icône GraduationCap
// générique utilisée en repli le temps que cette partie soit livrée.

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

export function SidebarChatLite({
  agentId,
  role,
  aDesMessages,
  conversationActiveId,
  onNouvelleConversation,
  onSelectionnerConversation,
}: {
  agentId: string;
  role: string | null;
  aDesMessages: boolean;
  conversationActiveId: string | null;
  onNouvelleConversation: () => void;
  onSelectionnerConversation: (fil: FilConversation) => void;
}) {
  // Correctif (08/08) : lien vers /mon-espace (partie 4 -- inviter,
  // suivre son équipe, diffuser des documents), jusqu'ici inatteignable
  // depuis l'interface. Un étudiant n'a rien à gérer en dessous de lui
  // (voir EspaceClassGPT.tsx), donc pas de lien pour ce rôle.
  const peutVoirMonEspace = role === "etablissement" || role === "enseignant";
  const [ouverte, setOuverte] = useState(false);
  const [fils, setFils] = useState<FilConversation[] | null>(null);
  const [historiqueDeplie, setHistoriqueDeplie] = useState(false);
  const asideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentId) return;
    appelerApi(`/api/historique/${agentId}/conversations`)
      .then((r: FilConversation[]) => setFils(r))
      .catch(() => setFils([]));
  }, [agentId]);

  function choisirFil(fil: FilConversation) {
    onSelectionnerConversation(fil);
    setHistoriqueDeplie(false);
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();
    window.location.href = "/connexion";
  }

  return (
    <>
      {/* Fond assombri mobile uniquement, même comportement que
          djiguigne-frontend : ferme le panneau au clic extérieur. */}
      {ouverte && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOuverte(false)}
          aria-hidden="true"
        />
      )}

      <button
        onClick={() => setOuverte((v) => !v)}
        aria-label={ouverte ? "Replier le panneau" : "Déplier le panneau"}
        className="fixed left-2 top-2 z-40 flex h-8 w-8 items-center justify-center rounded-md bg-black/35 text-white hover:bg-black/50 md:hidden"
      >
        {ouverte ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
      </button>

      <div
        ref={asideRef}
        className={`hidden flex-shrink-0 flex-col overflow-hidden border-r border-dj-bordure bg-dj-fond px-2 py-3 transition-[width] duration-300 ease-out md:flex ${
          ouverte ? "md:w-72" : "md:w-14"
        }`}
      >
        <button
          onClick={() => setOuverte((v) => !v)}
          aria-label={ouverte ? "Replier le panneau" : "Déplier le panneau"}
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
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dj-bordure text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <MessageSquarePlus size={18} />
            </span>
            <LibelleRail ouverte={ouverte}>Nouvelle conversation</LibelleRail>
          </button>
        )}

        {peutVoirMonEspace && (
          <Link
            href="/mon-espace"
            className="mt-2 flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <Users size={18} />
            </span>
            <LibelleRail ouverte={ouverte}>Mon espace</LibelleRail>
          </Link>
        )}

        {fils && fils.length > 0 && (
          <div className="mt-2 rounded-xl border border-dj-bordure">
            <button
              onClick={() => {
                setHistoriqueDeplie((v) => !v);
                setOuverte(true);
              }}
              title="Historique"
              className={`flex w-full items-center gap-2 rounded-xl transition-colors ${
                historiqueDeplie ? "text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
              }`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <History size={18} />
              </span>
              <LibelleRail ouverte={ouverte}>Historique</LibelleRail>
            </button>
            {ouverte && (
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  historiqueDeplie ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col px-1 pb-1">
                    {fils.map((fil) => {
                      const estActive = fil.conversation_id === conversationActiveId;
                      return (
                        <button
                          key={fil.conversation_id ?? "legacy"}
                          onClick={() => !estActive && choisirFil(fil)}
                          disabled={estActive}
                          className={`border-b border-white/[0.06] px-2 py-2 text-left text-sm last:border-b-0 ${
                            estActive ? "text-dj-accent-1" : "text-dj-texte hover:text-dj-accent-1"
                          }`}
                        >
                          {estActive ? "● " : ""}
                          {fil.titre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={seDeconnecter}
            className="flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <LogOut size={18} />
            </span>
            <LibelleRail ouverte={ouverte}>Se déconnecter</LibelleRail>
          </button>

          <div className="flex w-full items-center gap-2 rounded-xl text-dj-texte-muet">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <Logo taille={18} />
            </span>
            <LibelleRail ouverte={ouverte}>
              <span className="font-display font-bold tracking-tight">Class GPT</span>
            </LibelleRail>
          </div>
        </div>
      </div>

      {/* Panneau plein écran mobile, même logique que desktop. */}
      {ouverte && (
        <div className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-hidden border-r border-dj-bordure bg-dj-fond px-2 py-3 md:hidden">
          {aDesMessages && (
            <button
              onClick={() => {
                onNouvelleConversation();
                setOuverte(false);
              }}
              className="mt-8 flex w-full items-center gap-2 rounded-xl border border-dj-bordure px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <MessageSquarePlus size={18} />
              </span>
              <span className="text-sm">Nouvelle conversation</span>
            </button>
          )}

          {peutVoirMonEspace && (
            <Link
              href="/mon-espace"
              onClick={() => setOuverte(false)}
              className={`flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte ${
                aDesMessages ? "mt-2" : "mt-8"
              }`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <Users size={18} />
              </span>
              <span className="text-sm">Mon espace</span>
            </Link>
          )}

          {fils && fils.length > 0 && (
            <div className="mt-2 flex-1 overflow-y-auto rounded-xl border border-dj-bordure">
              <div className="flex items-center gap-2 border-b border-dj-bordure px-2 py-2 text-dj-texte-muet">
                <History size={16} />
                <span className="text-sm">Historique</span>
              </div>
              <div className="flex flex-col px-1 pb-1">
                {fils.map((fil) => {
                  const estActive = fil.conversation_id === conversationActiveId;
                  return (
                    <button
                      key={fil.conversation_id ?? "legacy"}
                      onClick={() => !estActive && choisirFil(fil)}
                      disabled={estActive}
                      className={`border-b border-white/[0.06] px-2 py-2 text-left text-sm last:border-b-0 ${
                        estActive ? "text-dj-accent-1" : "text-dj-texte hover:text-dj-accent-1"
                      }`}
                    >
                      {estActive ? "● " : ""}
                      {fil.titre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={seDeconnecter}
            className="mt-auto flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <LogOut size={18} />
            </span>
            <span className="text-sm">Se déconnecter</span>
          </button>
        </div>
      )}
    </>
  );
}
