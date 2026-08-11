"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles, Library, Brain } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { lireMonRole, type MonRole } from "@/lib/api";
import { creerEtudiantAutonome } from "@/lib/invitations";
import { supabase } from "@/lib/supabase";
import { EspaceInviter } from "./EspaceInviter";
import { EspaceEquipe } from "./EspaceEquipe";
import { EspaceDiffuser } from "./EspaceDiffuser";
import { EspaceBibliotheque } from "./EspaceBibliotheque";
import { MesComportements } from "./MesComportements";
import { MaMemoire } from "./MaMemoire";
import { messageErreur } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";

/**
 * Espace utilisateur réduit de Class GPT (partie 4 du brief). Volontairement
 * SANS : onglet "administrer", onglet "mes IA", bouton retour vitrine,
 * sélecteur/historique de plusieurs agents.
 *
 * Passé en onglets (09/08, demande Bourama) :
 * - "Bureau" : l'ancien contenu unique de cette page (inviter, suivre son
 *   équipe, diffuser des documents) -- renommé, devient un onglet parmi
 *   d'autres au lieu d'être toute la page.
 * - "Mes comportements" : consignes perso pour l'IA de la personne connectée.
 * - "Bibliothèque" et "Ma mémoire" : personnels à chaque utilisateur.
 *
 * Correctif (10/08, demande explicite Bourama : "bureau activé toujours et
 * mes comportements toujours dans class gpt") : les deux onglets sont
 * désormais TOUJOURS affichés, quel que soit le rôle connecté ou la valeur
 * de agents.section_mes_comportements en base -- avant, "Bureau" était
 * réservé établissement/enseignant et "Mes comportements" conditionné à ce
 * flag par agent (`sectionComportementsActivee`). Vérifié avant ce
 * changement (audit backend, ne pas juste espérer que ça marche) :
 * - EspaceInviter (`GET/POST /api/roles/invitation`) et EspaceEquipe
 *   (`GET /api/roles/mon-equipe`) renvoient 403 ACTION_RESERVEE_A_CE_ROLE
 *   pour un étudiant -- MAIS ce code a un message français propre côté
 *   backend (core/erreurs.py:MESSAGES_FR), affiché tel quel par
 *   messageErreur(), jamais de JSON brut. Un étudiant ouvrant "Bureau" voit
 *   donc "Cette action n'est pas disponible pour ton rôle." sur ces deux
 *   sections -- pas cassé, juste pas fonctionnel pour lui sur 2 des 3.
 * - EspaceDiffuser fonctionne pour tout rôle (contrôle 403 déjà retiré
 *   côté backend le 07/08, cibles vides si aucun rattachement réel).
 * - Les endpoints comportements (api/comportements_etudiants.py) n'ont
 *   AUCUNE restriction de rôle ni de vérification du flag
 *   section_mes_comportements -- ce flag ne gouvernait que l'affichage de
 *   l'onglet, jamais l'accès aux données. Donc "toujours" ici ne casse
 *   rien côté backend, juste bypasse un interrupteur d'affichage.
 * `sectionComportementsActivee` et le state qui en dépendait ici ont été
 * retirés (code mort maintenant que l'onglet est inconditionnel) --
 * SidebarChatLite.tsx a son PROPRE flag `sectionMesComportements` (prop
 * distincte, alimentée par agent.section_mes_comportements), ça n'a
 * jamais été un état partagé avec ce fichier.
 *
 * Écran de repli "code reçu ou créer un établissement" (EspaceRejoindre,
 * fichier conservé mais retiré de l'affichage, 09/08 demande Bourama) :
 * n'a plus lieu d'être depuis que /inscription attribue déjà "etudiant"
 * silencieusement à tout nouveau compte -- ce cas (role: null pour un
 * compte connecté) ne devrait plus arriver qu'en edge case (ancien
 * compte, inscription interrompue...). Traité désormais silencieusement
 * ci-dessous plutôt qu'avec un écran de choix, voir useEffect dédié.
 */

type OngletId = "bureau" | "comportements" | "bibliotheque" | "memoire";

export function EspaceClassGPT() {
  const [monRole, setMonRole] = useState<MonRole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<OngletId | null>(null);

  useEffect(() => {
    lireMonRole()
      .then((r) => setMonRole(r))
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  // Edge case (voir commentaire d'en-tête) : compte connecté sans rôle.
  // Devient "etudiant" silencieusement, sans montrer d'écran de choix --
  // repli du repli, "Sans nom" si aucun nom n'est disponible sur la
  // session (même convention que _nom_affiche_ou_repli côté backend,
  // api/roles.py).

  useEffect(() => {
    if (chargement || erreur) return;
    if (!monRole || monRole.role) return;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const nomAffiche = session?.user?.email?.split("@")[0] || "Sans nom";
        await creerEtudiantAutonome(nomAffiche);
        window.location.reload();
      } catch (e) {
        setErreur(messageErreur(e));
      }
    })();
  }, [chargement, erreur, monRole]);

  const onglets = useMemo(() => {
    const liste: { id: OngletId; label: string; Icone: typeof Briefcase }[] = [
      { id: "bureau", label: "Bureau", Icone: Briefcase },
      { id: "comportements", label: "Mes comportements", Icone: Sparkles },
      { id: "bibliotheque", label: "Bibliothèque", Icone: Library },
      { id: "memoire", label: "Ma mémoire", Icone: Brain },
    ];
    return liste;
  }, []);

  useEffect(() => {
    if (onglet !== null) return;
    if (onglets.length > 0) setOnglet(onglets[0].id);
  }, [onglet, onglets]);

  if (chargement) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-14 rounded-xl border border-dj-bordure"
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
    // Auto-provisioning en cours (useEffect ci-dessus) -- pas d'écran de
    // choix, juste le même squelette de chargement que l'état initial.
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-14 rounded-xl border border-dj-bordure"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
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

      {onglet === "bureau" && (
        <div className="flex flex-col gap-4">
          <EspaceInviter />
          <EspaceEquipe titre={titreEquipe} />
          <EspaceDiffuser />
        </div>
      )}

      {onglet === "comportements" && monRole.agent_id && (
        <div className="max-w-md">
          <MesComportements agentId={monRole.agent_id} />
        </div>
      )}

      {onglet === "bibliotheque" && <EspaceBibliotheque />}

      {onglet === "memoire" && <MaMemoire />}
    </main>
  );
}
