"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles, Library, Brain, BookOpen } from "lucide-react";
import { useState } from "react";
import { EspaceInviter } from "./EspaceInviter";
import { EspaceEntrerCode } from "./EspaceEntrerCode";
import { EspaceEquipe } from "./EspaceEquipe";
import { EspaceDiffuser } from "./EspaceDiffuser";
import { EspaceBibliotheque } from "./EspaceBibliotheque";
import { MesComportements } from "./MesComportements";
import { MaMemoire } from "./MaMemoire";
import { EspaceProgramme } from "./EspaceProgramme";
import { Skeleton } from "./Skeleton";

// Clovis ne parle qu'à une seule IA, toujours -- voir app/page.tsx.
// Plus aucune notion de rôle (établissement/enseignant/étudiant) depuis
// le 09-10/08 (demande explicite Bourama, redite à Atik le 10/08 : "tout
// le monde est pareil" -- voir contenu dynamique par matière,
// api/contenu_dynamique_matiere.py).
const AGENT_ID = "nitrux";

/**
 * Espace utilisateur réduit de Clovis (partie 4 du brief, refonte du
 * 09/08). Volontairement SANS : onglet "administrer", onglet "mes IA",
 * bouton retour vitrine, sélecteur/historique de plusieurs agents.
 *
 * Onglets, TOUS visibles pour TOUT LE MONDE (plus de rôle, plus de flag
 * section_mes_comportements à vérifier -- décision explicite Bourama
 * "bureau activé toujours et mes comportements toujours dans Clovis") :
 * - "Bureau" : écrire une matière (génère un code), entrer un code,
 *   voir qui a entré mes codes, diffuser des documents ciblés.
 * - "Mes comportements" : consignes perso pour l'IA de la personne
 *   connectée.
 * - "Bibliothèque" et "Ma mémoire" : personnels à chaque utilisateur.
 */

type OngletId = "bureau" | "comportements" | "bibliotheque" | "memoire" | "programme";

const ONGLETS: { id: OngletId; label: string; Icone: typeof Briefcase }[] = [
  { id: "bureau", label: "Bureau", Icone: Briefcase },
  { id: "comportements", label: "Mes comportements", Icone: Sparkles },
  { id: "bibliotheque", label: "Bibliothèque", Icone: Library },
  { id: "memoire", label: "Ma mémoire", Icone: Brain },
  { id: "programme", label: "Mon programme", Icone: BookOpen },
];

export function EspaceClovis() {
  const [onglet, setOnglet] = useState<OngletId>("bureau");

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
        {ONGLETS.map((o) => (
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

      {onglet === "bureau" && (
        <div className="flex flex-col gap-4">
          <EspaceInviter />
          <EspaceEntrerCode />
          <EspaceEquipe />
          <EspaceDiffuser />
        </div>
      )}

      {onglet === "comportements" && (
        <div className="max-w-md">
          <MesComportements agentId={AGENT_ID} />
        </div>
      )}

      {onglet === "bibliotheque" && <EspaceBibliotheque />}

      {onglet === "memoire" && <MaMemoire />}

      {onglet === "programme" && <EspaceProgramme />}
    </main>
  );
}
