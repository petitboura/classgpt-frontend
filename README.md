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

## État d'avancement

**Partie 1 — Squelette (fait)**
Next.js 14 + Tailwind, tokens `dj-*` repris à l'identique de
`djiguigne-frontend/tailwind.config.ts` (à ne jamais faire dériver sans
décision explicite de Bourama). 3 polices de la marque (Bricolage
Grotesque, Inter, JetBrains Mono).

**Partie 2 — Connexion et inscription autonomes (fait)**
`app/connexion/page.tsx`, `app/inscription/page.tsx`, `components/ChampTelephone.tsx`,
`components/ChampMotDePasse.tsx`, `lib/authFallback.ts`. Connexion email ou
téléphone. L'inscription attribue silencieusement le rôle `etablissement`
(pas de sélecteur de rôle visible — un compte enseignant/étudiant se
rattache plus tard via un code d'invitation, partie 4). Aucun passage par
la vitrine Djiguignè (`djiguigne-ai`), tout est géré ici.

**Partie 3 — Expérience de chat directe (fait)**
`app/page.tsx` résout l'agent (Lirinus, jamais nommé côté UI) via
`GET /api/roles/moi`, redirige vers `/connexion` si pas de session. Tous
les composants de chat (`components/chat/*`) sont repris de
`djiguigne-frontend`, adaptés : `SidebarChatLite.tsx` remplace la sidebar
multi-agents (historique de conversations de CET agent uniquement, pas de
"changer d'IA"/"voir l'IA"/"retour à la vitrine").

**Correction apportée lors de la fusion (08/08)** : `lib/erreurs.ts`
contenait ~58 codes d'erreur du reste de l'écosystème Djiguignè
(création/modification d'agent, feed social, publications, vitrine,
signature électronique, génération 3D/vidéo...) — jamais déclenchés par
Class GPT mais présents en clair dans le bundle JS livré au navigateur,
donc inspectables via les devtools et révélateurs de l'écosystème plus
large derrière le produit. Retirés. Le fallback de `messageErreur()` sur
le message déjà en français renvoyé par le backend reste inchangé, aucune
perte fonctionnelle.

## Ce qui reste à faire (parties 4 et 5)

**Partie 4 — Espace utilisateur réduit
Uniquement : inviter par message/code, suivi des étudiants ("l'IA de mes
élèves"), diffusion de documents. Les fonctions équivalentes existent déjà
côté backend (`diffuserDocumentEtablissement`, `diffuserLien` — voir
`djiguigne-frontend/lib/api.ts` comme référence). Explicitement SANS :
onglets "administrer"/"mes IA", bouton retour vitrine, sélecteur/historique
d'agents.

**Partie 5 — Identité visuelle "à main levée" (reste à faire)**
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
