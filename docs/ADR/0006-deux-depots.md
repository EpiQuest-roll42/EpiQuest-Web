# ADR 0006 - Deux dépôts : EpiQuest-Web et EpiQuest-Mobile

- **Statut** : proposé, en attente de confirmation par le référent pédagogique
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-01 (#1)

## Contexte

Le produit comprend quatre parties :

- l'API NestJS et l'application web React, en TypeScript ;
- le moteur de règles et de dés, en TypeScript pur, utilisé par l'API et par le web ;
- l'application mobile, en Flutter (Dart).

Les trois parties TypeScript sont gérées ensemble par pnpm et Turborepo (ADR 0001). Flutter utilise son propre gestionnaire de dépendances (`pub` et `pubspec.yaml`) : pnpm ne le gère pas, et le moteur de règles TypeScript n'est pas utilisable directement en Dart.

La fiche parle « du dépôt » au singulier (livrable « Dépôt GitHub », test du nouvel arrivant, CI qui teste le web, le serveur et le mobile), sans interdire explicitement plusieurs dépôts.

## Options envisagées

| Option | Avantages | Inconvénients |
| --- | --- | --- |
| **Un seul dépôt** (`apps/api`, `apps/web`, `apps/mobile`, `packages/rules-engine`) | Un seul clone, une seule CI, un seul historique, correspond à la lettre de la fiche | Deux écosystèmes dans un même dépôt (pnpm et Flutter), CI plus complexe à filtrer, historique et revues mélangés |
| **Deux dépôts** : EpiQuest-Web (monorepo TypeScript) et EpiQuest-Mobile (Flutter) | Chaque dépôt a un seul écosystème, sa CI, ses issues et son historique ; correspond au schéma d'architecture | Deux clones et deux CI ; le partage entre web et mobile doit être explicite ; à faire valider au regard de la fiche |
| **Trois dépôts** : API, web et mobile séparés | Séparation maximale | Le moteur de règles partagé par l'API et le web devrait être publié ou dupliqué ; coordination lourde pour trois personnes |

## Décision

Le projet est réparti sur **deux dépôts** dans l'organisation `EpiQuest-roll42` :

- **EpiQuest-Web** : monorepo TypeScript avec `apps/api`, `apps/web` et `packages/rules-engine` (paquets `@lanterne/api`, `@lanterne/web`, `@lanterne/rules-engine`, tous `"private": true`) ;
- **EpiQuest-Mobile** : application Flutter, sans `package.json`.

Le partage entre les deux dépôts passe uniquement par le **contrat OpenAPI** de l'API :

- le client Dart du mobile est généré à partir de ce contrat ;
- le mobile ne calcule aucune règle : il interroge l'API, qui fait autorité.

Les deux dépôts sont suivis dans le **même GitHub Project** de l'organisation.

## Conséquences

**Positives**

- Chaque dépôt n'utilise qu'un seul écosystème : outils, CI et conventions restent simples.
- Les revues de code sont séparées par plateforme, ce qui suit la répartition de l'équipe.
- Aucune règle n'est dupliquée en Dart : le moteur de règles reste unique, côté serveur.

**Négatives ou à surveiller**

- Le README d'EpiQuest-Web renvoie vers EpiQuest-Mobile, et le test du nouvel arrivant couvre les deux dépôts.
- Chaque dépôt a sa propre CI : lint, tests et build pour le web et le serveur d'un côté, analyse, tests et APK de l'autre.
- Toute évolution du contrat OpenAPI doit être suivie d'une régénération du client Dart ; une PR qui change le contrat le signale dans sa description.
- **Si le référent pédagogique exige un seul dépôt**, l'application Flutter est déplacée dans `apps/mobile` d'EpiQuest-Web, en dehors des workspaces pnpm. Cette ADR est alors remplacée par une nouvelle.

## Références

- ADR 0001 - Monorepo avec pnpm workspaces et Turborepo
- Schéma d'architecture MVVM (Lucid) : dépôt `web-back` (api, web) et dépôt mobile séparé
