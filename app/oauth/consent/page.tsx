"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { Bouton } from "@/components/Bouton";

/**
 * Écran de consentement OAuth 2.1 (voir Authentication > OAuth Server dans
 * le tableau de bord Supabase). Quand un client MCP externe (ex. Claude)
 * demande l'accès au compte d'un utilisateur Clovis, Supabase Auth
 * redirige l'utilisateur ICI avec un paramètre `authorization_id`, avant
 * de renvoyer le contrôle au client externe une fois la décision prise.
 *
 * Le vrai travail OAuth (génération des codes, jetons, etc.) est géré
 * entièrement par Supabase -- cette page ne fait que : vérifier que
 * l'utilisateur est connecté, afficher qui demande l'accès, et transmettre
 * sa décision (approuver/refuser) via l'API JS `supabase.auth.oauth.*`.
 *
 * Sécurité : jamais de mot de passe ni de token manipulés ici -- exactement
 * la même logique que app/connexion/page.tsx (lib/supabase.ts, client
 * unique). Si l'utilisateur n'est pas connecté, on le renvoie vers
 * /connexion avec un retour vers cette page (même `authorization_id`), et
 * on revient ici automatiquement après connexion.
 *
 * IMPORTANT (branding Clovis) : cette page ne doit jamais mentionner
 * "Djiguignè" -- voir README section identité produit. Seul le nom
 * du client OAuth (ex. "Claude"), fourni par Supabase, est affiché.
 */

type DetailsAutorisation = {
  client: { name?: string | null; logo_uri?: string | null };
  redirect_uri: string;
  scope?: string | null;
};

// useSearchParams() oblige Next.js à traiter la page en rendu client --
// doit être isolé dans un composant séparé, enveloppé de <Suspense>,
// sinon `next build` échoue ("should be wrapped in a suspense boundary").
export default function PageConsentementOAuth() {
  return (
    <Suspense fallback={null}>
      <EcranConsentement />
    </Suspense>
  );
}

function EcranConsentement() {
  const router = useRouter();
  const params = useSearchParams();
  const authorizationId = params.get("authorization_id");

  const [details, setDetails] = useState<DetailsAutorisation | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!authorizationId) {
      setErreur("Lien d'autorisation invalide (authorization_id manquant).");
      setChargement(false);
      return;
    }

    async function charger() {
      // Utilisateur non connecté : on le renvoie vers /connexion, qui devra
      // revenir ici avec le même authorization_id une fois connecté.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace(
          `/connexion?retour=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`
        );
        return;
      }

      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId!);

      if (error || !data) {
        setErreur(error?.message ?? "Impossible de récupérer les détails de la demande d'accès.");
        setChargement(false);
        return;
      }

      // L'utilisateur a déjà approuvé ce client par le passé : Supabase ne
      // redemande pas de consentement, il fournit directement une URL de
      // retour vers le client externe.
      if (!("authorization_id" in data)) {
        router.replace(data.redirect_url);
        return;
      }

      setDetails(data as DetailsAutorisation);
      setChargement(false);
    }

    charger();
  }, [authorizationId, router]);

  async function repondre(decision: "approve" | "deny") {
    if (!authorizationId) return;
    setEnCours(true);
    setErreur(null);

    const { data, error } =
      decision === "approve"
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);

    if (error) {
      setErreur(error.message);
      setEnCours(false);
      return;
    }

    router.replace(data.redirect_url);
  }

  const nomClient = details?.client?.name || "Une application externe";
  const scopes = details?.scope?.trim() ? details.scope.trim().split(/\s+/) : [];

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
          {chargement && (
            <p className="text-sm text-dj-texte-muet">Chargement de la demande d'accès…</p>
          )}

          {!chargement && erreur && (
            <>
              <h1 className="font-display text-xl font-bold text-dj-texte">
                Demande invalide
              </h1>
              <p className="mt-2 text-sm text-dj-texte-muet">{erreur}</p>
            </>
          )}

          {!chargement && !erreur && details && (
            <>
              <h1 className="font-display text-xl font-bold text-dj-texte">
                Autoriser {nomClient} ?
              </h1>
              <p className="mt-2 text-sm text-dj-texte-muet">
                {nomClient} demande à accéder à votre compte Clovis.
              </p>

              {scopes.length > 0 && (
                <div className="mt-4 rounded-xl border border-dj-bordure bg-dj-surface-haute p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-dj-texte-muet">
                    Accès demandé
                  </p>
                  <ul className="mt-1.5 space-y-1 text-sm text-dj-texte">
                    {scopes.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Bouton
                  variante="secondaire"
                  className="flex-1"
                  disabled={enCours}
                  onClick={() => repondre("deny")}
                >
                  Refuser
                </Bouton>
                <Bouton
                  variante="primaire"
                  className="flex-1"
                  disabled={enCours}
                  onClick={() => repondre("approve")}
                >
                  Autoriser
                </Bouton>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
