"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { BlocExpansible } from "./BlocExpansible";

// Carte "note texte" pour les notes de la bibliothèque personnelle
// (voir api/bibliotheque_utilisateur.py:ajouter_texte -- stockées comme
// un .txt ordinaire dans le même bucket que le reste). Bourama 17/08 :
// avant ce composant, ces notes n'étaient couvertes par aucune carte
// dédiée (extensionFichier ne connaît pas .txt) -- elles retombaient sur
// LinkPreview, qui tente un aperçu de PAGE WEB, pas de fichier texte
// brut : rendu cassé ou vide. Ici on récupère et affiche le contenu
// directement, comme FichierChip le fait pour un PDF (même composant
// BlocExpansible, même logique déplié/replié/plein écran).
//
// Restreint à notre propre stockage (comme estOrigineDeConfiance dans
// FichierChip.tsx, dupliqué volontairement ici -- convention du projet,
// voir core/bibliotheque_rag.py, pour ne pas créer de dépendance
// croisée entre petits composants/modules) : un .txt d'une autre origine
// n'est pas automatiquement fetché (CORS non garanti, et surtout ce
// n'est probablement pas une note de bibliothèque) -- il retombe sur le
// comportement normal (lien classique) dans BulleMessage.tsx.
export function estNoteTexteBibliotheque(href: string): boolean {
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!urlSupabase) return false;
  try {
    if (new URL(href).origin !== new URL(urlSupabase).origin) return false;
  } catch {
    return false;
  }
  return href.split("?")[0].toLowerCase().endsWith(".txt");
}

export function NoteTexteChip({ href, nom }: { href: string; nom: string }) {
  const [texte, setTexte] = useState<string | null>(null);
  const [enErreur, setEnErreur] = useState(false);

  function chargerAuPremierClic() {
    fetch(href)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setTexte)
      .catch(() => setEnErreur(true));
  }

  return (
    <BlocExpansible
      titre={nom}
      icone={FileText}
      sousTitre="Note"
      hrefTelechargement={href}
      onPremiereOuverture={chargerAuPremierClic}
      enfant={
        enErreur ? (
          <p className="p-3 text-sm text-dj-texte-muet">Impossible de charger cette note.</p>
        ) : texte === null ? (
          <p className="p-3 text-sm text-dj-texte-muet">Chargement…</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words p-3 font-sans text-sm text-dj-texte">{texte}</pre>
        )
      }
    />
  );
}
