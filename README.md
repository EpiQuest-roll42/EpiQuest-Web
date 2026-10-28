# Lanterne

[![CI](https://github.com/EpiQuest-roll42/EpiQuest-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/EpiQuest-roll42/EpiQuest-Web/actions/workflows/ci.yml)

**Ta table de jeu de rôle, sur deux écrans.** Lanterne est une table de jeu de rôle virtuelle compatible 5e édition : le MJ mène la partie sur son ordinateur, une vue joueurs s'affiche sur un second écran ou une télévision, et chaque joueur gère sa fiche et ses dés sur l'application mobile.

> Projet réalisé dans le cadre du sujet EpiQuest (2026–2027). Ce dépôt contient l'API, l'application web et le moteur de règles. L'application mobile est dans [EpiQuest-Mobile](https://github.com/EpiQuest-roll42/EpiQuest-Mobile).

- **Produit en ligne** : _URL à ajouter une fois le déploiement en place (tâche P1-06)_
- **Documentation** : [`docs/`](docs/)
- **Suivi du projet** : [GitHub Projects](https://github.com/orgs/EpiQuest-roll42/projects)

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Captures](#captures)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancer le projet](#lancer-le-projet)
- [Tests](#tests)
- [Structure du dépôt](#structure-du-dépôt)
- [Contribuer](#contribuer)
- [Documentation](#documentation)
- [Accessibilité](#accessibilité)
- [Usage de l'IA](#usage-de-lia)
- [Équipe](#équipe)
- [Licence et attribution](#licence-et-attribution)

## Fonctionnalités

- **Personnages** : assistant de création pas à pas, fiche interactive, niveaux 1 à 5 et montée de niveau, export PDF.
- **Dés** : notation complète (`2d6+3`, `4d6kh3`, avantage, dés explosifs, relances), jets calculés côté serveur, jets publics, privés ou cachés, probabilités.
- **Cartes** : grille carrée ou hexagonale, calques, murs et portes, brouillard de guerre selon la ligne de vue, mesures et gabarits.
- **Bestiaire et rencontres** : bestiaire du SRD, constructeur de rencontres avec calcul de la difficulté.
- **Combat assisté** : le produit applique les règles, le MJ garde la main pour ajouter un effet, modifier ou annuler.
- **Deux vues synchronisées** : la vue joueurs n'affiche que ce que les personnages voient et ne reçoit jamais d'information cachée.
- **Campagnes** : invitation par lien ou par code, notes du MJ, documents à révéler.

## Captures

_À ajouter au fil des phases : vue MJ, vue joueurs, assistant de création._

## Architecture

Le projet suit une architecture **MVVM** côté clients, avec un serveur qui fait autorité.

| Partie                  | Technologie                             | Rôle                                                                                      |
| ----------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/api`              | NestJS, TypeScript, PostgreSQL, TypeORM | API REST documentée par Swagger, gateway WebSocket, projection des données par spectateur |
| `apps/web`              | React, TypeScript, TanStack Query       | Vue MJ et vue joueurs                                                                     |
| `packages/rules-engine` | TypeScript pur                          | Moteur de règles et de dés, partagé par l'API et le web                                   |

Les choix techniques sont expliqués dans le [journal des décisions d'architecture](docs/ADR/).

## Prérequis

| Outil                    | Version                                          | Installation                        |
| ------------------------ | ------------------------------------------------ | ----------------------------------- |
| Git                      | récente                                          | https://git-scm.com                 |
| Docker et Docker Compose | récente                                          | https://docs.docker.com/get-docker/ |
| Node.js                  | voir [`.nvmrc`](.nvmrc)                          | https://nodejs.org                  |
| pnpm                     | voir le champ `packageManager` du `package.json` | `corepack enable`                   |

## Installation

```bash
git clone https://github.com/EpiQuest-roll42/EpiQuest-Web.git
cd EpiQuest-Web
cp .env.example .env
pnpm install
```

Ouvrez ensuite `.env` et renseignez au moins `POSTGRES_PASSWORD` : sans lui, `docker compose` refuse de démarrer. Les autres valeurs peuvent être choisies librement en local, car l'utilisateur et la base PostgreSQL sont créés par le conteneur au premier démarrage.

Le fichier `.env` contient la configuration locale. Il n'est jamais commité : seul `.env.example`, sans valeur secrète, est versionné. Chaque variable y est décrite.

## Lancer le projet

### Avec Docker (recommandé)

```bash
docker compose up
```

Cette commande démarre PostgreSQL puis Adminer, une fois la base prête.

| Service                   | Adresse                        | Disponible                                                                   |
| ------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| PostgreSQL                | `localhost:5432`               | Oui                                                                          |
| Adminer (base de données) | http://localhost:8080          | Oui                                                                          |
| API                       | http://localhost:3000          | À venir ([P2-01](https://github.com/EpiQuest-roll42/EpiQuest-Web/issues/19)) |
| Documentation Swagger     | http://localhost:3000/api/docs | À venir ([P2-01](https://github.com/EpiQuest-roll42/EpiQuest-Web/issues/19)) |
| Application web           | http://localhost:5173          | À venir ([P1-14](https://github.com/EpiQuest-roll42/EpiQuest-Web/issues/14)) |

Les ports de PostgreSQL et d'Adminer se changent dans `.env` (`DB_PORT`, `ADMINER_PORT`) si ceux par défaut sont déjà pris. Les services n'écoutent que sur votre machine (`127.0.0.1`) : ils ne sont pas joignables depuis le réseau.

Pour vous connecter à Adminer, choisissez le système **PostgreSQL**, le serveur **`db`** (et non `localhost` : c'est le nom du service dans le réseau Docker) et les identifiants de votre `.env`.

### Arrêter et réinitialiser

```bash
docker compose down     # arrête les services, les données sont conservées
docker compose down -v  # arrête les services et EFFACE la base
```

Les variables `POSTGRES_*` ne sont lues qu'au premier démarrage, quand la base est vide. Si vous les modifiez ensuite, elles n'ont aucun effet : il faut réinitialiser avec `docker compose down -v`, ce qui supprime toutes les données locales.

### En développement

```bash
docker compose up db    # la base seule
pnpm dev                # API et web avec rechargement automatique (à venir)
```

_`pnpm dev` sera disponible quand l'API et l'application web seront initialisées._

## Tests

```bash
pnpm test               # tous les tests du dépôt, en une seule commande
pnpm lint               # ESLint sur tous les paquets
pnpm typecheck          # vérification des types TypeScript
pnpm format:check       # vérifie le formatage Prettier (utilisé par la CI)
pnpm format             # corrige le formatage Prettier
pnpm build              # compile tous les paquets
```

Ces commandes passent par Turborepo (sauf Prettier, lancé directement à la racine) : les paquets sont traités dans l'ordre de leurs dépendances, et un paquet qui n'a pas changé est repris depuis le cache.

Les tests couvrent notamment l'analyseur de dés (y compris la distribution statistique), le moteur de règles, la ligne de vue, le brouillard de guerre, les rencontres, la résolution des combats et le filtrage des données envoyées à la vue joueurs.

Pour lancer les tests d'un seul paquet :

```bash
pnpm --filter rules-engine test
```

## Structure du dépôt

```
.
├── apps/
│   ├── api/              # serveur NestJS
│   └── web/              # application React
├── packages/
│   └── rules-engine/     # moteur de règles et de dés
├── docs/                 # documentation utilisateur et technique, ADR
├── .github/              # CI, modèles d'issue et de pull request
├── .env.example          # variables locales à copier en .env
├── compose.yaml          # services Docker : PostgreSQL et Adminer
└── turbo.json
```

## Contribuer

Le déroulé complet est dans [`CONTRIBUTING.md`](CONTRIBUTING.md). En résumé :

1. Prendre une issue dans le [Project](https://github.com/orgs/EpiQuest-roll42/projects) et s'y assigner.
2. Créer depuis `dev` une branche `<type>/<n° issue>-<sujet>` (exemple : `feat/12-parseur-de-des`).
3. Committer au format [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat(api): …`, `fix(web): …`).
4. Ouvrir une pull request vers `dev`, reliée à l'issue ; elle est relue par un autre membre avant le merge, et la CI doit être verte.

`main` ne reçoit que les versions publiées, taguées selon le versionnage sémantique ; leur contenu est décrit dans le [`CHANGELOG.md`](CHANGELOG.md). La participation au projet est encadrée par le [code de conduite](CODE_OF_CONDUCT.md).

Les issues marquées `good first issue` sont un bon point de départ.

## Documentation

| Document                 | Contenu                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| [`docs/ADR/`](docs/ADR/) | Journal des décisions d'architecture                                                         |
| `docs/utilisateur/`      | Guides du MJ et du joueur, aide-mémoire des dés, FAQ (_à venir_)                             |
| `docs/technique/`        | Architecture, modèle de données, moteur de règles, synchronisation, exploitation (_à venir_) |
| Swagger                  | Documentation de l'API, servie par l'API sur `/api/docs`                                     |

## Accessibilité

Lanterne vise le niveau **AA des WCAG 2.2** : navigation complète au clavier, compatibilité avec les lecteurs d'écran, vue textuelle de la carte, contrastes conformes, animations désactivables. La déclaration d'accessibilité sera publiée dans `docs/` (_à venir_).

## Usage de l'IA

Conformément au sujet (bloc 03-D), l'équipe déclare ici les outils d'IA utilisés et pour quoi.

| Domaine       | Outil              | Usage                                                                                                                             |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Code          | Claude (Anthropic) | Conseil d'architecture, découpage des tâches et revue des pull requests. Le code et la configuration sont écrits par l'équipe.    |
| Tests         | Claude (Anthropic) | Suggestions de cas à tester lors des revues. Les tests sont écrits par l'équipe.                                                  |
| Documentation | Claude (Anthropic) | Rédaction et relecture du README, du guide de contribution, des ADR, du CHANGELOG, du code de conduite et des descriptions de PR. |
| Visuels       | Aucun              | Aucun visuel généré par IA à ce jour.                                                                                             |

Les règles suivies par l'assistant (conseil et relecture uniquement, pas de code applicatif) sont dans [`CLAUDE.md`](.claude/CLAUDE.md). Chaque membre complète ce tableau quand il utilise un nouvel outil ou un nouvel usage. Le code et les contenus produits avec une IA suivent les mêmes règles que le reste : tests, revue en pull request, sécurité, respect des licences. Chaque membre est responsable de ce qui est livré et peut expliquer n'importe quelle partie du code.

## Équipe

| Membre    | GitHub                                         | Rôle                 |
| --------- | ---------------------------------------------- | -------------------- |
| Vivien    | [@RainproDash](https://github.com/RainproDash) | Web, mobile, serveur |
| Alexandre | [@ShireXela2](https://github.com/ShireXela2)   | Mobile, serveur      |
| Killian   | [@Krio18](https://github.com/Krio18)           | Web, serveur         |

## Licence et attribution

Le code, la documentation et les visuels originaux de ce dépôt sont publiés **tous droits réservés** pour consultation dans le cadre d'un projet pédagogique : voir [`LICENSE`](LICENSE). Le contenu issu du SRD 5.1 reste sous licence CC BY 4.0, et les dépendances sous leurs propres licences.

Lanterne est un produit indépendant, compatible 5e édition. Il n'est ni affilié à Wizards of the Coast ni approuvé par cette société.

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.
