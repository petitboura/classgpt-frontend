"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { inscrireOuConnecter } from "@/lib/authFallback";
import { Logo } from "@/components/Logo";
import { Bouton } from "@/components/Bouton";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { ChampTelephone } from "@/components/ChampTelephone";

type MethodeAuth = "email" | "telephone";

// Correctif (08/08, fusion des parties 2 et 4) : cet écran ne fait plus
// que créer le compte (email/téléphone + mot de passe). L'attribution du
// rôle se fait juste après, sur "/", via EspaceRejoindre (partie 4) --
// soit avec un code reçu (enseignant/étudiant), soit "je crée un nouvel
// établissement" (le nouveau chemin racine, POST
// /api/roles/etablissement-racine). L'ancienne version de cet écran
// appelait directement POST /api/roles/choisir avec un rôle "etablissement"
// codé en dur pour TOUT nouveau compte -- ça cassait silencieusement le
// parcours enseignant/étudiant par code : le rôle était déjà pris avant
// même que la personne ait pu saisir son code. Le nom (nom_affiche) est
// maintenant demandé une seule fois, dans EspaceRejoindre, pas ici.

export default function PageInscription() {
  const router = useRouter();
  const [methode, setMethode] = useState<MethodeAuth>("email");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { error } =
      methode === "email"
        ? await inscrireOuConnecter({ email, password: motDePasse })
        : await inscrireOuConnecter({ phone: telephone.replace(/\s+/g, ""), password: motDePasse });

    setEnCours(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    // Le rôle (établissement/enseignant/étudiant) se choisit juste après,
    // sur "/" (EspaceRejoindre) -- voir commentaire en haut de fichier.
    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-dj-fade-up">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Logo taille={32} />
          <span className="font-display text-lg font-bold tracking-tight text-dj-texte">
            Class <span className="text-dj-accent-1">GPT</span>
          </span>
        </div>

        <div className="rounded-2xl border border-dj-bordure bg-dj-surface p-6 shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
          <h1 className="font-display text-xl font-bold text-dj-texte">Créer un compte</h1>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-full border border-dj-bordure bg-dj-surface-haute p-1">
            <button
              type="button"
              onClick={() => setMethode("email")}
              className={`rounded-full py-1.5 text-sm font-medium transition-colors ${
                methode === "email"
                  ? "bg-dj-gradient text-[#1A0D02]"
                  : "text-dj-texte-muet hover:text-dj-texte"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setMethode("telephone")}
              className={`rounded-full py-1.5 text-sm font-medium transition-colors ${
                methode === "telephone"
                  ? "bg-dj-gradient text-[#1A0D02]"
                  : "text-dj-texte-muet hover:text-dj-texte"
              }`}
            >
              Téléphone
            </button>
          </div>

          <form onSubmit={gererSoumission} className="mt-4 space-y-4">
            {methode === "email" ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dj-texte-muet">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-dj-texte outline-none focus:border-dj-accent-1"
                />
              </div>
            ) : (
              <ChampTelephone id="telephone" value={telephone} onChange={setTelephone} />
            )}

            <ChampMotDePasse
              id="mot-de-passe"
              value={motDePasse}
              onChange={setMotDePasse}
              autoComplete="new-password"
            />

            {erreur && <p className="text-sm text-[#F87171]">{erreur}</p>}

            <Bouton type="submit" disabled={enCours} className="w-full">
              {enCours ? "Création…" : "Créer mon compte"}
            </Bouton>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-dj-texte-muet">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-dj-accent-1 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
