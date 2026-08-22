"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Link as IconLien,
  Table as IconTable,
  List as IconListe,
  Calendar as IconCalendrier,
  Columns as IconKanban,
  Brain,
  Menu,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  listerPagesRacines,
  listerSousPages,
  creerPage,
  obtenirPage,
  modifierPage,
  supprimerPage,
  creerBloc,
  modifierBloc,
  supprimerBloc,
  listerCarrefour,
  ajouterCarrefour,
  supprimerCarrefour,
  creerBaseDonnees,
  obtenirBaseDonnees,
  creerProprieteBase,
  creerElementBase,
  modifierElementBase,
  supprimerElementBase,
  listerRevisionsDues,
  repondreRevision,
  type PageEspace,
  type PageDetail,
  type BlocEspace,
  type ReferenceCarrefour,
  type BaseDonneesDetail,
  type ProprieteBase,
  type ElementBase,
} from "@/lib/api";
import { ErreurApi } from "@/lib/erreurs";
import { CTACompteRequis } from "./CTACompteRequis";
import { Skeleton } from "./Skeleton";

// Section "Notion-like" -- Partie 1/2 de la refonte "vraiment comme
// Notion" (21/08/2026, demande explicite de Bourama, deux fois répétée
// après frustration : "tout"). Ajoute, PAR RAPPORT À LA REFONTE VISUELLE
// PRÉCÉDENTE (qui ne changeait rien à part l'affichage) :
//   - "/" : menu de conversion de type sur un bloc vide (tape "/" en
//     début de bloc), + Entrée crée un nouveau bloc juste après (pas de
//     document unique éditable comme Notion en interne -- notre modèle
//     reste "un bloc = une ligne en base", donc "/" convertit le bloc
//     courant plutôt que d'insérer au milieu d'un texte continu)
//   - mise en forme inline : **gras**, *italique*, __souligné__, `code`
//     -- syntaxe maison légère (pas de nouvelle dépendance npm), barre
//     flottante au survol d'une sélection de texte
//   - glisser-déposer : blocs (dans une page) et pages (mêmes parents
//     seulement -- pas de déplacement vers un autre parent par glisser)
//   - icône emoji de page (colonne `icone`, migration
//     2026_08_21_pages_icone.sql -- à exécuter côté Supabase avant que
//     ça fonctionne)
//   - vraie grille de calendrier (mois, navigation) au lieu d'une liste
//   - filtres + tri sur les vues tableau/liste/kanban
// Partie 2 (pas fait ici) : blocs image/vidéo/fichier/embed,
// imbrication bloc-dans-bloc, recherche globale, liens @/[[ ]],
// propriétés avancées de base de données (relation/rollup/formule).
// Bug corrigé au passage (api/pages_notion.py) : "base_donnees" manquait
// de la liste de types validés côté REST, rétrogradé en "texte".

const TYPES_BLOCS: { id: string; label: string }[] = [
  { id: "texte", label: "Texte" },
  { id: "titre", label: "Titre" },
  { id: "liste_puces", label: "Liste à puces" },
  { id: "liste_numerotee", label: "Liste numérotée" },
  { id: "case_a_cocher", label: "Case à cocher" },
  { id: "citation", label: "Citation" },
  { id: "separateur", label: "Séparateur" },
  { id: "equation", label: "Équation (LaTeX)" },
  { id: "base_donnees", label: "Base de données" },
];

const EMOJIS_COURANTS = [
  "📄", "📝", "📚", "🎓", "🧠", "💡", "📌", "✅",
  "🗂️", "🔬", "🧮", "🌍", "🎯", "⭐", "🔥", "📖",
  "🧪", "🖊️", "📅", "🏆", "💻", "🔑", "🚀", "❤️",
];

