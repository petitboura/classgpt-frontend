"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, X, Check, Sparkles, ChevronRight } from "lucide-react";
import { lireMesComportements, ajouterComportement, modifierComportement, supprimerComportement, type Comportement } from "@/lib/api";
import { ecouterDonneesModifiees } from "@/lib/evenementsDonnees";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { CTACompteRequis } from "@/components/CTACompteRequis";
import { ComportementsRecus } from "@/components/ComportementsRecus";
import { PanneauFlottant } from "@/components/PanneauFlottant";
import { Skeleton } from "./Skeleton";

// Section "Mes comportements" (06/08/2026, demande Bourama : "on peut en
// mettre plusieurs hein, pas juste un") : PLUSIEURS instructions perso
// écrites par l'étudiant, chacune ajoutée EN PLUS du system_prompt déjà
// résolu (généraliste, matière d'un enseignant, ou "Sans enseignant") --
// jamais un remplacement, voir core/main.py::_construire_system_prompt.
//
// Refonte visuelle (16/08/2026, demande Bourama : la section "doit être
// plus sérieuse") : ce composant vivait à l'origine dans l'ancienne
// sidebar de chat (SidebarChat.tsx, aujourd'hui disparue) et avait gardé
// son style panneau compact (texte minuscule, simple point coloré par
// ligne) même après être devenu une vraie page à part entière
// (app/(app)/comportements/page.tsx, refonte "Mon espace = l'app" du
// 15/08). Aligné ici sur le même langage visuel que les autres sections
// (voir EspaceBibliotheque.tsx) : cartes bordées, texte en taille
// normale, formulaire d'ajout en encart, CTA compte partagé
// (CTACompteRequis) au lieu d'une version dupliquée sur mesure.
//
// Ouvert aux visiteurs sans compte depuis le 09/08 (la barre latérale
// entière l'est désormais, décision Bourama : "tout est visible, la
// seule différence c'est que ça demande un compte au clic") : cette
// section est en revanche intrinsèquement liée à un compte (instructions
// perso PAR utilisateur) -- même la lecture initiale exige une session
// côté backend. Un visiteur sans session voit donc un CTA "Crée un
// compte" à la place de la liste, pas une liste vide silencieuse.
//
// Édition plein écran par élément (07/08/2026, demande Bourama : "je
// parle pas de la section, je parle de chaque élément de la liste --
// chaque élément qui peut s'agrandir, est cliquable pour l'ouvrir et
// bien l'éditer") : cliquer sur un comportement existant ouvre CET
// élément précis dans un espace dédié plein écran (grand champ de
// texte, Enregistrer, Supprimer).
//
// 18/08/2026, demande Bourama ("rends-le sérieux, en fait un vrai
// skill quoi") : la barre rapide d'ajout (petit input + bouton
// "Ajouter" au fil de l'eau) est supprimée. La création passe désormais
// UNIQUEMENT par le même panneau plein écran que l'édition -- texte +
// nom (choisi ou "Auto") ensemble, dès la création, plutôt qu'un ajout
// à la va-vite sans nom suivi d'une édition séparée pour en mettre un.

