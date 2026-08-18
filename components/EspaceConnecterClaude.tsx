"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Guide "Utiliser Clovis dans Claude" (18/08, demande Bourama : nouvel
// onglet dédié dans la sidebar, guide étape par étape avec des images
// plutôt que du texte seul -- "un guide d'image avec quoi mettre où").
//
// Les illustrations sont des mockups SVG dessinés à la main, PAS des
// captures d'écran réelles de Claude : le logo et l'interface de Claude
// appartiennent à Anthropic, on ne les reproduit pas. Chaque mockup
// recrée schématiquement l'écran concerné (mêmes libellés que la vraie
// interface Claude au 18/08/2026, vérifiés) avec les tokens de couleur
// dj-* pour rester cohérent en thème clair/sombre. Seul le mockup de
// l'étape 4 (écran d'autorisation) reproduit fidèlement notre propre
// écran (app/oauth/consent/page.tsx), puisque c'est du contenu Clovis.
//
// URL du serveur MCP Clovis confirmée par Bourama le 18/08 :
// https://clovis-backend-production.up.railway.app/mcp/espace

const URL_MCP_CLOVIS = "https://clovis-backend-production.up.railway.app/mcp/espace";

export function EspaceConnecterClaude() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-dj-texte-muet">
        Connecte ton compte Clovis à Claude pour que Claude puisse utiliser ce que tu as dans Clovis (ta mémoire,
        tes comportements, ta bibliothèque) directement dans vos conversations. Ça se fait une seule fois.
      </p>

      <EtapeGuide numero={1} titre="Ouvre les paramètres de Claude">
        <p>
          Dans Claude, clique sur ton icône de profil en bas à gauche, puis va dans{" "}
          <span className="font-semibold text-dj-texte">Connecteurs</span>.
        </p>
        <MockupParametres />
      </EtapeGuide>

      <EtapeGuide numero={2} titre="Ajoute un connecteur personnalisé">
        <p>
          Clique sur le bouton <span className="font-semibold text-dj-texte">+</span>, puis choisis{" "}
          <span className="font-semibold text-dj-texte">Ajouter un connecteur personnalisé</span>.
        </p>
        <MockupAjouter />
      </EtapeGuide>

      <EtapeGuide numero={3} titre="Remplis le formulaire">
        <p>
          Donne-lui un nom (ex. <span className="font-semibold text-dj-texte">Clovis</span>) et colle l&apos;URL
          ci-dessous dans le champ <span className="font-semibold text-dj-texte">URL du serveur MCP distant</span>,
          puis clique <span className="font-semibold text-dj-texte">Ajouter</span>.
        </p>
        <UrlACopier />
        <MockupFormulaire />
      </EtapeGuide>

      <EtapeGuide numero={4} titre="Autorise l'accès à ton compte Clovis">
        <p>
          Clique <span className="font-semibold text-dj-texte">Connecter</span> : Claude t&apos;envoie vers Clovis.
          Connecte-toi à ton compte si besoin, vérifie les accès demandés, puis clique{" "}
          <span className="font-semibold text-dj-texte">Autoriser</span>.
        </p>
        <MockupAutorisation />
      </EtapeGuide>

      <EtapeGuide numero={5} titre="Active Clovis dans une conversation" dernier>
        <p>
          De retour dans Claude, ouvre une conversation, clique sur{" "}
          <span className="font-semibold text-dj-texte">+</span> à côté de la zone de texte, et active{" "}
          <span className="font-semibold text-dj-texte">Clovis</span>. C&apos;est prêt.
        </p>
        <MockupActivation />
      </EtapeGuide>
    </div>
  );
}

function EtapeGuide({
  numero,
  titre,
  dernier = false,
  children,
}: {
  numero: number;
  titre: string;
  dernier?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 animate-dj-fade-in-rapide" style={{ animationDelay: `${(numero - 1) * 60}ms` }}>
      <div className="flex flex-shrink-0 flex-col items-center">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-dj-accent-1 text-sm font-bold text-[#1A0D02]">
          {numero}
        </span>
        {!dernier && <span className="mt-1 w-px flex-1 bg-dj-bordure" />}
      </div>
      <div className={`flex-1 space-y-3 ${dernier ? "" : "pb-4"}`}>
        <h2 className="font-display text-sm font-semibold text-dj-texte">{titre}</h2>
        <div className="space-y-1.5 text-sm leading-relaxed text-dj-texte-muet">{children}</div>
      </div>
    </div>
  );
}

function UrlACopier() {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(URL_MCP_CLOVIS);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Pas grave si le presse-papier échoue -- l'URL reste affichée à
      // l'écran, copiable à la main.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 overflow-x-auto rounded-xl border border-dj-bordure-forte bg-dj-surface-haute px-3 py-2.5 font-mono text-xs text-dj-texte">
        {URL_MCP_CLOVIS}
      </span>
      <button
        onClick={copier}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-cgpt-bouton border border-dj-bordure px-3 py-2.5 text-xs font-medium text-dj-texte-muet transition-colors hover:text-dj-texte"
      >
        {copie ? <Check size={14} /> : <Copy size={14} />}
        {copie ? "Copié !" : "Copier"}
      </button>
    </div>
  );
}

