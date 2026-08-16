"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, MessageSquare, Library, ScanSearch, BookOpen, type LucideIcon } from "lucide-react";
import { appelerApi, listerProgrammes, listerAuditsProgramme, listerMatieresProgramme } from "@/lib/api";
import { dateRelative } from "@/lib/dateRelative";
import { useOuvrirChat } from "@/lib/contexteChat";
import { Logo } from "@/components/Logo";
import { Skeleton } from "@/components/Skeleton";
import { ONGLETS } from "@/components/AppSidebar";

// Écran d'accueil réel de l'app (16/08/2026, demande Bourama : "faut une
// vraie écran d'accueil pour l'app, pas un lieu dans l'app" -- avant
// cette page, "/" redirigeait simplement vers /programme, qui n'a jamais
// été conçu pour être un accueil). Combine, comme demandé ("les deux, à
// voir ensemble") :
// - un écran de bienvenue (message + accès rapide au chat)
// - un tableau de bord (raccourcis vers chaque section + activité
//   récente RÉELLE -- pas d'échéances, aucune donnée de date limite
//   n'existe dans le modèle programme actuel, voir échange avec Bourama)

type ActiviteItem = {
  id: string;
  type: "conversation" | "bibliotheque" | "audit" | "programme";
  Icone: LucideIcon;
  label: string;
  date: string;
  href: string;
};

export function EcranAccueil() {
  const ouvrirChat = useOuvrirChat();
  const [activite, setActivite] = useState<ActiviteItem[] | null>(null);

  useEffect(() => {
    let annule = false;

    async function charger() {
      const items: ActiviteItem[] = [];

      // Conversations récentes -- même endpoint que ChatFlottant.tsx.
      try {
        const fils: { conversation_id: string | null; titre: string; derniere_activite: string }[] =
          await appelerApi("/api/historique/clovis/conversations");
        for (const f of fils) {
          items.push({
            id: `conv-${f.conversation_id ?? "legacy"}`,
            type: "conversation",
            Icone: MessageSquare,
            label: `Conversation : ${f.titre}`,
            date: f.derniere_activite,
            href: "#chat",
          });
        }
      } catch {
        // Visiteur sans compte ou erreur réseau -- section ignorée, pas
        // d'erreur bloquante pour un simple résumé.
      }

      // Fichiers récemment ajoutés à la Bibliothèque.
      try {
        const fichiers: { id: string; nom_fichier: string; created_at: string }[] = await appelerApi(
          "/api/bibliotheque"
        );
        for (const f of fichiers) {
          items.push({
            id: `biblio-${f.id}`,
            type: "bibliotheque",
            Icone: Library,
            label: `Ajouté à la bibliothèque : ${f.nom_fichier}`,
            date: f.created_at,
            href: "/bibliotheque",
          });
        }
      } catch {
        // Idem.
      }

      // Audits + matières modifiées -- nécessite de lister les
      // programmes d'abord (pas de endpoint global "tous mes audits").
      try {
        const programmes = await listerProgrammes();
        for (const p of programmes) {
          try {
            const audits = await listerAuditsProgramme(p.id);
            for (const a of audits) {
              if (!a.derniere_execution) continue;
              items.push({
                id: `audit-${a.matiere_id}`,
                type: "audit",
                Icone: ScanSearch,
                label: `Audit : ${a.matiere_nom}`,
                date: a.derniere_execution,
                href: "/audits",
              });
            }
          } catch {
            // Programme sans audits accessibles -- ignoré.
          }

          try {
            const matieres = await listerMatieresProgramme(p.id);
            for (const m of matieres) {
              items.push({
                id: `matiere-${m.id}`,
                type: "programme",
                Icone: BookOpen,
                label: `Programme modifié : ${m.nom}`,
                date: m.updated_at,
                href: "/programme",
              });
            }
          } catch {
            // Idem.
          }
        }
      } catch {
        // Visiteur sans compte -- pas de programme, section ignorée.
      }

      if (!annule) {
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivite(items.slice(0, 8));
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl animate-dj-fade-in space-y-8 px-4 pb-24 pt-8 md:pt-12">
      {/* Bienvenue */}
      <div className="flex flex-col items-start gap-4">
        <Logo taille={40} />
        <div>
          <h1 className="font-display text-2xl font-bold text-dj-texte">Bonjour</h1>
          <p className="mt-1 text-sm text-dj-texte-muet">L&apos;IA qui t&apos;aide dans tes études.</p>
        </div>
        <button
          onClick={ouvrirChat}
          className="flex items-center gap-2 rounded-xl bg-dj-gradient px-4 py-2.5 text-sm font-bold text-[#1A0D02] transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle size={18} />
          Ouvrir le chat
        </button>
      </div>

      {/* Raccourcis vers chaque section */}
      <div>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-dj-texte-muet">
          Mon espace
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ONGLETS.map((o) => (
            <Link
              key={o.id}
              href={o.href}
              className="flex flex-col items-start gap-2 rounded-xl border border-dj-bordure bg-dj-surface p-4 transition-colors hover:bg-dj-surface-haute"
            >
              <o.Icone size={20} className="text-dj-accent-1" />
              <span className="text-sm font-semibold text-dj-texte">{o.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Activité récente */}
      <div>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-dj-texte-muet">
          Activité récente
        </h2>

        {activite === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        )}

        {activite !== null && activite.length === 0 && (
          <p className="text-sm text-dj-texte-muet">Rien pour l&apos;instant -- lance une conversation pour commencer.</p>
        )}

        {activite !== null && activite.length > 0 && (
          <div className="flex flex-col gap-1">
            {activite.map((item) =>
              item.href === "#chat" ? (
                <button
                  key={item.id}
                  onClick={ouvrirChat}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-dj-surface"
                >
                  <item.Icone size={16} className="flex-shrink-0 text-dj-texte-muet" />
                  <span className="min-w-0 flex-1 truncate text-sm text-dj-texte">{item.label}</span>
                  <span className="flex-shrink-0 text-xs text-dj-texte-muet">{dateRelative(item.date)}</span>
                </button>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-dj-surface"
                >
                  <item.Icone size={16} className="flex-shrink-0 text-dj-texte-muet" />
                  <span className="min-w-0 flex-1 truncate text-sm text-dj-texte">{item.label}</span>
                  <span className="flex-shrink-0 text-xs text-dj-texte-muet">{dateRelative(item.date)}</span>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
