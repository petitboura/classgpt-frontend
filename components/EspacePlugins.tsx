"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Download, Trophy, Check } from "lucide-react";
import { listerPlugins, telechargerPlugin, type Plugin } from "@/lib/api";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";
import { CTACompteRequis } from "./CTACompteRequis";

// Lot 5 (chantier programme étudiant) -- interface de recherche/téléchar-
// gement des plugins (espaces de classe exportés en bloc, voir Partie 1 du
// document source). Ne gère PAS le paiement des plugins payants (hors
// scope du lancement) -- `gratuit` est affiché à titre indicatif seulement.
//
// 2026-08-14 : fusion demandée par Bourama -- plus de sections "Rechercher"
// / "Les plus téléchargés" séparées. Une seule liste, toujours triée par
// téléchargements décroissant (classement de la mécanique de lancement :
// le plus téléchargé fait gagner un an de gratuité à son auteur), avec un
// champ de recherche libre intégré (recherche en direct, débounce 300ms)
// qui filtre sur nom + niveau + auteur sans changer le tri.
//
// Pas de mécanisme i18n disponible dans ce composant (vérifié 2026-08-14,
// aucun i18n branché sur ce fichier ni sur le reste de l'espace plugins) --
// textes en dur en français comme le reste du fichier, à signaler à
// Bourama si la traduction doit être ajoutée plus tard.
//
// Pas encore de point d'entrée dans la navigation : composant autonome,
// à brancher par Bourama où il le souhaite (menu, onglet dédié…).

const DELAI_DEBOUNCE_MS = 300;

export function EspacePlugins() {
  const [motCle, setMotCle] = useState("");
  const [plugins, setPlugins] = useState<Plugin[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const requeteEnCours = useRef(0);

  useEffect(() => {
    const idAppel = ++requeteEnCours.current;
    setChargement(true);
    setErreur(null);

    const minuteur = setTimeout(async () => {
      try {
        const r = await listerPlugins(motCle);
        if (idAppel === requeteEnCours.current) {
          setPlugins(r);
        }
      } catch (e) {
        if (idAppel === requeteEnCours.current) {
          setErreur(messageErreur(e));
          setPlugins([]);
        }
      } finally {
        if (idAppel === requeteEnCours.current) {
          setChargement(false);
        }
      }
    }, motCle.trim() ? DELAI_DEBOUNCE_MS : 0);

    return () => clearTimeout(minuteur);
  }, [motCle]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dj-texte-muet"
        />
        <input
          value={motCle}
          onChange={(e) => setMotCle(e.target.value)}
          placeholder="Rechercher un plugin par nom, niveau ou créateur…"
          className="w-full rounded-full border border-dj-bordure bg-dj-surface py-2.5 pl-10 pr-4 text-sm text-dj-texte outline-none transition-colors focus:border-dj-bordure-forte"
        />
      </div>

      <p className="text-xs text-dj-texte-muet">
        Le plugin le plus téléchargé fait gagner à son auteur un an de gratuité sur la version payante la moins
        chère.
      </p>

      {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

      {chargement && (
        <div className="flex flex-col gap-2 transition-opacity duration-200" aria-hidden>
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" />
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" style={{ animationDelay: "200ms" }} />
        </div>
      )}

      {!chargement && plugins?.length === 0 && !erreur && (
        <p className="text-sm text-dj-texte-muet">
          {motCle.trim() ? "Aucun plugin ne correspond à cette recherche." : "Aucun plugin publié pour l'instant."}
        </p>
      )}

      {!chargement && plugins && plugins.length > 0 && (
        <div className="flex flex-col gap-2 animate-dj-fade-in-rapide">
          {plugins.map((p, i) => (
            <LignePlugin key={p.id} plugin={p} rang={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function LignePlugin({ plugin, rang }: { plugin: Plugin; rang: number }) {
  const [confirmation, setConfirmation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [telecharge, setTelecharge] = useState(false);
  // Télécharger un plugin crée une copie dans "ton espace" -- lié à un
  // compte. La liste/recherche reste publique, seul ce clic est gaté
  // (refonte "Mon espace = l'app", même détection 401 que les autres
  // sections).
  const [sansCompte, setSansCompte] = useState(false);

  async function telecharger() {
    setEnvoi(true);
    setErreur(null);
    try {
      await telechargerPlugin(plugin.id);
      setTelecharge(true);
      setConfirmation(false);
    } catch (e) {
      if (e instanceof ErreurApi && e.statusCode === 401) {
        setSansCompte(true);
      } else {
        setErreur(messageErreur(e));
      }
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3 transition-colors">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex w-6 flex-shrink-0 items-center justify-center text-sm font-bold text-dj-texte-muet">
          {rang === 0 ? <Trophy size={16} className="text-dj-accent-1" /> : `#${rang + 1}`}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-dj-texte">{plugin.nom}</p>
          <p className="text-xs text-dj-texte-muet">
            {plugin.niveau} · {plugin.telechargements_count} téléchargement(s) · {plugin.gratuit ? "Gratuit" : "Payant"}
          </p>
          {erreur && <p className="mt-1 text-xs text-[#F87171]">{erreur}</p>}
        </div>
      </div>

      {sansCompte ? (
        <div className="w-full flex-shrink-0 sm:w-auto">
          <CTACompteRequis texte="Crée un compte pour télécharger ce plugin dans ton espace." />
        </div>
      ) : telecharge ? (
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