// ---- Mockups SVG (illustrations schématiques, pas des captures réelles) ----

function CadreMockup({ children, hauteur = 150 }: { children: React.ReactNode; hauteur?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-dj-bordure bg-dj-surface-haute"
      style={{ height: hauteur }}
    >
      {children}
    </div>
  );
}

function Curseur({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0,0 L0,13 L3.2,10.2 L5.4,15 L7.4,14.1 L5.2,9.3 L9,9 Z"
        fill="var(--dj-accent-1)"
        stroke="var(--dj-fond)"
        strokeWidth="0.8"
      />
    </g>
  );
}

function MockupParametres() {
  return (
    <CadreMockup>
      <svg viewBox="0 0 320 150" className="h-full w-full" aria-hidden="true">
        <rect x="0" y="0" width="90" height="150" fill="var(--dj-surface)" />
        <rect x="0" y="0" width="320" height="150" fill="none" />
        {/* liste de paramètres */}
        <rect x="106" y="16" width="120" height="10" rx="2" fill="var(--dj-bordure)" />
        <rect x="106" y="40" width="90" height="8" rx="2" fill="var(--dj-texte-muet)" opacity="0.4" />
        <rect x="98" y="58" width="180" height="26" rx="6" fill="var(--dj-accent-1)" opacity="0.15" />
        <rect x="98" y="58" width="180" height="26" rx="6" fill="none" stroke="var(--dj-accent-1)" strokeWidth="1.5" />
        <rect x="106" y="66" width="70" height="10" rx="2" fill="var(--dj-accent-1)" />
        <rect x="106" y="94" width="70" height="8" rx="2" fill="var(--dj-texte-muet)" opacity="0.4" />
        {/* icône profil en bas à gauche */}
        <circle cx="24" cy="128" r="12" fill="var(--dj-accent-1)" opacity="0.3" />
        <circle cx="24" cy="128" r="12" fill="none" stroke="var(--dj-accent-1)" strokeWidth="1.5" />
        <Curseur x={20} y={120} />
      </svg>
    </CadreMockup>
  );
}

function MockupAjouter() {
  return (
    <CadreMockup>
      <svg viewBox="0 0 320 150" className="h-full w-full" aria-hidden="true">
        <rect x="16" y="14" width="130" height="12" rx="2" fill="var(--dj-texte-muet)" opacity="0.5" />
        {/* bouton + */}
        <circle cx="290" cy="20" r="14" fill="var(--dj-accent-1)" opacity="0.2" />
        <circle cx="290" cy="20" r="14" fill="none" stroke="var(--dj-accent-1)" strokeWidth="1.5" />
        <path d="M290,13 V27 M283,20 H297" stroke="var(--dj-accent-1)" strokeWidth="2" strokeLinecap="round" />
        <Curseur x={296} y={26} />
        {/* menu déroulant */}
        <rect x="180" y="40" width="132" height="60" rx="8" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
        <rect x="192" y="50" width="100" height="8" rx="2" fill="var(--dj-texte-muet)" opacity="0.4" />
        <rect x="188" y="66" width="116" height="24" rx="5" fill="var(--dj-accent-1)" opacity="0.18" />
        <rect x="188" y="66" width="116" height="24" rx="5" fill="none" stroke="var(--dj-accent-1)" strokeWidth="1.3" />
        <rect x="196" y="74" width="90" height="8" rx="2" fill="var(--dj-accent-1)" />
        {/* liste de connecteurs déjà présents */}
        <rect x="16" y="40" width="150" height="20" rx="5" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
        <rect x="16" y="66" width="150" height="20" rx="5" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
      </svg>
    </CadreMockup>
  );
}

