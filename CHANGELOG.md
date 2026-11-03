# Journal des modifications

Toutes les évolutions notables de Lanterne sont consignées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet respecte le [versionnage sémantique](https://semver.org/lang/fr/). La façon de publier une version est décrite dans [`CONTRIBUTING.md`](CONTRIBUTING.md#7-publier-une-version).

## [Non publié]

### Ajouté

- Monorepo pnpm et Turborepo : `apps/api`, `apps/web` et `packages/rules-engine` (#3).
- Configuration TypeScript partagée, ESLint, Prettier, commitlint et husky (#3).
- Docker Compose pour le développement local : PostgreSQL et Adminer, configurés par `.env` (#4).
- Documentation : README, guide de contribution, journal des décisions d'architecture (ADR 0001 à 0010), licence, code de conduite et ce journal des modifications.
- Mini charte graphique de Lanterne (`docs/charte-graphique.pdf`) : logo, palettes claire et « table de jeu » aux contrastes vérifiés (WCAG 2.2 AA), typographies Cinzel, Lora et Inter, composants de base (#8).
- Contrat d'API écrit en premier (ADR 0008) : paquet `packages/api-contract` avec `openapi.yaml`, vérifié par Redocly en CI : sections Auth (inscription, connexion web par cookie et mobile par jeton, déconnexion, mot de passe oublié), Utilisateurs, et Campagnes et invitations, Personnages (fiche, création guidée et actions de jeu), Dés, Cartes (brouillard, tuiles masquées côté serveur, initiative filtrée, jeton d'affichage de la vue joueurs), Données SRD (format d'action unique interprété par le moteur, attribution publique), Séances, Gabarits de zone, Rencontres, Combat assisté (actions proposées puis appliquées par le MJ, annulation, journal, effets actifs) et Gestion de campagne (notes, PNJ, lieux, quêtes, documents révélés), avec des vues distinctes selon le lecteur (#9).
- Spécification du format des règles (`docs/technique/format-des-regles.md`) et mentions des ressources tierces (`THIRD_PARTY_NOTICES.md`).
- Spécification de la notation des dés (`docs/technique/notation-des-des.md`) : grammaire, limites contre le déni de service, erreurs avec position, probabilités.
