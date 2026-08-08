"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { inscrireOuConnecter } from "@/lib/authFallback";
import { appelerApi } from "@/lib/api";
import { ErreurApi, messageErreur } from "@/lib/erreurs";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { ChampTelephone } from "@/components/ChampTelephone";

type MethodeAuth = "email" | "telephone";

// Rôle attribué automatiquement à tout compte créé directement depuis cet
// écran (pas de sélecteur visible, demande Bourama : "une seule
// inscription et normale"). Un compte enseignant/étudiant sera rattaché
// via un code d'invitation plus tard (partie 4), pas depuis cet écran.
// Ajustable en un mot si Bourama veut un autre défaut.
const ROLE_PAR_DEFAUT = "etablissement";

export default function PageInscription() {
  const router = useRouter();
  const [methode, setMethode] = useState<MethodeAuth>("email");
  const [nom, setNom] = useState("");
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

    if (error) {
      setEnCours(false);
      setErreur(error.message);
      return;
    }

    // Attribution du rôle + nom, silencieuse (aucune étape visible pour
    // l'utilisateur). Si le compte existait déjà avec un rôle (repli
    // "compte existant -> connexion" de inscrireOuConnecter), le backend
    // renvoie 409 ROLE_DEJA_CHOISI : pas une vraie erreur ici, le compte
    // est déjà en règle, on continue simplement vers le chat.
    try {
      await appelerApi("/api/roles/choisir", {
        method: "POST",
        body: JSON.stringify({ role: ROLE_PAR_DEFAUT, nom_affiche: nom }),
      });
    } catch (e) {
      if (!(e instanceof ErreurApi && e.code === "ROLE_DEJA_CHOISI")) {
        setEnCours(false);
        setErreur(messageErreur(e));
        return;
      }
    }

    setEnCours(false);
    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-dj-fade-up">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          {/* Logo (chapeau de diplômé, identité graphique) : traité en
              partie 5, laissé en texte simple pour ce module. */}
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
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-dj-texte-muet">
                Nom
              </label>
              <input
                id="nom"
                type="text"
                required
                autoComplete="name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-dj-texte outline-none focus:border-dj-accent-1"
              />
            </div>

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

            <button
              type="submit"
              disabled={enCours}
              className="w-full rounded-full bg-dj-gradient px-4 py-2.5 text-sm font-bold text-[#1A0D02] shadow-[0_2px_14px_rgba(217,99,31,0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {enCours ? "Création…" : "Créer mon compte"}
            </button>
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
