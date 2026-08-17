import { ReactNode } from "react";

export function Carte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-cgpt-carte border border-dj-bordure bg-dj-surface p-6 transition-colors duration-300 ease-cgpt-doux hover:border-dj-bordure-forte ${className}`}
    >
      {children}
    </div>
  );
}
