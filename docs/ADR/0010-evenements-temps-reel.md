# ADR 0010 - Événements temps réel (WebSocket)

- **Statut** : proposé (brouillon : voir [Points à trancher](#points-à-trancher))
- **Date** : 2026-11-03
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-09 (#9)

## Contexte

Le contrat OpenAPI (ADR 0008) ne décrit que les routes REST. Pendant une partie, les clients doivent aussi recevoir **sans les demander** les changements de la table : un jet de dés, un pion déplacé, une case découverte, des PV modifiés.

Le `CLAUDE.md` et le README prévoient une gateway WebSocket avec **deux canaux** : un canal MJ et un canal joueurs. Ce sont des données aussi sensibles que les réponses REST : la règle de projection par spectateur s'y applique de la même façon. Une analogie : le canal MJ est le talkie-walkie du MJ, le canal joueurs est le haut-parleur de la salle. Ce que le MJ murmure ne doit jamais passer dans le haut-parleur, même si personne n'écoute à ce moment-là.

Les sections du contrat ont déjà pris plusieurs décisions qui concernent le temps réel. Cette ADR les rassemble en un seul endroit, pour que l'implémentation de P2 ne les cherche pas dans les descriptions des routes.

## Options envisagées

### Description des messages

| Option                                                     | Avantages                                                                        | Inconvénients                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **AsyncAPI** (`asyncapi.yaml` à côté de `openapi.yaml`)    | Format standard, documentation générée, peut réutiliser les schémas de l'OpenAPI | Un outil et un format de plus à apprendre et à vérifier en CI            |
| **Schémas dans `openapi.yaml`, événements décrits en doc** | Un seul fichier de schémas, déjà généré pour le web et le mobile                 | La liste des événements et leurs canaux ne sont vérifiés par aucun outil |

### Contenu des événements

| Option                                           | Avantages                                                   | Inconvénients                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Événement complet** (l'objet après projection) | Le client met son état à jour sans requête supplémentaire   | Chaque événement doit être projeté séparément pour le MJ et pour les joueurs            |
| **Notification seule** (« la scène a changé »)   | Une seule projection, celle des routes REST, qui est testée | Une requête REST après chaque événement ; plus lent et plus de charge pendant un combat |

## Décision

Ce qui est déjà décidé dans les sections du contrat :

### Canaux et projection

- Deux canaux par campagne : **MJ** et **joueurs**. Chaque événement est **projeté côté serveur avant l'envoi**, avec les mêmes règles que les vues REST `gm` et `party`. Aucun événement n'est envoyé « complet » à un client qui en masquerait une partie.
- La vue joueurs (écran partagé, jeton d'affichage) et les comptes joueurs reçoivent le canal joueurs.

### Authentification

- Un client s'authentifie par un **premier message** contenant son jeton ou sa session, **jamais par l'URL**, qui finit dans les logs.
- La vue joueurs s'authentifie avec son **jeton d'affichage** (`X-Display-Token` en REST). Si ce jeton est présent, il s'applique seul : le cookie du MJ, joint par le navigateur, est ignoré. Le socket n'a alors accès qu'au canal joueurs, en lecture seule.
- Un jeton d'affichage révoqué ou expiré ferme le socket qui l'utilise.

### Événements déjà définis

| Événement                                   | Canal MJ                  | Canal joueurs                                                                                                        | Source                      |
| ------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `roll.created`, jet `public`                | oui                       | oui                                                                                                                  | Section Dés                 |
| `roll.created`, jet `private`               | oui                       | **au lanceur seulement**                                                                                             | Section Dés                 |
| `roll.created`, jet `hidden`                | oui                       | **non**                                                                                                              | Section Dés                 |
| Changement de brouillard                    | oui                       | oui, avec la **nouvelle liste `tiles`** (empreintes de masque) et le nouvel état `fog`                               | Section Cartes              |
| Changement de pions, de PV ou d'initiative  | oui, vue `gm`             | oui, vue `party` : créatures cachées absentes, `healthState` au lieu des PV, dernier état vu hors du champ de vision | Section Cartes              |
| Gabarit de zone posé, déplacé ou retiré     | oui                       | seulement les gabarits `public`, sans identifiant (`MapTemplateParty`)                                               | Section Cartes              |
| Action proposée (`proposeAction`)           | oui, `ActionResolutionGm` | **au joueur qui l'a proposée seulement**, `ActionPendingParty` (« En attente du MJ », sans jets ni cibles)           | Section Combat              |
| Action corrigée (`updatePendingAction`)     | oui                       | non                                                                                                                  | Section Combat              |
| Action annulée avant application            | oui                       | au joueur qui l'a proposée seulement : `status: cancelled`                                                           | Section Combat              |
| Action appliquée ou défaite                 | oui, `ActionResolutionGm` | oui, `ActionResolutionParty` : cibles visibles, jet de dégâts commun, jamais la CA, le DD ni les PV d'une créature   | Section Combat              |
| Tour suivant, début et fin de combat        | oui                       | oui, par la scène (`ScenePartyView`) ; rien pendant le tour d'une créature cachée hormis `currentTurn: null`         | Section Combat              |
| Effet ajouté ou retiré                      | oui, `ActiveEffect`       | oui, son nom seulement (`VisibleEffect`), jamais un effet `hiddenFromPlayers`                                        | Section Combat              |
| Nouvelle entrée du journal                  | oui, `JournalEntryGm`     | oui, `JournalEntryParty` ; jamais `actionCancelled` ni `manualCorrection`                                            | Section Combat              |
| Document révélé (`document.revealed`)       | oui                       | oui, `DocumentParty` sans `gmNotes`, **seulement au moment de la révélation**                                        | Section Gestion de campagne |
| Document recaché ou supprimé                | oui                       | oui : le document disparaît de la liste et de l'affichage                                                            | Section Gestion de campagne |
| Document affiché sur la vue joueurs         | oui                       | oui, `ScenePartyView.document`                                                                                       | Section Gestion de campagne |
| Notes, PNJ, lieux et quêtes                 | oui                       | **jamais**                                                                                                           | Section Gestion de campagne |
| Joueur retiré (`removeMember`)              | oui                       | le serveur **ferme immédiatement le socket** du joueur retiré                                                        | Section Campagnes           |
| Rôle de MJ transféré (`transferGameMaster`) | oui                       | l'ancien MJ quitte le canal MJ et rejoint le canal joueurs ; le nouveau MJ passe au canal MJ                         | Section Campagnes           |

### Accessibilité

Chaque événement a une forme **structurée** (`type`, `actor`, `target`, `value`), sans phrase. Le front en fait le texte lu par le lecteur d'écran (« Ogre : blessé »), comme pour les libellés de l'interface (ADR 0008, WCAG 2.2, critère 4.1.3 « Messages d'état »).

## Points à trancher

Ces points ne sont pas encore décidés. L'ADR passe à « accepté » quand ils le sont.

1. **Format de description des messages** : AsyncAPI, ou schémas dans `openapi.yaml` avec une page de doc.
2. **Contenu des événements** : événement complet projeté, ou simple notification suivie d'une requête REST.
3. **Enveloppe commune** : champs de chaque message (par exemple `type`, `campaignId`, `sequence`, `occurredAt`, `payload`).
4. **Ordre et reconnexion** : comment un client qui perd la connexion rattrape les événements manqués. Un numéro de séquence **par canal** ne doit pas révéler aux joueurs les événements du canal MJ, pour la même raison que l'absence de numéro de jet séquentiel (section Dés).
5. **Bibliothèque** : Socket.IO ou WebSocket natif (`ws`) côté NestJS, et l'équivalent Dart côté mobile.
6. **Battement de cœur et expiration** : délai avant de considérer un client comme déconnecté.
7. **Limites** : taille maximale d'un message entrant et nombre de messages par seconde, contre le déni de service.

## Conséquences

**Positives**

- Les règles de projection du temps réel sont écrites au même endroit, et testables comme celles des routes REST.
- Le mobile et le web reçoivent les mêmes événements, typés avec les schémas du contrat.

**Négatives ou à surveiller**

- Chaque nouvel événement doit être ajouté au tableau ci-dessus, avec son comportement sur **chaque** canal. Une PR qui ajoute un événement sans le tableau est refusée en revue.
- Les tests de projection doivent couvrir le WebSocket, avec le jeton d'affichage dans un navigateur où le MJ est aussi connecté (voir les issues P2-08, P2-10, P3-02 et P3-10).

## Références

- ADR 0008 - Contrat d'API écrit en premier
- Contrat : `packages/api-contract/openapi.yaml` (sections Dés, Campagnes et Cartes, schéma de sécurité `displayAuth`)
- Spécification de la notation des dés : `docs/technique/notation-des-des.md`
- AsyncAPI : https://www.asyncapi.com/docs
- WCAG 2.2, critère 4.1.3 Messages d'état : https://www.w3.org/TR/WCAG22/#status-messages
