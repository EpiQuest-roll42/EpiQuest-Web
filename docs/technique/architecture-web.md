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

- Une **View** n'appelle jamais l'API ni un repository : elle affiche l'état que lui donne son ViewModel et déclenche ses commandes.
- Un **ViewModel** ne connaît pas l'affichage : il expose un état d'écran (`campaigns`, `isLoading`, `error`…) et des commandes (`refresh`…).
- Le **Model** ne connaît pas React : ce sont des interfaces TypeScript et leurs implémentations.

En P1, le Model renvoie des **données simulées**. En P2, on passe au client HTTP **sans toucher aux Views ni aux ViewModels** : seule l'implémentation choisie change. C'est la raison d'être de cette séparation.

## Les dossiers de `src/`

| Dossier                | Rôle                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/`                 | Le **câblage** : point d'entrée, choix de l'implémentation des repositories (`createRepositories`), contexte React, client TanStack Query. |
| `models/api/`          | `schema.d.ts`, les types **générés** depuis le contrat d'API. Ce fichier n'est pas commité.                                                |
| `models/repositories/` | Une interface par ressource (`CampaignRepository`), ses implémentations `mock` et `http`, l'erreur typée et l'objet `Repositories`.        |
| `viewModels/`          | Un hook par écran (`useCampaignList`), qui expose l'état d'écran.                                                                          |
| `views/`               | Les écrans (`CampaignListView`).                                                                                                           |
| `components/`          | Les composants de la charte : bouton, champ, pion (à venir, #76).                                                                          |
| `tests/`               | Les tests (Vitest et Testing Library).                                                                                                     |

### Les règles d'import, vérifiées par le lint

| Une View peut importer         | Une View ne peut pas importer                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| les ViewModels, les composants | `models/`, `openapi-fetch`, `app/repositoriesContext`, `app/createRepositories`, les données simulées |

| Un ViewModel peut importer                        | Un ViewModel ne peut pas importer |
| ------------------------------------------------- | --------------------------------- |
| `app/repositoriesContext`, les types de `models/` | `views/`, `components/`           |

Ces règles sont dans `eslint.config.mjs` (`no-restricted-imports`) : un import interdit fait échouer `pnpm lint`, donc la CI.

## Les types de l'API

Les types viennent du contrat d'API (`packages/api-contract/openapi.yaml`, ADR 0008), générés par `openapi-typescript` :

- le script `generate:api` du paquet web écrit `src/models/api/schema.d.ts` ;
- les options `--root-types --root-types-no-schema-prefix` exportent chaque schéma du contrat sous son propre nom : `import type { CampaignSummaryPage } from '../models/api/schema';` ;
- le fichier n'est **pas commité** (il est ignoré par Git, Prettier et ESLint) : turbo le régénère avant `typecheck`, `build` et `test`, et le régénère dès que le contrat ou la version du générateur change ;
- un schéma renommé dans le contrat fait échouer `tsc` à l'endroit exact où il est utilisé.

Pour le régénérer à la main : `pnpm --filter @lanterne/web generate:api`.

## Données simulées ou API réelle

L'implémentation des repositories est choisie **à un seul endroit**, `src/app/createRepositories.ts`, selon deux variables d'environnement (voir `.env.example`) :

| Variable            | Valeurs          | Par défaut                                                                                 |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `VITE_API_MODE`     | `mock` ou `http` | `mock` en développement, **obligatoire** en production                                     |
| `VITE_API_BASE_URL` | URL de l'API     | `http://localhost:3000/api/v1` en développement, **obligatoire** en production avec `http` |

- En production, une variable absente, ou `mock`, **empêche l'application de démarrer**, avec un message clair : un site en ligne ne doit jamais afficher de données inventées.
- Les données simulées sont chargées par un `import()` dynamique : elles **ne figurent pas** dans le build de production.
- Le client HTTP envoie le cookie de session (`credentials: 'include'`, ADR 0008). La future vue joueurs, elle, utilisera `credentials: 'omit'` et son jeton d'affichage (contrat, `displayAuth`).

Les implémentations `mock` sont créées par une fonction (`createMockCampaignRepository()`) : chaque appel donne une instance neuve, avec ses propres données. Elles renvoient des **copies**, comme le ferait le réseau.

## Ajouter un écran

1. **Le type** : il existe déjà dans `schema.d.ts` s'il est dans le contrat. Sinon, on modifie d'abord le contrat (ADR 0008).
2. **Le Model** : ajouter la méthode à l'interface du repository (par exemple `CampaignRepository`), puis à ses deux implémentations, `mock` et `http`. Une méthode n'est ajoutée que lorsqu'un écran en a besoin.
3. **Le ViewModel** : un hook dans `viewModels/`, qui utilise `useRepositories()` et TanStack Query, et expose un **état d'écran** et des **commandes**, jamais l'objet brut de TanStack Query.
4. **La View** : un composant dans `views/`, qui n'utilise que son ViewModel.
5. **Les tests**, une couche à la fois : le ViewModel avec un faux repository injecté par `RepositoriesProvider`, la View avec un ViewModel simulé (`vi.mock`).

## Erreurs

- Un repository lève une erreur qui porte le `Problem` de l'API (RFC 9457).
- Le ViewModel la traduit en un **message pour l'interface**, en français. Le `detail` d'un `Problem` est un texte technique, en anglais : il n'est jamais affiché (ADR 0008).
- TanStack Query réessaie deux fois une erreur réseau ou serveur, mais jamais une erreur 4xx, qui ne se réglerait pas en réessayant (`src/app/queryClient.ts`).

## Accessibilité : les conventions en place

- Une région `role="status"` **toujours présente** dans l'écran annonce le chargement et le résultat : les lecteurs d'écran n'annoncent pas toujours une région ajoutée avec son texte.
- Une erreur est affichée dans un `role="alert"`.
- Le bouton « Réessayer » reste focalisable pendant la tentative (`aria-disabled` plutôt que `disabled`) ; après une tentative réussie, le focus va sur le titre de la page.

Ces conventions sont vérifiées par les tests de la View.

## Lancer et tester

```bash
pnpm --filter @lanterne/web dev    # http://localhost:5173, avec les données simulées
pnpm test                          # tous les tests du dépôt, dont ceux du web
pnpm --filter @lanterne/web test   # seulement ceux du web
```

## Limites connues et points à reprendre

- **`CampaignRepositoryError`** deviendra l'erreur de tous les repositories : à renommer (par exemple `ApiError`) avec le deuxième repository.
- **Un seul client HTTP** sera à partager entre les repositories, au lieu d'un client par repository.
- **La règle de l'ADR 0007** (le web n'importe jamais le point d'entrée des jets du moteur de règles) sera ajoutée au lint quand le moteur aura ses deux points d'entrée.
- **`<main>`** est aujourd'hui fourni par chaque View ; il passera à la mise en page commune avec le routing (#74), pour qu'une page n'ait qu'un seul repère principal.
- **`vite.config.ts`** n'est pas vérifié par `tsc` (seulement par ESLint) : choix assumé pour un fichier de configuration de quelques lignes.

## Références

- [ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité](../ADR/0007-web-depend-rules-engine.md)
- [ADR 0008 - Contrat d'API écrit en premier](../ADR/0008-contrat-api.md)
- Schéma d'architecture MVVM : `docs/EpiQuest - Architecture MVVM.pdf`
- TanStack Query : https://tanstack.com/query/latest
- openapi-typescript et openapi-fetch : https://openapi-ts.dev
