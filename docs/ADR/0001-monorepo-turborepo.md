# ADR 0001 - Monorepo avec pnpm workspaces et Turborepo

- **Statut** : accepté
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-01 (#1)

## Contexte

Le repo `EpiQuest-Web` contient trois projets TypeScript qui évoluent ensemble :

- `apps/api` : le serveur NestJS ;
- `apps/web` : l'application React (vue MJ et vue joueurs) ;
- `packages/rules-engine` : le moteur de règles et de dés, en TypeScript pur, utilisé par l'API et par le web.

Il nous faut :

- installer les dépendances une seule fois pour les trois projets ;
- importer `rules-engine` depuis l'API et le web sans le publier sur npm ;
- lancer lint, tests et build en **une seule commande**, en local comme en CI (exigence 03-B de la fiche) ;
- une CI qui reste rapide quand le projet grossit, puisque chaque PR la déclenche.

## Options envisagées

| Option                          | Avantages                                                                                                                       | Inconvénients                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **pnpm workspaces seul**        | Configuration minimale, rapide, liens locaux entre paquets                                                                      | Aucun cache : chaque commande reconstruit et reteste tout, et l'ordre des builds est à gérer à la main |
| **pnpm workspaces + Turborepo** | Cache local et en CI, ne relance que ce qui a changé, ordre des tâches déduit des dépendances, une configuration (`turbo.json`) | Un outil de plus à comprendre                                                                          |
| **Nx**                          | Très complet : générateurs, graphe des dépendances, règles de frontières entre paquets                                          | Courbe d'apprentissage forte, beaucoup de conventions propres à Nx, disproportionné pour trois paquets |

## Décision

Nous utilisons **pnpm workspaces** pour l'installation et les liens entre paquets, et **Turborepo** pour orchestrer les tâches.

- Les espaces de travail sont déclarés dans `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
- Chaque paquet définit ses scripts `lint`, `test`, `build`, `dev`.
- `turbo.json` décrit les dépendances entre tâches. Exemple : le `build` de l'API attend celui du `rules-engine`.
- À la racine, `pnpm lint`, `pnpm test` et `pnpm build` appellent Turborepo sur tout le repo.

## Conséquences

**Positives**

- Une seule commande lance chaque type de tâche sur les trois paquets, ce qui sert le test du nouvel arrivant.
- La CI ne relance que les paquets touchés par une PR, grâce au cache de Turborepo.
- Le `rules-engine` est partagé sans duplication de code entre l'API et le web.

**Négatives ou à surveiller**

- Toute l'équipe doit utiliser **pnpm** (et non npm ou yarn). La version est fixée dans le champ `packageManager` du `package.json` racine.
- Le cache peut masquer un problème s'il est mal configuré : les `outputs` de chaque tâche doivent être déclarés correctement dans `turbo.json`.
- Le cache distant (partagé entre machines) n'est pas mis en place pour l'instant. Nous le reconsidérerons si la CI dépasse quelques minutes.

## Références

- Documentation pnpm workspaces : https://pnpm.io/workspaces
- Documentation Turborepo : https://turbo.build/repo/docs
