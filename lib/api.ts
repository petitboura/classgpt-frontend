import { supabase } from "./supabase";

// Class GPT appelle le MÊME backend que djiguigne-frontend (même API
// FastAPI, mêmes endpoints /api/roles, /api/chat, etc.). Rien n'est
// dupliqué côté serveur — seule la façade change.

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL est requis (voir .env.local.example).");
}

/**
 * Appel API générique, avec le token Supabase de la session en cours
 * ajouté automatiquement. Base à compléter dans les parties suivantes
 * (streaming pour le chat en partie 3, upload de fichiers si besoin en
 * partie 4) — volontairement minimal ici, ce n'est que le socle.
 */
export async function appelerApi(chemin: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const reponse = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  if (!reponse.ok) {
    throw new Error(`Erreur API (${reponse.status}) sur ${chemin}`);
  }

  return reponse.json();
}
