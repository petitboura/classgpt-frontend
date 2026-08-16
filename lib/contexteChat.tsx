"use client";

import { createContext, useContext } from "react";

export type EtatChat = "fermee" | "mini" | "plein_ecran";

type ContexteChatValeur = {
  etat: EtatChat;
  setEtat: (etat: EtatChat) => void;
};

// L'état du chat flottant (fermee/mini/plein_ecran) vivait auparavant
// dans ChatFlottant.tsx lui-même. Remonté ici dans AppShell.tsx pour
// pouvoir être piloté depuis d'autres écrans (ex: bouton "Ouvrir le
// chat" sur l'écran d'accueil, 16/08/2026) -- ChatFlottant devient un
// composant contrôlé (etat + setEtat reçus en props).
export const ContexteChat = createContext<ContexteChatValeur | null>(null);

export function useOuvrirChat() {
  const ctx = useContext(ContexteChat);
  return () => ctx?.setEtat("mini");
}