export function MesComportements({ agentId }: { agentId: string }) {
  const [liste, setListe] = useState<Comportement[] | undefined>(undefined);

  // Panneau plein écran : soit édition d'un comportement existant, soit
  // création d'un nouveau (07/08/2026, demande Bourama : "le mode plein
  // écran ne doit pas être dispo que pour ceux qui existent -- en mode
  // édition [ajout] il faut aussi un truc à côté de la ligne de champ").
  // Depuis le 18/08 (voir plus haut), c'est le SEUL chemin de création,
  // plus de raccourci en parallèle.
  const [panneau, setPanneau] = useState<{ type: "edition"; c: Comportement } | { type: "creation" } | null>(null);
  const [texteOuvert, setTexteOuvert] = useState("");
  // Nom d'affichage (18/08/2026, demande Bourama) : soit choisi par
  // l'étudiant, soit "Auto" (généré côté serveur avec le skill, même
  // appel LLM, aucun coût en plus). Seul endroit de création/édition
  // depuis la suppression de la barre rapide -- voir plus haut.
  const [nomOuvert, setNomOuvert] = useState("");
  const [nomAuto, setNomAuto] = useState(true);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [erreurOuvert, setErreurOuvert] = useState<string | null>(null);
  const [sansCompte, setSansCompte] = useState(false);

  function charger() {
    lireMesComportements(agentId)
      .then(setListe)
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) {
          setSansCompte(true);
          setListe([]);
        } else {
          setListe([]);
        }
      });
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // 15/08 (demande Bourama : "quand l'IA crée un comportement on ne le
  // voit pas") : l'IA peut créer/modifier/supprimer un comportement
  // elle-même depuis le chat (ajouter_comportement, etc.) -- ce panneau
  // ne rechargeait avant que sur montage. Voir lib/evenementsDonnees.ts.
  useEffect(() => ecouterDonneesModifiees("comportements", charger), [agentId]);

  function ouvrirEdition(c: Comportement) {
    setPanneau({ type: "edition", c });
    setTexteOuvert(c.texte);
    setNomOuvert(c.nom || "");
    setNomAuto(false); // un comportement existant a déjà un nom -> édition manuelle par défaut
    setErreurOuvert(null);
  }

  function ouvrirCreation() {
    setPanneau({ type: "creation" });
    setTexteOuvert("");
    setNomOuvert("");
    setNomAuto(true);
    setErreurOuvert(null);
  }

  function fermer() {
    if (enregistrementEnCours || suppressionEnCours) return;
    setPanneau(null);
  }

  async function enregistrer() {
    if (!panneau) return;
    const texte = texteOuvert.trim();
    if (!texte) return;

    const nom = nomAuto ? null : nomOuvert.trim() || null;

    if (panneau.type === "creation") {
      setEnregistrementEnCours(true);
      setErreurOuvert(null);
      try {
        const cree = await ajouterComportement(agentId, texte, nom);
        setListe((prec) => [...(prec || []), cree]);
        setPanneau(null);
      } catch (e) {
        setErreurOuvert(messageErreur(e));
      } finally {
        setEnregistrementEnCours(false);
      }
      return;
    }

    if (texte === panneau.c.texte && nom === (panneau.c.nom || null)) {
      setPanneau(null);
      return;
    }
    setEnregistrementEnCours(true);
    setErreurOuvert(null);
    try {
      const maj = await modifierComportement(agentId, panneau.c.id, texte, nom);
      setListe((prec) => (prec || []).map((c) => (c.id === panneau.c.id ? maj : c)));
      setPanneau(null);
    } catch (e) {
      setErreurOuvert(messageErreur(e));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function supprimer() {
    if (!panneau || panneau.type !== "edition") return;
    setSuppressionEnCours(true);
    setErreurOuvert(null);
    try {
      await supprimerComportement(agentId, panneau.c.id);
      setListe((prec) => (prec || []).filter((c) => c.id !== panneau.c.id));
      setPanneau(null);
    } catch (e) {
      setErreurOuvert(messageErreur(e));
      setSuppressionEnCours(false);
    }
  }

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour ajouter tes propres consignes perso à Clovis." />;
  }

  if (liste === undefined) {
    return (
      <div className="flex flex-col gap-2" aria-hidden>
        <Skeleton className="h-14 rounded-xl border border-dj-bordure" />
        <Skeleton className="h-14 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
      </div>
    );
  }

  return (
    <div className="flex animate-dj-fade-in-rapide flex-col gap-4">
      <p className="text-sm text-dj-texte-muet">
        Tes consignes perso pour Clovis, en plus de ce que ton enseignant a déjà mis en place. Tu peux en ajouter
        plusieurs, clique sur l&apos;une d&apos;elles pour l&apos;ouvrir en grand et la modifier tranquillement.
      </p>

      <button
        onClick={ouvrirCreation}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dj-bordure bg-dj-surface px-4 py-3 text-sm font-semibold text-dj-texte transition-colors hover:border-dj-bordure-forte hover:bg-dj-surface-haute"
      >
        <Plus size={16} />
        Nouveau comportement
      </button>

      {liste.length === 0 && <p className="text-sm text-dj-texte-muet">Rien ici pour l&apos;instant.</p>}

      {liste.length > 0 && (
        <div className="flex flex-col gap-2">
          {liste.map((c) => (
            <button
              key={c.id}
              onClick={() => ouvrirEdition(c)}
              title="Ouvrir et modifier"
              className="group flex items-center gap-3 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3 text-left transition-colors hover:border-dj-bordure-forte hover:bg-dj-surface-haute"
            >
              <Sparkles size={16} className="flex-shrink-0 text-dj-accent-1" />
              <span className="min-w-0 flex-1 line-clamp-2 text-sm leading-relaxed text-dj-texte">
                {c.nom || c.description}
              </span>
              <ChevronRight
                size={16}
                className="flex-shrink-0 text-dj-texte-muet opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          ))}
        </div>
      )}

      <ComportementsRecus />

      {panneau && (
        <PanneauFlottant
          onFerme={enregistrementEnCours || suppressionEnCours ? undefined : fermer}
          entete={
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-dj-texte">
                {panneau.type === "creation" ? "Nouveau comportement" : "Modifier ce comportement"}
              </span>
              <button
                onClick={fermer}
                disabled={enregistrementEnCours || suppressionEnCours}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-dj-texte-muet transition-colors hover:bg-dj-surface-haute disabled:opacity-50"
              >
                <X size={14} /> Fermer
              </button>
            </div>
          }
        >
          <div className="flex w-full flex-col gap-1.5 pb-3 sm:flex-row sm:items-center">
            <input
              value={nomAuto ? "" : nomOuvert}
              onChange={(e) => setNomOuvert(e.target.value)}
              disabled={nomAuto}
              placeholder={nomAuto ? "Nom généré automatiquement" : "Ex : Réponses en langage simple"}
              className="flex-1 rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-1.5 text-sm text-dj-texte outline-none focus:border-dj-accent-1 disabled:opacity-50"
            />
            <label className="flex flex-shrink-0 items-center gap-1.5 text-xs text-dj-texte-muet">
              <input
                type="checkbox"
                checked={nomAuto}
                onChange={(e) => setNomAuto(e.target.checked)}
                className="accent-dj-accent-1"
              />
              Auto
            </label>
          </div>

          <textarea
            autoFocus
            value={texteOuvert}
            onChange={(e) => setTexteOuvert(e.target.value)}
            placeholder="Ex : réponds-moi toujours en langage simple"
            rows={10}
            className="w-full flex-1 resize-none rounded-xl border border-dj-bordure bg-dj-surface-haute px-4 py-3 text-base text-dj-texte outline-none focus:border-dj-accent-1"
          />

          <div className="flex w-full flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {erreurOuvert ? (
              <p className="text-xs text-[var(--dj-erreur)]">{erreurOuvert}</p>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex items-center gap-2">
              {panneau.type === "edition" && (
                <button
                  onClick={supprimer}
                  disabled={enregistrementEnCours || suppressionEnCours}
                  className="flex items-center gap-1.5 rounded-lg border border-dj-bordure px-3 py-2 text-sm text-[var(--dj-erreur)] transition-colors hover:bg-[var(--dj-erreur)]/10 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
              <button
                onClick={enregistrer}
                disabled={enregistrementEnCours || suppressionEnCours || !texteOuvert.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-dj-accent-1 px-4 py-2 text-sm font-semibold text-[#1A0D02] transition-colors hover:bg-dj-accent-2 disabled:opacity-50"
              >
                <Check size={14} />{" "}
                {enregistrementEnCours ? "Enregistrement…" : panneau.type === "creation" ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </div>
        </PanneauFlottant>
      )}
    </div>
  );
}
