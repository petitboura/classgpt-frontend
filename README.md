# Class GPT — frontend

Produit autonome dérivé de l'écosystème Djiguignè (rôle "établissement"),
mais qui ne doit **jamais** laisser transparaître ce lien. Pour
l'utilisateur, c'est une IA à part entière, pas une section d'un produit
plus grand.

## Ce qui existe déjà (backend, inchangé, partagé)

- Backend FastAPI (`djiguigne-backend`) : mêmes endpoints, notamment
  `api/roles.py` (auth/rôles établissement-enseignant-étudiant), `api/chat.py`
  (streaming), `lib/api.ts` de ce dépôt appelle directement ce backend.
- Supabase (même projet que `djiguigne-frontend`) : auth directe côté
  client via `lib/supabase.ts`, le backend ne fait que vérifier le token.
- Agent Lirinus : c'est l'agent existant dédié aux établissements,
  réutilisé ici en arrière-plan (l'utilisateur ne doit jamais voir son nom
  technique ni savoir qu'il existe d'autres agents).

## Ce qui est fait dans ce squelette (partie 1)

- Projet Next.js 14 + Tailwind, tokens `dj-*` repris à l'identique de
  `djiguigne-frontend/tailwind.config.ts` (à ne jamais faire dériver sans
  décision explicite de Bourama).
- 3 polices de la marque (Bricolage Grotesque, Inter, JetBrains Mono).
- `lib/supabase.ts` et `lib/api.ts` : socle d'appel au backend/à l'auth,
  minimal, à étendre dans les parties suivantes (streaming pour le chat,
  upload de fichiers, etc.).
- `app/page.tsx` : page de jonction temporaire, PAS l'écran final.

## Ce qui reste à faire (parties 2 à 5, indépendantes entre elles)

**Partie 2 — Connexion et inscription autonomes**
Écrans de connexion/inscription propres à Class GPT, aucune redirection
vers la vitrine Djiguignè (`djiguigne-ai`). S'appuie sur `api/roles.py`
côté backend (déjà existant, ne pas le modifier sans nécessité) et sur
`lib/supabase.ts` de ce dépôt.

**Partie 3 — Expérience de chat directe**
Ouverture directe sur le chat après connexion. Pas de sélecteur d'agents
visible, pas d'historique de plusieurs IA. Consomme le streaming du
backend (`appelerApiStream` dans `djiguigne-frontend/lib/api.ts` est la
référence d'implémentation, à adapter ici). L'agent utilisé en arrière-plan
est Lirinus, mais ce nom ne doit jamais apparaître à l'utilisateur.

**Partie 4 — Espace utilisateur réduit**
Uniquement : inviter par message/code, suivi des étudiants ("l'IA de mes
élèves"), diffusion de documents. Les fonctions équivalentes existent déjà
côté backend (`diffuserDocumentEtablissement`, `diffuserLien` — voir
`djiguigne-frontend/lib/api.ts` comme référence). Explicitement SANS :
onglets "administrer"/"mes IA", bouton retour vitrine, sélecteur/historique
d'agents.

**Partie 5 — Identité visuelle "à main levée"**
Logo (chapeau de diplômé, couleurs Djiguignè), et un traitement organique :
courbes légèrement irrégulières, animations à easing non linéaire (pas de
`ease-in-out` générique), rien ne s'affiche jamais de façon brute. À
appliquer avec retenue, jamais de façon gratuite/décorative — chaque
irrégularité doit servir une transition ou une apparition précise.

## Règles à respecter dans toutes les parties suivantes

- Jamais de valeur en dur (texte, couleur, URL, seuil) qui devrait pouvoir
  changer sans toucher au code.
- Toujours responsive (mobile ET desktop).
- Transitions fluides partout, jamais d'affichage brut, jamais de
  chargement bloquant sans animation.
- Préparer le multi-langue (pas de texte figé non traduisible).
- Ne jamais exposer le nom technique des agents, ni l'existence de
  Djiguignè, ni de lien vers la vitrine ou le frontend étudiant.
- S'inspirer de Claude.ai et ChatGPT pour les patterns d'interaction
  (streaming, animations de chargement, gestion des erreurs), sans copier
  à l'identique.
