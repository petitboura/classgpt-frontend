"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { lireMonRole, type MonRole } from "@/lib/api";
import { EspaceInviter } from "./EspaceInviter";
import { EspaceEquipe } from "./EspaceEquipe";
import { EspaceDiffuser } from "./EspaceDiffuser";
import { EspaceRejoindre } from "./EspaceRejoindre";
import { messageErreur } from "@/lib/erreurs";

/**
 * Espace utilisateur réduit de Class GPT (partie 4 du brief). Volontairement
 * SANS : onglet "administrer", onglet "mes IA", bouton retour vitrine,
 * sélecteur/historique de plusieurs agents -- seulement inviter, suivre
 * son équipe, diffuser des documents (brief section 3).
 *
 * "Étudiant" ne voit ni "Inviter" ni "Diffuser" (rien en dessous de lui à
 * gérer) -- seulement sa propre IA, gérée ailleurs (le chat direct, part 3).
 * Cette page ne s'affiche donc en pratique que pour établissement/enseignant.
 */
export function EspaceClassGPT() {
  const [monRole, setMonRole] = useState<MonRole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    lireMonRole()
      .then(setMonRole)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl border border-dj-bordure bg-dj-surface-haute"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </main>
    );
  }

  if (erreur) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <p className="animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>
      </main>
    );
  }

  if (!monRole?.role) {
    return (
      <main className="mx-auto flex min-h-[70vh] items-center justify-center px-4">
        <EspaceRejoindre onTermine={() => window.location.reload()} />
      </main>
    );
  }

  const titreEquipe = monRole.role === "etablissement" ? "Mes enseignants" : "Mes élèves";

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
      <EspaceInviter />
      <EspaceEquipe titre={titreEquipe} />
      <EspaceDiffuser />
    </main>
  );
}
