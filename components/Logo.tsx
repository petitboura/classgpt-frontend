import { useId } from "react";

// Logo = plume (12/08, remplace l'ancien chapeau de diplômé qui restait
// codé en dur ici alors que public/clovis-logo.svg avait déjà été changé).
// Même tracé "à main levée" que clovis-logo.svg.
//
// CORRECTIF (17/08) -- dégradé recoloré en doré (identité "Nuit d'étude"),
// remplace l'ancien dégradé orange/brun (#C2661C/#8F3B00/#551A00) hérité
// de la charte Djiguignè. Même tracé, seule la couleur change.
//
// Fix (14/08, bug remonté par Bourama : icône blanche/invisible sur
// mobile) : l'id du <linearGradient> était fixe ("cgpt-grad"), or <Logo />
// est monté plusieurs fois en même temps sur la même page (sidebar +
// écran d'accueil par ex.) -- deux <svg> avec le même id de gradient dans
// le DOM casse le rendu sur certains navigateurs mobiles (Safari iOS
// notamment). useId() donne un id unique à chaque instance.
// CORRECTIF (17/08, v2) -- dégradé piloté par variables CSS
// (--dj-logo-1/2/3, définies dans globals.css) plutôt que des couleurs
// figées, pour suivre automatiquement le thème clair/sombre actif sans
// logique JS ni risque de décalage d'hydratation (le <style> sur <stop>
// supporte var(), contrairement à l'attribut stop-color en XML pur).
export function Logo({ taille = 40 }: { taille?: number }) {
  const id = useId();
  const idGradient = `cgpt-grad-${id}`;
  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={idGradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--dj-logo-1)" }} />
          <stop offset="55%" style={{ stopColor: "var(--dj-logo-2)" }} />
          <stop offset="100%" style={{ stopColor: "var(--dj-logo-3)" }} />
        </linearGradient>
      </defs>
      <path d="M45.5 7.5
               C53.5 12.5, 56.5 24, 50.5 34.5
               C45.5 43.5, 35 49.5, 23.5 53.5
               C24.7 46, 29.5 39, 33.5 30.5
               C38 21, 42 14, 45.5 7.5 Z"
            fill={`url(#${idGradient})`} />
      <path d="M45.5 7.5
               C53.5 12.5, 56.5 24, 50.5 34.5
               C45.5 43.5, 35 49.5, 23.5 53.5
               C24.7 46, 29.5 39, 33.5 30.5
               C38 21, 42 14, 45.5 7.5 Z"
            fill="none" stroke="#1a0f06" strokeOpacity=".18" strokeWidth="1" />
      <path d="M44.5 9.5 C39 19, 31.5 33, 25 44.5 C21.8 48.5, 17.5 53, 13.5 56.5"
            fill="none" stroke={`url(#${idGradient})`} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12.3" cy="57.7" r="2.4" fill={`url(#${idGradient})`} />
      <path d="M41 15 L49.5 12.5" stroke={`url(#${idGradient})`} strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
      <path d="M37.7 21.5 L48 18" stroke={`url(#${idGradient})`} strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
      <path d="M34.2 28.7 L46.3 24.3" stroke={`url(#${idGradient})`} strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <path d="M30.6 35.8 L43.6 30.5" stroke={`url(#${idGradient})`} strokeWidth="1.5" strokeLinecap="round" opacity=".75" />
      <path d="M26.5 42.3 L39.3 36.6" stroke={`url(#${idGradient})`} strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      <path d="M22 48.6 L33.4 43" stroke={`url(#${idGradient})`} strokeWidth="1.3" strokeLinecap="round" opacity=".65" />
    </svg>
  );
}
