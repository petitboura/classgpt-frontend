"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatFlottant } from "@/components/chat/ChatFlottant";
import { CatalogueClovis } from "@/components/CatalogueClovis";

// Coquille de l'app entière (refonte "Mon espace = l'app", 15/08/2026).
// Monte UNE SEULE FOIS, au niveau du layout (voir app/(app)/layout.tsx) :
// - la session (connecte), lue une fois et transmise à la nav + au chat
// - la nav principale (AppSidebar)
// - le chat flottant (ChatFlottant), jamais démonté en changeant de
//   section -- sinon la conversation en cours serait perdue
// - le catalogue "Pourquoi Clovis ?", qui garde son comportement
//   d'ouverture automatique à la toute première visite (14/08, demande
//   Bourama), indépendamment de la section sur laquelle on atterrit.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [connecte, setConnecte] = useState(false);
  const [catalogueOuvert, setCatalogueOuvert] = useState(false);

  useEffect(() => {
    let annule = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!annule) setConnecte(!!session);
    });
    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem("clovis_catalogue_vu")) return;
    localStorage.setItem("clovis_catalogue_vu", "1");
    setCatalogueOuvert(true);
  }, []);

  return (
    <div className="flex h-dvh">
      <AppSidebar connecte={connecte} onOuvrirCatalogue={() => setCatalogueOuvert(true)} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ChatFlottant connecte={connecte} />
      {catalogueOuvert && <CatalogueClovis onFerme={() => setCatalogueOuvert(false)} />}
    </div>
  );
}
