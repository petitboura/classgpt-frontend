"use client";

import { useState } from "react";
import { rejoindreParCode, creerEtablissementRacine } from "@/lib/invitations";
import { messageErreur } from "@/lib/erreurs";

/**
 * Écran affiché à un compte qui n'a encore aucun rôle (voir /api/roles/moi
 * -> role: null). Autonome (part 4), pensé pour être branché soit
 * directement après l'inscription (part 2), soit ici en repli si la
 * personne arrive sans être passée par ce chemin.
 *
 * Deux entrées : un code reçu (cas normal, enseignant/élève) ou "je crée
 * un établissement" (cas racine, posé explicitement avec Bourama --
 * aucune invitation n'existe pour le tout premier compte d'une école).
 */
export function EspaceRejoindre({ onTermine }: { onTermine: () => void }) {
  const [mode, setMode] = useState<"choix" | "code" | "racine">("choix");
  const [code, setCode] = useState("");
  const [nomAffiche, setNomAffiche] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    if (!nomAffiche.trim() || (mode === "code" && !code.trim()) || enCours) return;
    setErreur(null);
    setEnCours(true);
    try {
      if (mode === "code") {
        await rejoindreParCode(code.trim(), nomAffiche.trim());
      } else {
        await creerEtablissementRacine(nomAffiche.trim());
      }
      onTermine();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm animate-dj-fade-in rounded-2xl border border-dj-bordure bg-dj-surface p-6 text-center">
      {mode === "choix" && (
        <div className="animate-dj-fade-in-rapide">
          <h1 className="font-display text-lg font-bold text-dj-texte">Bienvenue</h1>
          <p className="mt-1 text-sm text-dj-texte-muet">As-tu reçu un code ?</p>
          <button
            onClick={() => setMode("code")}
            className="mt-4 w-full rounded-full bg-dj-gradient px-5 py-2.5 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5"
          >
            J'ai un code
          </button>
          <button
            onClick={() => setMode("racine")}
            className="mt-2 w-full rounded-full border border-dj-bordure px-5 py-2.5 text-sm font-medium text-dj-texte-muet transition-colors hover:text-dj-texte"
          >
            Je crée un nouvel établissement
          </button>
        </div>
      )}

      {mode !== "choix" && (
        <div className="animate-dj-fade-in-rapide">
          <h1 className="font-display text-lg font-bold text-dj-texte">
            {mode === "code" ? "Entre ton code" : "Ton établissement"}
          </h1>

          {mode === "code" && (
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={6}
              className="mt-4 w-full rounded-xl border border-dj-bordure bg-dj-surface-haute px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-dj-texte outline-none focus:border-dj-accent-1"
            />
          )}

          <input
            value={nomAffiche}
            onChange={(e) => setNomAffiche(e.target.value)}
            placeholder={mode === "code" ? "Ton nom" : "Nom de l'établissement"}
            className="mt-3 w-full rounded-xl border border-dj-bordure bg-dj-surface-haute px-4 py-2.5 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
          />

          {erreur && <p className="mt-2 animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>}

          <button
            onClick={valider}
            disabled={enCours || !nomAffiche.trim() || (mode === "code" && !code.trim())}
            className="mt-4 w-full rounded-full bg-dj-gradient px-5 py-2.5 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {enCours ? "Un instant…" : "Continuer"}
          </button>
          <button
            onClick={() => setMode("choix")}
            className="mt-2 text-xs text-dj-texte-muet transition-colors hover:text-dj-texte"
          >
            ← Retour
          </button>
        </div>
      )}
    </section>
  );
}
