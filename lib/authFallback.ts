import { supabase } from "@/lib/supabase";
import type { AuthError, Session, User } from "@supabase/supabase-js";

export type IdentifiantsAuth = { email: string; password: string } | { phone: string; password: string };

export type ResultatAuth = {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
};

/**
 * Supabase masque volontairement si un compte existe déjà (anti-énumération) :
 * signUp() sur un identifiant déjà utilisé ne renvoie pas d'erreur explicite,
 * juste une réponse sans session active. C'est le seul signal fiable pour
 * détecter "ce compte existe déjà".
 *
 * Différence volontaire avec djiguigne-frontend/lib/authFallback.ts : ici,
 * SEULE la page inscription a un repli (compte existant -> connexion).
 * La page connexion n'a PAS de repli inverse (identifiants inconnus ->
 * création de compte) : ce module attribue un rôle + un nom_affiche
 * obligatoires à la création du compte (voir app/inscription/page.tsx),
 * une création silencieuse depuis l'écran de connexion produirait un
 * compte sans nom ni rôle.
 */

/** Page inscription : si le compte existe déjà, tente une connexion avec les mêmes identifiants. */
export async function inscrireOuConnecter(identifiants: IdentifiantsAuth): Promise<ResultatAuth> {
  const { data, error } = await supabase.auth.signUp(identifiants);

  if (error) return { session: null, user: null, error };
  if (data.session) return { session: data.session, user: data.user, error: null };

  // Pas d'erreur mais pas de session : le compte existe déjà. On retente en connexion.
  const resultat = await supabase.auth.signInWithPassword(identifiants);
  return { session: resultat.data.session, user: resultat.data.user, error: resultat.error };
}

/** Page connexion : connexion simple, sans repli de création de compte (voir docstring ci-dessus). */
export async function connecter(identifiants: IdentifiantsAuth): Promise<ResultatAuth> {
  const resultat = await supabase.auth.signInWithPassword(identifiants);
  return { session: resultat.data.session, user: resultat.data.user, error: resultat.error };
}
