"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ecrireContenuMatiere, listerMesContenus, type ContenuMatiere } from "@/lib/api";
import { MATIERES } from "@/lib/matieres";
import { messageErreur } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";

/**
 * Bloc "Écrire une matière" de l'espace Clovis (réécrit le 09/08,
 * demande Bourama : plus de rôle enseignant/étudiant, plus de simple
 * bouton "générer un code" -- ici on écrit d'abord un contenu, le code
 * est généré en même temps que la première sauvegarde. Réutilise tel
 * quel /api/agents/nitrux/contenus-matiere (déjà construit et utilisé
 * par ailleurs via la page "L'IA de mes élèves" de djiguigne-frontend,
 * voir lib/api.ts:ecrireContenuMatiere).
 *
 * Chargement en squelette + apparitions en fondu (convention
 * animate-dj-fade-in-rapide déjà utilisée dans le reste du produit).
 */
export function EspaceInviter() {
  const [contenus, setContenus] = useState<ContenuMatiere[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [matiere, setMatiere] = useState<string>(MATIERES[0]);
  const [texte, setTexte] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [codeCopie, setCodeCopie] = useState<string | null>(null);

  function charger() {
    setChargement(true);
    listerMesContenus()
      .then(setContenus)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }

  useEffect(charger, []);

  const contenuExistant = contenus.find((c) => c.matiere === matiere) || null;

  useEffect(() => {
    setTexte(contenuExistant?.system_prompt ?? "");
  }, [matiere, contenuExistant?.system_prompt]);

  async function enregistrer() {
    if (!texte.trim()) return;
    setErreur(null);
    setEnCours(true);
    try {
      await ecrireContenuMatiere(matiere, texte.trim());
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function copier(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopie(code);
      setTimeout(() => setCodeCopie(null), 2000);
    } catch {
      // Pas grave si le presse-papier échoue -- le code reste affiché à
      // l'écran, copiable à la main.
    }
  }

  return (
    <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
      <h2 className="font-display text-base font-semibold text-dj-texte">Écrire une matière</h2>
      <p className="mt-1 text-xs text-dj-texte-muet">
        Choisis une matière et écris ce que l'IA doit savoir ou comment elle doit répondre. Un code se génère à
        l'enregistrement -- partage-le, il débloque exactement ce texte pour celui qui l'entre.
      </p>

      {chargement && <Skeleton className="mt-4 h-24 rounded-xl border border-dj-bordure" />}

      {erreur && <p className="mt-3 animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>}

      {!chargement && (
        <div className="mt-4 animate-dj-fade-in-rapide space-y-3">
          <select
            value={matiere}
            onChange={(e) => setMatiere(e.target.value)}
            className="w-full rounded-xl border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte"
          >
            {MATIERES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={5}
            placeholder="Ex : Concentre-toi sur le programme de terminale, donne toujours un exemple avant la théorie…"
            className="w-full resize-none rounded-xl border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte placeholder:text-dj-texte-muet"
          />

          <button
            onClick={enregistrer}
            disabled={enCours || !texte.trim()}
            className="rounded-full bg-dj-gradient px-5 py-2 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : contenuExistant ? "Mettre à jour" : "Enregistrer et générer le code"}
          </button>

          {contenuExistant && (
            <div className="flex items-center gap-2 pt-1">
              <span className="flex-1 rounded-xl border border-dj-bordure-forte bg-dj-surface-haute px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-dj-texte">
                {contenuExistant.code}
              </span>
              <button
                onClick={() => copier(contenuExistant.code)}
                className="flex items-center gap-1.5 rounded-full border border-dj-bordure px-4 py-3 text-xs font-medium text-dj-texte-muet transition-colors hover:text-dj-texte"
              >
                {codeCopie === contenuExistant.code ? <Check size={14} /> : <Copy size={14} />}
                {codeCopie === contenuExistant.code ? "Copié !" : "Copier"}
              </button>
            </div>
          )}

          {contenus.length > 0 && (
            <div className="border-t border-dj-bordure pt-3">
              <p className="text-xs font-semibold text-dj-texte-muet">Mes autres matières</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {contenus
                  .filter((c) => c.matiere !== matiere)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setMatiere(c.matiere)}
                      className="rounded-full border border-dj-bordure px-3 py-1.5 text-xs text-dj-texte-muet transition-colors hover:text-dj-texte"
                    >
                      {c.matiere} · {c.code}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
