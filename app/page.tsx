"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { appelerApi } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { ChatIA } from "@/components/chat/ChatIA";
import { MessageAffiche, nettoyerMessageHistorique } from "@/components/chat/BulleMessage";
import { SidebarChatLite } from "@/components/chat/SidebarChatLite";
import { useHauteurVisuelle } from "@/lib/useHauteurVisuelle";

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

type AgentDetail = {
  id: string;
  nom: string;
  icone_url: string | null;
  titre_accueil: string;
  sous_titre_accueil: string;
  modeles_disponibles?: { modele_id: string; label: string; distributeur: string; palier: string }[];
  modele_choisi?: string | null;
  bouton_sans_enseignant?: boolean;
  contenu_dynamique_par_matiere?: boolean;
  section_mes_comportements?: boolean;
};

type FilConversation = {
  conversation_id: string | null;
  titre: string;
  derniere_activite: string;
};

export default function PageAccueilChat() {
  const [etat, setEtat] = useState<"chargement" | "pret" | "erreur">("chargement");
  const [erreur, setErreur] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [cle, setCle] = useState(() => crypto.randomUUID());
  const [messagesInitiaux, setMessagesInitiaux] = useState<MessageAffiche[]>([]);
  const [nbMessages, setNbMessages] = useState(0);
  useHauteurVisuelle();

  useEffect(() => {
    let annule = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Pas de page de présentation publique (brief section 3) :
        // arrivée sans session -> écran de connexion propre à Class GPT
        // (partie 2 du brief, pas encore construite au moment d'écrire
        // cette partie -- la route existera une fois la partie 2 livrée).
        window.location.href = "/connexion";
        return;
      }
      try {
        const monRole: { role: string | null; agent_id: string | null } = await appelerApi(
          "/api/roles/moi"
        );
        if (!monRole.agent_id) {
          // Ne devrait normalement plus arriver -- /inscription attribue
          // le rôle automatiquement (09/08, décision Bourama : parcours
          // simple, pas d'écran "code ou établissement"). Filet de
          // sécurité si un compte plus ancien ou créé autrement n'a
          // vraiment aucun rôle : retour à /connexion plutôt que
          // /rejoindre (désactivé, code encore présent pour une
          // réactivation progressive plus tard).
          window.location.href = "/connexion";
          return;
        }
        const detail: AgentDetail = await appelerApi(`/api/agents/${monRole.agent_id}`);
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
        contenuDynamiqueParMatiere={agent.contenu_dynamique_par_matiere}
        sectionMesComportements={agent.section_mes_comportements}
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
          iconeUrl={agent.icone_url}
          titreAccueil={agent.titre_accueil}
          sousTitreAccueil={agent.sous_titre_accueil}
          conversationId={cle}
          messagesInitiaux={messagesInitiaux}
          onMessagesChange={setNbMessages}
          modelesDisponibles={agent.modeles_disponibles}
          modeleChoisi={agent.modele_choisi}
          boutonSansEnseignant={agent.bouton_sans_enseignant ?? true}
        />
      </div>
    </div>
  );
}
