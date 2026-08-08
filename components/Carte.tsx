import { ReactNode } from "react";

export function Carte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-cgpt-carte border border-dj-bordure bg-dj-surface p-6 -rotate-[.25deg] transition-all duration-[350ms] ease-cgpt-geste hover:rotate-0 hover:-translate-y-1 hover:border-dj-bordure-forte hover:shadow-[0_12px_28px_rgba(0,0,0,.28)] ${className}`}
    >
      {children}
    </div>
  );
}
