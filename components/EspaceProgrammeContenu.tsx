"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Check, Link as IconLien, FileText, Rocket } from "lucide-react";
import {
  lireDocumentsChapitre,
  ajouterDocumentChapitre,
  supprimerDocumentChapitre,
  type DocumentChapitre,
  lireExercicesChapitre,
  ajouterExerciceChapitre,
  modifierExerciceChapitre,
  supprimerExerciceChapitre,
  type ExerciceChapitre,
  lireExamensProgramme,
  creerExamen,
  supprimerExamen,
  type Examen,
  type TypeExamen,
  publierProgrammeCommePlugin,
} from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";
import { AjouterAClassementBouton } from "./AjouterAClassementBouton";

// Lot 5 (chantier programme étudiant) -- au moment où ce fichier a été
// écrit, components/EspaceProgramme.tsx (lot 4 : navigation
// programme/matière/chapitre) n'existe pas encore dans le dépôt. Fichier
// séparé comme prévu dans le brief : Bourama branche lui-même
// <VueChapitreContenu> et <VueProgrammeContenu> ci-dessous au bon endroit
// une fois le lot 4 en place, plutôt que de deviner sa structure.
//
// Ne couvre PAS la création/édition/liste des programmes, matières ou
// chapitres eux-mêmes (hors périmètre du lot 5).

// ---------------------------------------------------------------------------
// Vue "chapitre sélectionné" : documents + exercices du chapitre.

export function VueChapitreContenu({ chapitreId }: { chapitreId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionDocuments chapitreId={chapitreId} />
      <SectionExercices chapitreId={chapitreId} />
    </div>
  );
}

const URL_REGEX = /^https?:\/\/\S+$/i;

