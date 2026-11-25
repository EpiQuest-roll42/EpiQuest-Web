# Accessibilité de l'application web

Ce dossier rassemble les vérifications d'accessibilité de Lanterne : ce qui est contrôlé automatiquement, ce qui l'est à la main, les résultats et les limites connues. C'est le début de l'**audit** et de la **déclaration d'accessibilité** demandés par le sujet (bloc 03-A), complétés à la fin du projet (P3-18, #56).

- **Référentiel** : WCAG 2.2, niveau AA.
- **Périmètre de ce premier état** : l'application web de la phase 1 (#14), c'est-à-dire les routes de #74, le thème de #75 et les composants de #76, sur données simulées.
- **Date** : 2026-11-18.

## 1. Vérifications automatiques

Elles sont lancées par `pnpm test`, donc à chaque pull request par la CI : une régression fait échouer la PR.

| Vérification                                                                                                                                                                    | Où                                                            | Résultat |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| axe sans erreur sur **chaque route** (connexion, inscription, campagnes, vue MJ, rejoindre, vue joueurs, page introuvable), repères compris, dans les deux palettes             | `apps/web/src/tests/accessibility.test.tsx`                   | ✅       |
| axe sans erreur sur **chaque composant** (bouton, champ, pion), dans chaque variante et chaque état, dans les deux palettes                                                     | `Button.test.tsx`, `TextField.test.tsx`, `Token.test.tsx`     | ✅       |
| Ordre de tabulation égal à l'ordre de la page, dans les deux sens, sans piège au clavier (WCAG 2.4.3 et 2.1.2)                                                                  | `accessibility.test.tsx`                                      | ✅       |
| Aucun `tabindex` positif, qui imposerait un ordre différent de celui de la page                                                                                                 | `accessibility.test.tsx`                                      | ✅       |
| Focus visible : anneau de la charte (espace de 2 px en `bg/app`, puis anneau de 3 px en `focus/ring`) sur tout élément focalisé (WCAG 2.4.7)                                    | `themeTokens.test.ts`                                         | ✅       |
| L'anneau n'est retiré que d'un élément focalisé par le code puis cliqué à la souris (titre après une navigation)                                                                | `themeTokens.test.ts`                                         | ✅       |
| Aucun élément collant ou fixe qui pourrait cacher l'élément focalisé (WCAG 2.4.11)                                                                                              | `themeTokens.test.ts`                                         | ✅       |
| Les 104 ratios de contraste de la charte, recalculés depuis les variables CSS, dans les deux palettes ; l'anneau de focus à au moins 3:1 sur chaque fond (WCAG 1.4.3 et 1.4.11) | `themeTokens.test.ts`                                         | ✅       |
| Tailles de texte en `rem`, pour que le zoom du texte fonctionne (WCAG 1.4.4)                                                                                                    | `themeTokens.test.ts`                                         | ✅       |
| Cibles d'au moins 44 px pour les boutons, les champs et les pions (WCAG 2.5.8, règle de la charte)                                                                              | `themeTokens.test.ts`                                         | ✅       |
| Durée d'animation nulle avec `prefers-reduced-motion`                                                                                                                           | `themeTokens.test.ts`                                         | ✅       |
| Titre d'onglet par page (WCAG 2.4.2), focus sur le titre après une navigation, lien d'évitement (WCAG 2.4.1)                                                                    | `routes.test.tsx`, `documentTitle.test.tsx`                   | ✅       |
| Camp d'un pion lu à la forme, pas à la seule couleur ; erreur d'un champ portée par une icône et un texte (WCAG 1.4.1)                                                          | `Token.test.tsx`, `TextField.test.tsx`, `themeTokens.test.ts` | ✅       |
| Nom accessible obligatoire pour un bouton icône seule ; aucun PV pour une créature (projection par spectateur)                                                                  | `Button.test.tsx`, `Token.test.tsx` (vérifié par le typage)   | ✅       |