function MockupFormulaire() {
  return (
    <CadreMockup hauteur={170}>
      <svg viewBox="0 0 320 170" className="h-full w-full" aria-hidden="true">
        <rect x="30" y="14" width="260" height="142" rx="10" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
        <rect x="46" y="28" width="90" height="10" rx="2" fill="var(--dj-texte-muet)" opacity="0.5" />

        {/* champ Nom */}
        <rect x="46" y="46" width="60" height="7" rx="2" fill="var(--dj-texte-muet)" opacity="0.6" />
        <rect x="46" y="56" width="228" height="20" rx="5" fill="var(--dj-surface-haute)" stroke="var(--dj-bordure)" />
        <rect x="54" y="62" width="34" height="8" rx="2" fill="var(--dj-accent-1)" opacity="0.7" />

        {/* champ URL */}
        <rect x="46" y="86" width="150" height="7" rx="2" fill="var(--dj-texte-muet)" opacity="0.6" />
        <rect x="46" y="96" width="228" height="20" rx="5" fill="var(--dj-surface-haute)" stroke="var(--dj-bordure-forte)" strokeWidth="1.3" />
        <rect x="54" y="102" width="150" height="8" rx="2" fill="var(--dj-accent-1)" opacity="0.7" />

        {/* bouton Ajouter */}
        <rect x="200" y="128" width="74" height="20" rx="5" fill="var(--dj-accent-1)" />
        <rect x="214" y="134" width="46" height="8" rx="2" fill="var(--dj-fond)" opacity="0.85" />
        <Curseur x={266} y={138} />
      </svg>
    </CadreMockup>
  );
}

function MockupAutorisation() {
  return (
    <CadreMockup hauteur={170}>
      <svg viewBox="0 0 320 170" className="h-full w-full" aria-hidden="true">
        <rect x="70" y="10" width="180" height="152" rx="12" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
        <circle cx="160" cy="32" r="9" fill="var(--dj-accent-1)" />
        <rect x="118" y="48" width="84" height="10" rx="2" fill="var(--dj-texte)" opacity="0.8" />
        <rect x="108" y="64" width="104" height="7" rx="2" fill="var(--dj-texte-muet)" opacity="0.5" />

        {/* accès demandés */}
        <rect x="86" y="80" width="148" height="34" rx="6" fill="var(--dj-surface-haute)" stroke="var(--dj-bordure)" />
        <path d="M94,90 l3,3 l5,-6" stroke="var(--dj-accent-1)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="106" y="88" width="90" height="6" rx="2" fill="var(--dj-texte-muet)" opacity="0.6" />
        <path d="M94,102 l3,3 l5,-6" stroke="var(--dj-accent-1)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="106" y="100" width="70" height="6" rx="2" fill="var(--dj-texte-muet)" opacity="0.6" />

        {/* boutons Refuser / Autoriser */}
        <rect x="86" y="128" width="66" height="20" rx="5" fill="none" stroke="var(--dj-bordure)" />
        <rect x="99" y="134" width="40" height="8" rx="2" fill="var(--dj-texte-muet)" opacity="0.6" />
        <rect x="168" y="128" width="66" height="20" rx="5" fill="var(--dj-accent-1)" />
        <rect x="180" y="134" width="42" height="8" rx="2" fill="var(--dj-fond)" opacity="0.85" />
        <Curseur x={226} y={138} />
      </svg>
    </CadreMockup>
  );
}

function MockupActivation() {
  return (
    <CadreMockup hauteur={130}>
      <svg viewBox="0 0 320 130" className="h-full w-full" aria-hidden="true">
        {/* zone de saisie */}
        <rect x="16" y="86" width="288" height="30" rx="10" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
        <circle cx="34" cy="101" r="10" fill="var(--dj-accent-1)" opacity="0.18" />
        <circle cx="34" cy="101" r="10" fill="none" stroke="var(--dj-accent-1)" strokeWidth="1.5" />
        <path d="M34,96 V106 M29,101 H39" stroke="var(--dj-accent-1)" strokeWidth="2" strokeLinecap="round" />
        <rect x="54" y="97" width="100" height="8" rx="2" fill="var(--dj-texte-muet)" opacity="0.35" />

        {/* menu connecteurs ouvert au-dessus */}
        <rect x="16" y="14" width="150" height="60" rx="8" fill="var(--dj-surface)" stroke="var(--dj-bordure)" />
        <rect x="28" y="24" width="90" height="8" rx="2" fill="var(--dj-texte-muet)" opacity="0.5" />
        <rect x="24" y="40" width="126" height="24" rx="5" fill="var(--dj-accent-1)" opacity="0.18" />
        <rect x="24" y="40" width="126" height="24" rx="5" fill="none" stroke="var(--dj-accent-1)" strokeWidth="1.3" />
        <rect x="32" y="48" width="60" height="8" rx="2" fill="var(--dj-accent-1)" />
        {/* interrupteur actif */}
        <rect x="126" y="46" width="18" height="10" rx="5" fill="var(--dj-succes)" />
        <circle cx="139" cy="51" r="4" fill="var(--dj-surface)" />
        <Curseur x={34} y={64} />
      </svg>
    </CadreMockup>
  );
}
