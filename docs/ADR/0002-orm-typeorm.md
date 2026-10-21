# ADR 0002 - TypeORM pour l'accès à PostgreSQL

- **Statut** : accepté
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-01 (#1)

## Contexte

L'API NestJS stocke ses données dans PostgreSQL : utilisateurs, campagnes, personnages, contenu SRD importé, cartes, rencontres, combats, jets. Le modèle compte une quinzaine d'entités reliées entre elles.

Il nous faut :

- manipuler ces données en TypeScript plutôt qu'en SQL écrit à la main ;
- des **migrations versionnées** dans le repo, rejouables par n'importe qui ;
- une intégration propre avec NestJS et avec la couche Infrastructure de notre architecture (repositories) ;
- des requêtes sûres face aux injections SQL (Top 10 OWASP, exigence 03-B).

## Options envisagées

| Option | Avantages | Inconvénients |
| --- | --- | --- |
| **Prisma** | Schéma unique très lisible, client généré entièrement typé, migrations simples | Intégration NestJS par un service maison, un fichier de schéma et un langage à part, moins proche du style NestJS |
| **TypeORM** | Module officiel `@nestjs/typeorm`, entités en classes TypeScript à décorateurs (style identique à NestJS), pattern Repository natif | Typage des résultats moins strict, pièges connus (synchronisation automatique du schéma, relations chargées implicitement) |

## Décision

Nous utilisons **TypeORM** avec le module `@nestjs/typeorm`.

- Chaque entité est une classe dans le module NestJS de son domaine (`campaigns/campaign.entity.ts`…).
- L'accès aux données passe par les **repositories** TypeORM, encapsulés dans la couche Infrastructure. Les use cases ne manipulent jamais directement l'ORM.
- Le schéma évolue **uniquement par migrations**, générées puis relues en PR et versionnées dans `apps/api/src/migrations`.
- Une `DataSource` dédiée sert à la CLI des migrations, et la même configuration est réutilisée par l'application.

## Règles d'usage

- `synchronize: false` dans **tous** les environnements, y compris en local : sinon TypeORM modifie la base sans migration et l'historique du schéma est perdu.
- Toute migration générée est relue en PR comme du code.
- Les relations sont chargées explicitement (`relations` ou `QueryBuilder`), jamais en `eager: true` par défaut, pour éviter des requêtes cachées et coûteuses.
- Les requêtes construites avec des paramètres utilisent toujours les paramètres liés (`:id`), jamais une concaténation de chaînes.
- Les entités ne sont pas renvoyées telles quelles par l'API : on passe par des DTO, pour ne pas exposer de champ caché (exigence « aucune information cachée envoyée à la vue joueurs »).

## Conséquences

**Positives**

- Le code de l'API garde un style homogène : modules, décorateurs et injection de dépendances NestJS.
- Le pattern Repository correspond directement au bloc Infrastructure du schéma d'architecture.
- Les migrations rendent l'installation reproductible : `docker compose up` puis les migrations recréent la base à l'identique.

**Négatives ou à surveiller**

- Le typage des résultats de requêtes complexes est moins garanti qu'avec Prisma : les tests d'intégration de l'API (P2-20) doivent couvrir les requêtes importantes.
- Il faut connaître les pièges ci-dessus ; ils sont rappelés dans `CONTRIBUTING.md` et vérifiés en revue.

## Références

- Documentation NestJS, base de données avec TypeORM : https://docs.nestjs.com/techniques/database
- Documentation TypeORM, migrations : https://typeorm.io/migrations
