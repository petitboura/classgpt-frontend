"use client";

import { useRouter } from "next/navigation";
import { EspaceRejoindre } from "@/components/EspaceRejoindre";

// Page dédiée (partie 4), branchée depuis app/page.tsx : un compte
// connecté (email/téléphone déjà validé, voir /inscription) mais sans
// rôle (`GET /api/roles/moi` renvoie role: null) atterrit ici plutôt que
// de rebondir sur /connexion. Ne montre que le choix de rôle -- pas les
// blocs Inviter/Équipe/Diffuser de EspaceClassGPT, qui n'ont pas de sens
// tant que le rôle n'est pas connu.
export default function PageRejoindre() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-dj-fond px-4">
      <EspaceRejoindre onTermine={() => router.push("/")} />
    </main>
  );
}
