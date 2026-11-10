# Thème de l'application web

Cette page explique comment l'application web reprend la charte graphique (`docs/charte-graphique.pdf` et le fichier Figma) : couleurs, polices, tailles, focus et animations. Elle s'adresse à toute personne qui écrit un écran ou un composant.

**La règle** : une couleur, une taille ou une police vient **toujours** d'une variable de la charte. Aucune valeur n'est écrite en dur dans un composant, et aucune couleur n'est ajoutée au code sans être d'abord ajoutée à la charte : les contrastes vérifiés dans la charte ne restent vrais que si le code utilise les mêmes couleurs.

## Les fichiers

| Fichier                         | Contenu                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web/src/theme/tokens.css` | Les variables : les deux palettes, la typographie, les espacements, le focus, l'animation. |
| `apps/web/src/theme/fonts.css`  | Les polices, hébergées par l'application.                                                  |
| `apps/web/src/theme/base.css`   | Les styles globaux : texte, titres, liens, focus, lien d'évitement, navigation.            |
| `apps/web/src/index.css`        | Importe les trois fichiers ci-dessus, dans cet ordre.                                      |

Les variables portent le nom de la charte, la barre oblique devenant un tiret : `bg/app` dans Figma devient `--bg-app` en CSS.

## Les deux palettes

| Palette          | Usage                                | Activation                                                                                                           |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Claire**       | Préparation, sur le web et le mobile | Par défaut                                                                                                           |
| **Table de jeu** | Partie, vue joueurs sur télé         | `data-theme="table"` sur `<html>`, ou au premier lancement si le système est en mode sombre (`prefers-color-scheme`) |

- `data-theme="clair"` force la palette claire, même si le système est en mode sombre : c'est le choix de l'utilisateur qui l'emporte sur celui du système.
- La palette « table de jeu » apparaît deux fois dans `tokens.css` (dans le `@media` et sous `[data-theme='table']`), parce que le CSS ne permet pas de réunir les deux conditions. Le test vérifie que les deux blocs restent identiques.
- La palette du premier lancement est appliquée **par le CSS seul** : la page ne s'affiche jamais en clair avant de basculer en sombre.
- Les deux palettes ont les **mêmes noms de variables** : un composant écrit `var(--text-primary)` et s'affiche correctement dans les deux.

### Les couleurs

| Variable           | Claire             | Table de jeu       | Usage                                             |
| ------------------ | ------------------ | ------------------ | ------------------------------------------------- |
| `--bg-app`         | `#F4ECDD`          | `#1C1611`          | Fond de l'application                             |
| `--bg-surface`     | `#FBF7EE`          | `#2A221B`          | Carte, panneau                                    |
| `--bg-raised`      | `#EADFC9`          | `#3A3027`          | Élément surélevé (menu, survol)                   |
| `--bg-fog`         | `#3B3228`          | `#3B3228`          | Brouillard de guerre sur la carte                 |
| `--border-default` | `#8E7B5A`          | `#9C8A6A`          | Bordures                                          |
| `--text-primary`   | `#2B1D14`          | `#F4ECDD`          | Texte principal                                   |
| `--text-muted`     | `#6B5A48`          | `#CDBFA6`          | Texte secondaire                                  |
| `--text-on-accent` | `#FFFFFF`          | `#1C1611`          | Texte posé sur une couleur pleine (bouton, badge) |
| `--accent-default` | `#9B1C1C`          | `#F2938A`          | Action principale, liens                          |
| `--focus-ring`     | `#1D5FBF`          | `#A9CBFF`          | Anneau de focus                                   |
| `--state-success`  | `#256B42`          | `#7FD1A0`          | Réussite                                          |
| `--state-warning`  | `#875800`          | `#F0BE5E`          | Avertissement                                     |
| `--state-danger`   | `#B3261E`          | `#F2938A`          | Erreur, danger                                    |
| `--team-ally`      | `#2B63A5`          | `#8DB8F2`          | Camp allié                                        |
| `--team-enemy`     | = `--state-danger` | = `--state-danger` | Camp ennemi                                       |
| `--brand-flame`    | `#D9922E`          | `#D9922E`          | Flamme du logo : **décorative, jamais du texte**  |

## Les couples autorisés

**Un texte n'utilise qu'un couple marqué « Texte » de ce tableau.** Une bordure, une icône, un anneau de focus ou le logo utilise un couple « Texte » ou « Graphique ». « Non » est interdit.

- **Texte** : contraste d'au moins 4,5:1 (WCAG 1.4.3).
- **Graphique** : au moins 3:1, pour les bordures, icônes, anneaux de focus et le logo (WCAG 1.4.11).
- La dernière colonne donne le contraste de `--text-on-accent` posé sur la couleur utilisée en remplissage (un bouton `--accent-default` avec son texte, par exemple).

