# Par où commencer

Ce guide s'adresse à toute personne qui découvre le dépôt : nouveau membre de l'équipe, contributeur extérieur ou relecteur. Il ne remplace pas les autres documents, il dit **dans quel ordre les lire** et **où chercher quoi**. Comptez une heure pour le parcours commun, puis une demi-heure pour la partie du projet sur laquelle vous allez travailler.

## 1. Le projet en cinq minutes

**Lanterne** est une table de jeu de rôle virtuelle compatible 5e édition :

- le **MJ** prépare et mène la partie sur son ordinateur (vue MJ) ;
- une **vue joueurs** s'affiche sur un second écran ou une télévision, et ne montre que ce que les personnages voient ;
- chaque **joueur** gère sa fiche et ses dés sur l'application mobile (dépôt [EpiQuest-Mobile](https://github.com/EpiQuest-roll42/EpiQuest-Mobile)).

Le sujet complet est dans [`EpiQuest_FR.pdf`](EpiQuest_FR.pdf). Le travail avance en trois phases :

| Phase | Objectif                                                  | Ce que ça change pour vous                                                                             |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P1    | Le front et le moteur de règles, sur des données simulées | Le web ne parle pas encore à une API : il lit des données simulées, cachées derrière les repositories. |
| P2    | Le back commun, puis le branchement du web et du mobile   | On remplace les données simulées par le vrai client HTTP, sans réécrire les écrans.                    |
| P3    | Le produit complet                                        | Combat assisté, cartes complètes, finitions.                                                           |

## 2. Les six règles qu'on ne contourne pas

Elles reviennent dans chaque revue. Les comprendre évite la plupart des allers-retours en pull request.

| Règle                           | En une phrase                                                                                              | Pourquoi                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Le serveur fait autorité**    | Les jets de dés et les actions de combat sont calculés par le serveur, jamais par le navigateur.           | Un résultat calculé dans le navigateur peut être modifié par le joueur.                   |
| **Projection par spectateur**   | La vue joueurs ne reçoit jamais d'information cachée, même dans un champ que l'écran n'affiche pas.        | Tout ce qui est envoyé se lit dans les outils de développement du navigateur.             |
| **Les règles sont des données** | Un sort ou un monstre est décrit dans un format structuré, jamais par un `if` sur son nom.                 | Le SRD compte des centaines d'éléments : un seul interpréteur, pas des centaines de cas.  |
| **MVVM côté web**               | Un écran (View) passe toujours par son ViewModel, qui passe par un repository (Model).                     | C'est ce qui permet de passer des données simulées à l'API en P2 sans toucher aux écrans. |
| **Accessibilité WCAG 2.2 AA**   | Clavier, focus visible, libellés, contrastes, information jamais portée par la seule couleur.              | Exigence du sujet, vérifiée par des tests automatiques (axe) et en revue.                 |
| **Contenu SRD 5.1 uniquement**  | Aucun contenu des livres payants, et la mention d'attribution CC BY 4.0 partout où le contenu est affiché. | C'est la seule licence qui nous autorise à utiliser ces règles.                           |

