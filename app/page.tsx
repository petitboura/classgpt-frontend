"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { appelerApi } from "@/lib/api";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { ChatIA } from "@/components/chat/ChatIA";
import { MessageAffiche, nettoyerMessageHistorique } from "@/components/chat/BulleMessage";
import { SidebarChatLite } from "@/components/chat/SidebarChatLite";
import { CompteRequisModal } from "@/components/CompteRequisModal";
import { useHauteurVisuelle } from "@/lib/useHauteurVisuelle";
import { Logo } from "@/components/Logo";
import { creerEtudiantAutonome } from "@/lib/invitations";

// Partie 3 du brief ("Expérience de chat directe") : contrairement à
// djiguigne-frontend (app/agent/[id]/chat/page.tsx), il n'y a PAS de
// paramètre [id] dans l'URL -- Class GPT n'a qu'un seul agent visible à
// la fois, et il n'est jamais choisi par l'utilisateur (pas de sélecteur,
// brief section 3). Il est résolu dynamiquement selon le rôle du compte
// connecté via GET /api/roles/moi, qui renvoie déjà agent_id résolu
// côté backend (voir api/roles.py:AGENT_PAR_ROLE -- nitrux pour un
// étudiant, stirux pour un enseignant, lirinus pour un établissement).
// Ne JAMAIS coder un agent_id en dur ici : un compte connecté avec un
// autre rôle recevrait alors le mauvais agent.
//
// Mode invité (09/08, demande Bourama) : "atterrir dans le chat
// d'abord avant l'inscription". Arrivée sans session -> plus de
// redirection immédiate vers /connexion, on atterrit directement ici
// dans une coquille de chat générique (pas d'agent résolu, donc pas de
// titre/icône spécifique -- juste la marque Class GPT). Aucun appel API
// authentifié tant qu'il n'y a pas de session. Toute action qui exige
// un compte (ici : envoyer un premier message) ouvre CompteRequisModal
// au lieu d'un message d'erreur -- jamais de redirection silencieuse.
// Le modal pointe par défaut vers /inscription, pas /connexion
// (décision explicite de Bourama : la création de compte est le
// chemin par défaut). Après connexion ou inscription, les deux pages
// renvoient déjà vers "/" (router.push("/")) -- on retombe ici, cette
// fois avec une session, et le flux normal (résolution d'agent) prend
// le relais.

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

// Mode invité (09/08, décision Bourama) : avant inscription, on ne connaît
// pas le rôle du visiteur (rien à résoudre via /api/roles/moi, qui exige
// une session) -- il faut donc un agent fixe. Choix explicite : l'agent
// "étudiant" (nitrux), le même que celui attribué par défaut à
// l'inscription libre (voir /inscription et
// api/invitations_classgpt.py:creer_etudiant_autonome côté backend) --
// cohérent avec le fait que tout nouveau compte sans code d'invitation
// devient "etudiant" par défaut.
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
// djiguigne-frontend, où le déblocage par code est un vrai mécanisme.
// Sur Class GPT, l'étudiant "autonome" créé par l'inscription libre n'a
// jamais d'enseignant ni de code -- ce texte est donc toujours faux ici,
// que ce soit en mode invité ou déjà connecté. Titre/sous-titre/icône
// fixes volontaires, pas un oubli de dynamisme.
const TITRE_ACCUEIL_CLASSGPT = "Class GPT";
const SOUS_TITRE_ACCUEIL_CLASSGPT = "L'IA qui t'aide dans tes études.";

