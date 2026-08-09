import type { Config } from "tailwindcss";

// Thème repris à l'identique de djiguigne-frontend (palette, typographie,
// dégradés, animations dj-*) -- ne pas dévier de ces valeurs sans
// décision explicite de Bourama, pour garder une cohérence visuelle avec
// le reste de l'écosystème même si ce produit ne le montre jamais.
//
// Tokens "cgpt-*" (partie 5, traitement "à main levée") : propres à Class
// GPT, n'existent pas dans djiguigne-frontend -- easings sur mesure
// (jamais de ease-in-out générique) + rayons de bordure légèrement
// irréguliers, cf. brief section 4b.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dj: {
          fond: "#F4F3EE",
          surface: "#FBFAF8",
          "surface-haute": "#FFFFFF",
          bordure: "rgba(43,33,24,0.10)",
          "bordure-forte": "rgba(193,68,14,0.35)",
          "accent-1": "#E8934A",
          "accent-2": "#C1440E",
          texte: "#2B2118",
          "texte-muet": "#6E5F4D",
          succes: "#16A34A",
          inactif: "#B0A79B",
        },
      },
      backgroundImage: {
        "dj-gradient": "linear-gradient(135deg, #F2A65A 0%, #D9631F 55%, #8A2E0A 100%)",
        "dj-hero-glow":
          "radial-gradient(ellipse 120% 60% at 50% -10%, rgba(232,147,74,0.10), transparent 60%)",
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        // Corps des réponses de l'IA uniquement (09/08, façon Claude) --
        // voir commentaire dans app/layout.tsx.
        lecture: ["var(--font-lecture)", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        // Apparitions (fade-in, entrée d'un message, ouverture d'un
        // panneau) : décélération franche, jamais de rebond.
        "cgpt-doux": "cubic-bezier(.25,.8,.35,1)",
        // Interactions directes (survol, clic) : très léger dépassement
        // (1.04) avant de se stabiliser -- imite l'inertie d'un geste de
        // la main.
        "cgpt-geste": "cubic-bezier(.36,0,.2,1.04)",
      },
      borderRadius: {
        // Écart de 1 à 3px entre les 4 coins -- assez subtil pour ne
        // jamais lire comme un bug de rendu, assez réel pour casser le
        // tracé vectoriel parfaitement figé (brief 4b : "les courbes ne
        // sont jamais parfaitement rondes ou parfaitement droites").
        "cgpt-bouton": "12px 13px 12px 14px",
        "cgpt-carte": "16px 17px 16px 18px",
      },
      keyframes: {
        "dj-fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "dj-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Fondu rapide (2026-07-28, demande Bourama : "rien ne doit
        // s'afficher brut") -- distinct de dj-fade-in (0.8s, pensé pour un
        // chargement de page) : utilisé pour les micro-interactions d'UI
        // (changement d'onglet, apparition d'une icône dans un slot
        // variable) où 0.8s serait perçu comme lent.
        "dj-fade-in-rapide": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "dj-orbit": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "dj-glow": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
        },
        // Entrée d'un message dans le chat (partie 5) : jamais d'affichage
        // brut (brief 4b). Fondu + léger glissement + micro-scale.
        "cgpt-entree-message": {
          from: { opacity: "0", transform: "translateY(10px) scale(.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Apparition d'un modal (09/08, audit partie 5 : CompteRequisModal,
        // BoutonInstaller instructions iOS avaient un fond qui s'affichait
        // brut et un panneau sans easing sur mesure). Même principe que
        // cgpt-entree-message, léger scale en plus du glissement pour
        // renforcer la sensation de profondeur à l'ouverture.
        "cgpt-entree-modal": {
          from: { opacity: "0", transform: "translateY(12px) scale(.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Points de l'indicateur "{agent} réfléchit" (partie 5) : rythme
        // légèrement irrégulier plutôt que animate-bounce (délais
        // parfaitement réguliers) -- brief 4b.
        "cgpt-point-reflexion": {
          "0%, 100%": { transform: "translateY(0)", opacity: ".5" },
          "35%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        "dj-fade-up": "dj-fade-up 0.5s ease both",
        "dj-fade-in": "dj-fade-in 0.8s ease both",
        "dj-fade-in-rapide": "dj-fade-in-rapide 0.18s ease both",
        "dj-orbit": "dj-orbit 18s linear infinite",
        "dj-glow": "dj-glow 3.2s ease-in-out infinite",
        "cgpt-entree-message": "cgpt-entree-message 0.4s cubic-bezier(.25,.8,.35,1) both",
        "cgpt-entree-modal": "cgpt-entree-modal 0.35s cubic-bezier(.25,.8,.35,1) both",
        "cgpt-point-reflexion": "cgpt-point-reflexion 1.3s cubic-bezier(.25,.8,.35,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
