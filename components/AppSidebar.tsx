"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  LogIn,
  Home,
  Briefcase,
  ScrollText,
  Library,
  Brain,
  BookOpen,
  Puzzle,
  ScanSearch,
  MoreHorizontal,
  Share2,
  Star,
  Compass,
  Plug,
  NotebookPen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { NoteAgent } from "@/components/NoteAgent";
import { CommentairesAgent } from "@/components/CommentairesAgent";
import { BoutonInstaller } from "@/components/BoutonInstaller";

// Nav principale de l'app (refonte "Mon espace = l'app", 15/08/2026,
// demande Bourama : "faut changer l'affichage même de mon espace, son
// architecture elle-même ; c'est plus une page, c'est elle l'appli").
// Remplace SidebarChatLite.tsx comme point d'entrée -- dérivée de ce même
// fichier (rail collapse/expand, panneau plein écran mobile, transitions),
// mais pointe vers de vraies routes (/bureau, /comportements, ...) au
// lieu d'un onglet en state local dans EspaceClovis.tsx, et sans les
// éléments propres au fil de conversation (historique, nouvelle
// conversation), qui vivent désormais dans ChatFlottant.tsx.
//
// Tous les onglets restent visibles pour tout le monde, connecté ou non
// (même principe que l'ancienne sidebar, 09/08 : "tout est visible") --
// SAUF que la navigation elle-même n'est plus interceptée pour un
// visiteur sans compte (contrairement à l'ancien clicMonEspace) : chaque
// section gère désormais elle-même son propre CTA "Crée un compte" en
// cas de 401 (voir CTACompteRequis.tsx), pour que l'invité "atterrisse
// sur Mon espace comme un compte connecté, avec limitations" (demande
// explicite Bourama).
//
// Animations d'icônes au survol (16/08, demande Bourama : "d'autres
// bougent même, d'autres se penchent sur le côté, comme sur claude.ai")
// -- volontairement PAS un scale-110 uniforme partout. Chaque icône a un
// mouvement qui lui correspond : les chevrons glissent dans leur sens,
// les icônes de nav alternent bascule gauche/droite/rebond/agrandissement
// selon leur position, la boussole "Pourquoi Clovis ?" tourne comme une
// vraie aiguille, etc.

const AGENT_ID = "clovis";

export type OngletId =
  | "bureau"
  | "comportements"
  | "bibliotheque"
  | "notes"
  | "memoire"
  | "programme"
  | "plugins"
  | "audits"
  | "claude";

export const ONGLETS: { id: OngletId; href: string; label: string; Icone: typeof Briefcase }[] = [
  { id: "bureau", href: "/bureau", label: "Bureau", Icone: Briefcase },
  // Texte affiché "Mes skills" (21/08/2026, demande Bourama) -- en
  // interne (route, code, BDD, outils MCP) ça reste "comportement",
  // voir la note dans lib/api.ts. Seul le mot vu par l'utilisateur change.
  { id: "comportements", href: "/comportements", label: "Mes skills", Icone: ScrollText },
  { id: "bibliotheque", href: "/bibliotheque", label: "Bibliothèque", Icone: Library },
  // Section "Notion-like" (Partie 2, lot 5/5, 20/08, demande Bourama) --
  // juste après Bibliothèque, thématiquement proche (contenu personnel
  // organisé par l'étudiant).
  { id: "notes", href: "/notes", label: "Notes", Icone: NotebookPen },
  { id: "memoire", href: "/memoire", label: "Ma mémoire", Icone: Brain },
  { id: "programme", href: "/programme", label: "Mon programme", Icone: BookOpen },
  { id: "plugins", href: "/plugins", label: "Plugins", Icone: Puzzle },
  { id: "audits", href: "/audits", label: "Audits", Icone: ScanSearch },
  // Guide "Utiliser Clovis dans Claude" (18/08, demande Bourama) --
  // icône Plug ("branchement", demande explicite Bourama) plutôt que le
  // logo Claude, propriété d'Anthropic.
  { id: "claude", href: "/connecter-claude", label: "Utiliser Clovis dans Claude", Icone: Plug },
];

// Rotation des mouvements pour les icônes de nav (Accueil + les 7
// onglets) -- volontairement variés pour ne pas retomber sur un effet
// uniforme. Même assignation utilisée en desktop et mobile (calculée par
// index) pour que chaque section garde toujours le même mouvement.
const MOUVEMENTS_NAV = [
  "group-hover:-rotate-12", // Accueil : légère bascule
  "group-hover:scale-110", // Bureau
  "group-hover:rotate-12", // Mes comportements : bascule opposée
  "group-hover:-translate-y-0.5 group-hover:scale-105", // Bibliothèque : petit rebond
  "group-hover:rotate-6 group-hover:-translate-y-0.5", // Notes : léger tilt
  "group-hover:-rotate-12", // Ma mémoire
  "group-hover:scale-110", // Mon programme
  "group-hover:rotate-12", // Plugins
  "group-hover:-translate-y-0.5 group-hover:scale-105", // Audits : petit rebond
  "group-hover:-rotate-12 group-hover:scale-110", // Utiliser Clovis dans Claude
];

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

