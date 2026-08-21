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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  listerPagesRacines,
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

// Section "Notion-like" (Partie 2, lot 5/5) -- 2026-08-20, demande
// Bourama. Éditeur volontairement simple : réordonnancement par
// boutons haut/bas plutôt que drag & drop (préférence explicite du
// chantier : "un éditeur simple et fiable vaut mieux qu'un éditeur
// ambitieux et fragile"). Consomme les endpoints des lots 1 à 4
// (api/pages_notion.py, api/bases_donnees.py, api/revision.py).

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
  const [pages, setPages] = useState<PageEspace[] | null>(null);
  const [sansCompte, setSansCompte] = useState(false);
  const [pageActiveId, setPageActiveId] = useState<string | null>(null);
  const [ongletDroit, setOngletDroit] = useState<"page" | "revision">("page");

  useEffect(() => {
    chargerRacines();
  }, []);

  function chargerRacines() {
    listerPagesRacines()
      .then((r) => {
        setPages(r);
        if (r.length > 0 && !pageActiveId) setPageActiveId(r[0].id);
      })
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) setSansCompte(true);
        setPages([]);
      });
  }

  async function creerPageRacine() {
    const page = await creerPage("Nouvelle page");
    setPages((prev) => [...(prev ?? []), page]);
    setPageActiveId(page.id);
    setOngletDroit("page");
  }

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour organiser tes pages, fiches de révision et tâches dans Clovis." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {pages === null ? (
          <Skeleton className="h-7 w-40 rounded-full" />
        ) : (
          pages.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPageActiveId(p.id);
                setOngletDroit("page");
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                ongletDroit === "page" && pageActiveId === p.id
                  ? "border-dj-accent-2 bg-dj-accent-1/15 text-dj-accent-2"
                  : "border-dj-bordure text-dj-texte-muet hover:border-dj-bordure-forte"
              }`}
            >
              <FileText size={12} /> {p.titre || "(sans titre)"}
            </button>
          ))
        )}
        <button
          onClick={creerPageRacine}
          className="flex items-center gap-1 rounded-full border border-dashed border-dj-bordure px-3 py-1 text-xs text-dj-texte-muet hover:border-dj-accent-2 hover:text-dj-accent-2"
        >
          <Plus size={12} /> Page
        </button>
        <button
          onClick={() => setOngletDroit("revision")}
          className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            ongletDroit === "revision"
              ? "border-dj-accent-2 bg-dj-accent-1/15 text-dj-accent-2"
              : "border-dj-bordure text-dj-texte-muet hover:border-dj-bordure-forte"
          }`}
        >
          <Brain size={12} /> À réviser
        </button>
      </div>

      <div className="rounded-xl border border-dj-bordure bg-dj-surface p-5">
        {ongletDroit === "revision" ? (
          <PanneauRevision />
        ) : pageActiveId ? (
          <PanneauPage
            key={pageActiveId}
            pageId={pageActiveId}
            onNaviguer={setPageActiveId}
            onSupprimee={() => {
              chargerRacines();
              setPageActiveId(null);
            }}
          />
        ) : (
          <p className="text-sm text-dj-texte-muet">Crée une page pour commencer.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Sous-pages de la page active -- chips de navigation + création
// ---------------------------------------------------------------------

function SousPages({
  page,
  onNaviguer,
  onChange,
}: {
  page: PageDetail;
  onNaviguer: (id: string) => void;
  onChange: () => void;
}) {
  async function ajouterSousPage() {
    const sp = await creerPage("Nouvelle sous-page", page.id);
    onChange();
    onNaviguer(sp.id);
  }

  if (page.sous_pages.length === 0) {
    return (
      <button onClick={ajouterSousPage} className="flex items-center gap-1 text-xs text-dj-texte-muet hover:text-dj-accent-2">
        <Plus size={12} /> Ajouter une sous-page
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {page.sous_pages.map((sp) => (
        <button
          key={sp.id}
          onClick={() => onNaviguer(sp.id)}
          className="flex items-center gap-1 rounded-full border border-dj-bordure px-2.5 py-0.5 text-xs text-dj-texte-muet hover:border-dj-accent-2 hover:text-dj-accent-2"
        >
          <FileText size={11} /> {sp.titre || "(sans titre)"}
        </button>
      ))}
      <button onClick={ajouterSousPage} className="flex items-center gap-1 rounded-full border border-dashed border-dj-bordure px-2.5 py-0.5 text-xs text-dj-texte-muet hover:border-dj-accent-2 hover:text-dj-accent-2">
        <Plus size={11} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Panneau d'une page (titre, sous-pages, blocs, carrefour)
// ---------------------------------------------------------------------

function PanneauPage({
  pageId,
  onNaviguer,
  onSupprimee,
}: {
  pageId: string;
  onNaviguer: (id: string) => void;
  onSupprimee: () => void;
}) {
  const [page, setPage] = useState<PageDetail | null>(null);
  const [titreEnEdition, setTitreEnEdition] = useState("");

  useEffect(() => {
    setPage(null);
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
  }

  async function ajouterBloc(type: string) {
    if (!page) return;
    await creerBloc(pageId, type, {}, page.blocs.length);
    if (type === "base_donnees") {
      // La base est créée séparément depuis le bloc affiché (voir BlocBaseDonnees) --
      // ici on vient seulement d'ajouter un bloc "coquille" vide, à initialiser.
    }
    await recharger();
  }

  if (!page) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2 rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <input
          value={titreEnEdition}
          onChange={(e) => setTitreEnEdition(e.target.value)}
          onBlur={enregistrerTitre}
          placeholder="Sans titre"
          className="w-full bg-transparent font-display text-lg font-bold text-dj-texte outline-none placeholder:text-dj-texte-muet"
        />
        <button
          onClick={async () => {
            if (!confirm("Supprimer cette page et tout son contenu ?")) return;
            await supprimerPage(pageId);
            onSupprimee();
          }}
          className="shrink-0 rounded-md p-1.5 text-dj-texte-muet hover:bg-dj-surface-haute hover:text-red-500"
          title="Supprimer la page"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {page.est_carrefour && <PanneauCarrefour pageId={pageId} />}

      <SousPages page={page} onNaviguer={onNaviguer} onChange={recharger} />

      <div className="space-y-2">
        {page.blocs.map((b) => (
          <LigneBloc key={b.id} bloc={b} onChange={recharger} />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-dj-bordure pt-3">
        {TYPES_BLOCS.map((t) => (
          <button
            key={t.id}
            onClick={() => ajouterBloc(t.id)}
            className="rounded-md border border-dj-bordure px-2 py-1 text-xs text-dj-texte-muet transition-colors hover:border-dj-accent-2 hover:text-dj-accent-2"
          >
            + {t.label}
          </button>
        ))}
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
      <div className="group flex items-center gap-2">
        <hr className="flex-1 border-dj-bordure" />
        <button onClick={supprimer} className="hidden text-dj-texte-muet hover:text-red-500 group-hover:block">
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  const classesParType: Record<string, string> = {
    titre: "font-display text-base font-bold",
    liste_puces: "before:content-['•_'] before:text-dj-texte-muet",
    liste_numerotee: "before:content-['–_'] before:text-dj-texte-muet",
    citation: "border-l-2 border-dj-accent-2 pl-3 italic text-dj-texte-muet",
  };

  return (
    <div className="group flex items-start gap-2">
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
