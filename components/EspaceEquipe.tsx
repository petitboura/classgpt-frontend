"use client";

import { useEffect, useState } from "react";
import { lireMonEquipe, type MembreEquipe } from "@/lib/invitations";
import { messageErreur } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";

/**
 * "L'IA de mes élèves" (brief section 3). Réutilise /api/roles/mon-equipe
 * qui existe déjà côté backend (jamais exposé côté client jusqu'ici, voir
 * lib/invitations.ts:lireMonEquipe) -- établissement -> ses enseignants,
 * enseignant -> ses élèves.
 *
 * Correctif (08/08) : le bouton "Voir" pointait vers /agent/[id]/chat,
 * une route de djiguigne-frontend qui n'existe pas dans ce dépôt (Class
 * GPT n'a qu'une seule route de chat, "/", résolue pour le compte
 * connecté -- pas de route par agent_id arbitraire). Retiré plutôt que
 * de deviner une destination : est-ce que "voir" doit ouvrir une
 * conversation en lecture seule, une vue en direct, autre chose ? À
 * trancher avec Bourama avant de construire quoi que ce soit ici.
 * En attendant, la liste reste utile telle quelle (qui a rejoint,
 * combien de personnes).
 */
export function EspaceEquipe({ titre }: { titre: string }) {
  const [membres, setMembres] = useState<MembreEquipe[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    lireMonEquipe()
      .then(setMembres)
      .catch((e) => setErreur(messageErreur(e)));
  }, []);

  return (
    <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
      <h2 className="font-display text-base font-semibold text-dj-texte">{titre}</h2>

      {erreur && <p className="mt-3 animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>}

      {membres === null && !erreur && (
        <div className="mt-3 space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-12 rounded-lg border border-dj-bordure"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      )}

      {membres && membres.length === 0 && (
        <p className="mt-3 animate-dj-fade-in-rapide text-sm text-dj-texte-muet">
          Personne n'a encore rejoint avec ton code.
        </p>
      )}

      {membres && membres.length > 0 && (
        <ul className="mt-3 animate-dj-fade-in-rapide space-y-2">
          {membres.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between gap-2 rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2"
            >
              <span className="truncate text-sm text-dj-texte">{m.nom_affiche}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