function SectionDocuments({ chapitreId }: { chapitreId: string }) {
  const [documents, setDocuments] = useState<DocumentChapitre[] | null>(null);
  const [titre, setTitre] = useState("");
  const [urlOuContenu, setUrlOuContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setDocuments(null);
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapitreId]);

  function charger() {
    lireDocumentsChapitre(chapitreId)
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }

  async function ajouter() {
    if (!titre.trim() || !urlOuContenu.trim()) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await ajouterDocumentChapitre(chapitreId, titre.trim(), urlOuContenu.trim());
      setTitre("");
      setUrlOuContenu("");
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id: string, titreDoc: string) {
    if (!window.confirm(`Supprimer le document « ${titreDoc} » ?`)) return;
    try {
      await supprimerDocumentChapitre(id);
      charger();
    } catch (e) {
      window.alert(messageErreur(e));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-dj-texte">Documents du chapitre</h3>

      <div className="flex flex-col gap-2 rounded-2xl border border-dj-bordure bg-dj-surface p-4 sm:flex-row sm:items-center">
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre du document"
          className="rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte sm:w-48"
        />
        <input
          value={urlOuContenu}
          onChange={(e) => setUrlOuContenu(e.target.value)}
          placeholder="Colle un lien, ou écris le contenu…"
          className="flex-1 rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={envoi || !titre.trim() || !urlOuContenu.trim()}
          className="self-end rounded-full bg-dj-gradient px-5 py-2 text-sm font-bold text-[#1A0D02] shadow-[0_2px_14px_rgba(217,99,31,0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 sm:self-auto"
        >
          {envoi ? "Envoi…" : "Ajouter"}
        </button>
      </div>

      {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

      {documents === null && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-12 rounded-xl border border-dj-bordure" />
          <Skeleton className="h-12 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
        </div>
      )}
      {documents?.length === 0 && <p className="text-sm text-dj-texte-muet">Aucun document pour l&apos;instant.</p>}
      {documents && documents.length > 0 && (
        <div className="flex flex-col gap-2">
          {documents.map((d) => {
            const estLien = URL_REGEX.test(d.url_ou_contenu);
            const Icone = estLien ? IconLien : FileText;
            return (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Icone size={14} className="flex-shrink-0 text-dj-accent-1" />
                  {estLien ? (
                    <a
                      href={d.url_ou_contenu}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-dj-accent-1 hover:text-dj-accent-2"
                    >
                      {d.titre}
                    </a>
                  ) : (
                    <span className="truncate text-sm text-dj-texte" title={d.url_ou_contenu}>
                      {d.titre}
                    </span>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <AjouterAClassementBouton cibleType="document" cibleId={d.id} />
                  <button
                    onClick={() => supprimer(d.id, d.titre)}
                    className="text-xs text-dj-texte-muet transition-colors hover:text-[#F87171]"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionExercices({ chapitreId }: { chapitreId: string }) {
  const [exercices, setExercices] = useState<ExerciceChapitre[] | null>(null);
  const [nouvelEnonce, setNouvelEnonce] = useState("");
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [panneau, setPanneau] = useState<ExerciceChapitre | null>(null);
  const [texteOuvert, setTexteOuvert] = useState("");
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [erreurOuvert, setErreurOuvert] = useState<string | null>(null);

  useEffect(() => {
    setExercices(null);
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapitreId]);

  function charger() {
    lireExercicesChapitre(chapitreId)
      .then(setExercices)
      .catch(() => setExercices([]));
  }

  async function ajouter() {
    if (!nouvelEnonce.trim()) return;
    setAjoutEnCours(true);
    setErreur(null);
    try {
      const cree = await ajouterExerciceChapitre(chapitreId, nouvelEnonce.trim());
      setExercices((prec) => [...(prec || []), cree]);
      setNouvelEnonce("");
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setAjoutEnCours(false);
    }
  }

  function ouvrir(ex: ExerciceChapitre) {
    setPanneau(ex);
    setTexteOuvert(ex.enonce);
    setErreurOuvert(null);
  }

  function fermer() {
    if (enregistrementEnCours || suppressionEnCours) return;
    setPanneau(null);
  }

  async function enregistrer() {
    if (!panneau) return;
    const enonce = texteOuvert.trim();
    if (!enonce || enonce === panneau.enonce) {
      setPanneau(null);
      return;
    }
    setEnregistrementEnCours(true);
    setErreurOuvert(null);
    try {
      const maj = await modifierExerciceChapitre(panneau.id, enonce);
      setExercices((prec) => (prec || []).map((e) => (e.id === panneau.id ? maj : e)));
      setPanneau(null);
    } catch (e) {
      setErreurOuvert(messageErreur(e));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function supprimer() {
    if (!panneau) return;
    setSuppressionEnCours(true);
    setErreurOuvert(null);
    try {
      await supprimerExerciceChapitre(panneau.id);
      setExercices((prec) => (prec || []).filter((e) => e.id !== panneau.id));
      setPanneau(null);
    } catch (e) {
      setErreurOuvert(messageErreur(e));
      setSuppressionEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-dj-texte">Exercices du chapitre</h3>

      {exercices === null && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-10 rounded-xl border border-dj-bordure" />
          <Skeleton className="h-10 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
        </div>
      )}
      {exercices?.length === 0 && <p className="text-sm text-dj-texte-muet">Aucun exercice pour l&apos;instant.</p>}
      {exercices && exercices.length > 0 && (
        <div className="flex flex-col gap-2">
          {exercices.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3"
            >
              <button onClick={() => ouvrir(ex)} className="min-w-0 flex-1 truncate text-left text-sm text-dj-texte">
                {ex.enonce}
              </button>
              <AjouterAClassementBouton cibleType="exercice" cibleId={ex.id} />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border border-dj-bordure bg-dj-surface p-3">
        <textarea
          value={nouvelEnonce}
          onChange={(e) => setNouvelEnonce(e.target.value)}
          placeholder="Énoncé du nouvel exercice…"
          rows={2}
          className="min-w-0 flex-1 resize-none rounded-xl border border-dj-bordure bg-dj-fond px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
        />
        <button
          onClick={ajouter}
          disabled={ajoutEnCours || !nouvelEnonce.trim()}
          title="Ajouter"
          className="flex-shrink-0 rounded-full bg-dj-gradient p-2.5 text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
      </div>
      {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

      {panneau && (
        <div className="fixed inset-0 z-50 flex animate-dj-fade-in flex-col bg-dj-fond p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4">
            <span className="text-sm text-dj-texte-muet">Modifier cet exercice</span>
            <button
              onClick={fermer}
              disabled={enregistrementEnCours || suppressionEnCours}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-dj-texte-muet transition-colors hover:bg-dj-surface disabled:opacity-50"
            >
              <X size={14} /> Fermer
            </button>
          </div>

          <textarea
            autoFocus
            value={texteOuvert}
            onChange={(e) => setTexteOuvert(e.target.value)}
            className="mx-auto w-full max-w-2xl flex-1 resize-none rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3 text-base text-dj-texte outline-none focus:border-dj-accent-1"
          />

          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {erreurOuvert ? (
              <p className="text-xs text-[#F87171]">{erreurOuvert}</p>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={supprimer}
                disabled={enregistrementEnCours || suppressionEnCours}
                className="flex items-center gap-1.5 rounded-lg border border-dj-bordure px-3 py-2 text-sm text-[#F87171] transition-colors hover:bg-[#F87171]/10 disabled:opacity-50"
              >
                <Trash2 size={14} /> Supprimer
              </button>
              <button
                onClick={enregistrer}
                disabled={enregistrementEnCours || suppressionEnCours || !texteOuvert.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-dj-gradient px-4 py-2 text-sm font-semibold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Check size={14} /> {enregistrementEnCours ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vue "programme sélectionné" : examens/devoirs multi-chapitres + publier
// comme plugin. `chapitres` est fourni par l'appelant (lot 4) -- c'est lui
// qui connaît la liste chargée des chapitres du programme, ce composant ne
// la recharge pas lui-même pour éviter un double appel.

const TYPES_EXAMEN: { id: TypeExamen; label: string }[] = [
  { id: "examen", label: "Examen" },
  { id: "devoir", label: "Devoir" },
  { id: "probleme_composite", label: "Problème composite" },
];

export function VueProgrammeContenu({
  programmeId,
  chapitres,
}: {
  programmeId: string;
  chapitres: { id: string; titre: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionExamens programmeId={programmeId} chapitres={chapitres} />
      <SectionPublierPlugin programmeId={programmeId} />
    </div>
  );
}

function SectionExamens({
  programmeId,
  chapitres,
}: {
  programmeId: string;
  chapitres: { id: string; titre: string }[];
}) {
  const [examens, setExamens] = useState<Examen[] | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeExamen>("examen");
  const [chapitreIdsChoisis, setChapitreIdsChoisis] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setExamens(null);
    lireExamensProgramme(programmeId)
      .then(setExamens)
      .catch(() => setExamens([]));
  }, [programmeId]);

  function basculerChapitre(id: string) {
    setChapitreIdsChoisis((prec) => (prec.includes(id) ? prec.filter((c) => c !== id) : [...prec, id]));
  }

  async function creer() {
    if (!titre.trim() || chapitreIdsChoisis.length === 0) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const cree = await creerExamen(titre.trim(), type, chapitreIdsChoisis);
      setExamens((prec) => [...(prec || []), cree]);
      setTitre("");
      setChapitreIdsChoisis([]);
      setFormulaireOuvert(false);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id: string, titreExamen: string) {
    if (!window.confirm(`Supprimer « ${titreExamen} » ?`)) return;
    try {
      await supprimerExamen(id);
      setExamens((prec) => (prec || []).filter((e) => e.id !== id));
    } catch (e) {
      window.alert(messageErreur(e));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dj-texte">Examens &amp; devoirs du programme</h3>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-dj-bordure px-3 py-1.5 text-xs text-dj-texte transition-colors hover:border-dj-bordure-forte"
        >
          <Plus size={13} /> Nouveau
        </button>
      </div>

      {formulaireOuvert && (
        <div className="flex animate-dj-fade-in-rapide flex-col gap-3 rounded-2xl border border-dj-bordure bg-dj-surface p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre"
              className="flex-1 rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeExamen)}
              className="rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
            >
              {TYPES_EXAMEN.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-dj-texte-muet">Chapitres couverts (plusieurs possibles) :</p>
            <div className="flex flex-wrap gap-1.5">
              {chapitres.map((c) => {
                const choisi = chapitreIdsChoisis.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => basculerChapitre(c.id)}
                    className={
                      "rounded-full border px-3 py-1 text-xs transition-colors " +
                      (choisi
                        ? "border-dj-accent-1 bg-dj-accent-1/10 text-dj-accent-2"
                        : "border-dj-bordure text-dj-texte-muet hover:border-dj-bordure-forte")
                    }
                  >
                    {c.titre}
                  </button>
                );
              })}
              {chapitres.length === 0 && (
                <p className="text-xs text-dj-texte-muet">Aucun chapitre disponible dans ce programme.</p>
              )}
            </div>
          </div>

          {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

          <button
            onClick={creer}
            disabled={envoi || !titre.trim() || chapitreIdsChoisis.length === 0}
            className="self-end rounded-full bg-dj-gradient px-5 py-2 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {envoi ? "Création…" : "Créer"}
          </button>
        </div>
      )}

      {examens === null && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-12 rounded-xl border border-dj-bordure" />
        </div>
      )}
      {examens?.length === 0 && <p className="text-sm text-dj-texte-muet">Aucun examen ou devoir pour l&apos;instant.</p>}
      {examens && examens.length > 0 && (
        <div className="flex flex-col gap-2">
          {examens.map((ex) => (
            <div
              key={ex.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-dj-texte">{ex.titre}</p>
                <p className="text-xs text-dj-texte-muet">
                  {TYPES_EXAMEN.find((t) => t.id === ex.type)?.label ?? ex.type} · {ex.chapitre_ids.length} chapitre(s)
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <AjouterAClassementBouton cibleType="examen" cibleId={ex.id} />
                <button
                  onClick={() => supprimer(ex.id, ex.titre)}
                  className="text-xs text-dj-texte-muet transition-colors hover:text-[#F87171]"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionPublierPlugin({ programmeId }: { programmeId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [publie, setPublie] = useState(false);

  async function publier() {
    if (!nom.trim()) return;
    if (!window.confirm(`Publier ce programme comme plugin « ${nom.trim()} », visible et téléchargeable par tous ?`))
      return;
    setEnvoi(true);
    setErreur(null);
    try {
      await publierProgrammeCommePlugin(programmeId, nom.trim());
      setPublie(true);
      setOuvert(false);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dj-bordure bg-dj-surface p-4">
      <div className="flex items-center gap-2">
        <Rocket size={16} className="text-dj-accent-1" />
        <h3 className="text-sm font-semibold text-dj-texte">Publier comme plugin</h3>
      </div>
      <p className="text-xs text-dj-texte-muet">
        Rend cet espace (matières, chapitres, documents, exercices) téléchargeable en un bloc par d&apos;autres élèves
        de la même classe.
      </p>

      {publie ? (
        <p className="flex items-center gap-1.5 text-sm text-dj-succes">
          <Check size={14} /> Plugin publié.
        </p>
      ) : ouvert ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du plugin"
            className="flex-1 rounded-full border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
          />
          <button
            onClick={publier}
            disabled={envoi || !nom.trim()}
            className="rounded-full bg-dj-gradient px-5 py-2 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {envoi ? "Publication…" : "Publier"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOuvert(true)}
          className="self-start rounded-full border border-dj-bordure px-4 py-2 text-sm text-dj-texte transition-colors hover:border-dj-bordure-forte"
        >
          Publier comme plugin
        </button>
      )}
      {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}
    </div>
  );
}
