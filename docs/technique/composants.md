# Composants de l'application web

Cette page décrit les composants de la charte graphique (`docs/charte-graphique.pdf`, page 2) : le bouton, le champ de texte et le pion. Elle s'adresse à toute personne qui écrit un écran.

**La règle** : un écran n'écrit jamais son propre bouton, son propre champ ni son propre pion. Il utilise ces composants, qui portent une fois pour toutes l'accessibilité (WCAG 2.2 AA) et les couleurs de la charte.

## Les fichiers

| Fichier                                         | Contenu                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/Button.tsx`            | Le bouton.                                                                                              |
| `apps/web/src/components/TextField.tsx`         | Le champ de texte.                                                                                      |
| `apps/web/src/components/Token.tsx`             | Le pion.                                                                                                |
| `apps/web/src/components/tokenLabels.ts`        | Les types du pion, ses initiales et son nom accessible, sans React.                                     |
| `apps/web/src/viewModels/fieldErrorMessages.ts` | La traduction d'un code d'erreur de l'API en message (`describeFieldError`).                            |
| `apps/web/src/theme/components.css`             | Les styles des trois composants, uniquement à partir des variables de la charte ([theme.md](theme.md)). |

Les composants ne dépendent ni du Model ni des ViewModels : ils reçoivent tout par leurs props. Une View les utilise, et c'est son ViewModel qui prépare leurs valeurs (le message d'erreur traduit, l'état de santé d'une créature).

## Le bouton

```tsx
<Button onClick={save}>Enregistrer</Button>
<Button variant="secondary" onClick={cancel}>Annuler</Button>
<Button type="submit" isLoading={isSending}>Se connecter</Button>
<Button icon={Trash2} label="Supprimer le pion" onClick={remove} />
<Button variant="secondary" pressed={isOn} onClick={toggle}>Palette table de jeu</Button>
```

| Prop        | Rôle                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `variant`   | `primary` (par défaut, l'action principale, fond accent) ou `secondary` (fond `bg/raised`, bordure). |
| `isLoading` | L'action est en cours : annoncée, les clics sont ignorés, mais le bouton **reste focalisable**.      |
| `pressed`   | Bouton bascule : état dans `aria-pressed`, montré par le fond accent et une coche.                   |
| `icon`      | Une icône Lucide (ADR 0012), décorative, placée avant le texte.                                      |
| `label`     | Le nom accessible d'un bouton **icône seule**. Obligatoire dans ce cas, interdit sinon.              |
| `disabled`  | Le bouton natif désactivé : rien ne se déclenche, et la touche Tab le saute.                         |

- C'est toujours un vrai `<button>`, jamais une `div` cliquable. Il vaut `type="button"` par défaut : un bouton posé dans un formulaire ne l'envoie pas par accident. Pour envoyer, `type="submit"`.
- **Un bouton icône seule sans `label` ne compile pas** : le typage rend le nom accessible obligatoire (WCAG 4.1.2). Un bouton avec texte ne peut pas prendre de `label`, qui remplacerait son texte pour les lecteurs d'écran (WCAG 2.5.3).
- **En cours plutôt que désactivé** : `disabled` retire le bouton de la navigation au clavier, et le focus serait perdu au milieu de l'envoi. `isLoading` pose `aria-busy` et `aria-disabled`, ignore les clics et empêche l'envoi du formulaire, sans retirer le focus. Le message « Chargement en cours » est annoncé par une région `role="status"`, présente dès que le bouton reçoit la prop `isLoading` : une région ajoutée en même temps que son texte n'est pas toujours annoncée.
- **Taille** : au moins 44 × 44 px (`--target-min-size`), au-delà du minimum de 24 px de WCAG 2.5.8, comme le demande la charte pour le web.
- **Pressé** : un bouton avec texte affiche une coche en plus du fond accent, pour que l'état ne repose pas sur la couleur seule (WCAG 1.4.1). Un bouton icône seule garde son icône ; son état passe par le fond et `aria-pressed`.
- L'icône qui tourne pendant le chargement s'arrête avec `prefers-reduced-motion` (règle globale de `base.css`).

## Le champ de texte

```tsx
<TextField
  label="Adresse e-mail"
  type="email"
  autoComplete="email"
  required
  value={email}
  onChange={setEmail}
  error={emailError}
