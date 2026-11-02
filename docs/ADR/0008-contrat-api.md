# ADR 0008 - Contrat d'API écrit en premier

- **Statut** : proposé
- **Date** : 2026-11-02
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-09 (#9)

## Contexte

Le plan de travail commence par le front (P1), sur des données simulées, avant que l'API existe (P2). Pour que la P2 soit un simple branchement et non une réécriture, le web et le mobile doivent simuler **exactement** les données que l'API renverra.

Trois consommateurs dépendent de la forme de ces données :

- `apps/web`, dont la couche Model (architecture MVVM) est un client REST typé à partir de l'OpenAPI ;
- l'application mobile, dans le dépôt EpiQuest-Mobile, dont le client Dart est généré à partir du contrat OpenAPI (ADR 0006) ;
- `apps/api`, qui l'implémente.

Par défaut, NestJS fonctionne en « code d'abord » : le document OpenAPI est généré à partir des décorateurs `@nestjs/swagger` des contrôleurs. En P1, il n'y a pas encore de contrôleurs, donc rien à générer.

Le contrat doit aussi imposer deux règles du projet :

- **le serveur fait autorité** : un client envoie une intention (lancer `1d20+5`), jamais un résultat ;
- **la projection par spectateur** : la vue joueurs ne reçoit aucune information cachée, même dans un champ que l'interface n'affiche pas.

## Options envisagées

| Option                                                                 | Avantages                                                                                                                                | Inconvénients                                                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Code d'abord** : Swagger généré par NestJS en P2                     | Pas de fichier à maintenir à la main ; le document suit toujours le code                                                                 | Rien n'existe en P1 : le web et le mobile inventent chacun leurs types, et la P2 devient une réécriture             |
| **Contrat d'abord** : `openapi.yaml` écrit à la main, source de vérité | Disponible dès la P1 ; les trois consommateurs partagent les mêmes types ; le contrat est relu en équipe avant d'écrire le moindre écran | Le code NestJS de la P2 peut s'écarter du contrat : il faut une vérification automatique                            |
| **Types partagés en TypeScript** (paquet de types, sans OpenAPI)       | Simple pour le web et l'API                                                                                                              | Inutilisable par le mobile en Dart ; contredit l'ADR 0006, qui fait de l'OpenAPI le seul lien entre les deux dépôts |

## Décision

Le contrat est écrit **en premier**, à la main, dans `openapi.yaml`. Ce fichier **fait foi** : en cas d'écart, c'est le code qui est corrigé, ou le contrat qui évolue par une PR relue.

**Emplacement et version**

- Le contrat vit dans un paquet dédié, `packages/api-contract` (`@lanterne/api-contract`), et non dans `apps/api`, car l'API n'est que l'un de ses trois consommateurs.
- Format **OpenAPI 3.0.3**, le mieux pris en charge par `@nestjs/swagger` et par le générateur Dart. Le passage à 3.1 est à reconsidérer quand ces outils le prendront pleinement en charge.
- Le contrat est versionné selon le versionnage sémantique, avec des tags `contract-vX.Y.Z`. Le mobile génère son client à partir d'un tag précis, pas de la branche `dev`.

**Génération des clients**

- Web : types générés avec `openapi-typescript` et client typé avec `openapi-fetch`. Les mocks de la P1 utilisent ces types générés, derrière les repositories de la couche Model.
- Mobile : client Dart généré avec `openapi-generator` (générateur `dart-dio`), dans le dépôt EpiQuest-Mobile.
- API : en P2, la CI compare le document généré par NestJS avec `openapi.yaml` (`oasdiff`) et échoue en cas d'écart.

**Conventions du contrat**

- Toutes les routes sont préfixées par `/api/v1`. Une rupture de compatibilité passe par `/api/v2`.
- Propriétés JSON en `camelCase`, identifiants en UUID, dates au format ISO 8601 (`date-time`), valeurs d'énumération en anglais. Les libellés en français viennent de l'interface, jamais de l'API.
- Toutes les erreurs suivent un format unique, celui de la RFC 9457 (`application/problem+json`). Une erreur de notation de dés y ajoute la position de l'erreur dans l'expression, avec la même forme que l'erreur du moteur de règles.
- Chaque route protégée documente ses réponses `401` (non connecté) et `403` (connecté, mais sans le rôle requis dans la campagne). Une ressource d'une campagne dont on n'est pas membre renvoie `404`, pour ne pas révéler son existence.
- Les listes sont paginées par curseur (`cursor`, `limit`) et renvoient un objet `{ items, nextCursor }`, jamais un tableau nu, pour pouvoir ajouter des métadonnées plus tard sans rupture.
- Deux schémas d'authentification sont déclarés : un cookie de session `httpOnly` pour le web, qu'un script injecté ne peut pas lire, et un jeton `Bearer` pour le mobile. Le mécanisme précis (durée, renouvellement, révocation) fait l'objet d'une ADR séparée en P2.

**Règles du projet imposées par le contrat**

- **Projection par spectateur** : une ressource qui contient des informations cachées a **deux schémas distincts**, suffixés `GmView` et `PlayerView` (par exemple `MonsterGmView` avec les PV exacts, `MonsterPlayerView` avec un état qualitatif seulement). Un champ caché n'est jamais rendu facultatif dans un schéma commun : il n'existe pas dans le schéma des joueurs.
- **Le serveur fait autorité** : les routes d'action reçoivent une intention, par exemple une expression de dés et une visibilité (`public`, `private`, `hidden`), et renvoient le résultat calculé par le serveur. Aucune requête ne contient de résultat de dé.
- **Les règles sont des données** : les données SRD (espèces, classes, historiques, sorts, équipements, monstres) sont décrites dans le format de règles du moteur (ADR 0005), et ne contiennent que du contenu du SRD 5.1.

**Hors du périmètre d'OpenAPI**

OpenAPI ne décrit que les routes REST. Les messages des canaux WebSocket (MJ et joueurs) réutilisent les schémas de `components/schemas` du contrat, ce qui les rend disponibles au web comme au mobile, mais leur description (événements, ordre, reconnexion) fait l'objet d'une ADR séparée.

## Conséquences

**Positives**

- Le web et le mobile peuvent commencer leurs écrans en P1 avec les mêmes types que l'API de la P2.
- Le contrat est relu par les trois membres avant l'écriture du code, et les erreurs de conception (champ caché envoyé aux joueurs, résultat calculé par le client) sont repérées au moment où elles coûtent le moins cher.
- Le Swagger servi sur `/api/docs` décrit exactement le contrat relu.

**Négatives ou à surveiller**

- Le contrat est maintenu à la main : il est vérifié par un linter dans la CI (Redocly CLI) dès la P1, puis comparé au code par `oasdiff` en P2.
- Toute PR qui modifie `openapi.yaml` le signale dans sa description, indique s'il s'agit d'une rupture de compatibilité, et entraîne la régénération des types du web et du client Dart (ADR 0006).
- Les fichiers générés ne sont jamais modifiés à la main : une correction passe par le contrat.
- La section des données SRD dépend du format de règles du moteur, qui n'est pas encore défini. Elle est écrite en dernier et pourra évoluer avec lui.

## Références

- ADR 0005 - SRD 5.1, importé depuis la D&D 5e API
- ADR 0006 - Deux dépôts : EpiQuest-Web et EpiQuest-Mobile
- ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité
- Spécification OpenAPI 3.0.3 : https://spec.openapis.org/oas/v3.0.3
- RFC 9457, Problem Details for HTTP APIs : https://www.rfc-editor.org/rfc/rfc9457
- NestJS, OpenAPI : https://docs.nestjs.com/openapi/introduction
- openapi-typescript et openapi-fetch : https://openapi-ts.dev
- OpenAPI Generator, générateur `dart-dio` : https://openapi-generator.tech/docs/generators/dart-dio
- Redocly CLI : https://redocly.com/docs/cli
- oasdiff : https://github.com/oasdiff/oasdiff
- OWASP, Session Management Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
