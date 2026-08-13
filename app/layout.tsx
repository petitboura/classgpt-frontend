import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
// KaTeX/MathLive (rendu de formules dans BulleMessage.tsx et
// EditeurMathsRiche.tsx) : dans djiguigne-frontend ce CSS est scopé à la
// seule route /agent/[id]/chat (audit vitesse du 01/08, voir globals.css).
// Ici l'app entière EST le chat (pas de vitrine/blog à alléger), donc pas
// besoin de ce découpage par route — chargé une fois au niveau racine.
import "katex/dist/katex.min.css";
import "mathlive/fonts.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ReveilBackend } from "@/components/ReveilBackend";

// Polices identiques à la charte Djiguignè (brief section 4a), chargées en
// local (next/font, zéro requête Google au runtime) — même mécanisme que
// djiguigne-frontend/app/layout.tsx, dont ce fichier est dérivé.
//
// Volontairement ABSENT ici : SessionSyncVitrine (synchronisation de
// session avec djiguigne-ai.vercel.app). Clovis ne doit jamais
// laisser transparaître l'existence de l'écosystème Djiguignè (brief
// section 1) — inclure ce composant romprait ce principe dès le layout
// racine, avant même la moindre page.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Police serif éditoriale pour le corps des réponses de l'IA uniquement
// (09/08, demande Bourama : "façon Claude" pour le texte des réponses --
// pas pour les titres, qui restent en Bricolage Grotesque, juste
// agrandis). Décision explicite : identité partagée avec
// djiguigne-frontend, donc le même choix de police y est repris à
// l'identique.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lecture",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Clovis",
  description: "Clovis",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Clovis" },
  // Icône d'onglet (favicon) et icône iOS "ajouter à l'écran d'accueil"
  // (12/08) : désormais générées automatiquement par Next.js depuis
  // app/icon.png et app/apple-icon.png (convention native du App
  // Router, aucune config ici nécessaire). Avant ça, ni djiguigne-
  // frontend ni ce dépôt n'avaient de vrai favicon -- seule l'icône
  // PWA (manifest) était branchée, ce qui laissait un onglet
  // navigateur sans icône. La ligne `icons: { apple: ... }` qui
  // pointait vers icone-192.png est retirée : app/apple-icon.png fait
  // maintenant ce travail nativement, la garder aurait dupliqué la
  // balise <link rel="apple-touch-icon">.
};

export default function RacineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}
    >
      <body className="min-h-screen bg-dj-fond font-sans text-dj-texte antialiased">
        <ServiceWorkerRegistration />
        <ReveilBackend />
        {children}
      </body>
    </html>
  );
}
