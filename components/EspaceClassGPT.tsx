"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles, Library, Brain } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { lireMonRole, sectionComportementsActivee, type MonRole } from "@/lib/api";
import { EspaceInviter } from "./EspaceInviter";
import { EspaceEquipe } from "./EspaceEquipe";
import { EspaceDiffuser } from "./EspaceDiffuser";
import { EspaceRejoindre } from "./EspaceRejoindre";
import { EspaceBibliotheque } from "./EspaceBibliotheque";
import { MesComportements } from "./MesComportements";
import { MaMemoire } from "./MaMemoire";
import { messageErreur } from "@/lib/erreurs";

/**
 * Espace utilisateur réduit de Class GPT (partie 4 du brief). Volontairement
 * SANS : onglet "administrer", onglet "mes IA", bouton retour vitrine,
 * sélecteur/historique de plusieurs agents.
 *
 * Passé en onglets (09/08, demande Bourama) :
 * - "Bureau" : l'ancien contenu unique de cette page (inviter, suivre son
 *   équipe, diffuser des documents) -- renommé, devient un onglet parmi
 *   d'autres au lieu d'être toute la page. Réservé à établissement/enseignant,
 *   comme avant (un étudiant n'a rien en dessous de lui à gérer).
 * - "Mes comportements" : consignes perso pour l'IA de la personne connectée,
 *   affiché seulement si activé pour cette IA précise (section_mes_comportements
 *   côté agent, résolu dynamiquement via monRole.agent_id -- jamais un id
 *   d'agent codé en dur).
 * - "Bibliothèque" et "Ma mémoire" : personnels à chaque utilisateur, donc
 *   ouverts à TOUS les rôles y compris étudiant (contrairement à "Bureau").
 *
 * Assumé ici (à confirmer par Bourama) : comme ces deux derniers onglets
 * concernent un étudiant autant qu'un enseignant/établissement, le lien
 * "Mon espace" dans la sidebar doit maintenant être visible pour TOUS les
 * rôles connectés, pas seulement établissement/enseignant comme avant --
 * voir SidebarChatLite.tsx.
 */

type OngletId = "bureau" | "comportements" | "bibliotheque" | "memoire";

export function EspaceClassGPT() {
  const [monRole, setMonRole] = useState<MonRole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [comportementsActifs, setComportementsActifs] = useState(false);
  const [onglet, setOnglet] = useState<OngletId | null>(null);

  useEffect(() => {
    lireMonRole()
      .then((r) => {
        setMonRole(r);
        if (r.agent_id) {
          sectionComportementsActivee(r.agent_id).then(setComportementsActifs);
        }
      })
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  const peutVoirBureau = monRole?.role === "etablissement" || monRole?.role === "enseignant";

  const onglets = useMemo(() => {
    const liste: { id: OngletId; label: string; Icone: typeof Briefcase }[] = [];
    if (peutVoirBureau) liste.push({ id: "bureau", label: "Bureau", Icone: Briefcase });
    if (comportementsActifs) liste.push({ id: "comportements", label: "Mes comportements", Icone: Sparkles });
    liste.push({ id: "bibliotheque", label: "Bibliothèque", Icone: Library });
    liste.push({ id: "memoire", label: "Ma mémoire", Icone: Brain });
    return liste;
  }, [peutVoirBureau, comportementsActifs]);

  useEffect(() => {
    if (onglet !== null) return;
    if (onglets.length > 0) setOnglet(onglets[0].id);
  }, [onglet, onglets]);

  if (chargement) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl border border-dj-bordure bg-dj-surface-haute"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </main>
    );
  }

  if (erreur) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <p className="animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>
      </main>
    );
  }

  if (!monRole?.role) {
    return (
      <main className="mx-auto flex min-h-[70vh] items-center justify-center px-4">
        <EspaceRejoindre onTermine={() => window.location.reload()} />
      </main>
    );
  }

  const titreEquipe = monRole.role === "etablissement" ? "Mes enseignants" : "Mes élèves";

  return (
    <main className="mx-auto max-w-2xl animate-dj-fade-in space-y-4 px-4 pb-24 pt-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-dj-texte-muet transition-colors hover:text-dj-texte"
      >
        <ArrowLeft size={16} />
        Retour au chat
      </Link>
      <h1 className="font-display text-xl font-bold text-dj-texte">Mon espace</h1>

      <div className="flex gap-2 overflow-x-auto border-b border-dj-bordure">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={
              "flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors " +
              (onglet === o.id
                ? "border-dj-accent-1 text-dj-texte"
                : "border-transparent text-dj-texte-muet hover:text-dj-texte")
            }
          >
            <o.Icone size={16} />
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "bureau" && peutVoirBureau && (
        <div className="flex flex-col gap-4">
          <EspaceInviter />
          <EspaceEquipe titre={titreEquipe} />
          <EspaceDiffuser />
        </div>
      )}

      {onglet === "comportements" && comportementsActifs && monRole.agent_id && (
        <div className="max-w-md">
          <MesComportements agentId={monRole.agent_id} />
        </div>
      )}

      {onglet === "bibliotheque" && <EspaceBibliotheque />}

      {onglet === "memoire" && <MaMemoire />}
    </main>
  );
}
