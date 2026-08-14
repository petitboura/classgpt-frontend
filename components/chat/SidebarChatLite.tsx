"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronsLeft,
  ChevronsRight,
  MessageSquarePlus,
  History,
  LogOut,
  LogIn,
  Users,
  Sparkles,
  MoreHorizontal,
  Share2,
  Star,
  Compass,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appelerApi } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { MesComportements } from "@/components/MesComportements";
import { NoteAgent } from "@/components/NoteAgent";
import { CommentairesAgent } from "@/components/CommentairesAgent";
import { BoutonInstaller } from "@/components/BoutonInstaller";

// Sidebar de Clovis (partie 3 du brief) -- version délibérément réduite
// de SidebarChat.tsx (djiguigne-frontend) : reprend le même comportement
// de rail (collapse/expand, panneau plein écran sur mobile, transitions
// jamais brutales) mais SANS aucun des éléments qui révéleraient
// l'écosystème Djiguignè -- pas de "Changer d'IA", pas de "Voir l'IA",
// pas de lien "Retour à la vitrine". Les fonctionnalités "espace
// utilisateur" (inviter, suivi élèves, diffusion) appartiennent à la
// partie 4 du brief (voir EspaceClovis.tsx), pas à ce composant.
//
// Ajouté le 09/08 (demande Bourama, par comparaison avec
// djiguigne-frontend/SidebarChat.tsx) : Mes comportements, bouton
// Installer, et un bouton Actions réduit à Partager + Avis uniquement
// -- PAS de "Voir l'IA"/"Changer d'IA"/"Retour à la vitrine", contraires
// au principe ci-dessus. Le bouton Partager de Clovis pointe
// volontairement vers la racine de l'appli (window.location.origin),
// jamais vers /agent/{agentId} de djiguigne-frontend -- copier ce lien
// ici aurait révélé l'écosystème.
//
// CORRIGÉ le 09/08 : "Débloquer une matière" (code, contenu dynamique
// par matière) avait été ajouté ici par erreur -- Bourama n'avait
// demandé que 2/6/7/9/10 de la liste djiguigne-frontend, jamais le 5
// (débloquer une matière). Retiré entièrement (états, fonctions,
// rendu desktop ET mobile, ListeMatieresDebloquees, imports liés).
//
// Logo (plume, identité graphique) : branché depuis la partie 5
// (composant Logo.tsx), remplace l'icône GraduationCap générique
// utilisée en repli le temps que cette partie soit livrée. Le
// composant Logo.tsx dessinait encore l'ancien chapeau de diplômé
// en dur jusqu'au 12/08 (corrigé pour dessiner la plume).