/>
```

| Prop       | Rôle                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `label`    | Le libellé, toujours visible et relié au champ (WCAG 1.3.1 et 3.3.2).                                     |
| `value`    | La valeur, tenue par le ViewModel.                                                                        |
| `onChange` | Reçoit la nouvelle valeur (une chaîne), pas l'événement.                                                  |
| `type`     | `text` (par défaut), `email`, `password`, `search`, `tel` ou `url`.                                       |
| `required` | Pose l'attribut `required`, annoncé par les lecteurs d'écran, et écrit « (obligatoire) » dans le libellé. |
| `help`     | Une aide sous le champ, dans sa description accessible.                                                   |
| `error`    | Le message d'erreur, **déjà traduit** par le ViewModel. `null` ou absent : pas d'erreur.                  |

Les autres attributs d'un `<input>` passent tels quels, en particulier `autoComplete`, obligatoire sur les données personnelles (WCAG 1.3.5 : `email`, `username`, `current-password`, `new-password`).

- **Pas de placeholder** : le typage le refuse. Un placeholder disparaît dès qu'on tape et son contraste est faible : une indication va dans `help`, toujours visible.
- L'aide et l'erreur sont reliées au champ par `aria-describedby` ; en erreur, le champ porte `aria-invalid="true"`.
- **L'erreur ne passe pas par la couleur seule** (WCAG 1.4.1) : une icône, un texte, et une bordure plus épaisse.
- « (obligatoire) » est masqué aux lecteurs d'écran, qui annoncent déjà l'attribut `required` : il n'est pas lu deux fois.
- Chaque champ a ses propres identifiants (`useId`) : plusieurs champs sur une page ne se mélangent pas leurs descriptions.
- **Le focus après l'envoi est l'affaire de l'écran** : un message d'erreur qui apparaît n'est pas annoncé de lui-même. Quand l'envoi échoue, l'écran déplace le focus sur le premier champ en erreur, dont la description est alors lue (WCAG 3.3.1).

### Les messages d'erreur

L'API ne renvoie jamais de phrase, seulement un code et ses paramètres (`FieldError`, ADR 0008). Le ViewModel traduit le code avec `describeFieldError` :

| Code                | Message                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `required`          | Ce champ est obligatoire.                                                                               |
| `too_short`         | Au moins _min_ caractères. (sans `min` : Valeur trop courte.)                                           |
| `too_long`          | Au plus _max_ caractères. (sans `max` : Valeur trop longue.)                                            |
| `already_taken`     | Ce pseudo est déjà utilisé. / Cette adresse e-mail est déjà utilisée. / Cette valeur est déjà utilisée. |
| `password_required` | Saisissez votre mot de passe actuel.                                                                    |
| autre code          | Valeur invalide.                                                                                        |

- Un code inconnu donne un message générique, **jamais le code lui-même** ni un texte venu de l'API.
- `required` sert aussi aux vérifications faites par le ViewModel avant l'envoi : le même code donne le même message, que l'erreur vienne de l'écran ou de l'API.
- Le contrat ne fixe pas encore la liste complète des codes : quand une route en documente un nouveau, on l'ajoute ici, dans `fieldErrorMessages.ts` et dans son test.

## Le pion

```tsx
<Token kind="character" name="Thorin" side="ally" hitPoints={{ current: 20, max: 34 }} />
<Token kind="creature" name="Ogre" side="enemy" healthState="wounded" selected={isSelected} onSelect={select} />
```

| Prop          | Rôle                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `kind`        | `character` (un personnage) ou `creature` (un monstre, un PNJ).                                  |
| `name`        | Le nom complet : les initiales en sont tirées, et il commence le nom accessible.                 |
| `side`        | `ally` (rond) ou `enemy` (carré).                                                                |
| `hitPoints`   | Personnage seulement : `{ current, max }`.                                                       |
| `healthState` | Créature seulement : `unharmed`, `wounded` ou `down`, les valeurs de `HealthState` du contrat.   |
| `selected`    | Le pion est sélectionné : second anneau, et état annoncé.                                        |
| `onSelect`    | Rend le pion sélectionnable : c'est alors un bouton, au clavier (Entrée, Espace) et à la souris. |

- **Le camp se lit à la forme**, pas seulement à la couleur : rond pour un allié, carré pour un ennemi (règle de la charte, WCAG 1.4.1).
- **Nom accessible complet** : « Thorin, allié, 20 PV sur 34 », « Ogre, ennemi, blessé ». Les initiales affichées sont masquées aux lecteurs d'écran.
- **Une créature n'a jamais de PV** : le typage refuse `hitPoints` sur une créature. La vue joueurs ne reçoit que son état approximatif (projection par spectateur), et le pion ne peut donc pas en afficher davantage, même par erreur. Le test vérifie aussi que le type des états reste celui du contrat.
- **Initiales** : les deux premières lettres d'un nom d'un seul mot (« Ogre » → OG), sinon la première lettre du premier et du dernier mot (« Arwen du Nord » → AN).
- **Sélection** : avec `onSelect`, le pion est un `<button>` qui porte `aria-pressed`. Sans `onSelect`, c'est une image (`role="img"`) qui n'est pas focalisable ; s'il est sélectionné, « sélectionné » est ajouté à son nom.
- **Le second anneau** de la sélection est en `text/primary`, au-delà de l'anneau de focus : un pion à la fois focalisé et sélectionné montre les deux.
- Contrastes : `text/on-accent` sur `team/ally` (6,12:1 en clair, 8,76:1 en table de jeu) et sur `team/enemy` (6,54:1 et 7,95:1).

## Tests

| Fichier                                | Ce qui est vérifié                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tests/Button.test.tsx`            | `type="button"`, variantes, clic, Entrée et Espace, désactivé ignoré et sauté par Tab, chargement (annonce, clics ignorés, focus gardé, formulaire non envoyé), icône seule, bascule. |
| `src/tests/TextField.test.tsx`         | Libellé relié, champ obligatoire, aide et erreur dans la description, `aria-invalid`, icône d'erreur, identifiants distincts, saisie, `autoComplete`.                                 |
| `src/tests/Token.test.tsx`             | Initiales, noms accessibles, aucun PV pour une créature, états du contrat, forme selon le camp, sélection au clavier.                                                                 |
| `src/tests/fieldErrorMessages.test.ts` | Chaque code, ses paramètres, et un code inconnu qui ne montre rien de l'API.                                                                                                          |
| `src/tests/themeTokens.test.ts`        | Les styles : taille minimale, variantes, champ en erreur, forme des pions, aucune couleur en dur.                                                                                     |

- Chaque composant passe **axe dans chaque variante et chaque état, dans les deux palettes** (`src/tests/axeHelpers.ts`). jsdom ne calcule aucun rendu : axe y vérifie la structure et les noms, pas les contrastes, qui sont vérifiés depuis les variables et dans un navigateur (#77).
- Les règles de typage (bouton icône sans `label`, champ avec placeholder, créature avec des PV) sont vérifiées par des `@ts-expect-error` : si une règle saute, `pnpm typecheck` échoue.

## Limites connues

- **L'état désactivé** n'est pas défini par la charte : il est rendu par une opacité réduite. À valider et à ajouter à la charte.
- **Le badge d'état** (Indemne, Blessé, Gravement blessé, À terre) et la **case à cocher** de la charte ne sont pas encore des composants. Le contrat ne connaît d'ailleurs que trois états (`unharmed`, `wounded`, `down`) : « Gravement blessé » de la charte n'a pas d'équivalent.
- **Le champ** ne couvre que les saisies d'une ligne : pas encore de zone de texte ni de liste déroulante.
