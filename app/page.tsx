"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { appelerApi } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { ChatIA } from "@/components/chat/ChatIA";
import { MessageAffiche, nettoyerMessageHistorique } from "@/components/chat/BulleMessage";
import { SidebarChatLite } from "@/components/chat/SidebarChatLite";
import { CompteRequisModal } from "@/components/CompteRequisModal";
import { useHauteurVisuelle } from "@/lib/useHauteurVisuelle";
import { Logo } from "@/components/Logo";
import { creerEtudiantAutonome } from "@/lib/invitations";

// Partie 3 du brief ("Expérience de chat directe") : contrairement à
// djiguigne-frontend (app/agent/[id]/chat/page.tsx), il n'y a PAS de
// paramètre [id] dans l'URL -- Class GPT n'a qu'un seul agent, pour
// tout le monde, connecté ou pas (brief section 3 : pas de sélecteur).
//
// SIMPLIFIÉ le 10/08 (Bourama : "enlève ces histoires de rôles [...]
// tout le monde est pareil [...] c'est en train de tout niquer") --
// avant : l'agent dépendait d'un rôle résolu via /api/roles/moi
// (étudiant/enseignant/établissement, chacun un agent différent), avec
// un provisionnement silencieux si le compte n'en avait pas. Ce
// mécanisme n'existe plus ici : l'agent est TOUJOURS "nitrux"
// (AGENT_INVITE_ID plus bas), qu'on soit connecté ou non -- plus aucun
// appel à /api/roles/moi ni à creerEtudiantAutonome dans ce fichier. La
// notion de rôle continue d'exister côté backend/base pour d'autres
// produits Djiguignè (djiguigne-frontend), mais Class GPT ne la lit
// plus du tout.

type AgentDetail = {
  id: string;
  nom: string;
  icone_url: string | null;
  titre_accueil: string;
  sous_titre_accueil: string;
  modeles_disponibles?: { modele_id: string; label: string; distributeur: string; palier: string }[];
  modele_choisi?: string | null;
  bouton_sans_enseignant?: boolean;
  section_mes_comportements?: boolean;
};

type FilConversation = {
  conversation_id: string | null;
  titre: string;
  derniere_activite: string;
};

// Seul agent de Class GPT, pour tout le monde (voir commentaire plus
// haut) -- endpoint public (`/api/agents/{id}`), consultable sans
// session.
const AGENT_INVITE_ID = "nitrux";

// L'inscription n'est demandée qu'à partir du 5ème message envoyé par un
// visiteur non connecté (09/08, décision Bourama) -- avant ça, le chat
// est librement utilisable. Le backend accepte déjà les requêtes
// anonymes sans limite (api/chat.py:envoyer_message, utilisateur_optionnel) --
// la limite est donc uniquement appliquée ici, côté client.
const LIMITE_MESSAGES_INVITE = 5;
const CLE_COMPTEUR_INVITE = "classgpt_nb_messages_invite";

// Même logique que nomAgent="Class GPT" plus bas (fuite du nom
// technique de l'agent réel) mais pour le titre et le sous-titre de
// l'écran de démarrage (09/08, bug repéré par Bourama) : titre_accueil
// ("Nitrux") et sous_titre_accueil ("Débloque une matière avec le code
// de ton enseignant...") viennent de l'agent partagé avec
// djiguigne-frontend, où le déblocage par code est un vrai mécanisme,
// absent de Class GPT. Titre/sous-titre/icône fixes volontaires, pas un
// oubli de dynamisme.
const TITRE_ACCUEIL_CLASSGPT = "Class GPT";
const SOUS_TITRE_ACCUEIL_CLASSGPT = "L'IA qui t'aide dans tes études.";

