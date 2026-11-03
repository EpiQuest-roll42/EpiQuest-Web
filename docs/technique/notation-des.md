# Notation des dés

Le rules-engine sépare l'analyse de l'expression du tirage : `parse(expression)`
produit un arbre syntaxique ou une erreur déterministe. Le parsing ne lance aucun
dé et ne dépend d'aucune API Node.js.

## Grammaire

La notation est insensible à la casse. Les espaces sont autorisés entre les
termes et les modificateurs, mais pas à l'intérieur d'un jet ou d'un modificateur.
Les parenthèses ne sont pas prises en charge.

```text
expression   = [signe] terme { espace* signe espace* terme }
signe        = "+" | "-"
terme        = entier | jet
jet          = [nombre-de-dés] "d" faces { espace* modificateur }
modificateur = conservation | explosion | relance | avantage
conservation = "kh" entier | "kl" entier
explosion    = "!"
relance      = "r" comparateur entier
comparateur  = "<" | "<=" | "=" | ">" | ">="
avantage     = "adv" | "advantage" | "dis" | "disadvantage"
```

Les entiers sont écrits en base 10. Le nombre de dés omis vaut 1 (`d20` est
équivalent à `1d20`). Les limites acceptées sont de 1 à 100 dés par jet et de 1
à 1 000 faces par dé. Une conservation (`khN` ou `klN`) doit conserver entre 1
et le nombre de dés du jet. Le seuil d'une relance doit être compris entre 1 et
le nombre de faces.

## Modificateurs

- `khN` conserve les `N` résultats les plus élevés ; `klN` conserve les plus
  faibles.
- `!` indique qu'un résultat maximum fait exploser le dé.
- `r<3`, `r<=3`, `r=1`, `r>3` et `r>=3` indiquent le seuil de relance.
- `d20 adv` (ou `d20 advantage`) représente l'avantage ; `d20 dis` (ou
  `d20 disadvantage`) représente le désavantage. Ces formes ne s'appliquent
  qu'à un seul d20 et ne se combinent pas à d'autres modificateurs.

Un groupe de dés accepte au plus un modificateur de conservation, un
modificateur explosif et un modificateur de relance. La syntaxe conserve l'ordre
dans lequel ces modificateurs sont écrits. Les expressions composées combinent
des termes avec `+` et `-`, par exemple `2d6 + d4 - 3`.

## Erreurs de parsing

En cas d'erreur, `parse` renvoie un code stable, un message en français et
`position`, l'index à base zéro du premier caractère concerné dans l'expression.
L'index suit les positions de chaînes JavaScript (unités de code UTF-16). Cette
erreur peut être affichée par un client sans effectuer de tirage.

## Exemples

| Expression    | Signification syntaxique                                       |
| ------------- | -------------------------------------------------------------- |
| `2d6+3`       | Deux dés à six faces et un modificateur constant positif       |
| `4d6kh3`      | Quatre dés à six faces, avec conservation des trois plus hauts |
| `d20 adv + 5` | Un jet avec avantage, puis un bonus de cinq                    |
| `2d6!r<2`     | Deux dés à six faces, avec explosion et seuil de relance       |

Le générateur aléatoire et l'exécution des modificateurs relèvent de `roll` et
ne font pas partie du parsing.
