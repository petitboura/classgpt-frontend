"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Monitor, Sun, Moon, MessageCircle, ExternalLink, LogOut, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appelerApi, appelerApiFichier, lireMonProfil, enregistrerMonProfil, supprimerMonCompte } from "@/lib/api";
import { messageErreur, ErreurApi } from "@/lib/erreurs";
import { useTheme, type ChoixTheme } from "@/lib/useTheme";
import { Skeleton } from "./Skeleton";
import { CTACompteRequis } from "./CTACompteRequis";

/**
 * Page Paramètres (22/08/2026, demande Bourama : "on met les 7 [sections]
 * sauf abonnement et facturation"). 6 sections : Profil, Préférences,
 * Confidentialité et sécurité, Aide et support, À propos, Zone de danger
 * (déconnexion + suppression de compte).
 *
 * Rôles (2026-08-04) volontairement absents ici : vérifié dans
 * app/inscription/page.tsx, l'inscription n'attribue plus aucun rôle
 * ("il n'y a plus de rôle") -- rien à afficher côté profil pour l'instant.
 *
 * Deux sections restent volontairement minimales, faute de contenu réel
 * à afficher (signalé à Bourama plutôt que d'inventer) :
 * - Aide et support : pas d'adresse ou de formulaire de support dédié
 *   trouvé dans le projet -- pointe vers le chat Clovis en attendant.
 * - À propos : pas de numéro de version destiné aux utilisateurs, pas de
 *   page CGU propre à Clovis -- les liens légaux pointent vers les pages
 *   déjà existantes de la vitrine (djiguigne-ai/app/[locale]/legal/...).
 *
 * Pas de mécanisme i18n branché sur ce fichier (même constat que
 * MesComportements.tsx et EspacePlugins.tsx, vérifié 2026-08-22) -- textes
 * en dur en français comme le reste du projet, à signaler à Bourama si la
 * traduction doit être ajoutée plus tard.
 */

const ORDRE_THEME: ChoixTheme[] = ["systeme", "clair", "sombre"];
const ICONES_THEME = { systeme: Monitor, clair: Sun, sombre: Moon };
const LIBELLES_THEME = { systeme: "Système", clair: "Clair", sombre: "Sombre" };

type ProfilMoi = {
  user_id: string;
  nom_affiche: string;
  bio: string;
  avatar_url: string | null;
  notifications_proactives_actives: boolean;
};

