# Format des règles

Cette page est la spécification du format dans lequel Lanterne décrit le contenu du SRD 5.1 : sorts, capacités, espèces, classes, objets, états et monstres. Elle sert à la fois :

- à l'**import** (P2-02), qui convertit les données de 5e-bits dans ce format (ADR 0005) ;
- au **moteur de règles** (`packages/rules-engine`), qui l'interprète ;
- au **contrat d'API** (`packages/api-contract/openapi.yaml`, section Données SRD), qui en reprend les schémas.

En cas d'écart entre cette page et le code, c'est cette page qui fait foi : on corrige le code, ou on modifie la page en pull request relue.

## Principes

- **Les règles sont des données, pas du code.** Une boule de feu se décrit comme une attaque de massue d'ogre, avec une seule forme `Action`. Le moteur n'a qu'un interpréteur. En revue, tout test sur le nom d'un élément (`if (sort === "fire-bolt")`) est refusé.
- **Le moteur dit ce qu'il sait faire.** Chaque sort, capacité, état, objet magique ou monstre porte un champ `automation` :

  | Valeur    | Sens                                                        | Exemple           |
  | --------- | ----------------------------------------------------------- | ----------------- |
  | `full`    | le moteur résout tout                                       | _Boule de feu_    |
  | `partial` | le moteur résout ce qui est décrit, le MJ complète le reste | un sort à options |
  | `manual`  | texte seulement, le MJ applique la règle                    | _Souhait_         |

  C'est la règle de la fiche, « le reste est ajouté par le MJ », rendue visible dans les données.

- **Un élément que le format ne sait pas décrire est importé quand même**, en `manual`, avec son texte. On ne l'exclut jamais et on n'invente pas d'approximation.
- **Le contenu est public et en lecture seule.** Il n'y a pas de projection sur ces données : le seul secret, le lien entre un pion et son monstre, est protégé par la section Cartes.
- **Unités métriques**, converties à l'import : 1,5 m par case, 0,5 kg par livre (ADR 0009). **Prix en pièces de cuivre** (`costCp`, entier).
- **Le texte du SRD est une donnée externe.** Il est découpé en paragraphes (`description: string[]`) et toujours affiché comme **texte brut**, jamais interprété comme du HTML ou du Markdown.

## Identifiants et vocabulaire

- Chaque élément a un `RuleId` : minuscules, chiffres et tirets (`fighter`, `chain-mail`, `high-elf`), repris des index de la D&D 5e API. Un identifiant est unique **pour un type donné** : le type est porté par le champ ou par le chemin (`/srd/items/longsword`).
- Les mots du **vocabulaire du moteur** sont aussi des `RuleId`. Ce ne sont pas des entités avec leur propre route : le front les traduit lui-même, comme les codes d'erreur.

| Vocabulaire                         | Valeurs (SRD 5.1)                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Types de dégâts (`damageType`)      | `acid`, `bludgeoning`, `cold`, `fire`, `force`, `lightning`, `necrotic`, `piercing`, `poison`, `psychic`, `radiant`, `slashing`, `thunder` |
| Écoles de magie (`school`)          | `abjuration`, `conjuration`, `divination`, `enchantment`, `evocation`, `illusion`, `necromancy`, `transmutation`                           |
| Propriétés d'arme (`properties`)    | `ammunition`, `finesse`, `heavy`, `light`, `loading`, `reach`, `special`, `thrown`, `two-handed`, `versatile`                              |
| Exceptions de résistance (`except`) | `magical`, `silvered`, `adamantine`                                                                                                        |