Le détail est dans la section « Règles du projet à respecter » de [`CONTRIBUTING.md`](../CONTRIBUTING.md#règles-du-projet-à-respecter).

## 3. Le parcours de lecture

### Pour tout le monde (environ une heure)

1. Ce guide.
2. Le [`README.md`](../README.md) : sections Architecture, Installation et Tests.
3. Le [`CONTRIBUTING.md`](../CONTRIBUTING.md), parties 1 à 5 : de l'issue à la pull request.
4. Deux ADR qui expliquent presque toutes les autres décisions :
   - [ADR 0007](ADR/0007-web-depend-rules-engine.md) : pourquoi le web utilise le moteur de règles sans jamais faire autorité ;
   - [ADR 0008](ADR/0008-contrat-api.md) : pourquoi le contrat d'API est écrit avant le code.
5. Installer le projet (README, section Installation), puis lancer `pnpm test` : s'il passe, votre poste est prêt.

### Ensuite, selon la partie sur laquelle vous travaillez

| Vous travaillez sur…           | À lire                                                                                                                                                                                                                                                                        | Le code                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Le moteur de règles et les dés | [Notation des dés](technique/notation-des-des.md), [Format des règles](technique/format-des-regles.md), [ADR 0005](ADR/0005-source-srd.md) (source du SRD), [ADR 0009](ADR/0009-unites-srd.md) (unités)                                                                       | `packages/rules-engine/src/` |
| L'application web              | [Architecture du web](technique/architecture-web.md) (surtout « Ajouter un écran »), [Composants](technique/composants.md), [Thème](technique/theme.md), [charte graphique](charte-graphique.pdf), [ADR 0011](ADR/0011-routeur-web.md), [ADR 0012](ADR/0012-icones-lucide.md) | `apps/web/src/`              |
| L'API (P2)                     | [ADR 0002](ADR/0002-orm-typeorm.md) (TypeORM), [ADR 0010](ADR/0010-evenements-temps-reel.md) (WebSocket), le contrat d'API (section 5 ci-dessous)                                                                                                                             | `apps/api/`                  |
| Le déploiement                 | [ADR 0004](ADR/0004-hebergement-ovh.md), `compose.yaml`, `.github/workflows/ci.yml`                                                                                                                                                                                           | `compose.yaml`, `.github/`   |

### Les ADR, rangées par thème

Les ADR sont numérotées dans l'ordre où elles ont été écrites, pas par sujet. Le [journal des ADR](ADR/README.md) donne leur statut ; voici comment elles se regroupent :

| Thème                            | ADR                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Organisation des dépôts          | 0001 (monorepo, pnpm, Turborepo), 0006 (dépôts web et mobile séparés)         |
| Contenu et règles                | 0005 (source du SRD), 0009 (unités métriques et attribution)                  |
| Échanges entre client et serveur | 0007 (le web ne fait pas autorité), 0008 (contrat d'abord), 0010 (temps réel) |
| Application web                  | 0011 (React Router), 0012 (icônes Lucide)                                     |
| Serveur et hébergement           | 0002 (TypeORM), 0004 (VPS OVHcloud et Docker)                                 |
| Mobile                           | 0003 (Android)                                                                |

Une ADR se lit en cinq minutes : lisez **Contexte** et **Décision**, les **Options** seulement si vous voulez remettre la décision en question.

## 4. Où trouver quoi

| Je cherche…                                      | Où regarder                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Une route de l'API, un type échangé              | `packages/api-contract/openapi.yaml` (section 5)                                                    |
| Comment un sort ou un monstre est décrit         | [Format des règles](technique/format-des-regles.md)                                                 |
| Ce que `4d6kh3` ou `1d20!` veut dire             | [Notation des dés](technique/notation-des-des.md)                                                   |
| Un bouton, un champ, un pion                     | [Composants](technique/composants.md) et `apps/web/src/components/`                                 |
| Une couleur, une taille de police, un espacement | [Thème](technique/theme.md) et `apps/web/src/theme/tokens.css`                                      |
| Où mettre un nouvel écran                        | [Architecture du web](technique/architecture-web.md#ajouter-un-écran)                               |
| Pourquoi on a choisi tel outil                   | [Journal des ADR](ADR/README.md)                                                                    |
| Quelle tâche prendre                             | Le [Project GitHub](https://github.com/orgs/EpiQuest-roll42/projects), étiquette `good first issue` |
| Ce qui a changé récemment                        | [`CHANGELOG.md`](../CHANGELOG.md), section « Non publié »                                           |
| Quelles IA ont été utilisées, et pour quoi       | [`README.md`](../README.md#usage-de-lia), section « Usage de l'IA »                                 |

### Un document introuvable ?

Un document ajouté par une pull request n'existe que sur sa branche tant qu'elle n'est pas fusionnée dans `dev`. Pour savoir sur quelle branche il se trouve :

```bash
git fetch
git log --all --oneline -- 'docs/ADR/0011*'   # les commits qui ont touché ce fichier
git branch -a --contains <commit>             # les branches qui contiennent ce commit
```

Si vous ne le trouvez toujours pas, demandez : c'est souvent le signe qu'un lien manque dans ce guide.

## 5. Le contrat d'API sans le lire en entier

`packages/api-contract/openapi.yaml` décrit **toutes** les routes et **tous** les types échangés entre l'API, le web et le mobile ([ADR 0008](ADR/0008-contrat-api.md)). Il fait plus de 13 000 lignes parce qu'il couvre le produit complet, P3 comprise. Il n'est pas fait pour être lu d'un bout à l'autre : c'est une **référence**, comme un dictionnaire.

**Comment il est rangé** :

- `paths:` : les routes, groupées par section (`tags`) : Auth, Utilisateurs, Campagnes, Personnages, Dés, Cartes, Gestion de campagne, Données SRD, Rencontres, Combat ;
- `components: schemas:` : les types, chacun sous son nom (`RollResult`, `CampaignSummaryPage`…).

**Comment y chercher** :

- par le chemin de la route : chercher `/campaigns/{campaignId}` ;
- par le nom d'un type : chercher `RollResult:` (avec les deux-points, pour tomber sur la définition) ;
- par la vue **Outline** de VS Code (`Ctrl+Maj+O`), qui liste les routes et les types ;
- en demandant à une IA si le contrat contient déjà ce dont vous avez besoin, puis en vérifiant dans le fichier.

**Dans le code web**, les types sont générés depuis le contrat : `import type { RollResult } from '../models/api/schema';`. Le fichier `schema.d.ts` n'est pas commité ; Turborepo le régénère avant `typecheck`, `build` et `test`.

**Pour le modifier** : le contrat passe avant le code. On modifie d'abord `openapi.yaml` dans une pull request, on vérifie avec `pnpm --filter @lanterne/api-contract lint`, et seulement ensuite on écrit le code qui l'utilise.

## 6. Les pièges les plus fréquents

| Ce qui se passe                                     | Pourquoi                                                                                | Que faire                                                                                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le commit est refusé                                | Le message ne suit pas Conventional Commits, ou un fichier n'est pas formaté.           | Relire le message (`feat(web): …`), lancer `pnpm format`, recommencer.                                                                                                                                  |
| `schema.d.ts` est introuvable                       | Les types de l'API n'ont pas encore été générés sur votre poste.                        | `pnpm --filter @lanterne/web generate:api`                                                                                                                                                              |
| Le lint refuse un import dans une View              | Une View n'a pas le droit d'importer `models/`, `react-router` ou les données simulées. | Passer par le ViewModel de l'écran ([Architecture du web](technique/architecture-web.md)).                                                                                                              |
| Le test du thème échoue                             | Une couleur ou une police est écrite en dur dans un composant.                          | Utiliser une variable de [`tokens.css`](technique/theme.md).                                                                                                                                            |
| La branche contient des commits inattendus          | Elle a été créée depuis `main`, qui n'avance qu'à chaque version.                       | Créer les branches depuis `dev` (ou depuis la branche de la PR dont on dépend).                                                                                                                         |
| Une issue dépend d'une autre qui n'est pas terminée | Le travail est découpé en petites issues qui s'enchaînent.                              | Voir « Travailler sur une issue qui dépend d'une PR » dans [`CONTRIBUTING.md`](../CONTRIBUTING.md#travailler-sur-une-issue-qui-dépend-dune-pr-pas-encore-fusionnée), ou prendre l'issue dont on dépend. |

## 7. Les mots du projet

| Mot                           | Sens                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **MJ**                        | Maître du jeu : la personne qui prépare et mène la partie.                                                                    |
| **Vue joueurs**               | L'écran partagé (télévision) qui montre la carte telle que les personnages la voient.                                         |
| **Projection par spectateur** | Le serveur prépare, pour chaque destinataire, une version des données qui ne contient que ce qu'il a le droit de voir.        |
| **SRD 5.1**                   | _System Reference Document_ : la partie des règles 5e publiée sous licence libre CC BY 4.0. Notre seule source de contenu.    |
| **Moteur de règles**          | `packages/rules-engine` : le code TypeScript pur qui lance les dés et interprète les règles décrites en données.              |
| **Contrat d'API**             | `openapi.yaml` : la description des routes et des types, sur laquelle l'API, le web et le mobile s'accordent.                 |
| **MVVM**                      | Model, View, ViewModel : l'organisation du code web en trois couches (section 2).                                             |
| **Repository**                | Dans le Model, l'objet qui fournit les données d'une ressource : simulées en P1, depuis l'API en P2.                          |
| **ADR**                       | _Architecture Decision Record_ : une fiche courte qui explique une décision technique et pourquoi elle a été prise.           |
| **`automation`**              | Champ d'un sort ou d'un monstre qui dit si le moteur le résout entièrement (`full`), en partie (`partial`) ou pas (`manual`). |

## 8. Vous bloquez ?

- **Posez la question**, même si elle vous paraît simple : dans le canal de l'équipe, ou en commentaire de l'issue. Mieux vaut une question qu'une heure perdue.
- Les noms indiqués dans la description d'une issue sont **indicatifs**. Si vous avez besoin d'une issue pour avancer sur la vôtre, prenez-la en le signalant.
- L'équipe fait un point chaque mercredi à 15 h : c'est le bon moment pour les questions d'organisation ou de conception.
- Si ce guide ne vous a pas permis de trouver quelque chose, c'est ce guide qu'il faut corriger : proposez une modification en pull request.
