"use client";

import { useEffect, useState } from "react";
import { activerRattachement, entrerCode, listerMesRattachements, type Rattachement } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";

/**
 * Bloc "Entrer un code" (nouveau le 09/08, demande Bourama) : n'existait
 * jusqu'ici que dans EspaceRejoindre.tsx, un écran de repli créant un
 * compte "établissement" -- retiré (incompatible avec le nouveau
 * modèle). Ici, entrer un code débloque une matière précise (voir
 * lib/api.ts:entrerCode), rien d'autre -- pas de choix de rôle. Un même
 * compte peut débloquer plusieurs matières.
 */
export function EspaceEntrerCode() {
  const [rattachements, setRattachements] = useState<Rattachement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [messageOk, setMessageOk] = useState<string | null>(null);

  function charger() {
    setChargement(true);
    listerMesRattachements()
      .then(setRattachements)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }

  useEffect(charger, []);

  async function valider() {
    if (!code.trim()) return;
    setErreur(null);
    setMessageOk(null);
    setEnCours(true);
    try {
      const r = await entrerCode(code.trim());
      setMessageOk(`"${r.matiere}" débloquée.`);
      setCode("");
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function activer(contenuId: string) {
    setErreur(null);
    try {
      await activerRattachement(contenuId);
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  return (
    <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
      <h2 className="font-display text-base font-semibold text-dj-texte">Entrer un code</h2>
      <p className="mt-1 text-xs text-dj-texte-muet">
        Un enseignant t'a donné un code ? Entre-le ici pour débloquer sa matière.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && valider()}
          placeholder="Ex : AB3CD9"
          maxLength={6}
          className="flex-1 rounded-xl border border-dj-bordure bg-dj-surface-haute px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.2em] text-dj-texte placeholder:text-dj-texte-muet"
        />
        <button
          onClick={valider}
          disabled={enCours || !code.trim()}
          className="rounded-full bg-dj-gradient px-5 py-3 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {enCours ? "…" : "Valider"}
        </button>
      </div>

      {messageOk && <p className="mt-3 animate-dj-fade-in-rapide text-sm text-dj-accent-1">{messageOk}</p>}
      {erreur && <p className="mt-3 animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>}

      {chargement && <Skeleton className="mt-4 h-14 rounded-xl border border-dj-bordure" />}

      {!chargement && rattachements.length > 0 && (
        <div className="mt-4 animate-dj-fade-in-rapide space-y-2 border-t border-dj-bordure pt-3">
          <p className="text-xs font-semibold text-dj-texte-muet">Mes matières débloquées</p>
          {rattachements.map((r) => (
            <div
              key={r.contenu_id}
              className="flex items-center justify-between rounded-xl border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm"
            >
              <span className="text-dj-texte">
                {r.surnom || r.matiere}
                <span className="text-dj-texte-muet"> · {r.enseignant_nom}</span>
              </span>
              {r.actif ? (
                <span className="text-xs font-semibold text-dj-accent-1">Active</span>
              ) : (
                <button
                  onClick={() => activer(r.contenu_id)}
                  className="text-xs font-medium text-dj-texte-muet transition-colors hover:text-dj-texte"
                >
                  Activer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
