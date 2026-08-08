"use client";

import { useState } from "react";
import { diffuserDocumentEtablissement, diffuserLien, type ResultatDiffusion } from "@/lib/api";
import { messageErreur } from "@/lib/erreurs";

/**
 * "Diffuser des documents" (brief section 3). Réutilise TEL QUEL
 * diffuserDocumentEtablissement/diffuserLien (lib/api.ts), déjà en prod
 * -- aucun nouvel endpoint nécessaire ici. `cible` reste sur "tous" (pas
 * de sélecteur enseignant/étudiant) pour rester simple ; à ajouter plus
 * tard si Bourama le demande, l'API le supporte déjà.
 */
export function EspaceDiffuser() {
  const [onglet, setOnglet] = useState<"document" | "lien">("document");

  const [fichier, setFichier] = useState<File | null>(null);
  const [descriptionFichier, setDescriptionFichier] = useState("");

  const [url, setUrl] = useState("");
  const [descriptionLien, setDescriptionLien] = useState("");

  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatDiffusion | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    if (enCours) return;
    setErreur(null);
    setResultat(null);
    setEnCours(true);
    try {
      const r =
        onglet === "document"
          ? fichier && descriptionFichier.trim()
            ? await diffuserDocumentEtablissement(fichier, descriptionFichier.trim())
            : null
          : url.trim() && descriptionLien.trim()
            ? await diffuserLien(url.trim(), descriptionLien.trim())
            : null;
      if (!r) return;
      setResultat(r);
      setFichier(null);
      setDescriptionFichier("");
      setUrl("");
      setDescriptionLien("");
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  const pretAEnvoyer =
    onglet === "document" ? !!fichier && !!descriptionFichier.trim() : !!url.trim() && !!descriptionLien.trim();

  return (
    <section className="rounded-2xl border border-dj-bordure bg-dj-surface p-5">
      <h2 className="font-display text-base font-semibold text-dj-texte">Diffuser</h2>
      <p className="mt-1 text-xs text-dj-texte-muet">Ajouté d'un coup à la bibliothèque de toute ton équipe.</p>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-full border border-dj-bordure bg-dj-surface-haute p-1">
        <button
          type="button"
          onClick={() => setOnglet("document")}
          className={`rounded-full py-1.5 text-sm font-medium transition-colors ${
            onglet === "document" ? "bg-dj-gradient text-[#1A0D02]" : "text-dj-texte-muet hover:text-dj-texte"
          }`}
        >
          Document
        </button>
        <button
          type="button"
          onClick={() => setOnglet("lien")}
          className={`rounded-full py-1.5 text-sm font-medium transition-colors ${
            onglet === "lien" ? "bg-dj-gradient text-[#1A0D02]" : "text-dj-texte-muet hover:text-dj-texte"
          }`}
        >
          Lien
        </button>
      </div>

      {onglet === "document" && (
        <div className="mt-4 animate-dj-fade-in-rapide">
          <input
            type="file"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-dj-texte-muet file:mr-3 file:rounded-full file:border-0 file:bg-dj-surface-haute file:px-3 file:py-1.5 file:text-xs file:text-dj-texte"
          />
          <input
            value={descriptionFichier}
            onChange={(e) => setDescriptionFichier(e.target.value)}
            placeholder="Description (pour que l'IA sache le retrouver)"
            className="mt-2 w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
          />
        </div>
      )}

      {onglet === "lien" && (
        <div className="mt-4 animate-dj-fade-in-rapide">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
          />
          <input
            value={descriptionLien}
            onChange={(e) => setDescriptionLien(e.target.value)}
            placeholder="Description (pour que l'IA sache le retrouver)"
            className="mt-2 w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
          />
        </div>
      )}

      {erreur && <p className="mt-2 animate-dj-fade-in-rapide text-sm text-[#F87171]">{erreur}</p>}
      {resultat && (
        <p className="mt-2 animate-dj-fade-in-rapide text-sm text-dj-accent-1">
          Diffusé à {resultat.diffuse_a}/{resultat.total_cibles} personnes.
          {resultat.echecs.length > 0 && <> Échec pour : {resultat.echecs.join(", ")}.</>}
        </p>
      )}

      <button
        onClick={envoyer}
        disabled={!pretAEnvoyer || enCours}
        className="mt-3 rounded-full bg-dj-gradient px-4 py-1.5 text-sm font-bold text-[#1A0D02] transition-opacity disabled:opacity-50"
      >
        {enCours ? "Diffusion…" : "Diffuser à toute l'équipe"}
      </button>
    </section>
  );
}
