"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { inscrireOuConnecter } from "@/lib/authFallback";
import { creerEtudiantAutonome } from "@/lib/invitations";
import { ErreurApi, messageErreur } from "@/lib/erreurs";
import { Logo } from "@/components/Logo";
import { Bouton } from "@/components/Bouton";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { ChampTelephone } from "@/components/ChampTelephone";

type MethodeAuth = "email" | "telephone";

// Correctif (09/08, décision explicite de Bourama) : retour au parcours
// direct et simple -- "une IA normale". PAS d'écran intermédiaire "code
// reçu ou créer un établissement" après l'inscription (/rejoindre,
// EspaceRejoindre) : le compte devient "etudiant" automatiquement et
// silencieusement ici (sans enseignant rattaché), puis va droit au chat
// avec Nitrux. Les autres rôles (enseignant/étudiant rattaché par code)
// seront réintroduits plus tard, petit à petit -- ne pas les réactiver
// sans demande explicite.
//
// Garde-fou (10/08) : app/page.tsx ne redirige plus jamais ici un compte
// déjà connecté sans rôle (provisionnement silencieux directement là-bas
// désormais, voir son commentaire "enlève ces histoires de rôles"). Si
// cette page est quand même atteinte avec une session active (lien
// direct, favori), inutile de repasser par le formulaire : retour "/"
// immédiat, page.tsx s'occupe du reste.

export default function PageInscription() {
  const router = useRouter();
  const [verificationSession, setVerificationSession] = useState(true);
  const [methode, setMethode] = useState<MethodeAuth>("email");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (annule) return;
      if (session) {
        router.push("/");
        return;
      }
      setVerificationSession(false);
    });
    return () => {
      annule = true;
    };
  }, [router]);

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

    // Attribution silencieuse du rôle "etudiant" (sans enseignant
    // rattaché) -- aucune étape visible, conforme au brief "une IA
    // normale". Si le compte existait déjà avec un rôle (repli "compte
    // existant -> connexion" de inscrireOuConnecter), le backend renvoie
    // déjà-choisi : pas une vraie erreur ici, on continue simplement vers
    // le chat.
    try {
      await creerEtudiantAutonome(nom);
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

  if (verificationSession) {
    return <main className="flex min-h-screen items-center justify-center px-4" />;
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
