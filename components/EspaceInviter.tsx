"use client";

import { useEffect, useState } from "react";
import { genererMonInvitation, lireMonInvitation, type Invitation } from "@/lib/invitations";
import { messageErreur } from "@/lib/erreurs";

const LIBELLE_ROLE_CIBLE: Record<Invitation["role_cible"], string> = {
  enseignant: "enseignants",
  etudiant: "élèves",
};

/**
 * Bloc "Inviter" de l'espace Class GPT (partie 4). Un seul code actif à
 * la fois (voir POST /api/roles/invitation côté backend) : régénérer
 * remplace l'ancien plutôt que d'en accumuler plusieurs.
 *
 * Chargement en squelette + apparitions en fondu partout (jamais
 * d'affichage brut) -- convention déjà utilisée dans le reste du produit
 * (animate-dj-fade-in-rapide).
 */
export function EspaceInviter() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    lireMonInvitation()
      .then(setInvitation)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  async function generer() {
    setErreur(null);
    setEnCours(true);
    try {
      const nouvelle = await genererMonInvitation();
      setInvitation(nouvelle);
      setCopie(false);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function copier() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Pas grave si le presse-papier échoue (permission refusée,
      // navigateur ancien) -- le code reste affiché à l'écran, copiable à
      // la main. Pas d'erreur bloquante pour si peu.
    }
  }

  return (
    <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
      <h2 className="font-display text-base font-semibold text-dj-texte">Inviter</h2>

      {chargement && (
        <div className="mt-4 h-24 animate-pulse rounded-xl border border-dj-bordure bg-dj-surface-haute" aria-hidden />
      )}

      {erreur && <p className="mt-3 animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>}

      {!chargement && !invitation && !erreur && (
        <div className="mt-4 animate-dj-fade-in-rapide text-center">
          <p className="text-sm text-dj-texte-muet">Pas encore de code à partager.</p>
          <button
            onClick={generer}
            disabled={enCours}
            className="mt-3 rounded-full bg-dj-gradient px-5 py-2 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {enCours ? "Génération…" : "Générer mon code"}
          </button>
        </div>
      )}

      {invitation && (
        <div className="mt-4 animate-dj-fade-in-rapide">
          <p className="text-xs text-dj-texte-muet">
            Partage ce code avec tes futurs {LIBELLE_ROLE_CIBLE[invitation.role_cible]}.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 rounded-xl border border-dj-bordure-forte bg-dj-surface-haute px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-dj-texte">
              {invitation.code}
            </span>
            <button
              onClick={copier}
              className="rounded-full border border-dj-bordure px-4 py-3 text-xs font-medium text-dj-texte-muet transition-colors hover:text-dj-texte"
            >
              {copie ? "Copié !" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-xs text-dj-texte-muet">
            {invitation.utilisations === 0
              ? "Personne ne l'a encore utilisé."
              : `Utilisé ${invitation.utilisations} fois.`}
          </p>
          <button
            onClick={generer}
            disabled={enCours}
            className="mt-3 rounded-full border border-dj-bordure px-4 py-1.5 text-xs font-medium text-dj-texte-muet transition-colors hover:text-dj-texte disabled:opacity-50"
          >
            {enCours ? "Génération…" : "Régénérer (l'ancien code arrêtera de marcher)"}
          </button>
        </div>
      )}
    </section>
  );
}
