// Composant de référence pour la partie 1 (squelette du dépôt Clovis).
// Nécessite les tokens "cgpt-*" ajoutés dans tailwind.config.ts
// (voir styles/tailwind-ajouts.ts) -- coins légèrement irréguliers +
// easings sur mesure, cf. brief section 4b.

import { ButtonHTMLAttributes } from "react";

interface ButonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primaire" | "secondaire" | "fantome";
}

const classesParVariante: Record<string, string> = {
  primaire:
    "bg-dj-gradient text-[#1a0f06] hover:-translate-y-0.5 hover:rotate-[-.3deg] hover:shadow-[0_10px_26px_rgba(232,147,74,.28)] active:translate-y-0 active:scale-[.98]",
  secondaire:
    "bg-dj-surface-haute text-dj-texte border border-dj-bordure-forte hover:-translate-y-0.5 hover:rotate-[.25deg] hover:border-dj-accent-1",
  fantome:
    "bg-transparent text-dj-texte-muet hover:text-dj-texte hover:bg-dj-surface",
};

export function Bouton({ variante = "primaire", className = "", disabled, ...props }: ButonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`rounded-cgpt-bouton px-[22px] py-3 text-sm font-semibold font-sans transition-all duration-300 ease-cgpt-geste disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 ${classesParVariante[variante]} ${className}`}
    />
  );
}