export default function PageAccueilChat() {
  const [etat, setEtat] = useState<"chargement" | "pret" | "erreur" | "invite">("chargement");
  const [erreur, setErreur] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [cle, setCle] = useState(() => crypto.randomUUID());
  const [messagesInitiaux, setMessagesInitiaux] = useState<MessageAffiche[]>([]);
  const [nbMessages, setNbMessages] = useState(0);
  const [agentInvite, setAgentInvite] = useState<AgentDetail | null>(null);
  const [cleInvite, setCleInvite] = useState(() => crypto.randomUUID());
  const [compteRequis, setCompteRequis] = useState(false);
  useHauteurVisuelle();

  useEffect(() => {
    let annule = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Plus de redirection immédiate (correctif 09/08) : coquille de
        // chat invité rendue plus bas.
        if (!annule) setEtat("invite");
        // Best-effort, sert uniquement à sectionMesComportements plus bas
        // (titre/sous-titre/icône sont maintenant fixes, voir
        // TITRE_ACCUEIL_CLASSGPT -- ce fetch ne les fournit plus depuis
        // le correctif du 09/08). agentId reste "nitrux" (constante, pas
        // dépendante de cet appel) même si ce fetch échoue, donc le chat
        // invité reste utilisable dans tous les cas.
        try {
          const detail: AgentDetail = await appelerApi(`/api/agents/${AGENT_INVITE_ID}`);
          if (!annule) setAgentInvite(detail);
        } catch {
          // Repli silencieux, voir commentaire ci-dessus.
        }
        return;
      }
      try {
        let monRole: { role: string | null; agent_id: string | null } = await appelerApi(
          "/api/roles/moi"
        );
        if (!monRole.agent_id) {
          // CORRIGÉ le 10/08 (Bourama : "enlève ces histoires de rôles,
          // rend mon truc IA normal") -- avant : redirection forcée vers
          // /inscription, qui refaisait passer un compte DÉJÀ CONNECTÉ
          // par le formulaire email+mot de passe (signUp), cassé dès que
          // le mot de passe retapé ne correspondait pas exactement à
          // celui du compte existant (voir lib/authFallback.ts). Un
          // compte avec une session valide n'a jamais besoin de repasser
          // par là : il ne lui manque qu'un nom_affiche pour que le
          // profil existe -- on le déduit automatiquement (email/
          // téléphone) et on attribue le rôle "etudiant" en silence,
          // sans écran ni redirection. Ne peut pas échouer pour "rôle
          // déjà choisi" ici, vu qu'on vient de vérifier agent_id vide.
          const nomAffiche =
            session.user.email?.split("@")[0] || session.user.phone || "Utilisateur";
          try {
            await creerEtudiantAutonome(nomAffiche);
            monRole = await appelerApi("/api/roles/moi");
          } catch (e) {
            if (!(e instanceof ErreurApi && e.code === "ROLE_DEJA_CHOISI")) throw e;
            monRole = await appelerApi("/api/roles/moi");
          }
        }
        // Repli (10/08, bug repéré par Bourama : "Agent introuvable" sur
        // son propre compte) : un profil peut avoir un rôle qui existe
        // bien en base mais n'est pas l'un des 3 rôles Class GPT
        // (etudiant/enseignant/etablissement) -- ex. role="admin", un
        // rôle plateforme légitime (voir
        // api/permissions_hierarchie.py:_est_admin, utilisé pour
        // djiguigne-frontend) mais absent de AGENT_PAR_ROLE côté
        // backend. Dans ce cas monRole.agent_id reste null même après
        // la tentative de provisioning ci-dessus (elle échoue en
        // ROLE_DEJA_CHOISI, normal, le rôle existe déjà) -- sans ce
        // repli, l'appel suivant part sur /api/agents/undefined. Ne
        // touche PAS le rôle en base (qui reste "admin", légitime
        // ailleurs) : uniquement l'agent affiché ici sur Class GPT.
        const agentIdResolu = monRole.agent_id || AGENT_INVITE_ID;
        const detail: AgentDetail = await appelerApi(`/api/agents/${agentIdResolu}`);
        if (!annule) {
          setAgent(detail);
          setRole(monRole.role);
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

  function nouvelleConversationInvite() {
    setCleInvite(crypto.randomUUID());
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

  if (etat === "chargement") {
    return (
      <div className="flex h-dvh items-center justify-center bg-dj-fond">
        {/* Jamais un texte figé "Chargement..." (standards de dev,
            règle 7) -- animation douce plutôt qu'un état brut. */}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dj-bordure border-t-dj-accent-1" />
      </div>
    );
  }

  if (etat === "invite") {
    // Lu à chaque tentative d'envoi plutôt que gardé en state React :
    // évite un re-render de toute la page à chaque message, et reste de
    // toute façon la source de vérité unique (persiste au rechargement,
    // voir décision Bourama 09/08).
    function verifierLimiteInvite(): boolean {
      const brut = window.localStorage.getItem(CLE_COMPTEUR_INVITE);
      const compte = brut ? parseInt(brut, 10) || 0 : 0;
      if (compte >= LIMITE_MESSAGES_INVITE) {
        setCompteRequis(true);
        return false;
      }
      window.localStorage.setItem(CLE_COMPTEUR_INVITE, String(compte + 1));
      return true;
    }

    return (
      <div className="flex h-dvh" style={{ height: "var(--vh-visuelle, 100dvh)" }}>
        <SidebarChatLite
          agentId={AGENT_INVITE_ID}
          role={null}
          aDesMessages={nbMessages > 0}
          conversationActiveId={cleInvite}
          onNouvelleConversation={nouvelleConversationInvite}
          onSelectionnerConversation={() => {}}
          sectionMesComportements={agentInvite?.section_mes_comportements}
          onNecessiteCompte={() => setCompteRequis(true)}
        />
        <div className="flex-1 overflow-hidden">
          <ChatIA
            key={cleInvite}
            agentId={AGENT_INVITE_ID}
            // Même choix que pour un compte connecté (voir plus bas) :
            // jamais le nom technique de l'agent réel.
            nomAgent="Class GPT"
            titreAccueil={TITRE_ACCUEIL_CLASSGPT}
            sousTitreAccueil={SOUS_TITRE_ACCUEIL_CLASSGPT}
            iconePersonnalisee={<Logo taille={28} />}
            conversationId={cleInvite}
            onMessagesChange={setNbMessages}
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
        role={role}
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
