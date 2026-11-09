# À faire plus tard

Points repérés pendant P1-03, P1-04 et l'issue des fichiers du dépôt. Chaque point a vocation à devenir une issue dans le GitHub Project ; une fois l'issue créée, cocher la case ici.

## En cours : #74 Routing (section temporaire)

> Liste de travail de la branche `feat/74-routing`, créée depuis `feat/14-squelette-react-mvvm-et-composants-accessibles`. À supprimer au merge de la PR. 🔍 = montrer le résultat pour revue avant de continuer.

**1. Choisir la bibliothèque** (`docs(adr): add 0011 web router`)

- [x] Choisir entre React Router et TanStack Router (critères dans la réponse de Claude), puis demander à Claude de rédiger l'ADR 0011 avec ce choix.
- [x] Installer la bibliothèque dans `apps/web` (`pnpm --filter @lanterne/web add …`).

**2. La mise en page commune** (`feat(web): add accessible app layout`)

- [x] `apps/web/src/app/layout/AppLayout.tsx` : dans cet ordre, le lien d'évitement « Aller au contenu » (premier élément focalisable, WCAG 2.4.1), `header` (nom Lanterne), `nav` (liens vers les routes), puis `main` avec un `id` (cible du lien d'évitement) et la zone où s'affiche la page.
- [ ] Pour #75 : styliser l'état actif `.active` de `NavLink` avec un repère autre que la couleur seule (par exemple soulignement ou bordure, WCAG 1.4.1).
- [x] Le lien d'évitement peut être masqué visuellement, mais doit **apparaître quand il reçoit le focus**.
- [x] Retirer le `<main>` de `CampaignListView` (et adapter son test) : une page ne doit avoir qu'un seul repère principal, fourni par la mise en page.
- [x] `/vue-joueurs` n'utilise **pas** cette mise en page (pas de navigation ni de liens sur l'écran partagé) : prévoir une mise en page à part, minimale.
- [x] 🔍 Montrer la mise en page.

**3. Les routes de départ** (`feat(web): add initial routes`)

- [x] Définir les routes dans `apps/web/src/app/routes.tsx`.
- [x] Une View vide par route dans `apps/web/src/views/`, chacune avec un vrai `h1` : `LoginView` (`/connexion`), `RegisterView` (`/inscription`), `CampaignListView` (`/campagnes`, existe déjà), `GameMasterView` (`/campagnes/:campaignId`), `JoinCampaignView` (`/rejoindre`), `PlayerDisplayView` (`/vue-joueurs`), `NotFoundView` (toute autre adresse). Ne pas nommer la vue MJ `CampaignGmView` : ce nom est déjà un type du contrat.
- [x] `/` redirige vers `/campagnes`.

**4. Titre de page** (`feat(web): set page title on navigation`)

- [ ] Chaque route déclare son titre ; il est appliqué à `document.title` sous la forme `Campagnes · Lanterne` (WCAG 2.4.2). Un seul mécanisme pour toutes les routes, pas un `document.title` écrit dans chaque View.

**5. Focus après navigation** (`feat(web): move focus to the page heading on navigation`)

- [ ] Après chaque navigation (mais **pas** au premier chargement de la page), placer le focus sur le `h1` de la nouvelle page (`tabIndex={-1}`) : le lecteur d'écran lit alors le titre de la page.
- [ ] Un seul mécanisme dans la mise en page, pas un effet dans chaque View.
- [ ] 🔍 Montrer le mécanisme.

**6. Session et routes protégées** (`feat(web): add session view model and protected routes`)

