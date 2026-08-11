import { appelerApi } from "@/lib/api";
import { ErreurApi } from "@/lib/erreurs";

/**
 * Client pour /api/roles/invitation, /api/roles/rejoindre et
 * /api/roles/etablissement-racine (partie 4, Clovis, 2026-08-08).
 * Réutilise appelerApi tel quel (même gestion d'erreurs/parsing que le
 * reste du produit, voir lib/api.ts) -- aucune nouvelle logique réseau.
 */

export type Invitation = {
  code: string;
  role_cible: "enseignant" | "etudiant";
  utilisations: number;
};

export type ResultatRejoindre = {
  role: string;
  agent_id: string;
};

/** Mon code actuel, ou null si je n'en ai jamais généré (404 attendu, pas une erreur). */
export async function lireMonInvitation(): Promise<Invitation | null> {
  try {
    return (await appelerApi("/api/roles/invitation")) as Invitation;
  } catch (e) {
    if (e instanceof ErreurApi && e.statusCode === 404) return null;
    throw e;
  }
}

export async function genererMonInvitation(): Promise<Invitation> {
  return (await appelerApi("/api/roles/invitation", { method: "POST" })) as Invitation;
}

export async function rejoindreParCode(code: string, nomAffiche: string): Promise<ResultatRejoindre> {
  return (await appelerApi("/api/roles/rejoindre", {
    method: "POST",
    body: JSON.stringify({ code, nom_affiche: nomAffiche }),
  })) as ResultatRejoindre;
}

// Inscription libre (sans code) -- devient "etudiant" sans enseignant
// rattaché (décision Bourama, 09/08). Le nom de la route reste
// /etablissement-racine côté backend (nom d'URL inchangé pour éviter un
// aller-retour inutile), seul le rôle attribué a changé -- voir
// api/invitations_clovis.py:creer_etudiant_autonome.
export async function creerEtudiantAutonome(nomAffiche: string): Promise<ResultatRejoindre> {
  return (await appelerApi("/api/roles/etablissement-racine", {
    method: "POST",
    body: JSON.stringify({ nom_affiche: nomAffiche }),
  })) as ResultatRejoindre;
}

export type MembreEquipe = {
  user_id: string;
  nom_affiche: string;
  agent_id: string | null;
};

/** Endpoint déjà existant côté backend (api/roles.py), jamais exposé
 * côté client jusqu'ici -- réutilisé tel quel pour "Mes élèves"/"Mon équipe". */
export async function lireMonEquipe(): Promise<MembreEquipe[]> {
  return (await appelerApi("/api/roles/mon-equipe")) as MembreEquipe[];
}
