# Notation des dés

Cette page est la spécification de la notation des dés de Lanterne : grammaire, sens de chaque modificateur, limites, erreurs, générateur aléatoire et calcul des probabilités. Elle sert à la fois :

- au **moteur de règles** (`packages/rules-engine`), qui analyse et lance les expressions ;
- au **contrat d'API** (`packages/api-contract/openapi.yaml`, section Dés), qui en reprend les schémas `RollResult`, `FieldError` (avec la position des erreurs) et `DiceProbabilities` ;
- au **web et au mobile**, qui affichent le détail des jets et soulignent les erreurs de saisie.

En cas d'écart entre cette page et le code, c'est cette page qui fait foi : on corrige le code, ou on modifie la page en pull request relue.

## Principes

- **Le serveur lance tous les dés.** Le client envoie une expression ; il ne calcule jamais un résultat officiel. Le web peut analyser une expression et en calculer les probabilités localement pour un aperçu (ADR 0007), jamais la lancer.
- **Un jet n'est envoyé qu'à ceux qui ont le droit de le voir** (projection par spectateur, voir [Visibilité](#visibilité)).
- **Les libellés viennent de l'interface.** L'API renvoie des codes (`keep_out_of_range`) et des valeurs (`{ "min": 1, "max": 4 }`), jamais de phrase.

## Grammaire

Notation EBNF. La casse et les espaces sont ignorés partout : `2D6 + 3` équivaut à `2d6+3`.

```ebnf
expression      = [ signe ] terme { signe terme } ;
signe           = "+" | "-" ;
terme           = des | entier ;
des             = [ nombre ] "d" ( faces | "%" ) { modificateur } ;
modificateur    = garder | exploser | relancer ;
garder          = ( "kh" | "kl" ) entier ;     (* garder les N plus hauts / plus bas *)
exploser        = "!" ;                        (* relance et ajoute un dé sur la valeur max *)
relancer        = "r" [ "<" ] entier ;         (* r1 : relance les 1 ; r<2 : relance 1 et 2 *)

chiffre-non-nul = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
chiffre         = "0" | chiffre-non-nul ;
nombre          = chiffre-non-nul { chiffre } ; (* ≥ 1, sans zéro en tête *)
entier          = "0" | nombre ;
faces           = nombre ;
```

- `nombre` sert pour le nombre de dés et les faces ; `entier` pour les constantes et les valeurs de `kh`, `kl` et `r`. `kh0` est donc bien formé, mais refusé par `keep_out_of_range` : le message est plus clair qu'une erreur de syntaxe.
- Le nombre de dés vaut 1 s'il est absent : `d20` équivaut à `1d20`.
- `d%` équivaut à `d100`.
- Les zéros en tête sont refusés (`04d6`, `1d06`) avec le code `leading_zero` : une expression qui ressemble à une faute de frappe ne doit pas passer en silence.
- Il n'y a ni multiplication, ni division, ni parenthèses : le SRD n'en a pas besoin. Doubler les dés d'un coup critique est fait par la section Combat, qui réécrit l'expression avant de la lancer.

**Exemples valides** : `2d6+3`, `4d6kh3`, `1d20+5`, `2d6r<2+4`, `1d6!`, `1d8+1d6+2`, `d%`, `-1+1d4`.

## Sens des modificateurs

| Modificateur  | Sens                                                       | Représentation dans `DiceTerm`                |
| ------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `khN` / `klN` | Ne garder que les N dés les plus hauts / les plus bas      | `keep: { mode: highest \| lowest, count: N }` |
| `!`           | Chaque dé qui fait la valeur maximale ajoute un nouveau dé | `explode: true`                               |
| `rN`          | Relancer une fois les dés qui font exactement N            | `reroll: { mode: equal, value: N }`           |
| `r<N`         | Relancer une fois les dés qui font N ou moins              | `reroll: { mode: atMost, value: N }`          |

Les deux formes de relance existent dans le SRD : relancer les 1, ou relancer 1 et 2 (style de combat Combat à deux mains).

### Combinaisons

- Chaque **famille** de modificateurs apparaît au plus une fois par terme : garder (`kh` et `kl` ensemble comptent comme un doublon), exploser, relancer. Sinon : `duplicate_modifier`, position sur la deuxième occurrence.
- `!` combiné à `kh` ou `kl` est refusé avec `incompatible_modifiers` (position sur le modificateur écrit en second) : garder parmi des dés ajoutés par explosion ne correspond à aucune règle du SRD.
- L'ordre d'écriture est libre (`4d6kh3r1` et `4d6r1kh3` sont équivalents), puisque l'ordre d'application est fixe.

### Ordre d'application dans un terme

1. **Relances.** Seuls les **dés de base** sont relancés, jamais un dé issu d'une explosion. Chaque dé concerné est relancé **une seule fois**, et la nouvelle valeur est gardée même si elle est encore dans la plage de relance, comme dans les règles 5e. Le dé garde la trace de sa première valeur dans `rerolledFrom`.
2. **Explosions.** L'explosion porte sur la valeur **finale** du dé : un dé relancé qui tombe sur la valeur maximale explose. Chaque explosion ajoute un nouveau dé (`fromExplosion: true`), qui peut exploser à son tour, jusqu'à 10 explosions par dé de base.
3. **Dés gardés.** `kh` ou `kl` choisit parmi les dés du terme (il n'y a pas d'explosion dans un terme qui garde) ; les autres ont `kept: false`.

Le sous-total d'un terme est la somme des dés gardés. Le total est la somme des sous-totaux et des constantes, avec leur signe. Un total peut être négatif (`1d4-5`) : c'est la section Combat qui applique, par exemple, le minimum de 0 aux dégâts.

### Avantage et désavantage

L'avantage ne s'écrit pas dans la notation : il passe par le champ `advantage` (`none`, `advantage`, `disadvantage`), qui correspond aux trois boutons de l'interface.

- Le serveur réécrit le terme `1d20` en `2d20kh1` (avantage) ou `2d20kl1` (désavantage), puis renvoie l'expression réécrite dans `RollResult.expression`.
- L'expression doit contenir **exactement un** terme `1d20` **sans `kh`, `kl` ni `!`**, sinon : `advantage_requires_single_d20`.
- `r` est permis : la chance du halfelin (SRD 5.1) relance les 1 même avec avantage. `1d20r1` avec avantage devient `2d20r1kh1` ; l'ordre d'application (relancer, puis garder) fonctionne tel quel.

### Forme normalisée

`RollResult.expression` est renvoyée sous forme normalisée : minuscules, sans espaces, nombre de dés explicite, `d%` écrit `d100`, modificateurs toujours dans l'ordre `r`, `!`, `kh`/`kl`, avantage appliqué. Exemple : `D20 + 5` avec avantage donne `2d20kh1+5`.

## Limites

Elles protègent le serveur contre le déni de service.

| Limite                                                         | Valeur                      | Code d'erreur                                                 |
| -------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| Longueur de l'expression, telle qu'envoyée                     | 100 caractères              | `expression_too_long`                                         |
| Nombre de termes                                               | 10                          | `too_many_terms`                                              |
| Dés par terme                                                  | 1 à 100                     | `dice_count_out_of_range`                                     |
| Dés de base, somme sur tous les termes                         | 200                         | `too_many_dice`, position sur le terme qui franchit la limite |
| Faces                                                          | 2 à 100                     | `sides_out_of_range`                                          |
| Constante                                                      | -1 000 à 1 000              | `constant_out_of_range`                                       |
| `kh` / `kl`                                                    | 1 au nombre de dés du terme | `keep_out_of_range`                                           |
| `r` (`equal`)                                                  | 1 au nombre de faces        | `reroll_out_of_range`                                         |
| `r<` (`atMost`)                                                | 1 au nombre de faces − 1    | `reroll_out_of_range`                                         |
| Dés effectivement lancés : dés de base, relances et explosions | 400                         | aucune : le jet s'arrête, `capped: true`                      |
| Explosions par dé de base                                      | 10                          | aucune : `capped: true`                                       |
| Jets par utilisateur                                           | limite de débit             | réponse HTTP 429                                              |

Un `1d2!` exploserait sans fin : les deux plafonds arrêtent le jet sans erreur, et `capped: true` le signale à l'interface.

## Erreurs

Une expression invalide donne une réponse 400 au format `application/problem+json` (RFC 9457, ADR 0008). Chaque élément de `errors` est une `FieldError`, dont les trois champs facultatifs `position`, `length` et `params` sont **toujours remplis** pour une erreur de notation :

| Champ      | Type        | Rôle                                                                                   |
| ---------- | ----------- | -------------------------------------------------------------------------------------- |
| `field`    | string      | toujours `expression`                                                                  |
| `code`     | string      | voir la liste ci-dessous                                                               |
| `position` | integer ≥ 0 | index du premier caractère fautif dans la chaîne **telle qu'envoyée**, espaces compris |
| `length`   | integer ≥ 0 | nombre de caractères à souligner ; 0 pour une fin inattendue                           |
| `params`   | object      | valeurs utiles au message, par exemple `{ "min": 1, "max": 4 }`                        |

**La position est comptée en unités UTF-16**, celles des chaînes en TypeScript et en Dart : le web et le mobile soulignent le même caractère sans conversion. Pour `unexpected_end`, `position` vaut la longueur de la chaîne et `length` vaut 0.

Exemple pour `4d6kh7` :

```json
{
  "type": "/problems/validation-error",
  "title": "Bad Request",
  "status": 400,
  "errors": [
    {
      "field": "expression",
      "code": "keep_out_of_range",
      "position": 3,
      "length": 3,
      "params": { "min": 1, "max": 4 }
    }
  ]
}
```

| Famille       | Codes                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Syntaxe       | `unexpected_character`, `unexpected_end`, `missing_sides`, `leading_zero`                                                                               |
| Limites       | `expression_too_long`, `too_many_terms`, `dice_count_out_of_range`, `too_many_dice`, `sides_out_of_range`, `constant_out_of_range`, `keep_out_of_range` |
| Modificateurs | `reroll_out_of_range`, `duplicate_modifier`, `incompatible_modifiers`, `advantage_requires_single_d20`                                                  |
| Visibilité    | `visibility_requires_campaign`, `private_roll_player_only` (réponse 400, `field` = `visibility`) ; `hidden_roll_gm_only` (réponse 403)                  |
| Probabilités  | `too_complex_for_probabilities`                                                                                                                         |

## Mise en œuvre

### Analyseur

- **Pas d'expression régulière avec retour arrière**, pour éviter le déni de service par expression régulière (ReDoS). L'analyseur est écrit à la main et lit la chaîne **une seule fois**, de gauche à droite.
- L'analyse produit un arbre (`parse(expression)`), sans aucun aléatoire. Le lancer (`roll(arbre, rng)`) est une fonction séparée. Le web n'utilise que la première (ADR 0007).

### Générateur aléatoire

- Le moteur de règles **n'importe jamais `node:crypto`** : il tourne aussi dans le navigateur (ADR 0007). Il reçoit un générateur injecté, par exemple `Rng { nextInt(min, max) }`, bornes incluses.
- L'**API** lui passe un générateur cryptographique (`crypto.randomInt`).
- Les **tests** lui passent un générateur à graine, pour obtenir des jets reproductibles.

### Probabilités

`getDiceProbabilities` renvoie la distribution **exacte** des totaux : `min`, `max`, `mean` et `distribution` (tableau de `{ total, probability }` trié par total).

- Le nombre de totaux possibles (`max − min + 1`) est **connu dès l'analyse**, avant tout calcul. Au-delà de 2 000, la réponse est `too_complex_for_probabilities`, sans rien calculer.
- Les termes avec `kh`, `kl`, `!` ou `r` sont limités à 20 dés au total, pour la même raison.
- Le calcul se fait par convolution des distributions de chaque terme, sans énumérer toutes les combinaisons de dés.
- La somme des probabilités vaut 1, à 10⁻⁹ près. Chaque total entier entre `min` et `max` est renvoyé dans l'ordre croissant.
- Le web calcule les probabilités localement avec le moteur de règles ; la route sert surtout au mobile, qui attend 300 ms sans frappe avant de l'appeler.

## Visibilité

| Visibilité | Qui peut la choisir | Lanceur     | MJ  | Autres joueurs |
| ---------- | ------------------- | ----------- | --- | -------------- |
| `public`   | joueur ou MJ        | oui         | oui | oui            |
| `private`  | joueur uniquement   | oui         | oui | non            |
| `hidden`   | MJ uniquement       | oui (le MJ) | oui | non            |

- Un joueur qui demande `hidden` reçoit un 403 `hidden_roll_gm_only` : il est membre, mais n'a pas le droit.
- Le MJ qui demande `private` reçoit un 400 `private_roll_player_only` : pour lui, `private` reviendrait à `hidden`, et deux valeurs pour le même sens créeraient de la confusion. C'est un 400 et non un 403, car il a le droit de faire un jet secret.
- Un **jet personnel** (sans campagne) est toujours `private` : seul le lanceur le voit. `visibility` peut être omise ou valoir `private` ; `public` et `hidden` donnent un 400 `visibility_requires_campaign`. Il n'est pas enregistré, et son `id` vaut `null`.
- En WebSocket, l'événement `roll.created` d'un jet `public` part sur les deux canaux ; un jet `private` part sur le canal MJ et vers le lanceur seulement ; un jet `hidden` part sur le canal MJ seulement.
- L'API n'envoie **aucun numéro de jet séquentiel** : un trou dans la suite révélerait un jet caché aux joueurs. Le front du MJ numérote les jets à l'affichage s'il le souhaite.

## Tests attendus

**Moteur de règles** (P1-11)

- Avec un générateur à graine : le détail de chaque dé (`kept`, `rerolledFrom`, `fromExplosion`) pour chaque modificateur, et l'ordre relances, explosions, dés gardés.
- `1d2!` s'arrête avec `capped: true`.
- `too_many_dice` (3 termes de 100 dés), `duplicate_modifier` (`4d6kh3kl1`), `incompatible_modifiers` (`4d6!kh3`) ; un dé issu d'une explosion n'est jamais relancé ; `1d20r1` avec avantage donne `2d20r1kh1`.
- Chaque code d'erreur, avec sa `position` et sa `length`, y compris avec des espaces et des caractères hors ASCII avant l'erreur.
- Non-régression ReDoS : une expression de 100 caractères est analysée en moins d'une milliseconde.
- La somme de `distribution` vaut 1, à 10⁻⁹ près ; `min`, `max` et `mean` sont exacts pour des cas connus (`2d6` : 2, 12, 7).

**API** (P2-08)

- `listCampaignRolls` vu par un joueur ne contient aucun jet `private` d'un autre joueur ni aucun jet `hidden`, et chaque page contient bien `limit` éléments si assez de jets visibles existent.
- `getRoll` sur un jet caché ou privé d'un autre renvoie 404, et non 403.
- Visibilités : `hidden` par un joueur → 403 `hidden_roll_gm_only` ; `private` par le MJ → 400 `private_roll_player_only` ; `public` ou `hidden` sans campagne → 400 `visibility_requires_campaign`.
- Les trois cas de diffusion WebSocket de `roll.created`.

## Références

- [ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité](../ADR/0007-web-depend-rules-engine.md)
- [ADR 0008 - Contrat d'API écrit en premier](../ADR/0008-contrat-api.md)
- RFC 9457, Problem Details for HTTP APIs : https://www.rfc-editor.org/rfc/rfc9457
- OWASP, Regular expression Denial of Service (ReDoS) : https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