Ces chiffres sont ceux de la charte, page 2. Le test `apps/web/src/tests/themeTokens.test.ts` les recalcule à partir de `tokens.css` et échoue si un seul s'en écarte de plus de 0,01 : une couleur mal recopiée est détectée, même si son contraste reste suffisant.

### Palette claire

| Couleur \ fond     | `--bg-app`     | `--bg-surface` | `--bg-raised`  | `--bg-fog`     | `--text-on-accent` dessus |
| ------------------ | -------------- | -------------- | -------------- | -------------- | ------------------------- |
| `--text-primary`   | Texte 13,88    | Texte 15,24    | Texte 12,34    | Non 1,30       | -                         |
| `--text-muted`     | Texte 5,62     | Texte 6,17     | Texte 5,00     | Non 1,90       | -                         |
| `--accent-default` | Texte 6,94     | Texte 7,62     | Texte 6,17     | Non 1,54       | Texte 8,15                |
| `--state-success`  | Texte 5,49     | Texte 6,02     | Texte 4,88     | Non 1,95       | Texte 6,44                |
| `--state-warning`  | Texte 5,22     | Texte 5,73     | Texte 4,64     | Non 2,05       | Texte 6,13                |
| `--state-danger`   | Texte 5,57     | Texte 6,11     | Texte 4,95     | Non 1,92       | Texte 6,54                |
| `--team-ally`      | Texte 5,21     | Texte 5,72     | Texte 4,63     | Non 2,05       | Texte 6,12                |
| `--focus-ring`     | Graphique 5,20 | Graphique 5,71 | Graphique 4,62 | Non 2,06       | -                         |
| `--border-default` | Graphique 3,49 | Graphique 3,83 | Graphique 3,10 | Graphique 3,07 | -                         |
| `--brand-flame`    | Non 2,21       | Non 2,42       | Non 1,96       | Graphique 4,84 | -                         |

En palette claire, **rien ne s'écrit sur `--bg-fog`** : le brouillard ne porte pas de texte.

### Palette table de jeu

| Couleur \ fond     | `--bg-app`      | `--bg-surface` | `--bg-raised`  | `--bg-fog`     | `--text-on-accent` dessus |
| ------------------ | --------------- | -------------- | -------------- | -------------- | ------------------------- |
| `--text-primary`   | Texte 15,26     | Texte 13,32    | Texte 10,96    | Texte 10,69    | -                         |
| `--text-muted`     | Texte 9,89      | Texte 8,64     | Texte 7,11     | Texte 6,93     | -                         |
| `--accent-default` | Texte 7,95      | Texte 6,94     | Texte 5,71     | Texte 5,57     | Texte 7,95                |
| `--state-success`  | Texte 9,84      | Texte 8,58     | Texte 7,07     | Texte 6,89     | Texte 9,84                |
| `--state-warning`  | Texte 10,43     | Texte 9,11     | Texte 7,50     | Texte 7,31     | Texte 10,43               |
| `--state-danger`   | Texte 7,95      | Texte 6,94     | Texte 5,71     | Texte 5,57     | Texte 7,95                |
| `--team-ally`      | Texte 8,76      | Texte 7,65     | Texte 6,29     | Texte 6,14     | Texte 8,76                |
| `--focus-ring`     | Graphique 10,81 | Graphique 9,44 | Graphique 7,77 | Graphique 7,58 | -                         |
| `--border-default` | Graphique 5,34  | Graphique 4,66 | Graphique 3,83 | Graphique 3,74 | -                         |
| `--brand-flame`    | Graphique 6,91  | Graphique 6,03 | Graphique 4,96 | Graphique 4,84 | -                         |

`--team-enemy` vaut `--state-danger` : mêmes couples. La couleur ne suffit jamais à distinguer les camps (WCAG 1.4.1) : rond pour un allié, carré pour un ennemi, et le camp écrit dans le nom accessible (« Ogre, ennemi »).

## La typographie

| Variable              | Valeur      | Charte                               |
| --------------------- | ----------- | ------------------------------------ |
| `--font-heading`      | Lora        | Titres                               |
| `--font-body`         | Inter       | Texte et interface                   |
| `--font-size-h1`      | `2rem`      | Titre 1 · 32 · Bold                  |
| `--font-size-h2`      | `1.5rem`    | Titre 2 · 24 · Semi Bold             |
| `--font-size-body`    | `1rem`      | Corps · 16 · Regular, interligne 1,5 |
| `--font-size-caption` | `0.8125rem` | Légende · 13 · Medium                |

