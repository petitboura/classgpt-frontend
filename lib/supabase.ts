import { createClient } from "@supabase/supabase-js";

// Class GPT parle au MÊME projet Supabase que djiguigne-frontend (même
// auth, mêmes comptes établissement/enseignant/étudiant, même table
// `profiles`). Next.js parle directement à Supabase Auth via ce client —
// le backend FastAPI ne gère jamais de mot de passe, il vérifie seulement
// le token envoyé (même architecture que le reste de l'écosystème).

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cleAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !cleAnon) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis (voir .env.local.example)."
  );
}

export const supabase = createClient(url, cleAnon);