export function EspaceNotes() {
  const [racines, setRacines] = useState<PageEspace[] | null>(null);
  const [sansCompte, setSansCompte] = useState(false);
  const [pageActiveId, setPageActiveId] = useState<string | null>(null);
  const [ongletDroit, setOngletDroit] = useState<"page" | "revision">("page");
  const [enfants, setEnfants] = useState<Record<string, PageEspace[]>>({});
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});
  const [sidebarMobileOuverte, setSidebarMobileOuverte] = useState(false);

  useEffect(() => {
    chargerRacines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chargerRacines() {
    listerPagesRacines()
      .then((r) => {
        setRacines(r);
        setPageActiveId((prev) => prev ?? (r.length > 0 ? r[0].id : null));
      })
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) setSansCompte(true);
        setRacines([]);
      });
  }

  function chargerEnfants(pageId: string) {
    listerSousPages(pageId).then((r) => setEnfants((prev) => ({ ...prev, [pageId]: r })));
  }

  function basculerNoeud(pageId: string) {
    setOuverts((prev) => {
      const ouvertMaintenant = !prev[pageId];
      if (ouvertMaintenant && !enfants[pageId]) chargerEnfants(pageId);
      return { ...prev, [pageId]: ouvertMaintenant };
    });
  }

  function rafraichirNoeud(parentId: string | null) {
    if (parentId === null) {
      chargerRacines();
      return;
    }
    chargerEnfants(parentId);
    setOuverts((prev) => ({ ...prev, [parentId]: true }));
  }

  // Patch générique d'une page dans l'arbre (titre et/ou icône), sans
  // tout recharger -- reflet immédiat sidebar <-> canevas.
  function patcherPageDansArbre(pageId: string, champs: Partial<PageEspace>) {
    setRacines((prev) => prev?.map((p) => (p.id === pageId ? { ...p, ...champs } : p)) ?? prev);
    setEnfants((prev) => {
      const copie: Record<string, PageEspace[]> = {};
      for (const cle of Object.keys(prev)) copie[cle] = prev[cle].map((p) => (p.id === pageId ? { ...p, ...champs } : p));
      return copie;
    });
  }

  // Glisser-déposer entre pages de MÊME parent (racines entre elles, ou
  // sous-pages d'une même page entre elles). Pas de changement de
  // parent par glisser -- hors scope de cette partie.
  async function reordonnerFreres(parentId: string | null, depuisId: string, versId: string) {
    const liste = parentId === null ? racines : enfants[parentId];
    if (!liste) return;
    const ids = liste.map((p) => p.id);
    const depuisIndex = ids.indexOf(depuisId);
    const versIndex = ids.indexOf(versId);
    if (depuisIndex === -1 || versIndex === -1 || depuisIndex === versIndex) return;
    const nouveauxIds = [...ids];
    const [retire] = nouveauxIds.splice(depuisIndex, 1);
    nouveauxIds.splice(versIndex, 0, retire);
    const parId = new Map(liste.map((p) => [p.id, p]));
    const nouvelleListe = nouveauxIds.map((id, i) => ({ ...parId.get(id)!, ordre: i }));
    if (parentId === null) setRacines(nouvelleListe);
    else setEnfants((prev) => ({ ...prev, [parentId]: nouvelleListe }));
    await Promise.all(
      nouveauxIds.map((id, i) => (parId.get(id)!.ordre === i ? null : modifierPage(id, { ordre: i })))
        .filter((p): p is Promise<PageEspace> => p !== null)
    );
  }

  function naviguer(id: string) {
    setPageActiveId(id);
    setOngletDroit("page");
    setSidebarMobileOuverte(false);
  }

  async function creerPageRacine() {
    const page = await creerPage("Nouvelle page");
    setRacines((prev) => [...(prev ?? []), page]);
    naviguer(page.id);
  }

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour organiser tes pages, fiches de révision et tâches dans Clovis." />;
  }

  return (
    <div className="flex h-full min-h-0">
      {sidebarMobileOuverte && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarMobileOuverte(false)}
          aria-hidden="true"
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 md:static md:z-auto ${sidebarMobileOuverte ? "flex" : "hidden"} md:flex`}>
        <SidebarArbre
          racines={racines}
          pageActiveId={ongletDroit === "page" ? pageActiveId : null}
          revisionActive={ongletDroit === "revision"}
          onNaviguer={naviguer}
          onRevision={() => {
            setOngletDroit("revision");
            setSidebarMobileOuverte(false);
          }}
          onCreerRacine={creerPageRacine}
          enfants={enfants}
          ouverts={ouverts}
          onBasculer={basculerNoeud}
          onReordonnerFreres={reordonnerFreres}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 pb-1 pl-12 pt-3 md:hidden">
          <button
            onClick={() => setSidebarMobileOuverte(true)}
            aria-label="Ouvrir les pages"
            className="flex h-8 w-8 items-center justify-center rounded-md text-dj-texte-muet hover:bg-dj-surface-haute"
          >
            <Menu size={16} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-4 md:px-14 md:pt-12">
          {ongletDroit === "revision" ? (
            <PanneauRevision />
          ) : pageActiveId ? (
            <PanneauPage
              key={pageActiveId}
              pageId={pageActiveId}
              onNaviguer={naviguer}
              onSupprimee={(parentId) => {
                rafraichirNoeud(parentId);
                setPageActiveId(null);
              }}
              onArbreChange={rafraichirNoeud}
              onPageChange={patcherPageDansArbre}
              onReordonnerFreres={reordonnerFreres}
            />
          ) : (
            <p className="text-sm text-dj-texte-muet">Crée une page pour commencer.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Sidebar façon Notion -- arbre de pages, dépliable, chargement paresseux
// des sous-pages, glisser-déposer entre pages de même parent.
// ---------------------------------------------------------------------

function SidebarArbre({
  racines,
  pageActiveId,
  revisionActive,
  onNaviguer,
  onRevision,
  onCreerRacine,
  enfants,
  ouverts,
  onBasculer,
  onReordonnerFreres,
}: {
  racines: PageEspace[] | null;
  pageActiveId: string | null;
  revisionActive: boolean;
  onNaviguer: (id: string) => void;
  onRevision: () => void;
  onCreerRacine: () => void;
  enfants: Record<string, PageEspace[]>;
  ouverts: Record<string, boolean>;
  onBasculer: (id: string) => void;
  onReordonnerFreres: (parentId: string | null, depuisId: string, versId: string) => void;
}) {
  return (
    <nav className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-dj-bordure bg-dj-fond px-2 py-4">
      <button
        onClick={onRevision}
        className={`mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
          revisionActive ? "bg-dj-accent-1/15 text-dj-accent-2" : "text-dj-texte hover:bg-dj-surface-haute"
        }`}
      >
        <Brain size={14} /> À réviser
      </button>

      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-dj-texte-muet">Pages</p>

      <div className="flex-1 space-y-0.5">
        {racines === null ? (
          <div className="space-y-1.5 px-2 py-1">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        ) : racines.length === 0 ? (
          <p className="px-2 py-1 text-xs text-dj-texte-muet">Aucune page.</p>
        ) : (
          racines.map((p) => (
            <NoeudArbre
              key={p.id}
              page={p}
              profondeur={0}
              pageActiveId={pageActiveId}
              onNaviguer={onNaviguer}
              enfants={enfants}
              ouverts={ouverts}
              onBasculer={onBasculer}
              onReordonnerFreres={onReordonnerFreres}
            />
          ))
        )}
      </div>

      <button
        onClick={onCreerRacine}
        className="mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-accent-2"
      >
        <Plus size={13} /> Nouvelle page
      </button>
    </nav>
  );
}

function NoeudArbre({
  page,
  profondeur,
  pageActiveId,
  onNaviguer,
  enfants,
  ouverts,
  onBasculer,
  onReordonnerFreres,
}: {
  page: PageEspace;
  profondeur: number;
  pageActiveId: string | null;
  onNaviguer: (id: string) => void;
  enfants: Record<string, PageEspace[]>;
  ouverts: Record<string, boolean>;
  onBasculer: (id: string) => void;
  onReordonnerFreres: (parentId: string | null, depuisId: string, versId: string) => void;
}) {
  const ouvert = ouverts[page.id] ?? false;
  const listeEnfants = enfants[page.id];
  const actif = pageActiveId === page.id;

  return (
    <div>
      <div
        onClick={() => onNaviguer(page.id)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", page.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const idSource = e.dataTransfer.getData("text/plain");
          if (idSource && idSource !== page.id) onReordonnerFreres(page.parent_id, idSource, page.id);
        }}
        style={{ paddingLeft: 4 + profondeur * 14 }}
        className={`group flex cursor-pointer items-center gap-1 rounded-md py-1 pr-2 text-sm transition-colors ${
          actif ? "bg-dj-accent-1/15 text-dj-accent-2" : "text-dj-texte hover:bg-dj-surface-haute"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBasculer(page.id);
          }}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-dj-texte-muet"
          aria-label={ouvert ? "Replier" : "Déplier"}
        >
          {ouvert ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {page.icone ? (
          <span className="w-[13px] shrink-0 text-center text-[13px] leading-none">{page.icone}</span>
        ) : (
          <FileText size={13} className="shrink-0 text-dj-texte-muet" />
        )}
        <span className="truncate">{page.titre || "Sans titre"}</span>
      </div>
      {ouvert && (
        <div>
          {listeEnfants === undefined ? (
            <div style={{ paddingLeft: 4 + (profondeur + 1) * 14 }} className="py-1">
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ) : (
            listeEnfants.map((enfant) => (
              <NoeudArbre
                key={enfant.id}
                page={enfant}
                profondeur={profondeur + 1}
                pageActiveId={pageActiveId}
                onNaviguer={onNaviguer}
                enfants={enfants}
                ouverts={ouverts}
                onBasculer={onBasculer}
                onReordonnerFreres={onReordonnerFreres}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Sélecteur d'icône emoji de page
// ---------------------------------------------------------------------

function SelecteurIcone({ icone, onChoisir }: { icone: string | null; onChoisir: (e: string | null) => void }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOuvert((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-2xl hover:bg-dj-surface-haute"
        title="Changer l'icône"
      >
        {icone || <FileText size={22} className="text-dj-texte-muet" />}
      </button>
      {ouvert && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-dj-bordure bg-dj-surface p-2 shadow-lg">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS_COURANTS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onChoisir(e);
                  setOuvert(false);
                }}
                className="flex h-6 w-6 items-center justify-center rounded text-base hover:bg-dj-surface-haute"
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-dj-bordure pt-2">
            <input
              maxLength={4}
              placeholder="Autre emoji puis Entrée…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  onChoisir(e.currentTarget.value.trim());
                  setOuvert(false);
                }
              }}
              className="w-full rounded border border-dj-bordure bg-dj-surface px-1.5 py-1 text-xs outline-none"
            />
          </div>
          {icone && (
            <button
              onClick={() => {
                onChoisir(null);
                setOuvert(false);
              }}
              className="mt-1.5 w-full rounded-md px-1.5 py-1 text-left text-[11px] text-dj-texte-muet hover:bg-dj-surface-haute"
            >
              Retirer l'icône
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Panneau d'une page (icône, titre, blocs, sous-pages, carrefour)
// ---------------------------------------------------------------------

function PanneauPage({
  pageId,
  onNaviguer,
  onSupprimee,
  onArbreChange,
  onPageChange,
  onReordonnerFreres,
}: {
  pageId: string;
  onNaviguer: (id: string) => void;
  onSupprimee: (parentId: string | null) => void;
  onArbreChange: (parentId: string | null) => void;
  onPageChange: (pageId: string, champs: Partial<PageEspace>) => void;
  onReordonnerFreres: (parentId: string | null, depuisId: string, versId: string) => void;
}) {
  const [page, setPage] = useState<PageDetail | null>(null);
  const [titreEnEdition, setTitreEnEdition] = useState("");
  const [menuAjoutOuvert, setMenuAjoutOuvert] = useState(false);
  const [nouveauBlocId, setNouveauBlocId] = useState<string | null>(null);

  useEffect(() => {
    setPage(null);
    setMenuAjoutOuvert(false);
    setNouveauBlocId(null);
    obtenirPage(pageId).then((p) => {
      setPage(p);
      setTitreEnEdition(p.titre);
    });
  }, [pageId]);

  async function recharger() {
    const p = await obtenirPage(pageId);
    setPage(p);
    return p;
  }

  async function enregistrerTitre() {
    if (!page || titreEnEdition === page.titre) return;
    const maj = await modifierPage(pageId, { titre: titreEnEdition });
    setPage((prev) => (prev ? { ...prev, titre: maj.titre } : prev));
    onPageChange(pageId, { titre: maj.titre });
  }

  async function changerIcone(icone: string | null) {
    const maj = await modifierPage(pageId, { icone });
    setPage((prev) => (prev ? { ...prev, icone: maj.icone } : prev));
    onPageChange(pageId, { icone: maj.icone });
  }

  // Insère un bloc de `type` à la position `index` (0 = tout en haut),
  // en renumérotant proprement le champ `ordre` des autres blocs -- sert
  // à la fois pour "Ajouter" (index = fin) et pour Entrée-crée-un-bloc
  // (index = juste après le bloc courant).
  async function inserterBlocA(index: number, type: string) {
    if (!page) return;
    const nouveau = await creerBloc(pageId, type, {}, page.blocs.length);
    const idsOrdonnes = page.blocs.map((b) => b.id);
    idsOrdonnes.splice(index, 0, nouveau.id);
    const parId = new Map<string, BlocEspace>(page.blocs.map((b) => [b.id, b]));
    parId.set(nouveau.id, nouveau);
    await Promise.all(
      idsOrdonnes.map((id, i) => {
        const b = parId.get(id)!;
        return b.ordre === i ? null : modifierBloc(id, { ordre: i });
      }).filter((p): p is Promise<BlocEspace> => p !== null)
    );
    await recharger();
    setNouveauBlocId(nouveau.id);
  }

  async function deplacerBloc(idSource: string, idCible: string) {
    if (!page || idSource === idCible) return;
    const ids = page.blocs.map((b) => b.id);
    const depuisIndex = ids.indexOf(idSource);
    const versIndex = ids.indexOf(idCible);
    if (depuisIndex === -1 || versIndex === -1) return;
    const nouveauxIds = [...ids];
    const [retire] = nouveauxIds.splice(depuisIndex, 1);
    nouveauxIds.splice(versIndex, 0, retire);
    const parId = new Map(page.blocs.map((b) => [b.id, b]));
    await Promise.all(
      nouveauxIds.map((id, i) => (parId.get(id)!.ordre === i ? null : modifierBloc(id, { ordre: i })))
        .filter((p): p is Promise<BlocEspace> => p !== null)
    );
    await recharger();
  }

  async function ajouterSousPage() {
    if (!page) return;
    setMenuAjoutOuvert(false);
    const sp = await creerPage("Nouvelle page", page.id);
    onArbreChange(page.id);
    onNaviguer(sp.id);
  }

  if (!page) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-2/3 rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div>
      <div className="group/titre flex items-start gap-2">
        <SelecteurIcone icone={page.icone} onChoisir={changerIcone} />
        <input
          value={titreEnEdition}
          onChange={(e) => setTitreEnEdition(e.target.value)}
          onBlur={enregistrerTitre}
          placeholder="Sans titre"
          className="mt-1 w-full bg-transparent font-display text-3xl font-bold text-dj-texte outline-none placeholder:text-dj-texte-muet/50"
        />
        <button
          onClick={async () => {
            if (!confirm("Supprimer cette page et tout son contenu ?")) return;
            const parentId = page.parent_id;
            await supprimerPage(pageId);
            onSupprimee(parentId);
          }}
          className="mt-2.5 shrink-0 rounded-md p-1.5 text-dj-texte-muet opacity-0 transition-opacity hover:bg-dj-surface-haute hover:text-red-500 group-hover/titre:opacity-100"
          title="Supprimer la page"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {page.est_carrefour && (
        <div className="mt-4">
          <PanneauCarrefour pageId={pageId} />
        </div>
      )}

      <div className="mt-6 space-y-0.5">
        {page.blocs.map((b, i) => (
          <div
            key={b.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", b.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const idSource = e.dataTransfer.getData("text/plain");
              if (idSource) deplacerBloc(idSource, b.id);
            }}
            className="group/ligne flex items-start gap-1"
          >
            <span
              className="mt-1.5 hidden shrink-0 cursor-grab text-dj-texte-muet group-hover/ligne:block"
              title="Glisser pour réordonner"
            >
              <GripVertical size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <LigneBloc
                bloc={b}
                onChange={recharger}
                onNouveauBlocApres={() => inserterBlocA(i + 1, "texte")}
                autoFocus={b.id === nouveauBlocId}
                onAutoFocusConsomme={() => setNouveauBlocId(null)}
              />
            </div>
          </div>
        ))}
      </div>

      {page.sous_pages.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {page.sous_pages.map((sp) => (
            <div
              key={sp.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", sp.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const idSource = e.dataTransfer.getData("text/plain");
                if (idSource && idSource !== sp.id) onReordonnerFreres(page.id, idSource, sp.id);
              }}
            >
              <button
                onClick={() => onNaviguer(sp.id)}
                className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-dj-texte hover:bg-dj-surface-haute"
              >
                {sp.icone ? (
                  <span className="w-[15px] shrink-0 text-center text-sm leading-none">{sp.icone}</span>
                ) : (
                  <FileText size={15} className="shrink-0 text-dj-texte-muet" />
                )}
                <span className="truncate underline decoration-dj-bordure underline-offset-4">{sp.titre || "Sans titre"}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-1 inline-block">
        <button
          onClick={() => setMenuAjoutOuvert((v) => !v)}
          className="-mx-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-dj-texte-muet/70 hover:bg-dj-surface-haute hover:text-dj-texte-muet"
        >
          <Plus size={14} /> Ajouter
        </button>
        {menuAjoutOuvert && (
          <div className="absolute left-0 top-full z-10 mt-1 w-56 space-y-0.5 rounded-lg border border-dj-bordure bg-dj-surface p-1.5 shadow-lg">
            {TYPES_BLOCS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMenuAjoutOuvert(false);
                  inserterBlocA(page.blocs.length, t.id);
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-dj-texte hover:bg-dj-surface-haute"
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={ajouterSousPage}
              className="mt-0.5 block w-full rounded-md border-t border-dj-bordure px-2 py-1.5 pt-2 text-left text-xs text-dj-accent-2 hover:bg-dj-surface-haute"
            >
              + Sous-page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Mise en forme inline -- syntaxe maison légère (pas de dépendance
// supplémentaire) : **gras**, *italique*, __souligné__, `code`.
// ---------------------------------------------------------------------

const REGEX_FORMAT = /(\*\*.+?\*\*|__.+?__|`.+?`|\*.+?\*)/g;

function RenduTexteFormatte({ texte }: { texte: string }) {
  const morceaux = texte.split(REGEX_FORMAT);
  return (
    <>
      {morceaux.map((m, i) => {
        if (m.startsWith("**") && m.endsWith("**") && m.length >= 4) return <strong key={i}>{m.slice(2, -2)}</strong>;
        if (m.startsWith("__") && m.endsWith("__") && m.length >= 4) return <u key={i}>{m.slice(2, -2)}</u>;
        if (m.startsWith("`") && m.endsWith("`") && m.length >= 2)
          return (
            <code key={i} className="rounded bg-dj-surface-haute px-1 py-0.5 font-mono text-[0.85em]">
              {m.slice(1, -1)}
            </code>
          );
        if (m.startsWith("*") && m.endsWith("*") && m.length >= 2) return <em key={i}>{m.slice(1, -1)}</em>;
        return <span key={i}>{m}</span>;
      })}
    </>
  );
}

function BarreFormatage({ onFormat }: { onFormat: (marque: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-dj-bordure bg-dj-surface p-0.5 shadow-lg">
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat("**")} className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-dj-texte hover:bg-dj-surface-haute" title="Gras">
        B
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat("*")} className="flex h-6 w-6 items-center justify-center rounded text-xs italic text-dj-texte hover:bg-dj-surface-haute" title="Italique">
        I
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat("__")} className="flex h-6 w-6 items-center justify-center rounded text-xs underline text-dj-texte hover:bg-dj-surface-haute" title="Souligné">
        U
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat("`")} className="flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] text-dj-texte hover:bg-dj-surface-haute" title="Code">
        {"</>"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Un bloc, selon son type -- "/" pour changer de type, Entrée pour
// créer un nouveau bloc juste après, barre de mise en forme au survol
// d'une sélection.
// ---------------------------------------------------------------------

function LigneBloc({
  bloc,
  onChange,
  onNouveauBlocApres,
  autoFocus,
  onAutoFocusConsomme,
}: {
  bloc: BlocEspace;
  onChange: () => void;
  onNouveauBlocApres: () => void;
  autoFocus: boolean;
  onAutoFocusConsomme: () => void;
}) {
  const [enEdition, setEnEdition] = useState(autoFocus);
  const cle = bloc.type === "equation" ? "latex" : "texte";
  const [valeur, setValeur] = useState((bloc.contenu?.[cle] as string) ?? "");
  const [selection, setSelection] = useState<{ debut: number; fin: number } | null>(null);
  const refZone = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && refZone.current) {
      refZone.current.focus();
      onAutoFocusConsomme();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enregistrer() {
    setEnEdition(false);
    setSelection(null);
    if (valeur === ((bloc.contenu?.[cle] as string) ?? "")) return;
    await modifierBloc(bloc.id, { contenu: { [cle]: valeur } });
    onChange();
  }

  async function supprimer() {
    await supprimerBloc(bloc.id);
    onChange();
  }

  async function convertirEnType(type: string) {
    setValeur("");
    setEnEdition(false);
    await modifierBloc(bloc.id, { type, contenu: {} });
    onChange();
  }

  function appliquerFormat(marque: string) {
    const zone = refZone.current;
    if (!zone || zone.selectionStart === null || zone.selectionEnd === null) return;
    const debut = zone.selectionStart;
    const fin = zone.selectionEnd;
    if (debut === fin) return;
    const nouveau = `${valeur.slice(0, debut)}${marque}${valeur.slice(debut, fin)}${marque}${valeur.slice(fin)}`;
    setValeur(nouveau);
    requestAnimationFrame(() => {
      zone.focus();
      zone.setSelectionRange(debut + marque.length, fin + marque.length);
    });
  }

  function surSelection() {
    const zone = refZone.current;
    if (zone && zone.selectionStart !== zone.selectionEnd) setSelection({ debut: zone.selectionStart!, fin: zone.selectionEnd! });
    else setSelection(null);
  }

  const menuSlash = valeur.startsWith("/") && bloc.type !== "equation";
  const requeteSlash = valeur.slice(1);

  function surTouche(e: React.KeyboardEvent) {
    if (menuSlash) {
      if (e.key === "Escape") {
        e.preventDefault();
        setValeur("");
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enregistrer();
      onNouveauBlocApres();
    }
    if (e.key === "Escape") {
      setEnEdition(false);
      setValeur((bloc.contenu?.[cle] as string) ?? "");
    }
  }

  if (bloc.type === "base_donnees") {
    return <BlocBaseDonnees bloc={bloc} onChange={onChange} onSupprimer={supprimer} />;
  }

  if (bloc.type === "separateur") {
    return (
      <div className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5">
        <hr className="flex-1 border-dj-bordure" />
        <button onClick={supprimer} className="hidden text-dj-texte-muet hover:text-red-500 group-hover:block">
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  const classesParType: Record<string, string> = {
    titre: "font-display text-xl font-bold",
    liste_puces: "before:content-['•_'] before:text-dj-texte-muet",
    liste_numerotee: "before:content-['–_'] before:text-dj-texte-muet",
    citation: "border-l-2 border-dj-accent-2 pl-3 italic text-dj-texte-muet",
  };

  return (
    <div className="group -mx-2 flex items-start gap-2 rounded-md px-2 py-1 transition-colors hover:bg-dj-surface-haute/60">
      {bloc.type === "case_a_cocher" && (
        <input
          type="checkbox"
          className="mt-1.5 shrink-0"
          checked={Boolean(bloc.contenu?.coche)}
          onChange={async (e) => {
            await modifierBloc(bloc.id, { contenu: { ...bloc.contenu, coche: e.target.checked } });
            onChange();
          }}
        />
      )}
      <div className={`relative min-w-0 flex-1 text-sm text-dj-texte ${classesParType[bloc.type] ?? ""}`}>
        {enEdition && selection && bloc.type !== "equation" && (
          <div className="absolute -top-9 left-0 z-10">
            <BarreFormatage onFormat={appliquerFormat} />
          </div>
        )}
        {enEdition ? (
          bloc.type === "equation" ? (
            <input
              ref={refZone as React.RefObject<HTMLInputElement>}
              autoFocus
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              onBlur={enregistrer}
              onKeyDown={surTouche}
              placeholder="ex : x^2 + y^2 = r^2"
              className="w-full rounded-md border border-dj-accent-2 bg-dj-surface px-2 py-1 font-mono text-sm outline-none"
            />
          ) : (
            <>
              <textarea
                ref={refZone as React.RefObject<HTMLTextAreaElement>}
                autoFocus
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
                onSelect={surSelection}
                onBlur={enregistrer}
                onKeyDown={surTouche}
                rows={Math.max(1, valeur.split("\n").length)}
                placeholder="Écris, ou tape / pour changer le type…"
                className="w-full resize-none bg-transparent outline-none"
              />
              {menuSlash && (
                <div className="absolute left-0 top-full z-10 mt-1 w-56 space-y-0.5 rounded-lg border border-dj-bordure bg-dj-surface p-1.5 shadow-lg">
                  {TYPES_BLOCS.filter((t) => t.label.toLowerCase().includes(requeteSlash.toLowerCase())).map((t) => (
                    <button
                      key={t.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => convertirEnType(t.id)}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-dj-texte hover:bg-dj-surface-haute"
                    >
                      {t.label}
                    </button>
                  ))}
                  {TYPES_BLOCS.filter((t) => t.label.toLowerCase().includes(requeteSlash.toLowerCase())).length === 0 && (
                    <p className="px-2 py-1 text-xs text-dj-texte-muet">Aucun type ne correspond.</p>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          <div onClick={() => setEnEdition(true)} className="min-h-[1.5rem] cursor-text">
            {bloc.type === "equation" ? (
              valeur ? (
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$$${valeur}$$`}</ReactMarkdown>
              ) : (
                <span className="text-dj-texte-muet">Clique pour écrire une équation…</span>
              )
            ) : valeur ? (
              <RenduTexteFormatte texte={valeur} />
            ) : (
              <span className="text-dj-texte-muet">Clique pour écrire…</span>
            )}
          </div>
        )}
      </div>
      <button onClick={supprimer} className="hidden shrink-0 text-dj-texte-muet hover:text-red-500 group-hover:block">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Page carrefour -- références vers programme/matière/chapitre/document
// ---------------------------------------------------------------------

function PanneauCarrefour({ pageId }: { pageId: string }) {
  const [refs, setRefs] = useState<ReferenceCarrefour[] | null>(null);

  useEffect(() => {
    listerCarrefour(pageId).then(setRefs);
  }, [pageId]);

  if (!refs) return <Skeleton className="h-10 w-full rounded-md" />;

  return (
    <div className="space-y-1.5 rounded-lg border border-dj-accent-2/30 bg-dj-accent-1/5 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-dj-accent-2">
        <IconLien size={13} /> Page carrefour
      </p>
      {refs.length === 0 ? (
        <p className="text-xs text-dj-texte-muet">Aucune référence pour l'instant.</p>
      ) : (
        <ul className="space-y-1">
          {refs.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm text-dj-texte">
              <span>
                <span className="mr-1.5 rounded bg-dj-surface-haute px-1.5 py-0.5 text-[10px] uppercase text-dj-texte-muet">
                  {r.type_cible}
                </span>
                {r.label}
              </span>
              <button
                onClick={async () => {
                  await supprimerCarrefour(pageId, r.id);
                  setRefs((prev) => (prev ?? []).filter((rr) => rr.id !== r.id));
                }}
                className="text-dj-texte-muet hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Bloc "base de données" -- 4 vues (liste/tableau/calendrier/kanban),
// avec filtre + tri (tableau/liste/kanban) et vraie grille de mois
// (calendrier).
// ---------------------------------------------------------------------

function BlocBaseDonnees({ bloc, onChange, onSupprimer }: { bloc: BlocEspace; onChange: () => void; onSupprimer: () => void }) {
  const baseIdInitiale = bloc.contenu?.base_donnees_id as string | undefined;
  const [baseId, setBaseId] = useState<string | undefined>(baseIdInitiale);
  const [base, setBase] = useState<BaseDonneesDetail | null>(null);
  const [vue, setVue] = useState<"liste" | "tableau" | "calendrier" | "kanban">("tableau");
  const [nomBase, setNomBase] = useState("Fiches de révision");

  useEffect(() => {
    if (baseId) obtenirBaseDonnees(baseId).then((b) => {
      setBase(b);
      setVue((b.vue_par_defaut as typeof vue) || "tableau");
    });
  }, [baseId]);

  async function initialiser() {
    const b = await creerBaseDonnees(bloc.page_id, nomBase);
    await modifierBloc(bloc.id, { contenu: { base_donnees_id: b.id } });
    setBaseId(b.id);
    onChange();
  }

  if (!baseId) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-dj-bordure p-3">
        <input
          value={nomBase}
          onChange={(e) => setNomBase(e.target.value)}
          className="w-full rounded-md border border-dj-bordure bg-dj-surface px-2 py-1 text-sm outline-none"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={initialiser}
            className="rounded-md bg-dj-accent-1 px-2.5 py-1 text-xs font-semibold text-[#1A0D02] hover:bg-dj-accent-2"
          >
            Créer la base
          </button>
          <button onClick={onSupprimer} className="text-dj-texte-muet hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  if (!base) return <Skeleton className="h-32 w-full rounded-md" />;

  return (
    <div className="space-y-2 rounded-lg border border-dj-bordure p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-dj-texte">{base.titre || "(sans titre)"}</p>
        <div className="flex items-center gap-1">
          {(
            [
              ["liste", IconListe],
              ["tableau", IconTable],
              ["calendrier", IconCalendrier],
              ["kanban", IconKanban],
            ] as const
          ).map(([id, Icone]) => (
            <button
              key={id}
              onClick={() => setVue(id)}
              className={`rounded-md p-1 ${vue === id ? "bg-dj-accent-1/20 text-dj-accent-2" : "text-dj-texte-muet hover:bg-dj-surface-haute"}`}
              title={id}
            >
              <Icone size={14} />
            </button>
          ))}
          <button onClick={onSupprimer} className="ml-1 text-dj-texte-muet hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <VueBaseDonnees base={base} vue={vue} onChange={async () => setBase(await obtenirBaseDonnees(baseId))} />
    </div>
  );
}

function VueBaseDonnees({
  base,
  vue,
  onChange,
}: {
  base: BaseDonneesDetail;
  vue: "liste" | "tableau" | "calendrier" | "kanban";
  onChange: () => void;
}) {
  const [nouvellePropriete, setNouvellePropriete] = useState("");
  const [filtreProprieteId, setFiltreProprieteId] = useState("");
  const [filtreValeur, setFiltreValeur] = useState("");
  const [triProprieteId, setTriProprieteId] = useState("");
  const [triDesc, setTriDesc] = useState(false);

  const elementsRacine = base.elements.filter((e) => !e.parent_element_id);
  const valeurDe = (elementId: string, proprieteId: string) =>
    base.valeurs.find((v) => v.element_id === elementId && v.propriete_id === proprieteId)?.valeur;

  function appliquerFiltreEtTri(liste: ElementBase[]): ElementBase[] {
    let resultat = liste;
    if (filtreProprieteId && filtreValeur.trim()) {
      const q = filtreValeur.trim().toLowerCase();
      resultat = resultat.filter((el) => String(valeurDe(el.id, filtreProprieteId) ?? "").toLowerCase().includes(q));
    }
    if (triProprieteId) {
      resultat = [...resultat].sort((a, b) => {
        const va = String(valeurDe(a.id, triProprieteId) ?? "");
        const vb = String(valeurDe(b.id, triProprieteId) ?? "");
        return triDesc ? vb.localeCompare(va) : va.localeCompare(vb);
      });
    }
    return resultat;
  }

  async function ajouterElement() {
    await creerElementBase(base.id, {});
    onChange();
  }

  async function changerValeur(elementId: string, propriete: ProprieteBase, valeur: unknown) {
    await modifierElementBase(elementId, { [propriete.nom]: valeur });
    onChange();
  }

  async function ajouterPropriete() {
    if (!nouvellePropriete.trim()) return;
    await creerProprieteBase(base.id, nouvellePropriete.trim(), "texte");
    setNouvellePropriete("");
    onChange();
  }

  if (base.proprietes.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={nouvellePropriete}
          onChange={(e) => setNouvellePropriete(e.target.value)}
          placeholder="Nom de la première propriété (ex : Statut)"
          className="flex-1 rounded-md border border-dj-bordure bg-dj-surface px-2 py-1 text-xs outline-none"
        />
        <button onClick={ajouterPropriete} className="rounded-md border border-dj-bordure px-2 py-1 text-xs hover:border-dj-accent-2">
          Ajouter
        </button>
      </div>
    );
  }

  const barreFiltreTri = vue !== "calendrier" && (
    <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
      <select
        value={filtreProprieteId}
        onChange={(e) => setFiltreProprieteId(e.target.value)}
        className="rounded border border-dj-bordure bg-dj-surface px-1 py-0.5 text-dj-texte-muet outline-none"
      >
        <option value="">Filtrer…</option>
        {base.proprietes.map((p) => (
          <option key={p.id} value={p.id}>{p.nom}</option>
        ))}
      </select>
      {filtreProprieteId && (
        <input
          value={filtreValeur}
          onChange={(e) => setFiltreValeur(e.target.value)}
          placeholder="contient…"
          className="w-24 rounded border border-dj-bordure bg-dj-surface px-1 py-0.5 outline-none"
        />
      )}
      <select
        value={triProprieteId}
        onChange={(e) => setTriProprieteId(e.target.value)}
        className="rounded border border-dj-bordure bg-dj-surface px-1 py-0.5 text-dj-texte-muet outline-none"
      >
        <option value="">Trier…</option>
        {base.proprietes.map((p) => (
          <option key={p.id} value={p.id}>{p.nom}</option>
        ))}
      </select>
      {triProprieteId && (
        <button
          onClick={() => setTriDesc((v) => !v)}
          className="rounded border border-dj-bordure px-1 py-0.5 text-dj-texte-muet hover:border-dj-accent-2"
        >
          {triDesc ? "↓" : "↑"}
        </button>
      )}
    </div>
  );

  if (vue === "tableau") {
    const liste = appliquerFiltreEtTri(elementsRacine);
    return (
      <div>
        {barreFiltreTri}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-dj-texte-muet">
                {base.proprietes.map((p) => (
                  <th key={p.id} className="px-2 py-1 font-medium">
                    {p.nom}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {liste.map((el) => (
                <tr key={el.id} className="border-t border-dj-bordure">
                  {base.proprietes.map((p) => (
                    <td key={p.id} className="px-2 py-1">
                      <CelluleValeur propriete={p} valeur={valeurDe(el.id, p.id)} onChange={(v) => changerValeur(el.id, p, v)} />
                    </td>
                  ))}
                  <td>
                    <button
                      onClick={async () => {
                        await supprimerElementBase(el.id);
                        onChange();
                      }}
                      className="text-dj-texte-muet hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={ajouterElement} className="mt-1 text-xs text-dj-texte-muet hover:text-dj-accent-2">
            + Ajouter une ligne
          </button>
        </div>
      </div>
    );
  }

  if (vue === "liste") {
    const proprieteTitre = base.proprietes[0];
    const liste = appliquerFiltreEtTri(elementsRacine);
    return (
      <div>
        {barreFiltreTri}
        <div className="space-y-1">
          {liste.map((el) => (
            <div key={el.id} className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-dj-surface-haute">
              <CelluleValeur propriete={proprieteTitre} valeur={valeurDe(el.id, proprieteTitre.id)} onChange={(v) => changerValeur(el.id, proprieteTitre, v)} />
              <button
                onClick={async () => {
                  await supprimerElementBase(el.id);
                  onChange();
                }}
                className="text-dj-texte-muet hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button onClick={ajouterElement} className="text-xs text-dj-texte-muet hover:text-dj-accent-2">
            + Ajouter
          </button>
        </div>
      </div>
    );
  }

  if (vue === "kanban") {
    const proprieteStatut = base.proprietes.find((p) => p.type === "statut") ?? base.proprietes[0];
    const colonnes = proprieteStatut.options.length > 0 ? proprieteStatut.options : ["(vide)"];
    const liste = appliquerFiltreEtTri(elementsRacine);
    return (
      <div>
        {barreFiltreTri}
        <div className="flex gap-2 overflow-x-auto">
          {colonnes.map((col) => (
            <div key={col} className="w-40 shrink-0 space-y-1 rounded-md bg-dj-surface-haute p-2">
              <p className="text-[10px] font-semibold uppercase text-dj-texte-muet">{col}</p>
              {liste
                .filter((el) => (valeurDe(el.id, proprieteStatut.id) ?? "(vide)") === col)
                .map((el) => (
                  <div key={el.id} className="rounded-md border border-dj-bordure bg-dj-surface px-2 py-1 text-xs">
                    {base.proprietes[0].id !== proprieteStatut.id
                      ? String(valeurDe(el.id, base.proprietes[0].id) ?? "—")
                      : String(el.id).slice(0, 8)}
                  </div>
                ))}
            </div>
          ))}
          <button onClick={ajouterElement} className="self-start text-xs text-dj-texte-muet hover:text-dj-accent-2">
            + Ajouter
          </button>
        </div>
      </div>
    );
  }

  // vue === "calendrier" -- vraie grille de mois avec navigation.
  const proprieteDate = base.proprietes.find((p) => p.type === "date");
  if (!proprieteDate) {
    return <p className="text-xs text-dj-texte-muet">Ajoute une propriété de type "date" pour utiliser la vue calendrier.</p>;
  }
  return (
    <VueCalendrier
      base={base}
      proprieteDate={proprieteDate}
      elementsRacine={elementsRacine}
      valeurDe={valeurDe}
      ajouterElement={ajouterElement}
    />
  );
}

function VueCalendrier({
  base,
  proprieteDate,
  elementsRacine,
  valeurDe,
  ajouterElement,
}: {
  base: BaseDonneesDetail;
  proprieteDate: ProprieteBase;
  elementsRacine: ElementBase[];
  valeurDe: (elementId: string, proprieteId: string) => unknown;
  ajouterElement: () => void;
}) {
  const [moisAffiche, setMoisAffiche] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const premierJour = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth(), 1);
  const dernierJourNum = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() + 1, 0).getDate();
  const decalageDebut = (premierJour.getDay() + 6) % 7; // lundi = 0
  const cases: (number | null)[] = [...Array(decalageDebut).fill(null), ...Array.from({ length: dernierJourNum }, (_, i) => i + 1)];
  while (cases.length % 7 !== 0) cases.push(null);

  const parJour = new Map<number, ElementBase[]>();
  for (const el of elementsRacine) {
    const brut = String(valeurDe(el.id, proprieteDate.id) ?? "");
    if (!brut) continue;
    const d = new Date(brut);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() === moisAffiche.getFullYear() && d.getMonth() === moisAffiche.getMonth()) {
      const liste = parJour.get(d.getDate()) ?? [];
      liste.push(el);
      parJour.set(d.getDate(), liste);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setMoisAffiche(new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() - 1, 1))}
          className="rounded px-2 py-0.5 text-xs text-dj-texte-muet hover:bg-dj-surface-haute"
        >
          ‹
        </button>
        <p className="text-xs font-semibold capitalize text-dj-texte">
          {moisAffiche.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setMoisAffiche(new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() + 1, 1))}
          className="rounded px-2 py-0.5 text-xs text-dj-texte-muet hover:bg-dj-surface-haute"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] font-medium text-dj-texte-muet">
        {["L", "M", "M", "J", "V", "S", "D"].map((j, i) => (
          <div key={i}>{j}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cases.map((jour, i) => (
          <div
            key={i}
            className={`min-h-[3.25rem] rounded-md p-1 text-[10px] ${jour ? "border border-dj-bordure" : ""}`}
          >
            {jour && (
              <>
                <p className="text-dj-texte-muet">{jour}</p>
                {(parJour.get(jour) ?? []).slice(0, 3).map((el) => (
                  <p key={el.id} className="mt-0.5 truncate rounded bg-dj-accent-1/15 px-1 text-dj-accent-2">
                    {String(valeurDe(el.id, base.proprietes[0].id) ?? "—")}
                  </p>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      <button onClick={ajouterElement} className="mt-1.5 text-xs text-dj-texte-muet hover:text-dj-accent-2">
        + Ajouter
      </button>
    </div>
  );
}

function CelluleValeur({
  propriete,
  valeur,
  onChange,
}: {
  propriete: ProprieteBase;
  valeur: unknown;
  onChange: (v: unknown) => void;
}) {
  if (propriete.type === "case_a_cocher") {
    return <input type="checkbox" checked={Boolean(valeur)} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (propriete.type === "statut" && propriete.options.length > 0) {
    return (
      <select value={String(valeur ?? "")} onChange={(e) => onChange(e.target.value)} className="rounded bg-transparent text-xs outline-none">
        <option value="" />
        {propriete.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      defaultValue={String(valeur ?? "")}
      onBlur={(e) => e.target.value !== String(valeur ?? "") && onChange(e.target.value)}
      type={propriete.type === "nombre" ? "number" : propriete.type === "date" ? "date" : "text"}
      className="w-full bg-transparent text-xs outline-none"
    />
  );
}

// ---------------------------------------------------------------------
// Panneau de révision (répétition espacée, lot 4)
// ---------------------------------------------------------------------

function PanneauRevision() {
  const [dus, setDus] = useState<{ element_id: string; base_id: string }[] | null>(null);
  const [index, setIndex] = useState(0);
  const [reponseVisible, setReponseVisible] = useState(false);

  useEffect(() => {
    listerRevisionsDues().then(setDus);
  }, []);

  async function repondre(qualite: "echec" | "difficile" | "correct" | "facile") {
    if (!dus) return;
    await repondreRevision(dus[index].element_id, qualite);
    setReponseVisible(false);
    setIndex((i) => i + 1);
  }

  if (!dus) return <Skeleton className="h-32 w-full rounded-md" />;
  if (dus.length === 0) return <p className="text-sm text-dj-texte-muet">Rien à réviser pour l'instant 🎉</p>;
  if (index >= dus.length) return <p className="text-sm text-dj-texte">Session terminée, bien joué !</p>;

  return (
    <div className="mx-auto max-w-sm space-y-4 text-center">
      <p className="text-xs text-dj-texte-muet">
        {index + 1} / {dus.length}
      </p>
      <div className="rounded-xl border border-dj-bordure bg-dj-surface-haute p-6">
        <p className="text-sm text-dj-texte-muet">Élément id {dus[index].element_id.slice(0, 8)}…</p>
        <p className="mt-2 text-xs text-dj-texte-muet">Ouvre la base correspondante pour revoir le détail, puis évalue-toi.</p>
      </div>
      {!reponseVisible ? (
        <button
          onClick={() => setReponseVisible(true)}
          className="rounded-lg bg-dj-accent-1 px-4 py-2 text-sm font-semibold text-[#1A0D02] hover:bg-dj-accent-2"
        >
          Voir la réponse
        </button>
      ) : (
        <div className="flex justify-center gap-2">
          {(
            [
              ["echec", "Échec"],
              ["difficile", "Difficile"],
              ["correct", "Correct"],
              ["facile", "Facile"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => repondre(id)}
              className="rounded-lg border border-dj-bordure px-3 py-1.5 text-xs hover:border-dj-accent-2 hover:text-dj-accent-2"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
