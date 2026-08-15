"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Maximize2, Minimize2, MessageSquarePlus, History } from "lucide-react";
import { appelerApi, lireOutilsChatAgent } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";
import { ChatIA } from "./ChatIA";
import { MessageAffiche, nettoyerMessageHistorique } from "./BulleMessage";
import { CompteRequisModal } from "@/components/CompteRequisModal";
import { Logo } from "@/components/Logo";
import { useHauteurVisuelle } from "@/lib/useHauteurVisuelle";

// Chat flottant global (refonte "Mon espace = l'app", 15/08/2026, demande
// Bourama : "il faut un bouton pour ouvrir le chat en plein écran"). Avant
// cette refonte, le chat était app/page.tsx tout entier (la home). Cette
// logique de chargement (détail agent + outils + historique) est reprise
// ICI à l'identique, mais montée une seule fois au niveau du layout de
// l'app (voir components/AppShell.tsx) -- jamais remontée en changeant de
// section de Mon espace, pour ne jamais perdre la conversation en cours.
//
// Trois états, jamais de démontage de ChatIA entre eux (juste un
// changement d'habillage CSS) pour préserver la conversation :
// - "fermee" : uniquement la bulle icône, ChatIA reste monté mais caché.
// - "mini" : petite fenêtre utilisable en bas à droite (bas de l'écran
//   sur mobile, faute de place).
// - "plein_ecran" : overlay plein écran, même logique de hauteur visuelle
//   que l'ancien app/page.tsx (clavier mobile, voir useHauteurVisuelle).

type EtatChat = "fermee" | "mini" | "plein_ecran";

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

const AGENT_INVITE_ID = "clovis";
const LIMITE_MESSAGES_INVITE = 5;
const CLE_COMPTEUR_INVITE = "clovis_nb_messages_invite";
const TITRE_ACCUEIL_CLOVIS = "Clovis";
const SOUS_TITRE_ACCUEIL_CLOVIS = "L'IA qui t'aide dans tes études.";

