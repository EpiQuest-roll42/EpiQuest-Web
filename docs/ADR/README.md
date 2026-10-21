# Journal des décisions d'architecture (ADR)

Chaque décision technique structurante est consignée dans une fiche courte : contexte, options, décision, conséquences. Une décision n'est jamais modifiée après acceptation : si elle change, une nouvelle ADR la remplace et l'ancienne passe au statut « remplacé ».

Pour en ajouter une : copier `0000-modele.md`, prendre le numéro suivant, l'ouvrir en PR et la faire relire par l'équipe.

| N° | Décision | Statut |
| --- | --- | --- |
| [0001](0001-monorepo-turborepo.md) | Monorepo avec pnpm workspaces et Turborepo | Accepté |
| [0002](0002-orm-typeorm.md) | TypeORM pour l'accès à PostgreSQL | Accepté |
| [0003](0003-mobile-android.md) | Android comme plateforme mobile cible | Accepté |
| [0004](0004-hebergement-ovh.md) | Déploiement continu sur un VPS OVHcloud avec Docker | Accepté |
| [0005](0005-source-srd.md) | SRD 5.1, importé depuis la D&D 5e API | Accepté |

Ce journal couvre les décisions qui concernent tout le projet, y compris le mobile. Les décisions propres à l'application Flutter sont consignées dans `docs/adr/` du repo EpiQuest-Mobile.
