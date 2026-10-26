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

Le fichier `.env` contient la configuration locale. Il n'est jamais commité : seul `.env.example`, sans valeur secrète, est versionné. Chaque variable y est décrite.

## Lancer le projet

### Avec Docker (recommandé)

```bash
docker compose up
```

Cette commande démarre PostgreSQL, l'API et le web, applique les migrations, importe le SRD et charge la campagne de démonstration.

| Service                   | Adresse                        |
| ------------------------- | ------------------------------ |
| Application web           | http://localhost:5173          |
| API                       | http://localhost:3000          |
| Documentation Swagger     | http://localhost:3000/api/docs |
| Adminer (base de données) | http://localhost:8080          |

_Les ports sont à confirmer lors de la mise en place du Docker Compose (tâche P1-04)._

### En développement

```bash
docker compose up db    # la base seule
pnpm dev                # API et web avec rechargement automatique
```

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
├── docker-compose.yml
└── turbo.json
```

## Contribuer

Le déroulé complet est dans [`CONTRIBUTING.md`](CONTRIBUTING.md). En résumé :

1. Prendre une issue dans le [Project](https://github.com/orgs/EpiQuest-roll42/projects) et s'y assigner.
2. Créer une branche `feat/<n° issue>-<sujet>` ou `fix/<n° issue>-<sujet>`.
3. Committer au format [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat(api): …`, `fix(web): …`).
4. Ouvrir une pull request reliée à l'issue ; elle est relue par un autre membre avant le merge, et la CI doit être verte.

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

Conformément au sujet, l'équipe déclare ici les outils d'IA utilisés :

| Outil              | Usage                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude (Anthropic) | Conseil d'architecture, découpage des tâches, revue de code, rédaction de documentation (README, ADR). Le code applicatif est écrit par l'équipe ; les règles suivies par l'assistant sont dans [`CLAUDE.md`](.claude/CLAUDE.md). |

Chaque membre est responsable de ce qui est livré et peut expliquer n'importe quelle partie du code.

## Équipe

| Membre    | GitHub                                         | Rôle                 |
| --------- | ---------------------------------------------- | -------------------- |
| Vivien    | [@RainproDash](https://github.com/RainproDash) | Web, mobile, serveur |
| Alexandre | [@ShireXela2](https://github.com/ShireXela2)   | Mobile, serveur      |
| Killian   | [@Krio18](https://github.com/Krio18)           | Web, serveur         |

## Licence et attribution

Lanterne est un produit indépendant, compatible 5e édition. Il n'est ni affilié à Wizards of the Coast ni approuvé par cette société.

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.
