"use client";

import { useEffect, useState } from "react";
import { Search, Download, Trophy, Check } from "lucide-react";
import { rechercherPlugins, classementPlugins, telechargerPlugin, type Plugin } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";

// Lot 5 (chantier programme étudiant) -- interface de recherche/téléchar-
// gement des plugins (espaces de classe exportés en bloc, voir Partie 1 du
// document source) et classement des plus téléchargés (mécanique de
// lancement : le plus téléchargé fait gagner un an de gratuité à son
// auteur). Ne gère PAS le paiement des plugins payants (hors scope du
// lancement) -- `gratuit` est affiché à titre indicatif seulement.
//
// Pas encore de point d'entrée dans la navigation : composant autonome,
// à brancher par Bourama où il le souhaite (menu, onglet dédié…).

type SousOnglet = "recherche" | "classement";

export function EspacePlugins() {
  const [sousOnglet, setSousOnglet] = useState<SousOnglet>("recherche");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 text-xs">
        <button
          onClick={() => setSousOnglet("recherche")}
          className={
            "rounded-full px-3 py-1.5 font-semibold transition-colors " +
            (sousOnglet === "recherche" ? "bg-dj-surface-haute text-dj-texte" : "text-dj-texte-muet hover:text-dj-texte")
          }
        >
          Rechercher
        </button>
        <button
          onClick={() => setSousOnglet("classement")}
          className={
            "rounded-full px-3 py-1.5 font-semibold transition-colors " +
            (sousOnglet === "classement" ? "bg-dj-surface-haute text-dj-texte" : "text-dj-texte-muet hover:text-dj-texte")
          }
        >
          Les plus téléchargés
        </button>
      </div>

      {sousOnglet === "recherche" ? <SectionRecherche /> : <SectionClassement />}
    </div>
  );
}

function LignePlugin({ plugin, onTelecharge }: { plugin: Plugin; onTelecharge: (p: Plugin) => void }) {
  const [confirmation, setConfirmation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [telecharge, setTelecharge] = useState(false);

  async function telecharger() {
    setEnvoi(true);
    setErreur(null);
    try {
      await telechargerPlugin(plugin.id);
      setTelecharge(true);
      setConfirmation(false);
      onTelecharge(plugin);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-dj-texte">{plugin.nom}</p>
        <p className="text-xs text-dj-texte-muet">
          {plugin.niveau} · {plugin.telechargements_count} téléchargement(s) · {plugin.gratuit ? "Gratuit" : "Payant"}
        </p>
        {erreur && <p className="mt-1 text-xs text-[#F87171]">{erreur}</p>}
      </div>

      {telecharge ? (
        <span className="flex flex-shrink-0 items-center gap-1.5 text-sm text-dj-succes">
          <Check size={14} /> Téléchargé
        </span>
      ) : confirmation ? (
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="text-xs text-dj-texte-muet">Créer une copie dans ton espace ?</span>
          <button
            onClick={telecharger}
            disabled={envoi}
            className="rounded-full bg-dj-gradient px-3 py-1.5 text-xs font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {envoi ? "…" : "Confirmer"}
          </button>
          <button
            onClick={() => setConfirmation(false)}
            disabled={envoi}
            className="text-xs text-dj-texte-muet hover:text-dj-texte"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmation(true)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-dj-bordure px-3 py-1.5 text-xs text-dj-texte transition-colors hover:border-dj-bordure-forte"
        >
          <Download size={13} /> Télécharger
        </button>
      )}
    </div>
  );
}

function SectionRecherche() {
  const [niveau, setNiveau] = useState("");
  const [auteur, setAuteur] = useState("");
  const [resultats, setResultats] = useState<Plugin[] | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aDejaCherche, setADejaCherche] = useState(false);

  async function lancerRecherche() {
    setRecherche(true);
    setErreur(null);
    try {
      const r = await rechercherPlugins({ niveau: niveau.trim() || undefined, auteur: auteur.trim() || undefined });
      setResultats(r);
      setADejaCherche(true);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setRecherche(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-2xl border border-dj-bordure bg-dj-surface p-4 sm:flex-row sm:items-center">
        <input
          value={niveau}
          onChange={(e) => setNiveau(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lancerRecherche()}
          placeholder="Niveau / classe"
          className="flex-1 rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
        />
        <input
          value={auteur}
          onChange={(e) => setAuteur(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lancerRecherche()}
          placeholder="Nom du créateur"
          className="flex-1 rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
        />
        <button
          onClick={lancerRecherche}
          disabled={recherche || (!niveau.trim() && !auteur.trim())}
          className="flex flex-shrink-0 items-center gap-1.5 self-end rounded-full bg-dj-gradient px-5 py-2 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50 sm:self-auto"
        >
          <Search size={14} /> {recherche ? "Recherche…" : "Rechercher"}
        </button>
      </div>

      {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

      {recherche && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" />
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
        </div>
      )}
      {!recherche && aDejaCherche && resultats?.length === 0 && (
        <p className="text-sm text-dj-texte-muet">Aucun plugin trouvé.</p>
      )}
      {!recherche && resultats && resultats.length > 0 && (
        <div className="flex flex-col gap-2">
          {resultats.map((p) => (
            <LignePlugin key={p.id} plugin={p} onTelecharge={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionClassement() {
  const [plugins, setPlugins] = useState<Plugin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    classementPlugins()
      .then(setPlugins)
      .catch((e) => {
        setErreur(messageErreur(e));
        setPlugins([]);
      });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-dj-texte-muet">
        Le plugin le plus téléchargé fait gagner à son auteur un an de gratuité sur la version payante la moins
        chère.
      </p>

      {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

      {plugins === null && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" />
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
        </div>
      )}
      {plugins?.length === 0 && !erreur && <p className="text-sm text-dj-texte-muet">Aucun plugin publié pour l&apos;instant.</p>}
      {plugins && plugins.length > 0 && (
        <div className="flex flex-col gap-2">
          {plugins.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3"
            >
              <span className="flex w-6 flex-shrink-0 items-center justify-center text-sm font-bold text-dj-texte-muet">
                {i === 0 ? <Trophy size={16} className="text-dj-accent-1" /> : `#${i + 1}`}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-dj-texte">{p.nom}</p>
                <p className="text-xs text-dj-texte-muet">
                  {p.niveau} · {p.telechargements_count} téléchargement(s)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
