# ADR 0012 - Lucide pour les icônes

- **Statut** : proposé
- **Date** : 2026-11-10
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-14 (#14), sous-issue #75

## Contexte

Les composants de la charte graphique (`docs/charte-graphique.pdf` et Figma) sont dessinés avec les icônes **Lucide**. L'application web, et plus tard l'application mobile, ont besoin des mêmes icônes, pour que les écrans ressemblent aux maquettes et que l'équipe n'ait pas à redessiner chaque pictogramme.

Les icônes portent aussi des exigences d'accessibilité (WCAG 2.2 AA) : un contraste d'au moins 3:1 pour un élément graphique (critère 1.4.11), et jamais une information portée par l'icône seule (critère 1.4.1, règle « icône + texte » de la charte).

## Options envisagées

| Option                              | Avantages                                                                                                                                                                 | Inconvénients                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Lucide** (`lucide-react`)         | Déjà utilisé par la charte ; licence ISC permissive ; un composant React par icône, seules les icônes importées sont dans le build ; portages communautaires pour Flutter | Les icônes dérivées de Feather sont sous licence MIT : deux mentions à conserver |
| Material Symbols                    | Très complet ; natif dans Flutter                                                                                                                                         | Style différent de la charte : les maquettes seraient à reprendre                |
| Icônes dessinées par l'équipe (SVG) | Aucune dépendance                                                                                                                                                         | Temps de dessin, cohérence difficile à tenir, chaque icône à vérifier            |

## Décision

Nous utilisons **Lucide** : `lucide-react` dans l'application web, et un portage Lucide pour Flutter dans l'application mobile (le paquet est à choisir dans le dépôt EpiQuest-Mobile). C'est la bibliothèque de la charte, donc les écrans reprennent les maquettes sans conversion.

- **Une icône n'est jamais la seule porteuse d'une information** : elle accompagne un texte visible, ou un nom accessible si elle est seule dans un bouton (`aria-label` sur le bouton, icône en `aria-hidden`).
- **Une icône décorative** est masquée aux lecteurs d'écran (`aria-hidden="true"`).
- **Sa couleur** vient des variables de la charte (`currentColor`, donc la couleur du texte qui l'entoure), parmi les couples « Graphique » ou « Texte » du tableau des contrastes (`docs/technique/theme.md`).
- **Les icônes restantes des maquettes** qui ne viennent pas de Lucide sont remplacées par leur équivalent Lucide.

## Conséquences

**Positives**

- Les écrans reprennent les maquettes à l'identique, sur le web comme sur le mobile.
- Seules les icônes importées sont dans le build : le poids de l'application reste faible.

**Négatives ou à surveiller**

- La mention de licence (ISC, et MIT pour les icônes dérivées de Feather) doit rester dans `THIRD_PARTY_NOTICES.md`, où elle est déjà.
- En revue, toute icône sans texte visible ni nom accessible est refusée.

## Références

- Charte graphique : `docs/charte-graphique.pdf` (crédits : « Icônes des composants : Lucide (licence ISC) »)
- `THIRD_PARTY_NOTICES.md`, section « Icônes Lucide »
- Lucide : https://lucide.dev
- WCAG 2.2, critère 1.4.11 Contraste du contenu non textuel : https://www.w3.org/TR/WCAG22/#non-text-contrast