- [ ] Ajouter un repository de session (`SessionRepository`, méthode `getCurrentUser`, route `getCurrentUser` du contrat), avec ses implémentations `mock` et `http`, et l'ajouter à l'objet `Repositories`. Un 401 de l'API signifie « non connecté », pas une erreur.
- [ ] C'est le deuxième repository : renommer `CampaignRepositoryError` en une erreur commune (par exemple `ApiError`) et partager **un seul** client HTTP entre les repositories (limites notées dans `architecture-web.md`).
- [ ] ViewModel `useSession` : expose `isAuthenticated`, `isLoading` et l'utilisateur.
- [ ] Un composant de garde dans `apps/web/src/app/` utilise `useSession` : non connecté → redirection vers `/connexion`, en gardant l'adresse demandée pour y revenir après la connexion. Pendant le chargement de la session, ne rien afficher de la page protégée.
- [ ] Routes protégées : `/campagnes`, `/campagnes/:campaignId`, `/rejoindre`. Publiques : `/connexion`, `/inscription`, `/vue-joueurs` (elle a son jeton d'affichage), 404.
- [ ] Le `mock` permet de simuler les deux cas (connecté, non connecté), pour le développement et les tests.

**7. Les fragments d'URL** (`feat(web): read invitation code and display token from the url fragment`)

- [ ] `/rejoindre#XXXXX-XXXXX` : lire le code dans le fragment (`location.hash`), jamais dans un paramètre `?code=` (le fragment n'est jamais envoyé au serveur ni écrit dans ses logs). Le garder pendant une redirection vers `/connexion`, pour le retrouver après.
- [ ] `/vue-joueurs#<jeton>` : lire le jeton, l'effacer **aussitôt** de l'adresse avec `history.replaceState`, et le garder **en mémoire uniquement** (ni `localStorage`, ni `sessionStorage`, ni console). Sans jeton, afficher un message qui explique d'ouvrir la vue depuis l'écran du MJ.
- [ ] 🔍 Montrer la lecture du jeton.

**8. Chargement différé** (`feat(web): lazy load heavy screens`)

- [ ] `GameMasterView` et `PlayerDisplayView` chargées à la demande (`React.lazy` ou l'équivalent de la bibliothèque), avec un état de chargement annoncé dans une région `role="status"` toujours présente.

**9. Tests** (`test(web): cover routing, focus and protected routes`)

- [ ] Installer un outil axe pour les tests (`vitest-axe` ou `jest-axe`) et vérifier la mise en page : aucune erreur.
- [ ] Chaque route rend son titre de page et son `h1`.
- [ ] Après une navigation par un lien, au clavier, le focus est sur le `h1` de la nouvelle page ; au premier chargement, il ne bouge pas.
- [ ] Le lien d'évitement est le premier élément focalisable et amène au `main`.
- [ ] `/vue-joueurs#jeton` : le fragment n'est plus dans l'adresse après le chargement.
- [ ] Une route protégée redirige vers `/connexion` quand `useSession` dit « non connecté », puis revient à l'adresse demandée après la connexion.

**10. Documentation** (rédigée par Claude sur demande)

- [ ] ADR 0011, section « Routing » de `docs/technique/architecture-web.md`, CHANGELOG.

**11. PR**

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` à la racine.
- [ ] PR vers `feat/14-squelette-react-mvvm-et-composants-accessibles` : « Closes #74 ».
- [ ] « vérifie » avec Claude avant de la proposer à l'équipe.

## Documentation et licences

- [ ] **Captures du README** : remplacer l'emplacement vide de la section « Captures » par des images de la vue MJ, de la vue joueurs et de l'assistant de création, rangées dans `docs/captures/`, chacune avec un texte alternatif (WCAG 1.1.1). Exigé par la fiche (bloc 03-B).
- [ ] **Attribution du SRD dans le produit** : page « À propos » ou « Mentions légales » dans l'application web, avec la mention d'attribution CC BY 4.0 du SRD 5.1 (le README ne suffit pas : l'utilisateur ne le lit pas).
- [ ] **Traduction du SRD** : décider en équipe si le contenu est affiché en français. Si oui, ajouter « traduit et adapté » à la mention d'attribution (README et page « À propos »), comme l'exige la CC BY 4.0.

- [ ] **Déclaration de limites** : lister dans `docs/` les limites connues du produit, en commençant par celle-ci : murs et portes seulement sur grille carrée (le contrat renvoie `walls_require_square_grid` sur une grille hexagonale).
- [ ] **Icônes** : les composants de la charte utilisent Lucide (licence ISC). Utiliser la même bibliothèque dans le code (`lucide-react` côté web, équivalent côté mobile), le noter dans un ADR, et passer les icônes restantes des maquettes sur Lucide.

## Outillage

- [x] **Script `test` à la racine** : ajouter `turbo run test`, documenté dans le README mais absent du `package.json`. À faire avec le premier test du moteur de règles, ou dans la CI.
- [ ] **Version de PostgreSQL** : fixer l'image sur une version précise (par exemple `postgres:17.11-alpine`) dans `compose.yaml`, comme Adminer.
- [ ] **Vérifier `compose.yaml` en CI** : `docker compose config --quiet`, avec un `.env` créé à partir de `.env.example` et des valeurs factices.
- [ ] **TypeScript** : remonter au-delà de `~6.0.x` quand typescript-eslint le prendra en charge.

## À vérifier avant la soutenance

- [ ] `main` et `dev` sont bien protégées (CI obligatoire et relecture), comme l'annonce `CONTRIBUTING.md`.
- [ ] Le formulaire de signalement privé du dépôt est activé (utilisé par `CODE_OF_CONDUCT.md`).
- [ ] Chaque membre a complété le tableau « Usage de l'IA » du README.
- [ ] Test du nouvel arrivant : une personne extérieure lance le produit et les tests avec le seul README, en moins de 15 minutes.

- Renommer `CampaignRepositoryError` en une erreur commune, et partager un seul client HTTP, avec le deuxième repository.
- Interdire au web le point d'entrée « jets » du moteur de règles (ADR 0007), quand le moteur aura ses deux points d'entrée.

ta note sur le style .active pour #75 est rangée dans la section temporaire de #74. Cette section sera supprimée au merge de #74, et la note avec elle. Mets-la plutôt dans l'issue #75,