export function ChatFlottant({ connecte }: { connecte: boolean }) {
  const [etat, setEtat] = useState<EtatChat>("fermee");
  const [chargement, setChargement] = useState<"chargement" | "pret" | "erreur">("chargement");
  const [erreur, setErreur] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [cle, setCle] = useState(() => crypto.randomUUID());
  const [messagesInitiaux, setMessagesInitiaux] = useState<MessageAffiche[]>([]);
  const [nbMessages, setNbMessages] = useState(0);
  const [compteRequis, setCompteRequis] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [outilsActifsAgent, setOutilsActifsAgent] = useState<{
    outils: string[];
    actions_locales: string[];
  } | null>(null);
  const [historique, setHistorique] = useState<FilConversation[]>([]);
  useHauteurVisuelle();

  // Chargé dès le montage du layout (pas seulement à l'ouverture du
  // widget) : l'ouverture doit être instantanée, jamais un écran de
  // chargement qui apparaît après coup.
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const detail: AgentDetail = await appelerApi(`/api/agents/${AGENT_INVITE_ID}`);
        const [outils, fils] = await Promise.all([
          lireOutilsChatAgent(AGENT_INVITE_ID).catch(() => ({ outils: [], actions_locales: [] })),
          appelerApi(`/api/historique/${AGENT_INVITE_ID}/conversations`).catch(() => [] as FilConversation[]),
        ]);
        if (!annule) {
          setAgent(detail);
          setOutilsActifsAgent(outils);
          setHistorique(fils as FilConversation[]);
          setChargement("pret");
        }
      } catch (e) {
        if (!annule) {
          setErreur(messageErreur(e));
          setChargement("erreur");
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
    setHistoriqueOuvert(false);
  }

  async function selectionnerConversation(fil: FilConversation) {
    if (!agent) return;
    try {
      const cheminId = fil.conversation_id ?? "legacy";
      const lignes: { role: "user" | "assistant"; content: string; created_at: string }[] = await appelerApi(
        `/api/historique/${agent.id}/conversations/${cheminId}`
      );
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
      setHistoriqueOuvert(false);
    } catch {
      // Échec de rechargement : on garde le fil courant plutôt que de
      // casser tout le widget.
    }
  }

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

  // Bulle fermée : toujours affichée (sauf pendant le tout premier
  // chargement, pour ne jamais montrer un bouton qui échouerait au clic).
  if (etat === "fermee") {
    return (
      <button
        onClick={() => setEtat("mini")}
        aria-label="Ouvrir le chat"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-dj-gradient text-[#1A0D02] shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  const pleinEcran = etat === "plein_ecran";

  return (
    <div
      className={
        pleinEcran
          ? "fixed inset-0 z-[110] flex flex-col bg-dj-fond"
          : "fixed bottom-5 right-5 z-40 flex h-[min(70dvh,600px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-dj-bordure bg-dj-fond shadow-[0_4px_30px_rgba(0,0,0,0.45)]"
      }
      style={pleinEcran ? { height: "var(--vh-visuelle, 100dvh)" } : undefined}
    >
      {/* En-tête compact -- remplace le rail complet de l'ancienne
          SidebarChatLite (historique/nouvelle conversation), le reste
          (partager, avis, pourquoi Clovis) vit désormais dans la nav
          principale de l'app (voir AppSidebar.tsx). */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-dj-bordure px-3 py-2.5">
        <Logo taille={20} />
        <span className="font-display text-sm font-bold text-dj-texte">Clovis</span>

        <div className="ml-auto flex items-center gap-1">
          {nbMessages > 0 && (
            <button
              onClick={nouvelleConversation}
              title="Nouvelle conversation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
            >
              <MessageSquarePlus size={16} />
            </button>
          )}
          {historique.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setHistoriqueOuvert((v) => !v)}
                title="Historique"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  historiqueOuvert ? "bg-dj-surface-haute text-dj-accent-1" : "text-dj-texte-muet hover:bg-dj-surface-haute hover:text-dj-texte"
                }`}
              >
                <History size={16} />
              </button>
              {historiqueOuvert && (
                <div className="absolute right-0 top-9 z-10 max-h-64 w-56 animate-dj-fade-in-rapide overflow-y-auto rounded-xl border border-dj-bordure bg-dj-surface p-1 shadow-lg">
                  {historique.map((fil) => (
                    <button
                      key={fil.conversation_id ?? "legacy"}
                      onClick={() => selectionnerConversation(fil)}
                      className="block w-full truncate rounded-lg px-2.5 py-2 text-left text-sm text-dj-texte transition-colors hover:bg-dj-surface-haute"
                    >
                      {fil.titre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setEtat(pleinEcran ? "mini" : "plein_ecran")}
            title={pleinEcran ? "Réduire" : "Plein écran"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            {pleinEcran ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => setEtat("fermee")}
            title="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {chargement === "chargement" && (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-dj-bordure border-t-dj-accent-1" />
          </div>
        )}

        {chargement === "erreur" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm text-dj-texte">{erreur ?? "Une erreur est survenue."}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-dj-gradient px-4 py-2 text-sm font-bold text-[#1A0D02]"
            >
              Réessayer
            </button>
          </div>
        )}

        {chargement === "pret" && agent && (
          <ChatIA
            key={cle}
            agentId={agent.id}
            nomAgent="Clovis"
            titreAccueil={TITRE_ACCUEIL_CLOVIS}
            sousTitreAccueil={SOUS_TITRE_ACCUEIL_CLOVIS}
            iconePersonnalisee={<Logo taille={40} />}
            conversationId={cle}
            messagesInitiaux={messagesInitiaux}
            onMessagesChange={setNbMessages}
            modelesDisponibles={agent.modeles_disponibles}
            modeleChoisi={agent.modele_choisi}
            outilsActifsAgent={outilsActifsAgent}
            boutonSansEnseignant={false}
            avantEnvoi={verifierLimiteInvite}
          />
        )}
      </div>

      {compteRequis && (
        <CompteRequisModal texte="Crée un compte pour continuer." onFerme={() => setCompteRequis(false)} />
      )}
    </div>
  );
}
