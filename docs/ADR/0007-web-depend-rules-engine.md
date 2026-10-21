# ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité

- **Statut** : accepté
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-03 (#3)

## Contexte

`packages/rules-engine` contient le moteur de règles et de dés, en TypeScript pur. L'API en dépend : c'est elle qui lance les dés et valide les actions de combat.

Le web a aussi besoin de connaître une partie des règles :

- les **types** du domaine (personnage, sort, monstre, jet de dés, condition…), pour typer les données reçues de l'API ;
- des **fonctions d'affichage**, par exemple écrire une formule de dés lisible (`2d6 + 3`), montrer une portée ou une zone d'effet, ou calculer un modificateur de caractéristique pour la fiche de personnage.

Deux règles du projet limitent cet usage :

- **le serveur fait autorité** : les jets de dés et les actions de combat sont calculés et validés côté serveur, jamais dans le navigateur ;
- **la projection par spectateur** : la vue joueurs ne reçoit aucune information cachée. Le web ne doit donc pas recalculer de son côté ce que le serveur a choisi de ne pas envoyer.

## Options envisagées

| Option | Avantages | Inconvénients |
| --- | --- | --- |
| **Le web ne dépend pas du moteur** | Impossible d'utiliser le moteur dans le navigateur par erreur | Types et fonctions d'affichage dupliqués dans le web, avec le risque qu'ils divergent du moteur |
| **Le web dépend du moteur, avec une limite d'usage documentée et vérifiée** | Une seule source de vérité pour les types et le format des données ; aperçus sans attendre l'API | Il faut empêcher le web d'appeler les fonctions qui font autorité (jets, résolution d'actions) |
| **Un paquet de types séparé** (`packages/shared-types`) | Séparation nette entre types et logique | Un paquet de plus à maintenir pour trois personnes ; les fonctions d'affichage n'y ont pas leur place |

## Décision

`@lanterne/web` dépend de `@lanterne/rules-engine` (`workspace:*`), **uniquement pour les types et les fonctions pures d'affichage ou d'aperçu**.

Le web n'utilise jamais le moteur pour :

- lancer un dé ou produire un résultat aléatoire ;
- résoudre ou valider une action (attaque, sauvegarde, dégâts, concentration…) ;
- recalculer une donnée que le serveur cache à la vue joueurs (PV exacts d'un monstre, jets cachés, brouillard).

Tout résultat affiché comme officiel vient de l'API. Un aperçu calculé dans le navigateur est présenté comme une estimation, jamais comme un résultat.

## Conséquences

**Positives**

- Une seule définition des types et des formats de données, partagée par l'API et le web.
- Les aperçus de l'interface (formule de dés, portée, modificateurs) ne demandent pas d'aller-retour réseau.

**Négatives ou à surveiller**

- Le moteur est exécuté dans le navigateur : il doit rester en **TypeScript pur**, sans API propre à Node.js (`fs`, `crypto` de Node…), en plus de ne dépendre ni de NestJS ni de React.
- La limite d'usage doit être **vérifiée par l'outillage**, pas seulement en revue. Piste retenue : le moteur expose deux points d'entrée via le champ `exports` de son `package.json` (un pour les types et l'affichage, un pour les jets et la résolution), et une règle ESLint `no-restricted-imports` interdit au web d'importer le second.
- En revue de code, tout import du moteur dans `apps/web` est vérifié au regard de cette ADR.
- La taille du bundle web est à surveiller : n'importer que ce qui sert à l'affichage.

## Références

- ADR 0001 - Monorepo avec pnpm workspaces et Turborepo
- ADR 0006 - Deux dépôts : EpiQuest-Web et EpiQuest-Mobile
- Node.js, champ `exports` : https://nodejs.org/api/packages.html#exports
- ESLint, règle `no-restricted-imports` : https://eslint.org/docs/latest/rules/no-restricted-imports