// CORRIGÉ le 09/08 (Bourama, suite à la disparition de la barre en mode
// invité) : "tout est visible, visiteur ou pas -- la seule différence,
// c'est que cliquer sur un truc qui nécessite un compte invite à s'en
// créer un." La barre est désormais rendue à l'identique pour un
// visiteur sans session (voir app/page.tsx, état "invite") : "Mon
// espace" reste visible mais ouvre `onNecessiteCompte` au clic au lieu
// de naviguer, et "Se déconnecter" devient "Se connecter" (même
// callback). "Mes comportements"/"Avis" restent visibles tels quels --
// gérés au niveau de MesComportements.tsx/NoteAgent.tsx/
// CommentairesAgent.tsx eux-mêmes (401 -> CompteRequisModal locale).

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
  connecte,
  aDesMessages,
  conversationActiveId,
  onNouvelleConversation,
  onSelectionnerConversation,
  sectionMesComportements,
  onNecessiteCompte,
  onOuvrirCatalogue,
}: {
  agentId: string;
  connecte: boolean;
  aDesMessages: boolean;
  conversationActiveId: string | null;
  onNouvelleConversation: () => void;
  onSelectionnerConversation: (fil: FilConversation) => void;
  sectionMesComportements?: boolean;
  onNecessiteCompte: () => void;
  // Bouton réouvrable "Ce qui différencie Clovis" (14/08) -- ouvre
  // CatalogueClovis, état géré par le parent (app/page.tsx), même
  // pattern que onNecessiteCompte ci-dessus.
  onOuvrirCatalogue: () => void;
}) {
  // "Mon espace" est toujours visible, connecté ou non (voir
  // commentaire d'en-tête, 09-10/08) : plus de rôle à tester.
  const [ouverte, setOuverte] = useState(false);
  const [fils, setFils] = useState<FilConversation[] | null>(null);
  const [historiqueDeplie, setHistoriqueDeplie] = useState(false);
  const [comportementsDeplie, setComportementsDeplie] = useState(false);
  const [actionsDeplie, setActionsDeplie] = useState(false);
  const [avisDeplie, setAvisDeplie] = useState(false);
  const [copie, setCopie] = useState(false);
  const asideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentId) return;
    appelerApi(`/api/historique/${agentId}/conversations`)
      .then((r: FilConversation[]) => setFils(r))
      .catch(() => setFils([]));
  }, [agentId]);

  // Bascule exclusive pour les volets repliables du rail (même correctif
  // que djiguigne-frontend, 28/07) : un seul volet ouvert à la fois.
  function basculerVoletRail(section: "historique" | "comportements") {
    const dejaActif = (section === "historique" && historiqueDeplie) || (section === "comportements" && comportementsDeplie);
    setHistoriqueDeplie(section === "historique" ? !dejaActif : false);
    setComportementsDeplie(section === "comportements" ? !dejaActif : false);
    setOuverte(true);
  }

  function basculerActions() {
    setActionsDeplie((v) => !v);
    setOuverte(true);
  }

  // Partage le lien de Clovis lui-même, JAMAIS /agent/{agentId} --
  // ce lien pointerait vers l'écosystème Djiguignè, contraire au brief.
  async function partager() {
    const url = window.location.origin;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Clovis", url });
      } catch {
        // Annulé par la personne -- flux normal du Web Share API.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt("Copie ce lien :", url);
    }
  }

  function choisirFil(fil: FilConversation) {
    onSelectionnerConversation(fil);
    setHistoriqueDeplie(false);
  }

  function clicMonEspace(e: React.MouseEvent) {
    if (!connecte) {
      e.preventDefault();
      onNecessiteCompte();
    }
  }

  async function seDeconnecter() {
    if (!connecte) {
      onNecessiteCompte();
      return;
    }
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
            className="mt-2 flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <MessageSquarePlus size={18} />
            </span>
            <LibelleRail ouverte={ouverte}>Nouvelle conversation</LibelleRail>
          </button>
        )}

        <Link
          href="/mon-espace"
          onClick={clicMonEspace}
          className="mt-2 flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <Users size={18} />
          </span>
          <LibelleRail ouverte={ouverte}>Mon espace</LibelleRail>
        </Link>

        <button
          onClick={onOuvrirCatalogue}
          className="mt-2 flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <Compass size={18} />
          </span>
          <LibelleRail ouverte={ouverte}>Pourquoi Clovis ?</LibelleRail>
        </button>

        {fils && fils.length > 0 && (
          <div className="mt-2 rounded-xl">
            <button
              onClick={() => basculerVoletRail("historique")}
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

        {sectionMesComportements && (
          <div className="mt-2 rounded-xl">
            <button
              onClick={() => basculerVoletRail("comportements")}
              title="Mes comportements"
              className={`flex w-full items-center gap-2 rounded-xl transition-colors ${
                comportementsDeplie ? "text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
              }`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <Sparkles size={18} />
              </span>
              <LibelleRail ouverte={ouverte}>Mes comportements</LibelleRail>
            </button>
            {ouverte && (
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  comportementsDeplie ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <MesComportements agentId={agentId} />
                </div>
              </div>
            )}
          </div>
        )}

        {ouverte && (
          <div className="mt-auto flex justify-center pt-2">
            <BoutonInstaller />
          </div>
        )}

        <div className={`rounded-xl ${ouverte ? "mt-2" : "mt-auto"}`}>
          <button
            onClick={basculerActions}
            title="Actions"
            className={`flex w-full items-center gap-2 rounded-xl transition-colors ${
              actionsDeplie ? "text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
            }`}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <MoreHorizontal size={18} />
            </span>
            <LibelleRail ouverte={ouverte}>Actions</LibelleRail>
          </button>
          {ouverte && (
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                actionsDeplie ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-2 px-2 pb-2">
                  <button
                    onClick={partager}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface hover:text-dj-texte"
                  >
                    <Share2 size={16} className="flex-shrink-0" />
                    {copie ? "Copié !" : "Partager"}
                  </button>

                  <div className="rounded-lg">
                    <button
                      onClick={() => setAvisDeplie((v) => !v)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                        avisDeplie ? "text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface hover:text-dj-texte"
                      }`}
                    >
                      <Star size={16} className="flex-shrink-0" />
                      Avis sur cette IA
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        avisDeplie ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-4 px-2 pb-2">
                          <NoteAgent agentId={agentId} />
                          <CommentairesAgent agentId={agentId} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={seDeconnecter}
          className="mt-2 flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            {connecte ? <LogOut size={18} /> : <LogIn size={18} />}
          </span>
          <LibelleRail ouverte={ouverte}>{connecte ? "Se déconnecter" : "Se connecter"}</LibelleRail>
        </button>

        <div className="flex w-full items-center gap-2 rounded-xl text-dj-texte-muet">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <Logo taille={18} />
          </span>
          <LibelleRail ouverte={ouverte}>
            <span className="font-display font-bold tracking-tight">Clovis</span>
          </LibelleRail>
        </div>
      </div>

      {/* Panneau plein écran mobile, même logique que desktop. */}
      {ouverte && (
        <div className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto overflow-x-hidden border-r border-dj-bordure bg-dj-fond px-2 py-3 md:hidden">
          {aDesMessages && (
            <button
              onClick={() => {
                onNouvelleConversation();
                setOuverte(false);
              }}
              className="mt-8 flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <MessageSquarePlus size={18} />
              </span>
              <span className="text-sm">Nouvelle conversation</span>
            </button>
          )}

          <Link
            href="/mon-espace"
            onClick={(e) => {
              clicMonEspace(e);
              if (connecte) setOuverte(false);
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte ${
              aDesMessages ? "mt-2" : "mt-8"
            }`}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <Users size={18} />
            </span>
            <span className="text-sm">Mon espace</span>
          </Link>

          <button
            onClick={() => {
              onOuvrirCatalogue();
              setOuverte(false);
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <Compass size={18} />
            </span>
            <span className="text-sm">Pourquoi Clovis ?</span>
          </button>

          {fils && fils.length > 0 && (
            <div className="mt-2 flex-1 overflow-y-auto rounded-xl">
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

          {sectionMesComportements && (
            <div className="mt-2 rounded-xl">
              <button
                onClick={() => setComportementsDeplie((v) => !v)}
                className={`flex w-full items-center gap-2 px-2 py-2 text-sm transition-colors ${
                  comportementsDeplie ? "text-dj-accent-1" : "text-dj-texte-muet"
                }`}
              >
                <Sparkles size={18} />
                Mes comportements
              </button>
              {comportementsDeplie && <MesComportements agentId={agentId} />}
            </div>
          )}

          <div className="mt-2 flex justify-center">
            <BoutonInstaller />
          </div>

          <div className="mt-2 rounded-xl px-2">
            <button
              onClick={() => setActionsDeplie((v) => !v)}
              className={`flex w-full items-center gap-2 py-2 text-sm transition-colors ${
                actionsDeplie ? "text-dj-accent-1" : "text-dj-texte-muet"
              }`}
            >
              <MoreHorizontal size={18} />
              Actions
            </button>
            {actionsDeplie && (
              <div className="flex flex-col gap-2 pb-2">
                <button
                  onClick={partager}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
                >
                  <Share2 size={16} />
                  {copie ? "Copié !" : "Partager"}
                </button>
                <button
                  onClick={() => setAvisDeplie((v) => !v)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                    avisDeplie ? "text-dj-accent-1" : "text-dj-texte-muet"
                  }`}
                >
                  <Star size={16} />
                  Avis sur cette IA
                </button>
                {avisDeplie && (
                  <div className="flex flex-col gap-4 px-2 pb-2">
                    <NoteAgent agentId={agentId} />
                    <CommentairesAgent agentId={agentId} />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={seDeconnecter}
            className="mt-auto flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              {connecte ? <LogOut size={18} /> : <LogIn size={18} />}
            </span>
            <span className="text-sm">{connecte ? "Se déconnecter" : "Se connecter"}</span>
          </button>
        </div>
      )}
    </>
  );
}