function Carte({
  titre,
  description,
  children,
}: {
  titre: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-dj-bordure bg-dj-surface p-6">
      <div>
        <h2 className="font-display text-base font-bold text-dj-texte">{titre}</h2>
        {description && <p className="mt-1 text-sm text-dj-texte-muet">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function EspaceParametres() {
  const router = useRouter();
  const { choix: choixTheme, changerTheme } = useTheme();

  const [chargement, setChargement] = useState(true);
  const [sansCompte, setSansCompte] = useState(false);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);

  const [profil, setProfil] = useState<ProfilMoi | null>(null);
  const [nomAffiche, setNomAffiche] = useState("");
  const [bio, setBio] = useState("");
  const [notifsActives, setNotifsActives] = useState(false);

  const [enregistrementProfil, setEnregistrementProfil] = useState(false);
  const [messageProfil, setMessageProfil] = useState<string | null>(null);
  const [erreurProfil, setErreurProfil] = useState<string | null>(null);

  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [erreurAvatar, setErreurAvatar] = useState<string | null>(null);
  const inputFichierRef = useRef<HTMLInputElement>(null);

  const [messageNotifs, setMessageNotifs] = useState<string | null>(null);
  const [enregistrementNotifs, setEnregistrementNotifs] = useState(false);

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [enregistrementMotDePasse, setEnregistrementMotDePasse] = useState(false);
  const [messageMotDePasse, setMessageMotDePasse] = useState<string | null>(null);
  const [erreurMotDePasse, setErreurMotDePasse] = useState<string | null>(null);

  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  useEffect(() => {
    lireMonProfil()
      .then((p: ProfilMoi) => {
        setProfil(p);
        setNomAffiche(p.nom_affiche || "");
        setBio(p.bio || "");
        setNotifsActives(!!p.notifications_proactives_actives);
      })
      .catch((e) => {
        if (e instanceof ErreurApi && e.statusCode === 401) {
          setSansCompte(true);
        } else {
          setErreurChargement(messageErreur(e));
        }
      })
      .finally(() => setChargement(false));
  }, []);

  async function enregistrerProfil() {
    setEnregistrementProfil(true);
    setErreurProfil(null);
    setMessageProfil(null);
    try {
      await enregistrerMonProfil({ nom_affiche: nomAffiche.trim(), bio: bio.trim() });
      setMessageProfil("Profil enregistré.");
    } catch (e) {
      setErreurProfil(messageErreur(e));
    } finally {
      setEnregistrementProfil(false);
    }
  }

  async function changerAvatar(fichier: File) {
    setUploadEnCours(true);
    setErreurAvatar(null);
    try {
      const { url } = await appelerApiFichier("/api/uploads/image", fichier);
      await enregistrerMonProfil({ avatar_url: url });
      setProfil((p) => (p ? { ...p, avatar_url: url } : p));
    } catch (e) {
      setErreurAvatar(messageErreur(e));
    } finally {
      setUploadEnCours(false);
    }
  }

  async function basculerNotifs() {
    const nouvelleValeur = !notifsActives;
    setNotifsActives(nouvelleValeur);
    setEnregistrementNotifs(true);
    setMessageNotifs(null);
    try {
      await enregistrerMonProfil({ notifications_proactives_actives: nouvelleValeur });
      setMessageNotifs(nouvelleValeur ? "Relances activées." : "Relances désactivées.");
    } catch (e) {
      setNotifsActives(!nouvelleValeur); // repli si l'enregistrement échoue
      setMessageNotifs(messageErreur(e));
    } finally {
      setEnregistrementNotifs(false);
    }
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setErreurMotDePasse(null);
    setMessageMotDePasse(null);
    if (motDePasse.length < 6) {
      setErreurMotDePasse("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (motDePasse !== confirmationMotDePasse) {
      setErreurMotDePasse("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setEnregistrementMotDePasse(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: motDePasse });
      if (error) throw error;
      setMessageMotDePasse("Mot de passe mis à jour.");
      setMotDePasse("");
      setConfirmationMotDePasse("");
    } catch (e: any) {
      setErreurMotDePasse(e?.message || "Impossible de mettre à jour le mot de passe, réessaie.");
    } finally {
      setEnregistrementMotDePasse(false);
    }
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();
    router.push("/connexion");
  }

  async function confirmerSuppressionCompte() {
    const saisie = window.prompt(
      'Cette action est définitive : ton profil, tes IA, tes commentaires et tout ce qui t\'appartient sur Clovis seront supprimés. Tape "SUPPRIMER" pour confirmer.'
    );
    if (saisie !== "SUPPRIMER") return;

    setSuppressionEnCours(true);
    setErreurSuppression(null);
    try {
      await supprimerMonCompte();
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      setErreurSuppression(messageErreur(e));
      setSuppressionEnCours(false);
    }
  }

  if (sansCompte) {
    return <CTACompteRequis texte="Crée un compte pour gérer ton profil et tes préférences." />;
  }

  if (chargement) {
    return (
      <div className="flex flex-col gap-4" aria-hidden>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (erreurChargement) {
    return <p className="text-sm text-[var(--dj-erreur)]">{erreurChargement}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* --- Profil --- */}
      <Carte titre="Profil" description="Ta photo, ton nom et ta bio, visibles sur ton profil Clovis.">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => inputFichierRef.current?.click()}
            disabled={uploadEnCours}
            aria-label="Changer la photo de profil"
            className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-dj-bordure bg-dj-surface-haute disabled:opacity-60"
          >
            {profil?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar_url vient de Supabase Storage, hôte dynamique, pas dans next.config
              <img src={profil.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-dj-texte-muet">
                {(nomAffiche || "?").trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <Camera size={18} className={uploadEnCours ? "animate-pulse" : ""} />
            </span>
          </button>
          <input
            ref={inputFichierRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              if (fichier) changerAvatar(fichier);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => inputFichierRef.current?.click()}
              disabled={uploadEnCours}
              className="self-start text-sm font-medium text-dj-accent-1 hover:text-dj-accent-2 disabled:opacity-50"
            >
              {uploadEnCours ? "Envoi…" : "Changer la photo"}
            </button>
            <span className="text-xs text-dj-texte-muet">JPEG, PNG ou WebP, 5 Mo max.</span>
          </div>
        </div>
        {erreurAvatar && <p className="text-sm text-[var(--dj-erreur)]">{erreurAvatar}</p>}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nom-affiche" className="text-sm font-medium text-dj-texte">
            Nom affiché
          </label>
          <input
            id="nom-affiche"
            type="text"
            value={nomAffiche}
            onChange={(e) => setNomAffiche(e.target.value)}
            placeholder="Ton nom"
            className="w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-dj-texte">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Quelques mots sur toi (optionnel)."
            className="w-full resize-y rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-dj-texte">Email</span>
          <span className="text-sm text-dj-texte-muet">Géré depuis l&apos;écran de connexion, non modifiable ici.</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={enregistrerProfil}
            disabled={enregistrementProfil}
            className="rounded-cgpt-bouton bg-dj-accent-1 px-5 py-2 text-sm font-bold text-[#1A0D02] transition-colors hover:bg-dj-accent-2 disabled:opacity-50"
          >
            {enregistrementProfil ? "Enregistrement…" : "Enregistrer"}
          </button>
          {messageProfil && <span className="text-sm text-dj-texte-muet">{messageProfil}</span>}
        </div>
        {erreurProfil && <p className="text-sm text-[var(--dj-erreur)]">{erreurProfil}</p>}
      </Carte>

      {/* --- Préférences --- */}
      <Carte titre="Préférences">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-dj-texte">Thème</span>
          <div className="flex gap-2">
            {ORDRE_THEME.map((t) => {
              const Icone = ICONES_THEME[t];
              const actif = choixTheme === t;
              return (
                <button
                  key={t}
                  onClick={() => changerTheme(t)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    actif
                      ? "border-dj-bordure-forte bg-dj-surface-haute text-dj-texte"
                      : "border-dj-bordure text-dj-texte-muet hover:bg-dj-surface-haute"
                  }`}
                >
                  <Icone size={16} />
                  {LIBELLES_THEME[t]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-dj-bordure pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-dj-texte">Relances de Clovis</span>
            <span className="text-xs text-dj-texte-muet">
              Autorise Clovis à te relancer si tu es inactif, pour ne pas perdre le fil.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={notifsActives}
            onClick={basculerNotifs}
            disabled={enregistrementNotifs}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              notifsActives ? "bg-dj-accent-1" : "bg-dj-inactif"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                notifsActives ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {messageNotifs && <span className="text-sm text-dj-texte-muet">{messageNotifs}</span>}
      </Carte>

      {/* --- Confidentialité et sécurité --- */}
      <Carte titre="Confidentialité et sécurité" description="Change le mot de passe de ton compte.">
        <form onSubmit={changerMotDePasse} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nouveau-mdp" className="text-sm font-medium text-dj-texte">
              Nouveau mot de passe
            </label>
            <input
              id="nouveau-mdp"
              type="password"
              autoComplete="new-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmation-mdp" className="text-sm font-medium text-dj-texte">
              Confirme le mot de passe
            </label>
            <input
              id="confirmation-mdp"
              type="password"
              autoComplete="new-password"
              value={confirmationMotDePasse}
              onChange={(e) => setConfirmationMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-dj-bordure bg-dj-surface-haute px-3 py-2 text-sm text-dj-texte outline-none focus:border-dj-accent-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={enregistrementMotDePasse || !motDePasse}
              className="self-start rounded-cgpt-bouton bg-dj-accent-1 px-5 py-2 text-sm font-bold text-[#1A0D02] transition-colors hover:bg-dj-accent-2 disabled:opacity-50"
            >
              {enregistrementMotDePasse ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
            {messageMotDePasse && <span className="text-sm text-dj-texte-muet">{messageMotDePasse}</span>}
          </div>
          {erreurMotDePasse && <p className="text-sm text-[var(--dj-erreur)]">{erreurMotDePasse}</p>}
        </form>
      </Carte>

      {/* --- Aide et support --- */}
      <Carte titre="Aide et support">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 self-start rounded-lg border border-dj-bordure px-4 py-2 text-sm text-dj-texte transition-colors hover:bg-dj-surface-haute"
        >
          <MessageCircle size={16} />
          Poser une question à Clovis
        </button>
      </Carte>

      {/* --- À propos --- */}
      <Carte titre="À propos">
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-dj-texte">Clovis, par Djiguignè AI</span>
          <a
            href="https://djiguigne.com/legal/mentions-legales"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-dj-accent-1 hover:text-dj-accent-2"
          >
            Mentions légales
            <ExternalLink size={13} />
          </a>
          <a
            href="https://djiguigne.com/legal/confidentialite"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-dj-accent-1 hover:text-dj-accent-2"
          >
            Politique de confidentialité
            <ExternalLink size={13} />
          </a>
        </div>
      </Carte>

      {/* --- Zone de danger --- */}
      <Carte titre="Zone de danger">
        <button
          onClick={seDeconnecter}
          className="flex items-center gap-2 self-start rounded-lg border border-dj-bordure px-4 py-2 text-sm text-dj-texte-muet transition-colors hover:bg-dj-surface-haute hover:text-dj-texte"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>

        <div className="flex flex-col gap-2 border-t border-dj-bordure pt-4">
          <button
            onClick={confirmerSuppressionCompte}
            disabled={suppressionEnCours}
            className="flex items-center gap-2 self-start rounded-lg border border-[var(--dj-erreur)] px-4 py-2 text-sm text-[var(--dj-erreur)] transition-colors hover:bg-[var(--dj-erreur)]/10 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {suppressionEnCours ? "Suppression…" : "Supprimer mon compte"}
          </button>
          <span className="text-xs text-dj-texte-muet">
            Supprime définitivement ton profil, tes IA et tout ce qui t&apos;appartient sur Clovis.
          </span>
          {erreurSuppression && <p className="text-sm text-[var(--dj-erreur)]">{erreurSuppression}</p>}
        </div>
      </Carte>
    </div>
  );
}
