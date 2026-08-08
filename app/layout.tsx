import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Class GPT — squelette (partie 1).
//
// Correctif mobile repris de djiguigne-frontend : viewportFit "cover" +
// interactiveWidget "resizes-content" pour que le clavier virtuel ne casse
// pas la mise en page sur mobile (utile dès qu'il y aura un champ de
// saisie de chat, partie 3).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

// Les 3 polices de la marque Djiguignè, chargées à l'identique (next/font,
// auto-hébergées, zéro requête Google au runtime), exposées en variables
// CSS consommées par tailwind.config.ts.
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

// Titre/description volontairement neutres : Class GPT ne se présente
// jamais comme une section de Djiguignè, ni publiquement ni dans ses
// métadonnées techniques.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://classgpt.vercel.app"),
  title: "Class GPT",
  description: "Class GPT",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
