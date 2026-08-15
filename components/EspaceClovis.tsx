"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles, Library, Brain, BookOpen, Puzzle, ScanSearch } from "lucide-react";
import { useState } from "react";
import { EspaceEntrerCode } from "./EspaceEntrerCode";
import { MesCodes } from "./MesCodes";
import { EspaceBibliotheque } from "./EspaceBibliotheque";
import { MesComportements } from "./MesComportements";
import { MaMemoire } from "./MaMemoire";
import { EspaceProgramme } from "./EspaceProgramme";
import { ProgrammesRecus } from "./ProgrammesRecus";
import { EspacePlugins } from "./EspacePlugins";
import { EspaceAudits } from "./EspaceAudits";
import { Skeleton } from "./Skeleton";

// Clovis ne parle qu'à une seule IA, toujours -- voir app/page.tsx.
// Plus aucune notion de rôle (établissement/enseignant/étudiant) depuis
// le 09-10/08 (demande explicite Bourama, redite à Atik le 10/08 : "tout
// le monde est pareil" -- voir contenu dynamique par matière,
// api/contenu_dynamique_matiere.py).
const AGENT_ID = "clovis";

// Bureau réactivé (14/08) : c'est précisément la fonctionnalité annoncée
// comme "va revenir" dans le commentaire ci-dessous -- demande explicite
// de Bourama dans cette conversation, avec le nouveau système de codes de
// partage (MesCodes/EspaceEntrerCode) à la place de l'ancien contenu
// matière (EspaceInviter/EspaceEquipe/EspaceDiffuser, plus jamais monté).
const AFFICHER_BUREAU = true;

/**
 * Espace utilisateur réduit de Clovis (partie 4 du brief, refonte du
 * 09/08). Volontairement SANS : onglet "administrer", onglet "mes IA",
 * bouton retour vitrine, sélecteur/historique de plusieurs agents.
 *
 * Onglets, TOUS visibles pour TOUT LE MONDE (plus de rôle, plus de flag
 * section_mes_comportements à vérifier -- décision explicite Bourama
 * "bureau activé toujours et mes comportements toujours dans Clovis") :
 * - "Bureau" : gérer mes codes de partage (comportement/programme/
 *   bibliothèque/texte, voir MesCodes.tsx) et entrer un code reçu d'un
 *   autre utilisateur (14/08/2026, remplace l'ancien système "un code =
 *   une matière", jamais lu par le chat -- voir core/codes_partage.py).
 * - "Mes comportements" : consignes perso pour l'IA de la personne
 *   connectée.
 * - "Bibliothèque" et "Ma mémoire" : personnels à chaque utilisateur.
 */

type OngletId = "bureau" | "comportements" | "bibliotheque" | "memoire" | "programme" | "plugins" | "audits";

const ONGLETS: { id: OngletId; label: string; Icone: typeof Briefcase }[] = [
  { id: "bureau", label: "Bureau", Icone: Briefcase },
  { id: "comportements", label: "Mes comportements", Icone: Sparkles },
  { id: "bibliotheque", label: "Bibliothèque", Icone: Library },
  { id: "memoire", label: "Ma mémoire", Icone: Brain },
  { id: "programme", label: "Mon programme", Icone: BookOpen },
  { id: "plugins", label: "Plugins", Icone: Puzzle },
  { id: "audits", label: "Audits", Icone: ScanSearch },
];

export function EspaceClovis() {
  const [onglet, setOnglet] = useState<OngletId>(AFFICHER_BUREAU ? "bureau" : "comportements");

  return (
    <main className="mx-auto max-w-2xl animate-dj-fade-in space-y-4 px-4 pb-24 pt-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-dj-texte-muet transition-colors hover:text-dj-texte"
      >
        <ArrowLeft size={16} />
        Retour au chat
      </Link>
      <h1 className="font-display text-xl font-bold text-dj-texte">Mon espace</h1>

      <div className="flex gap-2 overflow-x-auto border-b border-dj-bordure">
        {ONGLETS.filter((o) => AFFICHER_BUREAU || o.id !== "bureau").map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={
              "flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors " +
              (onglet === o.id
                ? "border-dj-accent-1 text-dj-texte"
                : "border-transparent text-dj-texte-muet hover:text-dj-texte")
            }
          >
            <o.Icone size={16} />
            {o.label}
          </button>
        ))}
      </div>

      {AFFICHER_BUREAU && onglet === "bureau" && (
        <div className="flex flex-col gap-4">
          <MesCodes />
          <EspaceEntrerCode />
        </div>
      )}

      {onglet === "comportements" && (
        <div className="max-w-md">
          <MesComportements agentId={AGENT_ID} />
        </div>
      )}

      {onglet === "bibliotheque" && <EspaceBibliotheque />}

      {onglet === "memoire" && <MaMemoire />}

      {onglet === "programme" && (
        <>
          <ProgrammesRecus />
          <EspaceProgramme />
        </>
      )}

      {onglet === "plugins" && <EspacePlugins />}

      {onglet === "audits" && <EspaceAudits />}
    </main>
  );
}
