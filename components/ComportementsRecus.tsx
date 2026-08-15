"use client";

import { useEffect, useState } from "react";
import { listerMesRattachementsCodes, type RattachementCode } from "@/lib/api";

/**
 * Comportements reçus via un code (14/08/2026, voir
 * core/codes_partage.py) -- affichés SÉPARÉMENT des comportements
 * propres de MesComportements.tsx, lecture seule (on ne modifie pas ce
 * qu'on a reçu, seul le propriétaire du code le peut, depuis "Mes
 * codes"). Fusionnés côté chat avec les comportements propres avant le
 * petit routeur "à la skill" -- ici, purement pour affichage humain.
 */
export function ComportementsRecus() {
  const [rattachements, setRattachements] = useState<RattachementCode[] | undefined>(undefined);

  useEffect(() => {
    listerMesRattachementsCodes()
      .then(setRattachements)
      .catch(() => setRattachements([]));
  }, []);

  const recus = (rattachements || []).filter((r) => r.a_comportement);
  if (!rattachements || recus.length === 0) return null;

  return (
    <div className="mt-4 animate-dj-fade-in-rapide space-y-2 border-t border-dj-bordure pt-3">
      <p className="text-xs font-semibold text-dj-texte-muet">Reçus (via un code)</p>
      {recus.map((r) => (
        <div key={r.rattachement_id} className="rounded-lg border border-dj-bordure/60 bg-dj-surface-haute px-2 py-2">
          <p className="text-[11px] text-dj-texte-muet">Reçu de {r.proprietaire_nom}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-dj-texte">{r.comportement_texte}</p>
        </div>
      ))}
    </div>
  );
}
