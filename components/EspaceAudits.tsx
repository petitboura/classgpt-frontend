"use client";

import { useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { listerProgrammes, listerAuditsProgramme, type Programme, type AuditMatiere } from "@/lib/api";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";
import { CTACompteRequis } from "./CTACompteRequis";

// Onglet "Audits" (2026-08-12, chantier "connexion IA <-> structure
// programme"). Nouvelle section DÉDIÉE, volontairement séparée de "Mes
// comportements" (décision Bourama 12/08) -- affiche, pour chaque
// programme puis chaque matière, le texte que l'IA a écrit en analysant
// tout le contenu réel de la matière (chapitres, limites, documents).
//
// Lecture seule : l'audit est réécrit en place chaque lundi par l'IA
// (voir core/audit_programme.py côté backend) -- rien à éditer ici,
// n'importe quelle modification serait de toute façon écrasée au lundi
// suivant.

export function EspaceAudits() {
  const [programmes, setProgrammes] = useState<Programme[] | null>(null);
  const [programmeOuvert, setProgrammeOuvert] = useState<Programme | null>(null);
  // Refonte "Mon espace = l'app" : section auparavant inatteignable sans
  // compte, même détection 401 que les autres.
  const [sansCompte, setSansCompte] = useState(false);

  useEffect(() => {
    listerProgrammes()
      .then(setProgrammes)
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) {
          setSansCompte(true);
        }
        setProgrammes([]);
      });
  }, []);

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour voir les audits de ton programme." />;
  }

  return (
    <div className="flex animate-dj-fade-in-rapide flex-col gap-4">
      <p className="text-sm text-dj-texte-muet">
        Chaque lundi, Clovis relit tout le contenu réel de chacune de tes matières (chapitres, limites,
        documents) et écrit ici un état des lieux, limites et attentes à respecter. Texte réécrit
        automatiquement chaque semaine, tu ne peux pas le modifier directement.
      </p>

      {programmeOuvert ? (
        <AuditsDuProgramme programme={programmeOuvert} onRetour={() => setProgrammeOuvert(null)} />
      ) : (
        <ListeProgrammesAudits programmes={programmes} onOuvrir={setProgrammeOuvert} />
      )}
    </div>
  );
}

function ListeProgrammesAudits({
  programmes,
  onOuvrir,
}: {
  programmes: Programme[] | null;
  onOuvrir: (p: Programme) => void;
}) {
  if (programmes === null) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    );
  }

  if (programmes.length === 0) {
    return (
      <p className="rounded-xl border border-dj-bordure p-4 text-sm text-dj-texte-muet">
        Aucun programme pour l&apos;instant, crée-en un dans l&apos;onglet &laquo;&nbsp;Mon programme&nbsp;&raquo;
        pour que Clovis puisse commencer à l&apos;auditer.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {programmes.map((p) => (
        <button
          key={p.id}
          onClick={() => onOuvrir(p)}
          className="flex items-center gap-3 rounded-xl border border-dj-bordure p-4 text-left transition-colors hover:border-dj-accent-1"
        >
          <BookOpen size={18} className="flex-shrink-0 text-dj-texte-muet" />
          <div>
            <div className="font-semibold text-dj-texte">{p.niveau}</div>
            {p.nom && <div className="text-sm text-dj-texte-muet">{p.nom}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

function AuditsDuProgramme({ programme, onRetour }: { programme: Programme; onRetour: () => void }) {
  const [audits, setAudits] = useState<AuditMatiere[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [matiereOuverte, setMatiereOuverte] = useState<string | null>(null);

  useEffect(() => {
    charger();
  }, [programme.id]);

  function charger() {
    setErreur(null);
    listerAuditsProgramme(programme.id)
      .then(setAudits)
      .catch((e) => setErreur(messageErreur(e)));
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={onRetour} className="self-start text-sm text-dj-texte-muet transition-colors hover:text-dj-texte">
        ← {programme.niveau}
      </button>

      {erreur && <p className="text-sm text-[var(--dj-erreur)]">{erreur}</p>}

      {audits === null ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : audits.length === 0 ? (
        <p className="rounded-xl border border-dj-bordure p-4 text-sm text-dj-texte-muet">
          Aucune matière dans ce programme pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {audits.map((audit) => (
            <div key={audit.matiere_id} className="rounded-xl border border-dj-bordure p-4">
              <button
                onClick={() => setMatiereOuverte(matiereOuverte === audit.matiere_id ? null : audit.matiere_id)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-semibold text-dj-texte">{audit.matiere_nom}</span>
                {audit.derniere_execution ? (
                  <span className="flex items-center gap-1 text-xs text-dj-texte-muet">
                    <RefreshCw size={12} />
                    {new Date(audit.derniere_execution).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                ) : (
                  <span className="text-xs text-dj-texte-muet">Pas encore audité</span>
                )}
              </button>

              {matiereOuverte === audit.matiere_id && (
                <div className="mt-3 whitespace-pre-wrap text-sm text-dj-texte-muet">
                  {audit.texte ?? "Cette matière n'a pas encore de contenu à analyser (ajoute des chapitres, documents ou exercices dans « Mon programme »)."}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