**Ce que ces tests ne voient pas.** Ils tournent dans jsdom, qui ne calcule aucun rendu : axe y vérifie la structure, les rôles et les noms, mais **pas les contrastes affichés**, ni la mise en page au zoom. Les contrastes sont vérifiés à partir des variables de la charte, ce qui suffit tant que chaque couleur vient d'une variable (règle vérifiée aussi par le test). Le reste se vérifie à la main (section 2).

## 2. Vérifications manuelles

À refaire avant chaque version (`v0.1.0`, `v0.2.0`, `v1.0.0`), et après tout changement de mise en page important. Lancer l'application avec `pnpm --filter @lanterne/web dev` (données simulées).

### 2.1 Clavier et focus, dans un navigateur

1. Sur chaque page, parcourir la page avec Tab, puis Maj+Tab, **sans souris**.
2. Vérifier que le focus est **toujours visible** et jamais caché, en palette claire puis en palette « table de jeu » (bouton « Palette table de jeu »).
3. Vérifier que le lien « Aller au contenu » apparaît au premier Tab et mène au contenu.
4. Activer chaque bouton avec Entrée et avec Espace.

### 2.2 Zoom à 200 % et largeur de 320 px (WCAG 1.4.4 et 1.4.10)

1. Zoom du navigateur à 200 % (Ctrl et +) : aucun texte ne doit être coupé, masqué ou superposé.
2. Outils de développement, mode responsive, largeur de **320 px** : aucun défilement horizontal. Pour le vérifier, taper dans la console :
   `document.documentElement.scrollWidth <= window.innerWidth` (doit afficher `true`).
3. Firefox, zoom du texte seul (Affichage > Zoom > Zoom texte seulement), à 200 % : le texte grandit, rien ne se chevauche.

### 2.3 Lecteur d'écran (NVDA ou Orca)

Parcours court : **connexion, puis liste des campagnes**. NVDA avec Firefox sous Windows, ou Orca avec Firefox sous Linux.

1. Ouvrir `/connexion` : le titre de l'onglet et le titre « Connexion » sont annoncés.
2. Parcourir la page avec Tab : chaque élément est annoncé avec son nom et son rôle (« Palette table de jeu, bouton bascule, non enfoncé »).
3. Activer le bouton de palette : son nouvel état est annoncé.
4. Aller sur « Mes campagnes » par la navigation : le nouveau titre est annoncé, puis le statut « N campagnes chargées ».
5. Parcourir la liste avec les touches de navigation du lecteur (titres, listes) : chaque campagne est lue avec son nom, son rôle et son nombre de joueurs.