- **Cinzel** est réservée au logo, qui est un dessin vectoriel : elle n'est pas chargée par l'application.
- **Les tailles sont en `rem`** : elles suivent la taille de texte choisie dans le navigateur, et le zoom à 200 % fonctionne sans perte (WCAG 1.4.4). Le test refuse une taille de texte ou un espacement en `px`.
- **Les polices sont hébergées par l'application** (paquets `@fontsource-variable/inter` et `@fontsource-variable/lora`), jamais chargées depuis Google Fonts : aucune requête vers un tiers (RGPD), et l'application fonctionne hors ligne. Le test refuse toute adresse `http` dans les fichiers du thème. Licence SIL Open Font License 1.1 : voir `THIRD_PARTY_NOTICES.md`.

### L'échelle « table de jeu »

Sur l'écran partagé, la charte multiplie la typographie par 1,5 : texte d'au moins 20 px, noms à 24 px, résultat d'un jet à 64 px. Elle s'active avec `data-text-scale="table"` sur l'élément qui contient la vue, **indépendamment de la palette** : un MJ qui prépare sa partie en palette sombre sur son ordinateur n'a pas besoin de texte agrandi.

| Variable                  | Normal      | Table de jeu |
| ------------------------- | ----------- | ------------ |
| `--font-size-h1`          | `2rem`      | `3rem`       |
| `--font-size-h2`          | `1.5rem`    | `2.25rem`    |
| `--font-size-body`        | `1rem`      | `1.5rem`     |
| `--font-size-caption`     | `0.8125rem` | `1.25rem`    |
| `--font-size-name`        | `1rem`      | `1.5rem`     |
| `--font-size-roll-result` | -           | `4rem`       |

La légende passe à 20 px, et non à 19,5 px (13 × 1,5), pour respecter le minimum de 20 px de la charte.

## Espacements, rayons et cibles

| Variable                                              | Valeur                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `--space-1` à `--space-7`                             | `0.25`, `0.5`, `0.75`, `1`, `1.5`, `2`, `3rem`                    |
| `--radius-small`, `--radius-medium`, `--radius-round` | `0.25rem`, `0.5rem`, `999px`                                      |
| `--target-min-size`                                   | `2.75rem` (44 px, taille minimale d'une cible sur le web, charte) |

**Les espacements et les rayons ne figurent pas encore dans la charte** : ces valeurs sont une proposition, à valider en équipe et à reporter dans les variables Figma, pour que les maquettes et le code restent alignés.

## Le focus

Tout élément qui reçoit le focus au clavier affiche, comme dans la charte, un espace de 2 px couleur `--bg-app` puis un anneau de 3 px couleur `--focus-ring` (`:focus-visible` dans `base.css`). L'anneau est un couple « Graphique » sur tous les fonds, sauf `--bg-fog` en palette claire.

Un titre ou le `main` qui reçoivent le focus par le code (`tabIndex={-1}`, après une navigation) n'affichent pas d'anneau quand l'utilisateur navigue à la souris.

## Les animations

- `--duration-animation` donne la durée des animations, dont celles des dés. Un composant écrit `transition-duration: var(--duration-animation)` plutôt qu'une durée en dur.
- Quand l'utilisateur demande moins d'animations (`prefers-reduced-motion: reduce`), elle passe à `0s` : les animations de dés sont alors désactivées, comme l'exige le sujet. `base.css` coupe aussi les animations et transitions de toute la page, y compris celles des bibliothèques.
- Une animation ne porte jamais seule une information : le résultat d'un jet est aussi écrit, et annoncé aux lecteurs d'écran.

## Ajouter une couleur ou une variable

1. L'ajouter **d'abord à la charte** (Figma), avec ses contrastes vérifiés sur chaque fond, dans les deux palettes.
2. La reporter dans `tokens.css`, dans **les trois blocs** de palette (clair, `@media` sombre, `[data-theme='table']`).
3. Ajouter sa ligne au tableau des couples, dans cette page et dans le test.
4. Lancer `pnpm --filter @lanterne/web test` : le test vérifie les noms, les blocs identiques et chaque ratio.

## Limites connues

- **Le choix de palette** (stockage du choix, bouton) n'est pas encore branché : `data-theme` n'est posé par aucun code. Aujourd'hui, seule la préférence du système s'applique.
- **La vue joueurs** n'utilise pas encore `data-theme="table"` ni `data-text-scale="table"`.
- **Les contrastes réels à l'écran** (texte sur image, carte, pions) ne sont pas vérifiés par ce test, qui ne lit que les variables : ils se vérifient dans un navigateur (#77).

## Références

- Charte graphique : `docs/charte-graphique.pdf`
- [ADR 0012 - Lucide pour les icônes](../ADR/0012-icones-lucide.md)
- [Architecture de l'application web](architecture-web.md)
- WCAG 2.2 : https://www.w3.org/TR/WCAG22/ (1.4.1, 1.4.3, 1.4.4, 1.4.11, 2.3.3, 2.4.7)
- Fontsource : https://fontsource.org
