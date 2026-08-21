"use client";

import { useEffect, useState } from "react";
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
} from "@/lib/api";
import { ErreurApi } from "@/lib/erreurs";
import { CTACompteRequis } from "./CTACompteRequis";
import { Skeleton } from "./Skeleton";

// Section "Notion-like" -- refonte du 21/08/2026 (demande explicite de
// Bourama : "je veux que ce soit comme si tu ouvrais une nouvelle app",
// après une première version jugée "complètement ridicule" -- boutons
// partout, pilules, tout enfermé dans une carte). Cette refonte ne
// change QUE l'affichage/l'ergonomie -- sidebar avec arbre de pages
// (au lieu de pilules), canevas plein écran sans carte englobante,
// ajout de bloc via un "+" discret (au lieu d'une rangée de boutons),
// sous-pages affichées comme des liens (au lieu de pilules).
// AUCUNE fonctionnalité ajoutée ni retirée : toujours les mêmes 9
// types de blocs, la même base de données à 4 vues, le même mécanisme
// de page carrefour, la même révision espacée. Pas de drag & drop --
// n'existait pas avant cette refonte, ne pas en ajouter sans qu'il le
// demande explicitement (règle "rien d'autre ne change").
// Consomme les endpoints des lots 1 à 4 (api/pages_notion.py,
// api/bases_donnees.py, api/revision.py) -- aucun changement backend.

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

  // Rafraîchit la portion de l'arbre concernée après création/suppression
  // d'une sous-page ailleurs dans l'UI (ex : depuis le canevas).
  function rafraichirNoeud(parentId: string | null) {
    if (parentId === null) {
      chargerRacines();
      return;
    }
    chargerEnfants(parentId);
    setOuverts((prev) => ({ ...prev, [parentId]: true }));
  }

  // Met à jour le titre affiché dans l'arbre sans tout recharger (édition
  // en direct dans le canevas -> reflet immédiat dans la sidebar).
  function patcherTitre(pageId: string, titre: string) {
    setRacines((prev) => prev?.map((p) => (p.id === pageId ? { ...p, titre } : p)) ?? prev);
    setEnfants((prev) => {
      const copie: Record<string, PageEspace[]> = {};
      for (const cle of Object.keys(prev)) copie[cle] = prev[cle].map((p) => (p.id === pageId ? { ...p, titre } : p));
      return copie;
    });
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
              onTitreChange={patcherTitre}
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
// des sous-pages au premier dépliage de chaque nœud.
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
}: {
  page: PageEspace;
  profondeur: number;
  pageActiveId: string | null;
  onNaviguer: (id: string) => void;
  enfants: Record<string, PageEspace[]>;
  ouverts: Record<string, boolean>;
  onBasculer: (id: string) => void;
}) {
  const ouvert = ouverts[page.id] ?? false;
  const listeEnfants = enfants[page.id];
  const actif = pageActiveId === page.id;

  return (
    <div>
      <div
        onClick={() => onNaviguer(page.id)}
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
        <FileText size={13} className="shrink-0 text-dj-texte-muet" />
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
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Panneau d'une page (titre, blocs, sous-pages, carrefour) -- canevas
// plein, sans carte englobante.
// ---------------------------------------------------------------------

function PanneauPage({
  pageId,
  onNaviguer,
  onSupprimee,
  onArbreChange,
  onTitreChange,
}: {
  pageId: string;
  onNaviguer: (id: string) => void;
  onSupprimee: (parentId: string | null) => void;
  onArbreChange: (parentId: string | null) => void;
  onTitreChange: (pageId: string, titre: string) => void;
}) {
  const [page, setPage] = useState<PageDetail | null>(null);
  const [titreEnEdition, setTitreEnEdition] = useState("");
  const [menuAjoutOuvert, setMenuAjoutOuvert] = useState(false);

  useEffect(() => {
    setPage(null);
    setMenuAjoutOuvert(false);
    obtenirPage(pageId).then((p) => {
      setPage(p);
      setTitreEnEdition(p.titre);
    });
  }, [pageId]);

  async function recharger() {
    const p = await obtenirPage(pageId);
    setPage(p);
  }

  async function enregistrerTitre() {
    if (!page || titreEnEdition === page.titre) return;
    const maj = await modifierPage(pageId, titreEnEdition);
    setPage((prev) => (prev ? { ...prev, titre: maj.titre } : prev));
    onTitreChange(pageId, maj.titre);
  }

  async function ajouterBloc(type: string) {
    if (!page) return;
    setMenuAjoutOuvert(false);
    await creerBloc(pageId, type, {}, page.blocs.length);
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
      <div className="group/titre flex items-start justify-between gap-3">
        <input
          value={titreEnEdition}
          onChange={(e) => setTitreEnEdition(e.target.value)}
          onBlur={enregistrerTitre}
          placeholder="Sans titre"
          className="w-full bg-transparent font-display text-3xl font-bold text-dj-texte outline-none placeholder:text-dj-texte-muet/50"
        />
        <button
          onClick={async () => {
            if (!confirm("Supprimer cette page et tout son contenu ?")) return;
            const parentId = page.parent_id;
            await supprimerPage(pageId);
            onSupprimee(parentId);
          }}
          className="mt-2 shrink-0 rounded-md p-1.5 text-dj-texte-muet opacity-0 transition-opacity hover:bg-dj-surface-haute hover:text-red-500 group-hover/titre:opacity-100"
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
        {page.blocs.map((b) => (
          <LigneBloc key={b.id} bloc={b} onChange={recharger} />
        ))}
      </div>

      {page.sous_pages.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {page.sous_pages.map((sp) => (
            <button
              key={sp.id}
              onClick={() => onNaviguer(sp.id)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-dj-texte hover:bg-dj-surface-haute"
            >
              <FileText size={15} className="shrink-0 text-dj-texte-muet" />
              <span className="truncate underline decoration-dj-bordure underline-offset-4">{sp.titre || "Sans titre"}</span>
            </button>
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
                onClick={() => ajouterBloc(t.id)}
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
// Un bloc, selon son type
// ---------------------------------------------------------------------

function LigneBloc({ bloc, onChange }: { bloc: BlocEspace; onChange: () => void }) {
  const [enEdition, setEnEdition] = useState(false);
  const cle = bloc.type === "equation" ? "latex" : "texte";
  const [valeur, setValeur] = useState((bloc.contenu?.[cle] as string) ?? "");

  async function enregistrer() {
    setEnEdition(false);
    if (valeur === ((bloc.contenu?.[cle] as string) ?? "")) return;
    await modifierBloc(bloc.id, { contenu: { [cle]: valeur } });
    onChange();
  }

  async function supprimer() {
    await supprimerBloc(bloc.id);
    onChange();
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
      <div className={`min-w-0 flex-1 text-sm text-dj-texte ${classesParType[bloc.type] ?? ""}`}>
        {enEdition ? (
          bloc.type === "equation" ? (
            <input
              autoFocus
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              onBlur={enregistrer}
              placeholder="ex : x^2 + y^2 = r^2"
              className="w-full rounded-md border border-dj-accent-2 bg-dj-surface px-2 py-1 font-mono text-sm outline-none"
            />
          ) : (
            <textarea
              autoFocus
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              onBlur={enregistrer}
              rows={Math.max(1, valeur.split("\n").length)}
              className="w-full resize-none bg-transparent outline-none"
            />
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
              valeur
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
// Bloc "base de données" -- 4 vues (liste/tableau/calendrier/kanban)
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
    // Rattache la base à CE bloc, plutôt que d'en laisser un second
    // orphelin créé automatiquement par ajouter_base côté backend --
    // simplification : on remplace le contenu du bloc coquille.
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
  const elementsRacine = base.elements.filter((e) => !e.parent_element_id);
  const valeurDe = (elementId: string, proprieteId: string) =>
    base.valeurs.find((v) => v.element_id === elementId && v.propriete_id === proprieteId)?.valeur;

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

  if (vue === "tableau") {
    return (
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
            {elementsRacine.map((el) => (
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
    );
  }

  if (vue === "liste") {
    const proprieteTitre = base.proprietes[0];
    return (
      <div className="space-y-1">
        {elementsRacine.map((el) => (
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
    );
  }

  if (vue === "kanban") {
    const proprieteStatut = base.proprietes.find((p) => p.type === "statut") ?? base.proprietes[0];
    const colonnes = proprieteStatut.options.length > 0 ? proprieteStatut.options : ["(vide)"];
    return (
      <div className="flex gap-2 overflow-x-auto">
        {colonnes.map((col) => (
          <div key={col} className="w-40 shrink-0 space-y-1 rounded-md bg-dj-surface-haute p-2">
            <p className="text-[10px] font-semibold uppercase text-dj-texte-muet">{col}</p>
            {elementsRacine
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
    );
  }

  // vue === "calendrier" -- v1 simplifiée : liste triée par la première
  // propriété de type date, groupée par date. Pas de vraie grille de
  // mois pour ce lot (voir lot-5, "un éditeur simple et fiable").
  const proprieteDate = base.proprietes.find((p) => p.type === "date");
  if (!proprieteDate) {
    return <p className="text-xs text-dj-texte-muet">Ajoute une propriété de type "date" pour utiliser la vue calendrier.</p>;
  }
  const tries = [...elementsRacine].sort((a, b) => {
    const da = String(valeurDe(a.id, proprieteDate.id) ?? "");
    const db = String(valeurDe(b.id, proprieteDate.id) ?? "");
    return da.localeCompare(db);
  });
  return (
    <div className="space-y-1">
      {tries.map((el) => (
        <div key={el.id} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 text-dj-texte-muet">{String(valeurDe(el.id, proprieteDate.id) ?? "—")}</span>
          <span>{String(valeurDe(el.id, base.proprietes[0].id) ?? "")}</span>
        </div>
      ))}
      <button onClick={ajouterElement} className="text-xs text-dj-texte-muet hover:text-dj-accent-2">
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
