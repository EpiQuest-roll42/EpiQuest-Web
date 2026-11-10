# Architecture de l'application web

Cette page explique comment est organisée l'application web (`apps/web`) et comment y ajouter un écran. Elle s'adresse à toute personne qui reprend le code.

## Le principe : MVVM

L'application suit l'architecture **MVVM**, décrite dans le schéma `docs/EpiQuest - Architecture MVVM.pdf` :

```
View  ──────────►  ViewModel  ──────────►  Model  ──────────►  API
composants React   hooks + TanStack Query  repositories          (P2)
affiche l'état     calcule l'état d'écran  données simulées (P1)
                   et expose les commandes ou client HTTP (P2)
```

- Une **View** n'appelle jamais l'API ni un repository et ne lit pas l'adresse : elle affiche l'état que lui donne son ViewModel et déclenche ses commandes.
- Un **ViewModel** ne connaît pas l'affichage : il expose un état d'écran (`campaigns`, `isLoading`, `error`…) et des commandes (`refresh`…).
- Le **Model** ne connaît pas React : ce sont des interfaces TypeScript et leurs implémentations.

En P1, le Model renvoie des **données simulées**. En P2, on passe au client HTTP **sans toucher aux Views ni aux ViewModels** : seule l'implémentation choisie change. C'est la raison d'être de cette séparation.

## Les dossiers de `src/`

