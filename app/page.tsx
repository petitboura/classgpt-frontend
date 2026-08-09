"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { appelerApi } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { ChatIA } from "@/components/chat/ChatIA";
import { MessageAffiche, nettoyerMessageHistorique } from "@/components/chat/BulleMessage";
import { SidebarChatLite } from "@/components/chat/SidebarChatLite";
import { CompteRequisModal } from "@/components/CompteRequisModal";
import { Logo } from "@/components/Logo";
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

export default function PageAccueilChat() {
  const [etat, setEtat] = useState<"chargement" | "pret" | "erreur" | "invite">("chargement");
  const [erreur, setErreur] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [cle, setCle] = useState(() => crypto.randomUUID());
  const [messagesInitiaux, setMessagesInitiaux] = useState<MessageAffiche[]>([]);
  const [nbMessages, setNbMessages] = useState(0);
  const [messageInvite, setMessageInvite] = useState("");
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
        // chat invité rendue plus bas, aucun appel API tant qu'il n'y a
        // pas de session.
        if (!annule) setEtat("invite");
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
          // vraiment aucun rôle : vers /inscription (formulaire par
          // défaut, décision du 09/08), pas /rejoindre (désactivé, code
          // encore présent pour une réactivation progressive plus tard).
          window.location.href = "/inscription";
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

  if (etat === "invite") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-dj-fond px-4">
        <div className="flex items-center gap-2.5">
          <Logo taille={32} />
          <span className="font-display text-lg font-bold tracking-tight text-dj-texte">
            Class <span className="text-dj-accent-1">GPT</span>
          </span>
        </div>
        <p className="max-w-sm text-center text-sm text-dj-texte-muet">
          Pose ta question à l&apos;IA de ton établissement.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!messageInvite.trim()) return;
            setCompteRequis(true);
          }}
          className="flex w-full max-w-lg items-center gap-2"
        >
          <input
            value={messageInvite}
            onChange={(e) => setMessageInvite(e.target.value)}
            placeholder="Écris ta question…"
            className="flex-1 rounded-full border border-dj-bordure bg-dj-surface px-4 py-3 text-dj-texte outline-none focus:border-dj-accent-1"
          />
          <button
            type="submit"
            disabled={!messageInvite.trim()}
            className="rounded-full bg-dj-gradient px-5 py-3 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>

        {compteRequis && (
          <CompteRequisModal
            texte="Crée un compte pour continuer la conversation."
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
