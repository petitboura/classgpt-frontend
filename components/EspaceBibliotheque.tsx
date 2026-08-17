"use client";

import { useEffect, useMemo, useState } from "react";
import { Link as IconLien, FileText, Paperclip, Image as IconImage, AudioLines as IconAudio, Video as IconVideo } from "lucide-react";
import {
  appelerApi,
  ajouterFichiersBibliothequePersonnelle,
  ajouterLienBibliothequePersonnelle,
  ajouterTexteBibliothequePersonnelle,
} from "@/lib/api";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { Skeleton } from "./Skeleton";
import { CTACompteRequis } from "./CTACompteRequis";
import { VisionneuseBibliotheque } from "./VisionneuseBibliotheque";

// Onglet "Bibliothèque" de Mon espace, porté de
// djiguigne-frontend/app/dashboard/espace/page.tsx (même logique,
// juste extrait en composant autonome pour être un onglet parmi
// d'autres ici plutôt que toute la page). Personnel à chaque
// utilisateur : n'importe laquelle de ses IA peut consulter ces
// documents pendant une conversation (outil consulter_bibliotheque).

const URL_REGEX = /^https?:\/\/\S+$/i;

type FichierBiblio = {
  id: string;
  nom_fichier: string;
  type_mime: string;
  description: string | null;
  url_publique: string;
  created_at: string;
};

type SousOngletBiblio = "tous" | "documents" | "images" | "audio" | "videos" | "liens" | "texte";

const SOUS_ONGLETS: { id: SousOngletBiblio; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "documents", label: "Documents" },
  { id: "images", label: "Images" },
  { id: "audio", label: "Audio" },
  { id: "videos", label: "Vidéos" },
  { id: "liens", label: "Liens" },
  { id: "texte", label: "Texte" },
];

function typeDe(f: FichierBiblio): SousOngletBiblio {
  if (f.type_mime === "text/uri-list") return "liens";
  if (f.type_mime === "text/plain") return "texte";
  if (f.type_mime.startsWith("image/")) return "images";
  if (f.type_mime.startsWith("audio/")) return "audio";
  if (f.type_mime.startsWith("video/")) return "videos";
  return "documents";
}