| Dossier                | Rôle                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                 | Le **câblage** : point d'entrée, choix de l'implémentation des repositories (`createRepositories`), contexte React, client TanStack Query, routes (`routes.tsx`), mises en page (`layout/`), garde de session. |
| `models/api/`          | `schema.d.ts`, les types **générés** depuis le contrat d'API. Ce fichier n'est pas commité.                                                                                                                    |
| `models/repositories/` | Une interface par ressource (`CampaignRepository`, `SessionRepository`), ses implémentations `mock` et `http`, l'erreur commune `ApiError`, le client HTTP partagé (`apiClient`) et l'objet `Repositories`.    |
| `viewModels/`          | Un hook par écran (`useCampaignList`, `useLogin`, `useJoinCampaign`, `usePlayerDisplay`) et le hook partagé `useSession`.                                                                                      |
| `views/`               | Les écrans, un par route (`CampaignListView`, `LoginView`…).                                                                                                                                                   |
| `components/`          | Les composants de la charte : bouton, champ, pion (créés par #76).                                                                                                                                             |
| `theme/`               | Les variables de la charte (palettes, typographie, échelles, focus, animations) et les styles globaux, décrits dans [theme.md](theme.md).                                                                      |
| `tests/`               | Les tests (Vitest, Testing Library et axe).                                                                                                                                                                    |

### Les règles d'import, vérifiées par le lint

| Une View peut importer         | Une View ne peut pas importer                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| les ViewModels, les composants | `models/`, `openapi-fetch`, `react-router`, `app/repositoriesContext`, `app/createRepositories`, les données simulées |

| Un ViewModel peut importer                                                                   | Un ViewModel ne peut pas importer |
| -------------------------------------------------------------------------------------------- | --------------------------------- |
| `app/repositoriesContext`, les types de `models/`, `react-router` (lire l'adresse, naviguer) | `views/`, `components/`           |

Ces règles sont dans `eslint.config.mjs` (`no-restricted-imports`) : un import interdit fait échouer `pnpm lint`, donc la CI. Interdire `react-router` aux Views oblige à passer par un ViewModel pour tout ce qui touche à l'adresse (fragment, redirection, retour après connexion), et donc à pouvoir le tester seul.

## Les types de l'API

Les types viennent du contrat d'API (`packages/api-contract/openapi.yaml`, ADR 0008), générés par `openapi-typescript` :

- le script `generate:api` du paquet web écrit `src/models/api/schema.d.ts` ;
- les options `--root-types --root-types-no-schema-prefix` exportent chaque schéma du contrat sous son propre nom : `import type { CampaignSummaryPage } from '../models/api/schema';` ;
- le fichier n'est **pas commité** (il est ignoré par Git, Prettier et ESLint) : turbo le régénère avant `typecheck`, `build` et `test`, et le régénère dès que le contrat ou la version du générateur change ;
- un schéma renommé dans le contrat fait échouer `tsc` à l'endroit exact où il est utilisé.

Pour le régénérer à la main : `pnpm --filter @lanterne/web generate:api`.

## Données simulées ou API réelle

L'implémentation des repositories est choisie **à un seul endroit**, `src/app/createRepositories.ts`, selon ces variables d'environnement (voir `.env.example`) :

| Variable            | Valeurs                        | Par défaut                                                                                 |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `VITE_API_MODE`     | `mock` ou `http`               | `mock` en développement, **obligatoire** en production                                     |
| `VITE_API_BASE_URL` | URL de l'API                   | `http://localhost:3000/api/v1` en développement, **obligatoire** en production avec `http` |
| `VITE_MOCK_SESSION` | `authenticated` ou `anonymous` | `authenticated` ; lue seulement avec `mock`, pour simuler un visiteur connecté ou non      |

- En production, une variable absente, ou `mock`, **empêche l'application de démarrer**, avec un message clair : un site en ligne ne doit jamais afficher de données inventées. Une valeur inconnue de `VITE_MOCK_SESSION` empêche aussi le démarrage.
- Les données simulées sont chargées par un `import()` dynamique : elles **ne figurent pas** dans le build de production.
- Les repositories `http` partagent **un seul client** (`models/repositories/apiClient.ts`), qui envoie le cookie de session (`credentials: 'include'`, ADR 0008). La future vue joueurs, elle, utilisera `credentials: 'omit'` et son jeton d'affichage (contrat, `displayAuth`).
- Vite charge le `.env` de la racine du dépôt (`envDir: '../..'` dans `apps/web/vite.config.ts`), cohérent avec l'emplacement indiqué par `.env.example`.

Les implémentations `mock` sont créées par une fonction (`createMockCampaignRepository()`, `createMockSessionRepository()`) : chaque appel donne une instance neuve, avec ses propres données. Elles renvoient des **copies**, comme le ferait le réseau. `createMockSessionRepository(null)` simule un visiteur non connecté.

## Routing

Le routing utilise React Router 8 en mode « data » (ADR 0011). Les routes sont décrites dans `src/app/routes.tsx` (`appRoutes`), et le routeur est créé dans `src/app/App.tsx` : les tests créent ainsi leur propre routeur en mémoire à partir des mêmes routes.

### Les routes

| Adresse                  | View                | Accès                      | Chargement   |
| ------------------------ | ------------------- | -------------------------- | ------------ |
| `/`                      | -                   | redirige vers `/campagnes` | -            |
| `/connexion`             | `LoginView`         | public                     | immédiat     |
| `/inscription`           | `RegisterView`      | public                     | immédiat     |
| `/campagnes`             | `CampaignListView`  | connecté                   | immédiat     |
| `/campagnes/:campaignId` | `GameMasterView`    | connecté                   | à la demande |
| `/rejoindre`             | `JoinCampaignView`  | connecté                   | immédiat     |
| `/vue-joueurs`           | `PlayerDisplayView` | public (jeton d'affichage) | à la demande |
| toute autre adresse      | `NotFoundView`      | public                     | immédiat     |

### Les mises en page

```
RouteTitleLayout         route racine sans path : titre, focus, région de statut
├── AppLayout            lien d'évitement, en-tête, navigation, main
│   └── toutes les routes sauf /vue-joueurs
└── PlayerDisplayLayout  un main seul : pas de navigation sur l'écran partagé
    └── /vue-joueurs
```

- **`AppLayout`** affiche, dans cet ordre, le lien d'évitement « Aller au contenu » (WCAG 2.4.1), l'en-tête, la navigation (`aria-label="Navigation principale"`, avec des `NavLink` qui posent `aria-current="page"`) et le `main`. Le lien d'évitement déplace le focus sur le `main` sans modifier le fragment de l'adresse, qui porte le code d'invitation de `/rejoindre`.
- **`PlayerDisplayLayout`** ne garde que le `main` : la vue joueurs est affichée sur l'écran partagé, sans lien vers les écrans du MJ.
- Chaque page n'a donc qu'**un seul** `main`, fourni par sa mise en page. Une View ne crée jamais de `main`.

### Le titre de page

Chaque route affichée déclare son titre dans son champ `handle`, typé par `RouteHandle` (`src/app/RouteHandle.ts`) :

```ts
handle: { title: 'Mes campagnes' } satisfies RouteHandle,
```

La route racine l'applique à `document.title` sous la forme `Mes campagnes · Lanterne` (WCAG 2.4.2). Le titre de l'onglet, le `h1` de la page et le lien de navigation portent le **même nom**. Une route sans titre affiche « Lanterne », et un test fait échouer la CI si une route affichée n'en déclare pas.

### Le focus après navigation

- Au **premier chargement**, le focus ne bouge pas : le navigateur et le lecteur d'écran commencent en haut de la page. Une redirection immédiate (par exemple de `/` vers `/campagnes`) compte comme le premier chargement.
- Après **chaque navigation**, le focus va sur le `h1` de la nouvelle page, que le lecteur d'écran annonce. Chaque `h1` a donc `tabIndex={-1}` : il peut recevoir le focus par le code, sans entrer dans l'ordre de tabulation.
- Si le `h1` n'est pas encore affiché (session en cours de vérification), la demande reste en attente jusqu'à son apparition. Une nouvelle navigation annule la demande précédente.
- Ce mécanisme existe **une seule fois**, dans la route racine : une View ne déplace jamais le focus après une navigation.

### La région de statut

Une région `role="status"` **toujours présente**, dans le `main` de chaque mise en page, annonce les chargements : « Chargement de la page… » pendant le chargement d'un écran à la demande, « Vérification de la session… » pendant celle de la session. Un composant qui a un message à annoncer appelle `useRouteStatus(message)`, et le dernier message actif est affiché.

### Les routes protégées

- `RequireAuthentication` (`src/app/`) utilise le ViewModel `useSession`. Pendant la vérification, il n'affiche **rien** de la page protégée. Pour un visiteur non connecté, il redirige vers `/connexion` en gardant l'adresse demandée, fragment compris, dans l'état de navigation (`returnTo`).
- `useSession` lit la session par `SessionRepository.getCurrentUser` (opération `getCurrentUser` du contrat). Un 401 de l'API signifie « non connecté », pas une erreur ; les autres erreurs affichent un message dans un `role="alert"`.
- Après la connexion, `useLogin` renvoie vers `returnTo` **seulement s'il désigne une adresse du site** : l'adresse est résolue avec `new URL` et son `origin` est comparé à celui du site ; sinon, le retour se fait vers `/campagnes` (OWASP, redirections non validées).
- Ces vérifications ne servent que l'interface. Les permissions sont **toujours** vérifiées par le serveur : masquer une page ne protège aucune donnée.

### Les fragments d'adresse

Le code d'invitation et le jeton d'affichage sont passés dans le **fragment** (`#…`), jamais dans un paramètre `?…=` : le navigateur n'envoie jamais le fragment au serveur, qui ne peut donc pas l'écrire dans ses journaux.

- **`/rejoindre#XXXXX-XXXXX`** : `useJoinCampaign` lit le code. Il est conservé pendant un passage par `/connexion`.
- **`/vue-joueurs#<jeton>`** : `usePlayerDisplay` capture le jeton **une seule fois**, en mémoire, puis le retire de l'adresse par une navigation React Router qui remplace l'entrée d'historique. Ni l'adresse affichée, ni l'état du routeur, ni l'historique ne contiennent plus le jeton. Il n'est jamais écrit dans `localStorage`, `sessionStorage` ni la console. Sans jeton, la page explique d'ouvrir la vue depuis l'écran du MJ.

### Le chargement à la demande

`GameMasterView` et `PlayerDisplayView`, les écrans les plus lourds, sont chargés avec le champ `lazy` des routes : le build en fait des fichiers séparés, téléchargés seulement quand on ouvre ces pages. Si l'application démarre directement sur l'une d'elles, la route racine affiche `RouteHydrateFallback` le temps du téléchargement.

### Ce que les routes ne font pas

Les `loader` et `action` de React Router ne sont **pas** utilisés : les données passent par les ViewModels et TanStack Query. Un `loader` appellerait le Model sans passer par un ViewModel. Tout ajout est refusé en revue, sauf nouvelle ADR (ADR 0011).

## Ajouter un écran

1. **Le type** : il existe déjà dans `schema.d.ts` s'il est dans le contrat. Sinon, on modifie d'abord le contrat (ADR 0008).
2. **Le Model** : ajouter la méthode à l'interface du repository (par exemple `CampaignRepository`), puis à ses deux implémentations, `mock` et `http`. Une méthode n'est ajoutée que lorsqu'un écran en a besoin.
3. **Le ViewModel** : un hook dans `viewModels/`, qui utilise `useRepositories()` et TanStack Query, et expose un **état d'écran** et des **commandes**, jamais l'objet brut de TanStack Query. S'il a besoin de l'adresse, c'est lui qui utilise `react-router`, pas la View.
4. **La View** : un composant dans `views/`, qui n'utilise que son ViewModel, sans `main`, avec un seul `h1` en `tabIndex={-1}`.
5. **La route** : dans `app/routes.tsx`, sous la bonne mise en page, avec son titre dans `handle`, derrière `RequireAuthentication` si elle demande d'être connecté, et en `lazy` si l'écran est lourd.
6. **Les tests**, une couche à la fois : le ViewModel avec un faux repository injecté par `RepositoriesProvider`, la View avec un ViewModel simulé (`vi.mock`), la route dans `routes.test.tsx` (titre, `h1`, accès).

## Erreurs

- Un repository lève une `ApiError`, qui porte le `Problem` de l'API (RFC 9457).
- Le ViewModel la traduit en un **message pour l'interface**, en français. Le `detail` d'un `Problem` est un texte technique, en anglais : il n'est jamais affiché (ADR 0008).
- TanStack Query réessaie deux fois une erreur réseau ou serveur, mais jamais une erreur 4xx, qui ne se réglerait pas en réessayant (`src/app/queryClient.ts`).

## Accessibilité : les conventions en place

- Un seul `main` par page, fourni par la mise en page, et un seul `h1`, fourni par la View.
- Un lien d'évitement, premier élément focalisable de la page (WCAG 2.4.1).
- Un titre d'onglet par page (WCAG 2.4.2), et le focus sur le `h1` après chaque navigation, sauf au premier chargement (WCAG 2.4.3).
- Une région `role="status"` **toujours présente** dans le `main` annonce les chargements : les lecteurs d'écran n'annoncent pas toujours une région ajoutée avec son texte.
- Une erreur est affichée dans un `role="alert"`.
- Le bouton « Réessayer » reste focalisable pendant la tentative (`aria-disabled` plutôt que `disabled`) ; après une tentative réussie, le focus va sur le titre de la page.

Ces conventions sont vérifiées par les tests des Views et des routes (`routes.test.tsx`, `documentTitle.test.tsx`), dont un passage d'axe sur la mise en page principale.

## Lancer et tester

```bash
pnpm --filter @lanterne/web dev    # http://localhost:5173, avec les données simulées
pnpm test                          # tous les tests du dépôt, dont ceux du web
pnpm --filter @lanterne/web test   # seulement ceux du web
```

Pour voir la redirection vers `/connexion`, mettre `VITE_MOCK_SESSION=anonymous` dans le `.env`, puis relancer le serveur de développement.

## Limites connues et points à reprendre

- **La règle de l'ADR 0007** (le web n'importe jamais le point d'entrée des jets du moteur de règles) sera ajoutée au lint quand le moteur aura ses deux points d'entrée.
- **`vite.config.ts`** n'est pas vérifié par `tsc` (seulement par ESLint) : choix assumé pour un fichier de configuration de quelques lignes.
- **Focus en attente** : si l'utilisateur déplace lui-même le focus pendant que la page se charge, il le perd à l'apparition du `h1`. C'est invisible avec les données simulées, mais à corriger avant la P2, où le réseau allonge l'attente : annuler l'attente au premier déplacement du focus par l'utilisateur.
- **axe dans les tests** tourne dans jsdom, qui ne calcule aucun rendu : le **contraste n'y est pas vérifié**. Il se vérifie dans un navigateur (#77).
- **`campaignId`** n'est pas encore lu par `GameMasterView`. Dès qu'il le sera, son ViewModel devra vérifier que c'est un UUID, et afficher la page introuvable sinon (ADR 0011).
- **Vue joueurs** : le jeton est capturé, mais pas encore envoyé. Il le sera par un repository dédié, avec `credentials: 'omit'` et le schéma d'authentification du contrat (`displayAuth`).
- **Connexion et inscription** : les écrans n'ont encore que leur titre. La connexion devra invalider la requête de session (`currentUserQueryKey`) pour débloquer les routes protégées.

## Références

- [ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité](../ADR/0007-web-depend-rules-engine.md)
- [ADR 0008 - Contrat d'API écrit en premier](../ADR/0008-contrat-api.md)
- [ADR 0011 - React Router pour le routing de l'application web](../ADR/0011-routeur-web.md)
- Schéma d'architecture MVVM : `docs/EpiQuest - Architecture MVVM.pdf`
- TanStack Query : https://tanstack.com/query/latest
- openapi-typescript et openapi-fetch : https://openapi-ts.dev
- React Router : https://reactrouter.com
- WCAG 2.2 : https://www.w3.org/TR/WCAG22/
- OWASP, redirections non validées : https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