export default function PageAccueilChat() {
  const [etat, setEtat] = useState<"chargement" | "pret" | "erreur">("chargement");
  const [erreur, setErreur] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [connecte, setConnecte] = useState(false);
  const [cle, setCle] = useState(() => crypto.randomUUID());
  const [messagesInitiaux, setMessagesInitiaux] = useState<MessageAffiche[]>([]);
  const [nbMessages, setNbMessages] = useState(0);
  const [compteRequis, setCompteRequis] = useState(false);
  useHauteurVisuelle();

  useEffect(() => {
    let annule = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!annule) setConnecte(!!session);

      // Best-effort, en arrière-plan, jamais bloquant : si le compte
      // connecté n'a encore aucun profil (nom_affiche/slug), on lui en
      // crée un silencieusement pour que les commentaires/notes/articles
      // qu'il publie ailleurs sur Djiguignè affichent un nom -- sans le
      // moindre effet sur l'agent affiché ici (toujours "nitrux", voir
      // plus haut) ni sur l'accès au chat, qui ne dépend jamais du
      // résultat de cet appel.
      if (session) {
        const nomAffiche =
          session.user.email?.split("@")[0] || session.user.phone || "Utilisateur";
        creerEtudiantAutonome(nomAffiche).catch(() => {});
      }

      try {
        const detail: AgentDetail = await appelerApi(`/api/agents/${AGENT_INVITE_ID}`);
        if (!annule) {
          setAgent(detail);
          setEtat("pret");
        }
      } catch (e) {
        if (!annule) {
          setErreur(messageErreur(e));
          setEtat("erreur");
        }
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  function nouvelleConversation() {
    setCle(crypto.randomUUID());
    setMessagesInitiaux([]);
    setNbMessages(0);
  }

  async function selectionnerConversation(fil: FilConversation) {
    if (!agent) return;
    try {
      const cheminId = fil.conversation_id ?? "legacy";
      const lignes: { role: "user" | "assistant"; content: string; created_at: string }[] =
        await appelerApi(`/api/historique/${agent.id}/conversations/${cheminId}`);
      setCle(fil.conversation_id ?? crypto.randomUUID());
      setMessagesInitiaux(
        lignes.map((l) => {
          if (l.role !== "user") {
            return { id: null, role: l.role, content: l.content, created_at: l.created_at };
          }
          const { texte, pieceJointe } = nettoyerMessageHistorique(l.content);
          return { id: null, role: l.role, content: texte, created_at: l.created_at, pieceJointe };
        })
      );
      setNbMessages(lignes.length);
    } catch {
      // Échec de rechargement : on garde le fil courant plutôt que de
      // casser toute la page (même choix que ChatAgentClient côté
      // djiguigne-frontend).
    }
  }

  // Lu à chaque tentative d'envoi plutôt que gardé en state React :
  // évite un re-render de toute la page à chaque message, et reste de
  // toute façon la source de vérité unique (persiste au rechargement,
  // voir décision Bourama 09/08). Ne s'applique jamais à un compte
  // connecté (`connecte`), uniquement à un visiteur.
  function verifierLimiteInvite(): boolean {
    if (connecte) return true;
    const brut = window.localStorage.getItem(CLE_COMPTEUR_INVITE);
    const compte = brut ? parseInt(brut, 10) || 0 : 0;
    if (compte >= LIMITE_MESSAGES_INVITE) {
      setCompteRequis(true);
      return false;
    }
    window.localStorage.setItem(CLE_COMPTEUR_INVITE, String(compte + 1));
    return true;
  }

  if (etat === "chargement") {
    return (
      <div className="flex h-dvh items-center justify-center bg-dj-fond">
        {/* Jamais un texte figé "Chargement..." (standards de dev,
            règle 7) -- animation douce plutôt qu'un état brut. */}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dj-bordure border-t-dj-accent-1" />
      </div>
    );
  }

  if (etat === "erreur" || !agent) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-dj-fond px-6 text-center">
        <p className="text-dj-texte">{erreur ?? "Une erreur est survenue."}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-dj-gradient px-4 py-2 font-bold text-[#1A0D02]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh" style={{ height: "var(--vh-visuelle, 100dvh)" }}>
      <SidebarChatLite
        agentId={agent.id}
        role={connecte ? "etudiant" : null}
        aDesMessages={nbMessages > 0}
        conversationActiveId={cle}
        onNouvelleConversation={nouvelleConversation}
        onSelectionnerConversation={selectionnerConversation}
        sectionMesComportements={agent.section_mes_comportements}
        onNecessiteCompte={() => setCompteRequis(true)}
      />
      <div className="flex-1 overflow-hidden">
        <ChatIA
          key={cle}
          agentId={agent.id}
          // Correctif (08/08) : agent.nom renvoyait le nom technique
          // interne de l'agent (ex. "Lirinus"), affiché tel quel dans
          // "{nomAgent} réfléchit" / "Pose ta question à {nomAgent}" —
          // fuite directe du nom d'un agent de l'écosystème Djiguignè,
          // contraire au brief (section 3 : l'IA ne doit jamais révéler
          // qu'elle a un nom technique ou qu'il existe d'autres agents).
          // Nom de marque fixe volontaire ici, pas un oubli de
          // dynamisme : c'est justement le point, Class GPT n'a qu'un
          // seul nom, toujours le même, quel que soit l'agent réel
          // derrière.
          nomAgent="Class GPT"
          titreAccueil={TITRE_ACCUEIL_CLASSGPT}
          sousTitreAccueil={SOUS_TITRE_ACCUEIL_CLASSGPT}
          iconePersonnalisee={<Logo taille={28} />}
          conversationId={cle}
          messagesInitiaux={messagesInitiaux}
          onMessagesChange={setNbMessages}
          modelesDisponibles={agent.modeles_disponibles}
          modeleChoisi={agent.modele_choisi}
          boutonSansEnseignant={agent.bouton_sans_enseignant ?? true}
          avantEnvoi={verifierLimiteInvite}
        />
      </div>

      {compteRequis && (
        <CompteRequisModal
          texte="Crée un compte pour continuer."
          onFerme={() => setCompteRequis(false)}
        />
      )}
    </div>
  );
}