export function AppSidebar({
  connecte,
  onOuvrirCatalogue,
}: {
  connecte: boolean;
  // "Pourquoi Clovis ?" -- géré au niveau du layout (AppShell.tsx), pas
  // ici, pour pouvoir s'ouvrir aussi automatiquement à la première
  // visite (même logique que l'ancien app/page.tsx, 14/08).
  onOuvrirCatalogue: () => void;
}) {
  const pathname = usePathname();
  const [ouverte, setOuverte] = useState(false);
  const [actionsDeplie, setActionsDeplie] = useState(false);
  const [avisDeplie, setAvisDeplie] = useState(false);
  const [copie, setCopie] = useState(false);
  const asideRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  function basculerActions() {
    setActionsDeplie((v) => !v);
  }

  // Dropdown "Actions" (20/08/2026, demande Bourama : la barre latérale
  // étant quasi pleine, l'ancien accordéon poussait le sélecteur de
  // thème et "Se déconnecter" hors du cadre visible, coupés par
  // l'overflow-hidden du rail) -- petit menu flottant collé au bouton
  // plutôt qu'un dépli qui repousse le reste de la colonne. Se ferme au
  // clic en dehors.
  useEffect(() => {
    if (!actionsDeplie) return;
    function onClicExterieur(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsDeplie(false);
      }
    }
    document.addEventListener("mousedown", onClicExterieur);
    return () => document.removeEventListener("mousedown", onClicExterieur);
  }, [actionsDeplie]);

  async function partager() {
    const url = window.location.origin;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Clovis", url });
      } catch {
        // Annulé par la personne.
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

  async function seDeconnecter() {
    if (!connecte) {
      window.location.href = "/connexion";
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/connexion";
  }

  function LienOnglet({
    onglet,
    mouvement,
    mobile = false,
  }: {
    onglet: { href: string; label: string; Icone: typeof Briefcase };
    mouvement: string;
    mobile?: boolean;
  }) {
    const actif = pathname === onglet.href;
    return (
      <Link
        href={onglet.href}
        onClick={() => mobile && setOuverte(false)}
        className={`group relative mt-2 flex w-full items-center gap-2 rounded-xl transition-colors ${
          actif ? "bg-dj-surface-haute text-dj-texte" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
        } ${mobile ? "px-2" : ""}`}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <onglet.Icone size={18} className={`transition-transform duration-200 ${mouvement}`} />
        </span>
        {mobile ? <span className="text-sm">{onglet.label}</span> : <LibelleRail ouverte={ouverte}>{onglet.label}</LibelleRail>}
        {actif && <TraitSignature className="absolute bottom-0.5 left-2" />}
      </Link>
    );
  }

  // Élément signature (17/08, nouvelle direction "Nuit d'étude") : trait
  // à main levée (irrégulier, pas une ligne géométriquement parfaite --
  // même logique que le traitement "cgpt-*" du reste de l'app) sous
  // l'onglet de navigation actif, en accent doré. Remplace tout autre
  // indicateur d'état actif redondant -- volontairement discret, un seul
  // endroit, pas décoratif ailleurs.
  function TraitSignature({ className = "" }: { className?: string }) {
    return (
      <svg width="24" height="5" viewBox="0 0 24 5" className={className} aria-hidden="true">
        <path
          d="M0.5,2.6 C4,1.1 8,3.4 12,2 C16,0.7 20,3.1 23.5,1.8"
          stroke="var(--dj-accent-1)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const navComplete = [{ href: "/", label: "Accueil", Icone: Home }, ...ONGLETS];

  return (
    <>
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
        className="group fixed left-2 top-2 z-40 flex h-8 w-8 items-center justify-center rounded-md bg-black/35 text-white hover:bg-black/50 md:hidden"
      >
        {ouverte ? (
          <ChevronsLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
        ) : (
          <ChevronsRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
      </button>

      <div
        ref={asideRef}
        className={`hidden flex-shrink-0 flex-col border-r border-dj-bordure bg-dj-fond px-2 py-3 transition-[width] duration-300 ease-out md:flex ${
          actionsDeplie ? "overflow-visible" : "overflow-hidden"
        } ${ouverte ? "md:w-72" : "md:w-14"}`}
      >
        <button
          onClick={() => setOuverte((v) => !v)}
          aria-label={ouverte ? "Replier le panneau" : "Déplier le panneau"}
          className="group flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            {ouverte ? (
              <ChevronsLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            ) : (
              <ChevronsRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
          </span>
          <LibelleRail ouverte={ouverte}>Replier</LibelleRail>
        </button>

        <div className="my-2 h-px w-full bg-dj-bordure" />

        {navComplete.map((o, i) => (
          <LienOnglet key={o.href} onglet={o} mouvement={MOUVEMENTS_NAV[i % MOUVEMENTS_NAV.length]} />
        ))}

        {ouverte && (
          <div className="mt-auto flex justify-center pt-2">
            <BoutonInstaller />
          </div>
        )}

        <div ref={actionsRef} className={`relative rounded-xl ${ouverte ? "mt-2" : "mt-auto"}`}>
          <button
            onClick={basculerActions}
            title="Actions"
            className={`group flex w-full items-center gap-2 rounded-xl transition-colors ${
              actionsDeplie ? "text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
            }`}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              <MoreHorizontal size={18} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
            </span>
            <LibelleRail ouverte={ouverte}>Actions</LibelleRail>
          </button>
          {actionsDeplie && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-64 animate-dj-fade-in-rapide rounded-cgpt-carte border border-dj-bordure bg-dj-surface p-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-2">
                <button
                  onClick={partager}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
                >
                  <Share2 size={16} className="flex-shrink-0 transition-transform duration-200 group-hover:-rotate-12" />
                  {copie ? "Copié !" : "Partager"}
                </button>

                <div className="rounded-lg">
                  <button
                    onClick={() => setAvisDeplie((v) => !v)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                      avisDeplie ? "text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
                    }`}
                  >
                    <Star size={16} className="flex-shrink-0 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
                    Avis sur Clovis
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      avisDeplie ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-4 px-2 pb-2">
                        <NoteAgent agentId={AGENT_ID} />
                        <CommentairesAgent agentId={AGENT_ID} />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOuvrirCatalogue}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
                >
                  <Compass size={16} className="flex-shrink-0 transition-transform duration-300 group-hover:rotate-45" />
                  Pourquoi Clovis ?
                </button>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle LibelleRail={LibelleRail} ouverte={ouverte} />

        <button
          onClick={seDeconnecter}
          className="group mt-2 flex w-full items-center gap-2 rounded-xl text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
            {connecte ? (
              <LogOut size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            ) : (
              <LogIn size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
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
          <div className="mt-8">
            {navComplete.map((o, i) => (
              <LienOnglet key={o.href} onglet={o} mouvement={MOUVEMENTS_NAV[i % MOUVEMENTS_NAV.length]} mobile />
            ))}
          </div>

          <div className="mt-2 flex justify-center">
            <BoutonInstaller />
          </div>

          <div className="mt-2 rounded-xl px-2">
            <button
              onClick={() => setActionsDeplie((v) => !v)}
              className={`group flex w-full items-center gap-2 py-2 text-sm transition-colors ${
                actionsDeplie ? "text-dj-accent-1" : "text-dj-texte-muet"
              }`}
            >
              <MoreHorizontal size={18} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
              Actions
            </button>
            {actionsDeplie && (
              <div className="flex flex-col gap-2 pb-2">
                <button
                  onClick={partager}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
                >
                  <Share2 size={16} className="transition-transform duration-200 group-hover:-rotate-12" />
                  {copie ? "Copié !" : "Partager"}
                </button>
                <button
                  onClick={() => setAvisDeplie((v) => !v)}
                  className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                    avisDeplie ? "text-dj-accent-1" : "text-dj-texte-muet"
                  }`}
                >
                  <Star size={16} className="transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
                  Avis sur Clovis
                </button>
                {avisDeplie && (
                  <div className="flex flex-col gap-4 px-2 pb-2">
                    <NoteAgent agentId={AGENT_ID} />
                    <CommentairesAgent agentId={AGENT_ID} />
                  </div>
                )}
                <button
                  onClick={() => {
                    onOuvrirCatalogue();
                    setOuverte(false);
                  }}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
                >
                  <Compass size={16} className="transition-transform duration-300 group-hover:rotate-45" />
                  Pourquoi Clovis ?
                </button>
              </div>
            )}
          </div>

          <ThemeToggle LibelleRail={LibelleRail} ouverte={ouverte} mobile />

          <button
            onClick={seDeconnecter}
            className="group mt-auto flex w-full items-center gap-2 rounded-xl px-2 text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
              {connecte ? (
                <LogOut size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              ) : (
                <LogIn size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </span>
            <span className="text-sm">{connecte ? "Se déconnecter" : "Se connecter"}</span>
          </button>
        </div>
      )}
    </>
  );
}