> L'écran de connexion n'a pas encore de formulaire (#16) : le parcours sera à refaire avec les champs, l'envoi et les erreurs.

### 2.4 Résultats

| Date | Qui | Navigateur et outil | Vérification         | Résultat  | Remarques |
| ---- | --- | ------------------- | -------------------- | --------- | --------- |
|      |     |                     | 2.1 Clavier et focus | _à faire_ |           |
|      |     |                     | 2.2 Zoom et 320 px   | _à faire_ |           |
|      |     |                     | 2.3 Lecteur d'écran  | _à faire_ |           |

## 3. Critères WCAG 2.2 AA déjà couverts

| Critère | Intitulé                          | Comment                                                                                                                              |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1.3.1   | Information et relations          | HTML sémantique, un seul `main` et un seul `h1` par page, libellés reliés aux champs.                                                |
| 1.3.5   | Identifier la finalité des champs | `autoComplete` transmis par le champ, à poser sur chaque donnée personnelle.                                                         |
| 1.4.1   | Utilisation de la couleur         | Pion : forme selon le camp. Champ : icône et texte d'erreur. Bouton pressé : coche. Navigation : page en cours soulignée et en gras. |
| 1.4.3   | Contraste (minimum)               | Couples de la charte, recalculés par le test.                                                                                        |
| 1.4.4   | Redimensionnement du texte        | Tailles en `rem` ; à confirmer à la main (2.2).                                                                                      |
| 1.4.10  | Redistribution                    | Largeur minimale de 320 px ; à confirmer à la main (2.2).                                                                            |
| 1.4.11  | Contraste du contenu non textuel  | Bordures, anneau de focus et formes des pions à au moins 3:1.                                                                        |
| 2.1.1   | Clavier                           | Tout se fait au clavier : boutons, pions sélectionnables, navigation.                                                                |
| 2.1.2   | Pas de piège au clavier           | Vérifié page par page.                                                                                                               |
| 2.4.1   | Contourner des blocs              | Lien « Aller au contenu ».                                                                                                           |
| 2.4.2   | Titre de page                     | Un titre d'onglet par page.                                                                                                          |
| 2.4.3   | Parcours du focus                 | Ordre de la page, focus sur le titre après une navigation.                                                                           |
| 2.4.7   | Visibilité du focus               | Anneau de la charte partout.                                                                                                         |
| 2.4.11  | Focus non masqué                  | Aucun élément collant ni fixe.                                                                                                       |
| 2.5.8   | Taille de la cible                | 44 px au moins.                                                                                                                      |
| 3.3.1   | Identification des erreurs        | Erreur reliée au champ, `aria-invalid`.                                                                                              |
| 3.3.2   | Étiquettes ou instructions        | Libellé toujours visible, jamais de placeholder.                                                                                     |
| 4.1.2   | Nom, rôle et valeur               | Noms accessibles des boutons et des pions, `aria-pressed`, `aria-busy`.                                                              |

Les animations de dés désactivables, exigées par le sujet, reposent sur `prefers-reduced-motion` (durée d'animation nulle).

## 4. Limites connues

- **Les vérifications manuelles** (section 2) ne sont pas encore faites.
- **Les écrans n'ont presque pas de contenu** : connexion, inscription et vue MJ n'affichent que leur titre. L'audit couvre donc surtout la structure, la navigation et les composants ; il sera à refaire écran par écran (#16, #17, #18).
- **Le focus après un envoi en erreur** n'est pas encore géré : c'est à chaque écran de formulaire de le placer sur le premier champ en erreur (#16).
- **Les contrastes sur la carte** (texte sur image, pions sur le fond de carte) ne sont pas vérifiables à partir des variables : à contrôler quand la carte existera (#17).
- **À l'ouverture de la vue joueurs** dans une nouvelle fenêtre, la palette du MJ peut s'afficher un instant avant la palette « table de jeu » (#18).
- **L'état désactivé** des boutons n'est pas défini par la charte (opacité réduite, voir [composants.md](../technique/composants.md#limites-connues)).
- **Le bouton « Réessayer »** de la liste des campagnes est encore un `<button>` écrit à la main, pas le composant `Button`.
- **L'anneau de focus** suit la charte (espace de 2 px, anneau de 3 px), et non « anneau de 2 px, décalage de 2 px » écrit dans l'issue #77 : c'est la charte qui fait foi.

## 5. Déclaration d'accessibilité (ébauche)

> **Lanterne** s'engage à rendre son application web accessible, conformément aux WCAG 2.2, niveau AA.
>
> **État de conformité** : non évalué. L'audit est en cours : les vérifications automatiques sont en place, les vérifications manuelles et l'audit complet seront réalisés avant la version 1.0.0.
>
> **Contenus non accessibles** : voir les limites connues ci-dessus.
>
> **Établissement de cette déclaration** : à compléter à la fin de l'audit (date, méthode, pages auditées, outils).
>
> **Retour d'information** : pour signaler un défaut d'accessibilité, ouvrir une issue sur le dépôt avec le modèle « Bug ».

Cette ébauche n'affirme **aucune conformité** : elle sera complétée et datée à la fin de l'audit (P3-18, #56).
