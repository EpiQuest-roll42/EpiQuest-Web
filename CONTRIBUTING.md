# Contribuer à Lanterne

Ce guide décrit comment proposer une modification dans le dépôt EpiQuest-Web : de l'issue jusqu'au merge, puis jusqu'à la publication d'une version.

En participant au projet, vous acceptez de respecter le [code de conduite](CODE_OF_CONDUCT.md).

## Avant de commencer

Suivre la section [Installation](README.md#installation) du README. `pnpm install` installe aussi les hooks Git (husky) : les vérifications décrites plus bas s'appliquent automatiquement.

## 1. Prendre une issue

- Choisir une issue dans le [Project](https://github.com/orgs/EpiQuest-roll42/projects) et s'y assigner.
- Si elle contient plusieurs étapes, convertir chaque case en sous-issue au moment de la commencer.
- Les issues marquées `good first issue` sont un bon point de départ.

## 2. Créer une branche

### Stratégie de branches

| Branche            | Rôle                                                                                 | Qui y écrit                                     |
| ------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `main`             | Version stable : chaque commit de `main` correspond à une version publiée et taguée. | Uniquement par PR depuis `dev`                  |
| `dev`              | Branche d'intégration : le travail terminé et relu s'y accumule entre deux versions. | Uniquement par PR depuis une branche de travail |
| branche de travail | Une issue = une branche, créée depuis `dev` et supprimée après le merge.             | La personne assignée à l'issue                  |

`main` et `dev` sont protégées : on n'y pousse jamais directement, et une PR ne peut être fusionnée que si la CI est verte et qu'un autre membre l'a approuvée.

### Nommer la branche de travail

```
<type>/<n° issue>-<sujet>
```

Le type reprend celui des commits (voir plus bas) : `feat`, `fix`, `docs`, `chore`… Le sujet est en minuscules, sans accent ni espace, avec des tirets.

Exemples : `feat/12-parseur-de-des`, `fix/27-focus-fenetre-des`, `docs/7-fichiers-du-depot`.

```bash
git switch dev
git pull
git switch -c feat/12-parseur-de-des
```

### Travailler sur une issue qui dépend d'une PR pas encore fusionnée

Créer la branche **à partir de la branche de la PR en attente** plutôt que de `dev`, et l'indiquer dans la description (« Dépend de #<n°> »). Quand la première PR est fusionnée (en squash), rejouer ses propres commits sur `dev` :

```bash
git fetch
git rebase --onto origin/dev <branche-de-la-pr-fusionnée>
git push --force-with-lease
```

## 3. Committer

Les messages suivent [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
<type>(<portée facultative>): <description à l'impératif>
```

| Type       | Usage                                                            |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | nouvelle fonctionnalité                                          |
| `fix`      | correction de bug                                                |
| `docs`     | documentation uniquement                                         |
| `style`    | formatage, sans changement de comportement                       |
| `refactor` | restructuration du code, sans changement de comportement         |
| `test`     | ajout ou correction de tests                                     |
| `build`    | outillage de build et dépendances (pnpm, Turborepo, TypeScript…) |
| `ci`       | intégration continue                                             |
| `chore`    | maintenance qui ne rentre dans aucune autre catégorie            |

Portées autorisées : `api`, `web`, `rules-engine`, `docs`, `ci`, `deps`. Une portée est facultative ; un changement qui touche tout le dépôt n'en a pas.

Exemples :

```
feat(rules-engine): parse dice formulas like 2d6+3
fix(web): restore keyboard focus after closing the dice dialog
build: add commitlint and husky
```

### Vérifications automatiques

| Hook         | Ce qui est vérifié                                    |
| ------------ | ----------------------------------------------------- |
| `pre-commit` | `pnpm lint` et `pnpm format:check`                    |
| `commit-msg` | le message respecte Conventional Commits (commitlint) |

Si un hook échoue, le commit n'est pas créé : corriger le problème (souvent `pnpm format`) puis recommencer. Ne pas contourner les hooks avec `--no-verify` : la CI fait les mêmes vérifications et bloquera la pull request.

## 4. Vérifier avant d'ouvrir la pull request

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
```

## 5. Ouvrir la pull request

- La pull request vise **`dev`**, jamais `main` directement.
- Elle traite **un seul sujet** et est reliée à son issue (`Closes #<n°>` dans la description).
- Remplir le [modèle de pull request](.github/pull_request_template.md), notamment la section « Comment tester ».
- Elle est relue par un autre membre de l'équipe avant le merge, et la CI doit être verte.
- Elle est fusionnée avec **Squash and merge** : `dev` reçoit un seul commit, dont le message est le titre de la PR. Ce titre doit donc lui aussi respecter Conventional Commits.

## 6. Tenir le CHANGELOG à jour

Une PR qui change quelque chose de visible (fonctionnalité, correction, changement de configuration pour les contributeurs) ajoute une ligne dans la section `[Non publié]` de [`CHANGELOG.md`](CHANGELOG.md), sous `Ajouté`, `Modifié`, `Corrigé` ou `Supprimé`, avec le numéro de l'issue.

## 7. Publier une version

Les versions suivent le [versionnage sémantique](https://semver.org/lang/fr/) et sont taguées aux étapes clés du projet :

| Version  | Étape                                                      |
| -------- | ---------------------------------------------------------- |
| `v0.1.0` | Fin de la phase 1 : front sur données simulées             |
| `v0.2.0` | Fin de la phase 2 : back commun branché                    |
| `v1.0.0` | Fin de la phase 3 : produit complet, version de soutenance |

Entre ces étapes, une correction publiée incrémente le dernier chiffre (`v0.1.1`).

Pour publier :

1. Dans une PR vers `dev`, renommer la section `[Non publié]` du CHANGELOG en `[x.y.z] - AAAA-MM-JJ` et en ouvrir une nouvelle, vide, au-dessus.
2. Ouvrir une PR de `dev` vers `main`, intitulée `chore: release vx.y.z`.
3. Après le merge, taguer `main` et publier une _release_ GitHub reprenant la section du CHANGELOG :

```bash
git switch main && git pull
git tag -a vx.y.z -m "vx.y.z"
git push origin vx.y.z
```

## Règles du projet à respecter

- **Le serveur fait autorité** : jets de dés et actions de combat sont calculés côté serveur, jamais dans le navigateur (voir [ADR 0007](docs/ADR/0007-web-depend-rules-engine.md)).
- **Aucune information cachée** (brouillard, calque MJ, jets cachés, PV exacts des monstres, notes privées) n'est envoyée à la vue joueurs.
- **Les règles sont des données** : un sort, une capacité ou un monstre est décrit dans un format structuré interprété par le moteur de règles.
- **Accessibilité WCAG 2.2 AA** pour toute interface.
- **Contenu SRD 5.1 uniquement**, sous licence CC BY 4.0, avec la mention d'attribution.
- **Aucun secret** dans le dépôt : seul `.env.example` est versionné.

Les décisions d'architecture sont consignées dans le [journal des ADR](docs/ADR/README.md). Une décision structurante passe par une nouvelle ADR, relue en pull request.