Les **états** (`blinded`, `poisoned`, `prone`…) sont des entités à part entière (`/srd/conditions`), car leurs effets sont décrits en données (voir [États](#états)).

Les valeurs d'énumération du contrat (`bonusAction`, `slotProgression`, `meleeSpell`…) ne sont pas des `RuleId` et restent en camelCase.

## Formules

Une `Formula` est une expression de la [grammaire des dés](notation-des-des.md), à laquelle s'ajoutent des **variables** :

```ebnf
terme    = des | entier | variable ;
variable = "@" identifiant ;
```

| Variable                                       | Valeur                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `@str`, `@dex`, `@con`, `@int`, `@wis`, `@cha` | modificateur de caractéristique                                        |
| `@prof`                                        | bonus de maîtrise                                                      |
| `@level`                                       | niveau du personnage                                                   |
| `@spellMod`, `@spellAttack`, `@spellDc`        | caractéristique d'incantation, bonus d'attaque des sorts, DD des sorts |
| `@slotLevel`                                   | niveau de l'emplacement utilisé                                        |

- **Les variables ne sont acceptées que dans les données de règles.** Un jet libre (`rollDice`) qui contient `@` est refusé avec `unexpected_character`.
- **Une variable inconnue fait échouer l'import**, avec le nom de l'élément en cause, jamais l'exécution en pleine partie.
- **Les monstres utilisent des valeurs fixes** (`6`, `13`) : leur bloc de statistiques donne les nombres déjà calculés. Seuls leurs sorts utilisent `@spellDc` et `@spellAttack`, remplacés par les valeurs du monstre (voir [Monstres](#monstres)).
- La grammaire n'a **ni multiplication, ni division** : les quantités qui en auraient besoin passent par `Quantity`.

### `Quantity`

Un `oneOf` de trois formes :

| Forme                                            | Exemple                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| une `Formula` simple                             | `"@prof"`                                                                       |
| `{ kind: minimum, formula, minimum }`            | inspiration bardique : `{ "kind": "minimum", "formula": "@cha", "minimum": 1 }` |
| `{ kind: byLevel, byLevel: [{ level, value }] }` | imposition des mains : 5 au niveau 1, 10 au niveau 2, 15 au niveau 3…           |

`Quantity` sert pour `Uses.count` (réserves d'utilisations), `Targeting.creatures.count` et les charges des objets magiques.

## Action

Une `Action` décrit tout ce qui se lance : un sort, l'attaque d'un monstre, une capacité active.

| Champ        | Rôle                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `key`        | identifiant unique dans son parent (le sort, le monstre), désigné par exemple par une attaque multiple                 |
| `activation` | `action`, `bonusAction`, `reaction` (avec `trigger`), `minute` ou `hour` (avec `amount`), `special`                    |
| `cost`       | ce qu'elle consomme : `spellSlot`, `uses`, `charges`, `recharge`, `legendary`                                          |
| `range`      | `self`, `touch`, `distance`, `sight`, `unlimited` ; `meters`, `longMeters` (armes à distance), `reachMeters` (allonge) |
| `targeting`  | `self`, `creatures` (`count`, `filter`), ou `zone` (`shape`, `sizeMeters`, `widthMeters`, `heightMeters`, `origin`)    |
| `resolution` | `attack`, `save` ou `automatic`, avec les effets de chaque issue                                                       |
| `duration`   | type, `amount`, `concentration`                                                                                        |
| `scaling`    | augmentation des effets selon le niveau d'emplacement ou de personnage                                                 |
| `automation` | `full`, `partial` ou `manual`                                                                                          |

### Coûts

| `resource`  | Champs                              | Sens                                                                            |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `spellSlot` | `level`                             | un emplacement de ce niveau ou plus                                             |
| `uses`      | `count` (Quantity), `per`, `regain` | une réserve propre à l'action                                                   |
| `charges`   | `min`, `max`                        | de `min` à `max` charges de l'objet magique qui porte l'action (`Item.charges`) |
| `recharge`  | `min`                               | « Recharge 5–6 » : `min: 5`, le moteur lance 1d6 au début du tour du monstre    |
| `legendary` | `points`                            | points d'action légendaire                                                      |

`per` vaut `shortRest`, `longRest` ou `dawn`. `regain` est une `Formula` facultative : « récupère 1d6 + 1 charges à l'aube » s'écrit `{ "per": "dawn", "regain": "1d6+1" }`. Sans `regain`, tout est récupéré.

### Zones

| `shape`    | `sizeMeters` | Autres champs  |
| ---------- | ------------ | -------------- |
| `sphere`   | rayon        | —              |
| `cylinder` | rayon        | `heightMeters` |
| `cone`     | longueur     | —              |
| `line`     | longueur     | `widthMeters`  |
| `cube`     | côté         | —              |

**Cases touchées.** Une case est touchée si **son centre** est dans la forme. La règle est simple, identique dans le navigateur et sur le serveur, et c'est le moteur de règles qui la calcule. Sur la carte, une zone se décrit par un `AreaSpec` (contrat, section Cartes) : la forme et ses dimensions ci-dessus, plus `origin` (en cases, décimales permises) et `directionDegrees` pour le cône et la ligne (0 = nord, sens horaire).

### Résolution

- **`attack`** : `kind` (`melee`, `ranged`, `meleeSpell`, `rangedSpell`), `bonus` (Formula), puis les effets `onHit` et `onMiss`.
- **`save`** : `ability`, `dc` (Formula), puis les effets `onFailedSave` et `onSuccessfulSave`.
- **`automatic`** : `effects`, appliqués sans jet (_Projectile magique_, un soin).

**La règle de `halfDamage`.** Sur une sauvegarde réussie, chacun des effets `damage` de `onFailedSave` est divisé par deux, **sur les mêmes jets**, arrondi à l'unité inférieure (règle 5e). Les types de dégâts restent séparés : _Colonne de flamme_ inflige la moitié de son feu **et** la moitié de son radiant, et chaque moitié passe ensuite par les résistances de la cible.

### Augmentation (`scaling`)

- **`perSlotLevel`** : pour chaque niveau d'emplacement au-dessus de `aboveLevel`, l'effet `effectKey` reçoit `addDice` en plus.
- **`byCharacterLevel`** : pour les sorts mineurs, les dés de l'effet `effectKey` deviennent `dice` aux niveaux indiqués par `steps`.
- **`perExtraCharge`** : pour chaque charge dépensée au-delà de `aboveCharges`, l'effet `effectKey` reçoit `addDice` en plus. La _baguette de boules de feu_ dépense de 1 à 3 charges (`{ "resource": "charges", "min": 1, "max": 3 }`), et chaque charge au-delà de la première ajoute 1d6 : `{ "type": "perExtraCharge", "aboveCharges": 1, "effectKey": "fire", "addDice": "1d6" }`.

Chaque `Effect` peut porter une `key`, qui est ce que `effectKey` désigne.

## Effets

Deux familles, à ne pas mélanger : un effet de dégâts permanent n'aurait pas de sens.

### `Effect` : effets ponctuels d'une action

| `type`               | Champs                                                            | Exemple                                                                            |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `damage`             | `dice`, `damageType`                                              | `8d6` de feu                                                                       |
| `halfDamage`         | —                                                                 | voir la règle ci-dessus                                                            |
| `healing`            | `dice`                                                            | `1d4+@spellMod`                                                                    |
| `temporaryHitPoints` | `dice`                                                            | —                                                                                  |
| `condition`          | `condition`, `duration`, `repeatSave` (`ability`, `dc`, `timing`) | _Immobilisation de personne_ : paralysé, sauvegarde de SAG à la fin de chaque tour |
| `modifier`           | `target`, `value` (Formula), `duration`                           | _Bénédiction_ : `1d4` aux jets d'attaque                                           |
| `rollMode`           | voir ci-dessous                                                   | _Lueurs féeriques_ : avantage contre la cible                                      |

### `PassiveEffect` : effets permanents

Portés par les capacités (`Feature.passive`), les états (`Condition.passive`) et les objets magiques.

| `type`              | Champs                                                                           | Exemple                                                                            |
| ------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `proficiency`       | `kind` (compétence, sauvegarde, armure, arme, outil, langue), `ref`, `expertise` | maîtrise de la Perception                                                          |
| `damageAdjustment`  | `mode` (`resistance`, `vulnerability`, `immunity`), `damageType`, `except`       | résistance au poison des nains                                                     |
| `conditionImmunity` | `condition`                                                                      | —                                                                                  |
| `sense`             | `sense`, `meters`                                                                | vision dans le noir, 18 m                                                          |
| `armorClassFormula` | `formula`, `allowsShield`                                                        | Défense sans armure : `10 + @dex + @con`, bouclier permis (barbare) ou non (moine) |
| `speed`             | `movement`, `bonusMeters` **ou** `setMeters`                                     | _Agrippé_ : `setMeters: 0`                                                         |
| `hitPointMaximum`   | `perLevel`                                                                       | robustesse naine : +1 par niveau                                                   |
| `abilityScore`      | `ability`, `set` **ou** `bonus`, `max`                                           | —                                                                                  |
| `rollMode`          | voir ci-dessous                                                                  | —                                                                                  |
| `autoFail`          | `savingThrows`                                                                   | _Paralysé_ : FOR et DEX                                                            |
| `autoCritical`      | `withinMeters`                                                                   | _Paralysé_ : coups critiques à 1,5 m ou moins                                      |
| `cannotAct`         | `actions`, `reactions`, `movement`                                               | _Neutralisé_ : ni actions ni réactions                                             |

### `rollMode` : avantage et désavantage

`rollMode` appartient aux deux familles. Dans un `Effect`, il dure le temps de l'action ; dans un `PassiveEffect`, il est permanent.

| Champ                                        | Rôle                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `target`                                     | `attackRolls`, `abilityChecks` ou `savingThrows`                                                    |
| `mode`                                       | `advantage` ou `disadvantage`                                                                       |
| `appliesTo`                                  | `self` (les jets de la créature) ou `attackersAgainst` (les attaques contre elle)                   |
| `ability` (facultatif)                       | limite l'effet à une caractéristique : _Entravé_ donne un désavantage aux seules sauvegardes de DEX |
| `withinMeters`, `beyondMeters` (facultatifs) | limite l'effet selon la distance                                                                    |

_À terre_ s'écrit avec deux `rollMode` : avantage pour les attaquants à 1,5 m ou moins (`withinMeters: 1.5`), désavantage au-delà (`beyondMeters: 1.5`).

## Effets actifs

Un effet en cours sur un personnage ou une créature est un **`ActiveEffect`** : l'effet lui-même, sa source, les rounds restants (`null` : jusqu'à ce qu'on le retire) et `hiddenFromPlayers`. C'est la **seule source des états** : la fiche (`CharacterSheet.effects`) et le pion (`CreatureTokenGm.effects`) en portent la liste, et le combat les lit sans en être propriétaire, car un personnage peut rester empoisonné après la fin du combat.

L'effet porté est soit un `Effect` du format SRD (par exemple l'état `poisoned`), soit un **effet libre** (`FreeEffect`), ajouté par le MJ pour ce que les règles ne prévoient pas :

| Champ                | Rôle                                    | Exemple de la fiche |
| -------------------- | --------------------------------------- | ------------------- |
| `name`               | nom affiché, y compris aux joueurs      | « En feu »          |
| `trigger`            | `startOfTurn`, `endOfTurn` ou `none`    | `startOfTurn`       |
| `dice`, `damageType` | dégâts ou soins lancés au déclenchement | `1d4`, `fire`       |
| `durationRounds`     | durée                                   | 2                   |

Les joueurs ne reçoivent que le **nom** des effets visibles (`VisibleEffect`), jamais un effet marqué `hiddenFromPlayers`.

## États

Un état (`Condition`) est décrit par ses effets passifs. Par exemple :

| État       | `passive`                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empoisonné | `rollMode` désavantage sur `attackRolls` (`self`) ; `rollMode` désavantage sur `abilityChecks` (`self`)                                                             |
| Paralysé   | `cannotAct` (actions, réactions, déplacement) ; `autoFail` sur `str` et `dex` ; `rollMode` avantage sur `attackRolls` (`attackersAgainst`) ; `autoCritical` à 1,5 m |
| Agrippé    | `speed` `walk` `setMeters: 0`                                                                                                                                       |

Avec ce vocabulaire, la plupart des états du SRD passent en `automation: full`.

## Armes des personnages

Les attaques d'armes des personnages **ne sont pas stockées comme `Action`** : le moteur les déduit de l'arme, ce qui évite une action recopiée par arme. Chaque propriété est un mot du vocabulaire du moteur, interprété de façon générique :

| Propriété                                               | Effet dans le moteur                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| _(aucune)_                                              | attaque et dégâts avec `@str` au corps à corps, `@dex` à distance                                       |
| `finesse`                                               | le meilleur modificateur entre `@str` et `@dex`                                                         |
| `thrown`                                                | attaque à distance possible, avec le modificateur du corps à corps                                      |
| `versatile`                                             | `versatileDice` à deux mains                                                                            |
| `reach`                                                 | allonge de 1,5 m supplémentaire                                                                         |
| `two-handed`, `heavy`, `light`, `ammunition`, `loading` | contraintes d'utilisation, vérifiées par le moteur (P2-19)                                              |
| `special`                                               | règle propre à l'arme (lance d'arçon, filet), non interprétable : l'arme passe en `automation: partial` |

Le bonus d'attaque ajoute `@prof` si le personnage maîtrise l'arme. Jamais de test sur le nom d'une arme : c'est la frontière vérifiée en revue.

## Incantation

### Classes (`ClassSpellcasting`)

- `slotProgression: standard` : les emplacements dépendent du niveau du personnage (`slotsByLevel`).
- `slotProgression: pact` (occultiste) : les emplacements sont tous du même niveau (`pactSlotsByLevel` : `level`, `count`, `slotLevel`) et se récupèrent au **repos court**.
- `preparation` vaut `prepared` ou `known` ; `spellsKnownByLevel` ne sert qu'avec `known`.

### Monstres (`MonsterSpellcasting`)

`ability`, `dc` et `attackBonus` sont des valeurs fixes. Les sorts (`slots`, `perDay`, `atWill`) **renvoient vers les entités `Spell`**, et le moteur remplace `@spellDc` et `@spellAttack` par les valeurs du monstre. Le mage, la liche ou le prêtre restent ainsi en `full`.

## Entités

| Entité           | Particularités                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Species`        | **aplaties** : `high-elf` contient déjà les traits communs des elfes ; `family` ne sert qu'au regroupement à l'écran       |
| `CharacterClass` | les 20 niveaux sont importés ; l'API n'expose que les niveaux jusqu'au réglage `maxLevel` du serveur (5 au MVP)            |
| `Background`     | le SRD 5.1 n'en contient qu'un : Acolyte (ADR 0005)                                                                        |
| `Spell`          | `level` 0 pour un sort mineur ; `actions` contient en général une seule action                                             |
| `Item`           | `oneOf` sur `category` : `weapon`, `armor`, `gear`, `tool`, `pack`, `magicItem`                                            |
| `Condition`      | effets passifs (voir [États](#états))                                                                                      |
| `Monster`        | bonus déjà calculés ; `multiattack` désigne des actions par leur `key` ; `legendary` porte ses coûts dans `Cost.legendary` |

Les listes `listSpecies` et `listClasses` renvoient des résumés (`SpeciesSummary`, `ClassSummary`) suffisants pour les cartes de l'assistant, sans appeler le détail de chaque élément ; les historiques et les états renvoient des `RuleRef`.

Les choix de création (`ChoiceGroup`) donnent soit un élément (`kind: ref`), soit un bonus de caractéristique (`kind: abilityBonus`). Le demi-elfe a ainsi un groupe `choose: 2` parmi cinq options à `+1`, toutes les caractéristiques sauf le CHA, qui a déjà son bonus fixe.

## Exemples

_Boule de feu_ :

```json
{
  "key": "cast",
  "name": "Boule de feu",
  "activation": { "type": "action" },
  "cost": [{ "resource": "spellSlot", "level": 3 }],
  "range": { "type": "distance", "meters": 45 },
  "targeting": { "type": "zone", "shape": "sphere", "sizeMeters": 6, "origin": "point" },
  "resolution": {
    "type": "save",
    "ability": "dex",
    "dc": "@spellDc",
    "onFailedSave": [{ "key": "fire", "type": "damage", "dice": "8d6", "damageType": "fire" }],
    "onSuccessfulSave": [{ "type": "halfDamage" }]
  },
  "duration": { "type": "instantaneous", "concentration": false },
  "scaling": { "type": "perSlotLevel", "aboveLevel": 3, "effectKey": "fire", "addDice": "1d6" },
  "automation": "full"
}
```

La massue de l'ogre :

```json
{
  "key": "greatclub",
  "name": "Massue",
  "activation": { "type": "action" },
  "cost": [],
  "range": { "type": "touch", "reachMeters": 1.5 },
  "targeting": { "type": "creatures", "count": "1", "filter": "any" },
  "resolution": {
    "type": "attack",
    "kind": "melee",
    "bonus": "6",
    "onHit": [{ "type": "damage", "dice": "2d8+4", "damageType": "bludgeoning" }],
    "onMiss": []
  },
  "duration": { "type": "instantaneous", "concentration": false },
  "automation": "full"
}
```

## Attribution

Le contenu est celui du SRD 5.1, utilisé sous **CC BY 4.0** (ADR 0005), modifié (format structuré, unités métriques, traduction éventuelle) et importé depuis les données de 5e-bits, sous **licence MIT** (ADR 0009). La route publique `getSrdAttribution` renvoie la mention complète, avec les modifications (`changes`) et la source des données (`dataSource`) ; chaque réponse `/srd/*` porte l'en-tête `Link: </api/v1/srd/attribution>; rel="license"`. Le texte complet de la licence MIT est dans [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## Indicateur d'automatisation

Après chaque import, le script publie le nombre d'éléments `full`, `partial` et `manual`, par type. Ce décompte sera ajouté ici à la fin de P2-02 : il mesure honnêtement ce que le moteur sait faire.

## Tests attendus

**Import** (P2-02)

- Rejoué deux fois, l'import donne le même contenu et la même `rulesetVersion`.
- Toutes les formules de toutes les actions passent l'analyseur.
- Une variable inconnue fait échouer l'import, avec le nom de l'élément en cause.
- Aucun élément hors SRD 5.1 n'est présent après l'import, et aucune mention de pieds ni de livres ne reste dans les textes (ADR 0009).
- Le décompte `full`, `partial` et `manual` est produit.

**Moteur** (P2-19)

- _Boule de feu_ et la massue de l'ogre, ci-dessus, produisent le résultat de l'annexe A1 avec un générateur à graine.
- `halfDamage` sur _Colonne de flamme_ : deux moitiés séparées, arrondies à l'unité inférieure, sur les mêmes jets.
- Les états _Empoisonné_, _Paralysé_, _À terre_ et _Entravé_ appliquent leurs effets passifs.
- `rollDice` refuse une expression qui contient `@` (`unexpected_character`).

## Références

- [ADR 0005 - SRD 5.1, importé depuis la D&D 5e API](../ADR/0005-source-srd.md)
- [ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité](../ADR/0007-web-depend-rules-engine.md)
- [ADR 0009 - Unités métriques, conversion et attribution du SRD](../ADR/0009-unites-srd.md)
- [Notation des dés](notation-des-des.md)
- System Reference Document 5.1 : https://dnd.wizards.com/resources/systems-reference-document
