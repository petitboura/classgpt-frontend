"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import {
  listerMesCodes,
  creerCode,
  modifierCode,
  activerCode,
  supprimerCode,
  listerProgrammes,
  type CodePartage,
  type Programme,
} from "@/lib/api";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";
import { CTACompteRequis } from "./CTACompteRequis";

/**
 * "Mes codes" (14/08/2026, demande Bourama -- remplace EspaceInviter /
 * EspaceEquipe / EspaceDiffuser dans l'onglet Bureau, qui géraient
 * l'ancien système "un code = une matière", jamais lu par le chat).
 *
 * Plusieurs codes possibles, pour ne pas mélanger "à qui j'envoie quoi"
 * -- chaque code peut porter, tous optionnels et combinables : un
 * comportement, un programme (référence vers un des miens), un partage
 * de bibliothèque (copie automatique à chaque ajout), un texte libre.
 * Vivant : modifier un champ met à jour ce que voient tous les
 * receveurs de ce code, pas besoin d'en générer un nouveau.
 */
export function MesCodes() {
  const [codes, setCodes] = useState<CodePartage[] | undefined>(undefined);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null); // id du code en édition
  const [creation, setCreation] = useState(false);
  const [copieOk, setCopieOk] = useState<string | null>(null);
  // Refonte "Mon espace = l'app" : section auparavant inatteignable sans
  // compte, même détection 401 que les autres.
  const [sansCompte, setSansCompte] = useState(false);

  function charger() {
    listerMesCodes()
      .then(setCodes)
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) {
          setSansCompte(true);
        } else {
          setErreur(messageErreur(e));
        }
      });
  }

  useEffect(() => {
    charger();
    listerProgrammes().then(setProgrammes).catch(() => setProgrammes([]));
  }, []);

  async function creerVide() {
    setErreur(null);
    try {
      const c = await creerCode({});
      setCodes((prec) => [...(prec || []), c]);
      setOuvert(c.id);
      setCreation(false);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function sauvegarder(codeId: string, patch: Parameters<typeof modifierCode>[1]) {
    setErreur(null);
    try {
      const maj = await modifierCode(codeId, patch);
      setCodes((prec) => (prec || []).map((c) => (c.id === codeId ? maj : c)));
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function toggleActif(c: CodePartage) {
    setErreur(null);
    try {
      const maj = await activerCode(c.id, !c.actif);
      setCodes((prec) => (prec || []).map((x) => (x.id === c.id ? maj : x)));
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function supprimer(codeId: string) {
    setErreur(null);
    try {
      await supprimerCode(codeId);
      setCodes((prec) => (prec || []).filter((c) => c.id !== codeId));
      if (ouvert === codeId) setOuvert(null);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  function copier(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopieOk(code);
      setTimeout(() => setCopieOk(null), 1500);
    });
  }

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour créer des codes de partage." />;
  }

  if (codes === undefined) {
    return (
      <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="mt-3 h-14 rounded-xl" />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-dj-texte">Mes codes</h2>
          <p className="mt-1 text-xs text-dj-texte-muet">
            Crée un code et partage-le : tous ceux qui l&apos;entrent reçoivent tout ce que tu y mets,
            comportement, programme, bibliothèque, texte. Modifiable après coup, tout le monde voit la mise à jour.
          </p>
        </div>
        <button
          onClick={creerVide}
          disabled={creation}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-cgpt-bouton bg-dj-accent-1 px-3 py-2 text-xs font-bold text-[#1A0D02] transition-colors hover:bg-dj-accent-2 disabled:opacity-50"
        >
          <Plus size={14} /> Nouveau code
        </button>
      </div>

      {erreur && <p className="mt-3 text-sm text-[#F87171]">{erreur}</p>}

      <div className="mt-4 space-y-2">
        {codes.length === 0 && (
          <p className="rounded-xl border border-dashed border-dj-bordure px-3 py-4 text-center text-xs text-dj-texte-muet">
            Aucun code pour l&apos;instant. Crée-en un pour partager quelque chose.
          </p>
        )}

        {codes.map((c) => {
          const estOuvert = ouvert === c.id;
          return (
            <div key={c.id} className="rounded-xl border border-dj-bordure bg-dj-surface-haute">
              <button
                onClick={() => setOuvert(estOuvert ? null : c.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={"h-1.5 w-1.5 flex-shrink-0 rounded-full " + (c.actif ? "bg-dj-accent-1" : "bg-dj-texte-muet")} />
                  <span className="truncate text-sm text-dj-texte">{c.nom || "Sans nom"}</span>
                  <span className="flex-shrink-0 rounded-md bg-dj-fond px-1.5 py-0.5 font-mono text-[11px] tracking-wider text-dj-texte-muet">
                    {c.code}
                  </span>
                </div>
                {estOuvert ? <ChevronUp size={16} className="flex-shrink-0 text-dj-texte-muet" /> : <ChevronDown size={16} className="flex-shrink-0 text-dj-texte-muet" />}
              </button>

              {estOuvert && (
                <div className="animate-dj-fade-in-rapide space-y-3 border-t border-dj-bordure px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copier(c.code)}
                      className="flex items-center gap-1 rounded-lg border border-dj-bordure px-2 py-1 text-xs text-dj-texte-muet transition-colors hover:text-dj-texte"
                    >
                      <Copy size={12} /> {copieOk === c.code ? "Copié !" : "Copier le code"}
                    </button>
                    <button
                      onClick={() => toggleActif(c)}
                      className={
                        "ml-auto rounded-lg px-2 py-1 text-xs font-semibold transition-colors " +
                        (c.actif ? "text-dj-texte-muet hover:text-dj-texte" : "text-dj-accent-1")
                      }
                    >
                      {c.actif ? "Désactiver" : "Réactiver"}
                    </button>
                    <button
                      onClick={() => supprimer(c.id)}
                      title="Supprimer ce code"
                      className="rounded-lg p-1.5 text-dj-texte-muet transition-colors hover:text-[#F87171]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <ChampNom c={c} onSauver={(nom) => sauvegarder(c.id, { nom })} />
                  <ChampComportement c={c} onSauver={(comportement_texte) => sauvegarder(c.id, { comportement_texte })} />
                  <ChampProgramme c={c} programmes={programmes} onSauver={(programme_id) => sauvegarder(c.id, { programme_id })} />
                  <ChampBibliotheque c={c} onSauver={(partage_bibliotheque) => sauvegarder(c.id, { partage_bibliotheque })} />
                  <ChampTexteLibre c={c} onSauver={(texte_libre) => sauvegarder(c.id, { texte_libre })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChampNom({ c, onSauver }: { c: CodePartage; onSauver: (v: string) => void }) {
  const [valeur, setValeur] = useState(c.nom || "");
  return (
    <div>
      <label className="text-xs font-semibold text-dj-texte-muet">Nom (pour toi, pas pour les receveurs)</label>
      <div className="mt-1 flex gap-1.5">
        <input
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="Ex : Mes CM2"
          className="flex-1 rounded-lg border border-dj-bordure bg-dj-surface px-2.5 py-1.5 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
        />
        {valeur !== (c.nom || "") && (
          <button onClick={() => onSauver(valeur)} className="rounded-lg bg-dj-accent-1 px-2.5 text-[#1A0D02]">
            <Check size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChampComportement({ c, onSauver }: { c: CodePartage; onSauver: (v: string) => void }) {
  const [valeur, setValeur] = useState(c.comportement_texte || "");
  return (
    <div>
      <label className="text-xs font-semibold text-dj-texte-muet">Comportement</label>
      <div className="mt-1 flex gap-1.5">
        <textarea
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="Ex : réponds toujours avec des exemples concrets"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-dj-bordure bg-dj-surface px-2.5 py-1.5 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
        />
        {valeur !== (c.comportement_texte || "") && (
          <button onClick={() => onSauver(valeur)} className="self-start rounded-lg bg-dj-accent-1 px-2.5 py-1.5 text-[#1A0D02]">
            <Check size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChampProgramme({
  c,
  programmes,
  onSauver,
}: {
  c: CodePartage;
  programmes: Programme[];
  onSauver: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-dj-texte-muet">Programme</label>
      <select
        value={c.programme_id || ""}
        onChange={(e) => onSauver(e.target.value || null)}
        className="mt-1 w-full rounded-lg border border-dj-bordure bg-dj-surface px-2.5 py-1.5 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
      >
        <option value="">Aucun</option>
        {programmes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom || p.niveau}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChampBibliotheque({ c, onSauver }: { c: CodePartage; onSauver: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-dj-texte">
      <input type="checkbox" checked={c.partage_bibliotheque} onChange={(e) => onSauver(e.target.checked)} className="h-4 w-4 accent-dj-accent-1" />
      Partager ma bibliothèque (chaque nouvel ajout est copié chez les receveurs)
    </label>
  );
}

function ChampTexteLibre({ c, onSauver }: { c: CodePartage; onSauver: (v: string) => void }) {
  const [valeur, setValeur] = useState(c.texte_libre || "");
  return (
    <div>
      <label className="text-xs font-semibold text-dj-texte-muet">Texte libre (une annonce)</label>
      <div className="mt-1 flex gap-1.5">
        <textarea
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="Ex : le contrôle est reporté à vendredi"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-dj-bordure bg-dj-surface px-2.5 py-1.5 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
        />
        {valeur !== (c.texte_libre || "") && (
          <button onClick={() => onSauver(valeur)} className="self-start rounded-lg bg-dj-accent-1 px-2.5 py-1.5 text-[#1A0D02]">
            <Check size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
