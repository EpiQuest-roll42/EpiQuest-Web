# Journal des modifications

Toutes les évolutions notables de Lanterne sont consignées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet respecte le [versionnage sémantique](https://semver.org/lang/fr/). La façon de publier une version est décrite dans [`CONTRIBUTING.md`](CONTRIBUTING.md#7-publier-une-version).

## [Non publié]

### Ajouté

- Monorepo pnpm et Turborepo : `apps/api`, `apps/web` et `packages/rules-engine` (#3).
- Configuration TypeScript partagée, ESLint, Prettier, commitlint et husky (#3).
- Docker Compose pour le développement local : PostgreSQL et Adminer, configurés par `.env` (#4).
- Documentation : README, guide de contribution, journal des décisions d'architecture (ADR 0001 à 0007), licence, code de conduite et ce journal des modifications.