export function EspaceBibliotheque() {
  const [sousOnglet, setSousOnglet] = useState<SousOngletBiblio>("tous");
  const [fichiers, setFichiers] = useState<FichierBiblio[] | null>(null);
  const [nouveauxFichiers, setNouveauxFichiers] = useState<File[]>([]);
  const [texteOuLien, setTexteOuLien] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreursEnvoi, setErreursEnvoi] = useState<{ nom: string; erreur: string }[]>([]);
  // Visiteur sans compte (refonte "Mon espace = l'app") -- section
  // auparavant inatteignable sans compte, même détection que
  // MesComportements.tsx : 401 -> CTA plutôt qu'une liste vide.
  const [sansCompte, setSansCompte] = useState(false);
  // Fenêtre de prévisualisation (17/08, Bourama : "rien pour ouvrir
  // chaque type dans l'app") -- remplace l'ouverture en nouvel onglet.
  const [fichierOuvert, setFichierOuvert] = useState<FichierBiblio | null>(null);

  useEffect(() => {
    chargerFichiers();
  }, []);

  function chargerFichiers() {
    appelerApi("/api/bibliotheque")
      .then((r: FichierBiblio[]) => setFichiers(r))
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) {
          setSansCompte(true);
        }
        setFichiers([]);
      });
  }

  const fichiersAffiches = useMemo(() => {
    if (!fichiers) return null;
    if (sousOnglet === "tous") return fichiers;
    return fichiers.filter((f) => typeDe(f) === sousOnglet);
  }, [fichiers, sousOnglet]);

  async function ajouter() {
    const texte = texteOuLien.trim();
    if (nouveauxFichiers.length === 0 && !texte) return;

    setEnvoi(true);
    setErreursEnvoi([]);
    try {
      const erreurs = nouveauxFichiers.length > 0 ? await ajouterFichiersBibliothequePersonnelle(nouveauxFichiers) : [];

      if (texte) {
        try {
          if (URL_REGEX.test(texte)) {
            await ajouterLienBibliothequePersonnelle(texte);
          } else {
            await ajouterTexteBibliothequePersonnelle(texte);
          }
        } catch (e) {
          erreurs.push({ nom: texte, erreur: messageErreur(e) });
        }
      }

      setErreursEnvoi(erreurs);
      setNouveauxFichiers([]);
      setTexteOuLien("");
      chargerFichiers();
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id: string, nom: string) {
    if (!window.confirm(`Supprimer « ${nom} » de ta bibliothèque ?`)) return;
    try {
      await appelerApi(`/api/bibliotheque/${id}`, { method: "DELETE" });
      chargerFichiers();
    } catch (e) {
      window.alert(messageErreur(e));
    }
  }

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour avoir ta propre bibliothèque de documents." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-dj-texte-muet">
        Les documents ajoutés ici sont personnels : toi seul y as accès, et Clovis peut les consulter
        pendant une conversation.
      </p>

      <div className="flex flex-col gap-3 rounded-2xl border border-dj-bordure bg-dj-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={texteOuLien}
            onChange={(e) => setTexteOuLien(e.target.value)}
            placeholder="Colle un lien, ou écris/colle un texte…"
            className="flex-1 rounded-cgpt-bouton border border-dj-bordure bg-dj-fond px-4 py-2 text-sm text-dj-texte outline-none focus:border-dj-bordure-forte"
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-cgpt-bouton border border-dj-bordure px-4 py-2 text-xs text-dj-texte transition-colors hover:border-dj-bordure-forte">
            <Paperclip size={14} />
            {nouveauxFichiers.length > 0 ? `${nouveauxFichiers.length} fichier(s)` : "Joindre des fichiers"}
            <input
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/webm,video/quicktime"
              onChange={(e) => setNouveauxFichiers(Array.from(e.target.files ?? []))}
              className="hidden"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={ajouter}
          disabled={(nouveauxFichiers.length === 0 && !texteOuLien.trim()) || envoi}
          className="self-end rounded-cgpt-bouton bg-dj-accent-1 px-5 py-2 text-sm font-bold text-[#1A0D02] transition-colors hover:bg-dj-accent-2 disabled:opacity-50"
        >
          {envoi ? "Envoi…" : "Ajouter"}
        </button>
      </div>

      {erreursEnvoi.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-[#F87171]/40 bg-[#F87171]/5 px-4 py-3">
          {erreursEnvoi.map((e) => (
            <p key={e.nom} className="text-sm text-[#F87171]">
              {e.nom} : {e.erreur}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-1 text-xs">
        {SOUS_ONGLETS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSousOnglet(s.id)}
            className={
              "rounded-cgpt-bouton px-3 py-1.5 font-semibold transition-colors " +
              (sousOnglet === s.id ? "bg-dj-surface-haute text-dj-texte" : "text-dj-texte-muet hover:text-dj-texte")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {fichiersAffiches === null && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" />
          <Skeleton className="h-14 rounded-xl border border-dj-bordure" style={{ animationDelay: "100ms" }} />
        </div>
      )}
      {fichiersAffiches?.length === 0 && <p className="text-sm text-dj-texte-muet">Rien ici pour l&apos;instant.</p>}
      {fichiersAffiches && fichiersAffiches.length > 0 && (
        <div className="flex flex-col gap-2">
          {fichiersAffiches.map((f) => {
            const type = typeDe(f);
            const Icone =
              type === "liens" ? IconLien
              : type === "texte" ? FileText
              : type === "images" ? IconImage
              : type === "audio" ? IconAudio
              : type === "videos" ? IconVideo
              : Paperclip;
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-dj-bordure bg-dj-surface px-4 py-3"
              >
                <button
                  onClick={() => setFichierOuvert(f)}
                  className="flex min-w-0 items-center gap-2 text-sm text-dj-accent-1 hover:text-dj-accent-2"
                >
                  <Icone size={14} className="flex-shrink-0" />
                  <span className="truncate">{f.description || f.nom_fichier}</span>
                </button>
                <button
                  onClick={() => supprimer(f.id, f.description || f.nom_fichier)}
                  className="flex-shrink-0 text-xs text-dj-texte-muet transition-colors hover:text-[#F87171]"
                >
                  Supprimer
                </button>
              </div>
            );
          })}
        </div>
      )}

      <VisionneuseBibliotheque fichier={fichierOuvert} onFermer={() => setFichierOuvert(null)} />
    </div>
  );
}
