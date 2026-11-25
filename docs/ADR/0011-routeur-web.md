# ADR 0011 - React Router pour le routing de l'application web

- **Statut** : proposé
- **Date** : 2026-11-09
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-14 (#14), sous-issue #74

## Contexte

L'application web (`apps/web`, architecture MVVM décrite dans `docs/technique/architecture-web.md`) a besoin de routes pour les écrans des P1-16 à P1-18 : compte, campagnes, vue MJ, vue joueurs.

Le routing porte aussi des exigences d'accessibilité (WCAG 2.2 AA) : un titre par page (critère 2.4.2), le focus placé au bon endroit après une navigation, et un lien d'évitement (critère 2.4.1). Aucune bibliothèque de routing ne les gère à notre place : il faut les écrire, quel que soit le choix.

Deux bibliothèques sont envisagées. L'application utilise déjà TanStack Query pour ses données.

## Options envisagées

| Option              | Avantages                                                                                                    | Inconvénients                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **React Router**    | Très répandu, documentation et exemples abondants ; déjà connu dans l'équipe ; routes déclarées dans le code | Typage partiel des paramètres d'URL (`:campaignId`) et de la recherche                                        |
| **TanStack Router** | Typage complet des paramètres et de la recherche ; même écosystème que TanStack Query                        | Moins répandu ; prise en main supplémentaire ; le mode « routes par fichiers » ajoute une étape de génération |

## Décision

Nous utilisons **React Router** (paquet `react-router`, version 8), en **mode « data »** : routes déclarées dans le code avec `createBrowserRouter` et affichées par `RouterProvider`.

- **Pas de mode « framework »** : il impose sa propre structure de fichiers, son plugin Vite et un rendu côté serveur, dont l'application n'a pas besoin.
- **Les routes ne chargent pas de données.** Les `loader` et `action` de React Router ne sont pas utilisés : les données passent par les ViewModels et TanStack Query (MVVM). Un `loader` appellerait le Model sans passer par un ViewModel.
- **Le titre de chaque page** est déclaré dans la route (champ `handle`) et appliqué par une route racine sans chemin, commune à toutes les mises en page (y compris celle de la vue joueurs) : un seul mécanisme pour toutes les pages.
- **Le focus après navigation** est géré une seule fois, dans cette même route racine : il va sur le `h1` de la nouvelle page, mais ne bouge pas au premier chargement.
- **Seuls les ViewModels lisent l'adresse.** Les Views n'importent pas `react-router` (règle de lint) : la lecture des paramètres et des fragments, les redirections et le retour après connexion sont dans des ViewModels, testables seuls.
- **Les écrans lourds** (vue MJ, vue joueurs) sont chargés à la demande (`lazy` des routes de React Router).
- **Les paramètres d'URL sont validés** au moment où ils sont lus (par exemple, `campaignId` doit être un UUID), pour compenser le typage partiel.

Le choix l'emporte surtout parce que les deux bibliothèques laissent à l'équipe la partie la plus importante de cette tâche (le titre et le focus), et que React Router est déjà connu : l'effort d'apprentissage va à l'accessibilité plutôt qu'à l'outil.

## Conséquences

**Positives**

- Une bibliothèque déjà connue : la prise en main est immédiate.
- Une seule source de vérité pour les données (TanStack Query), sans doublon avec les `loader`.
- Le titre et le focus sont gérés au même endroit pour toutes les pages, donc testés une seule fois.

**Négatives ou à surveiller**

- Le typage des paramètres d'URL est partiel : un paramètre mal nommé n'est pas détecté par le compilateur. Les tests de chaque route le compensent.
- En revue, tout `loader` ou `action` ajouté à une route est refusé, sauf nouvelle ADR.
- La documentation et les exemples de React Router mélangent ses trois modes (« declarative », « data », « framework ») : vérifier qu'un exemple correspond bien au mode « data ».

## Références

- ADR 0007 - Le web dépend du moteur de règles, sans jamais faire autorité
- ADR 0008 - Contrat d'API écrit en premier
- `docs/technique/architecture-web.md`
- React Router, modes d'utilisation : https://reactrouter.com/start/modes
- WCAG 2.2, critère 2.4.1 Contourner des blocs : https://www.w3.org/TR/WCAG22/#bypass-blocks
- WCAG 2.2, critère 2.4.2 Titre de page : https://www.w3.org/TR/WCAG22/#page-titled
