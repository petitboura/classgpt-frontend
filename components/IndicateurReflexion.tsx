// Adapté du composant existant dans BulleMessage.tsx (djiguigne-frontend) --
// même texte "{agent} réfléchit" + 3 points, seul le rythme des délais
// change (0/140/310ms au lieu de 0/150/300ms parfaitement réguliers).
// Nécessite le keyframe cgpt-point-reflexion (styles/globals-ajouts.css).

export function IndicateurReflexion({ nomAgent }: { nomAgent: string }) {
  return (
    <div className="my-1 flex items-center gap-1.5 text-[13px] text-dj-texte-muet">
      <span>{nomAgent} réfléchit</span>
      <span className="flex gap-0.5">
        <span
          className="h-1 w-1 rounded-full bg-dj-texte-muet"
          style={{ animation: "cgpt-point-reflexion 1.3s var(--tw-ease-cgpt-doux, cubic-bezier(.25,.8,.35,1)) infinite", animationDelay: "0ms" }}
        />
        <span
          className="h-1 w-1 rounded-full bg-dj-texte-muet"
          style={{ animation: "cgpt-point-reflexion 1.3s cubic-bezier(.25,.8,.35,1) infinite", animationDelay: "140ms" }}
        />
        <span
          className="h-1 w-1 rounded-full bg-dj-texte-muet"
          style={{ animation: "cgpt-point-reflexion 1.3s cubic-bezier(.25,.8,.35,1) infinite", animationDelay: "310ms" }}
        />
      </span>
    </div>
  );
}
