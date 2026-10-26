# Contribuer à Lanterne

Ce guide décrit comment proposer une modification dans le dépôt EpiQuest-Web : de l'issue jusqu'au merge.

## Avant de commencer

Suivre la section [Installation](README.md#installation) du README. `pnpm install` installe aussi les hooks Git (husky) : les vérifications décrites plus bas s'appliquent automatiquement.

## 1. Prendre une issue

- Choisir une issue dans le [Project](https://github.com/orgs/EpiQuest-roll42/projects) et s'y assigner.
- Si elle contient plusieurs étapes, convertir chaque case en sous-issue au moment de la commencer.
- Les issues marquées `good first issue` sont un bon point de départ.

## 2. Créer une branche

Une branche par issue, créée depuis `main` :

```
feat/<n° issue>-<sujet>    nouvelle fonctionnalité
fix/<n° issue>-<sujet>     correction de bug
```

Exemple : `feat/12-parseur-de-des`.

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

- Une pull request traite **un seul sujet** et est reliée à son issue (`Closes #<n°>` dans la description).
- Remplir le [modèle de pull request](.github/pull_request_template.md), notamment la section « Comment tester ».
- Elle est relue par un autre membre de l'équipe avant le merge, et la CI doit être verte.

## Règles du projet à respecter

- **Le serveur fait autorité** : jets de dés et actions de combat sont calculés côté serveur, jamais dans le navigateur (voir [ADR 0007](docs/ADR/0007-web-depend-rules-engine.md)).
- **Aucune information cachée** (brouillard, calque MJ, jets cachés, PV exacts des monstres, notes privées) n'est envoyée à la vue joueurs.
- **Les règles sont des données** : un sort, une capacité ou un monstre est décrit dans un format structuré interprété par le moteur de règles.
- **Accessibilité WCAG 2.2 AA** pour toute interface.
- **Contenu SRD 5.1 uniquement**, sous licence CC BY 4.0, avec la mention d'attribution.
- **Aucun secret** dans le dépôt : seul `.env.example` est versionné.

Les décisions d'architecture sont consignées dans le [journal des ADR](docs/ADR/README.md). Une décision structurante passe par une nouvelle ADR, relue en pull request.
