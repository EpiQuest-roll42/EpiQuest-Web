# ADR 0009 - Unités métriques, conversion et attribution du SRD

- **Statut** : proposé
- **Date** : 2026-11-02
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-09 (#9)

## Contexte

Le SRD 5.1 (ADR 0005) exprime les distances en pieds et les poids en livres : vitesse de 30 pieds, portée de 120 pieds, armure de 20 livres. Lanterne est destiné à un public francophone, et les maquettes affichent des mètres et des kilogrammes.

Plusieurs parties du produit utilisent ces valeurs :

- la **fiche de personnage** (vitesse, charge portée, poids des objets) ;
- la **carte** (déplacements, portées, zones d'effet), découpée en cases ;
- le **moteur de règles**, qui calcule les portées et les déplacements.

Si chaque partie convertit de son côté, elles finiront par ne plus afficher les mêmes valeurs : 9 m sur la fiche, mais 9,14 m sur la carte.

## Options envisagées

| Option                                                            | Avantages                                                                                          | Inconvénients                                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Stocker en impérial, convertir à l'affichage**                  | Données identiques à la source                                                                     | Chaque client convertit : risque d'écarts entre web, mobile et carte ; le moteur raisonne en pieds |
| **Convertir exactement** (1 pied = 0,3048 m)                      | Conversion physiquement juste                                                                      | Valeurs illisibles (9,144 m) ; une case ne fait plus un nombre rond                                |
| **Convertir à l'import, avec les conventions du jeu en français** | Une seule règle pour tout le produit ; valeurs rondes et habituelles pour les joueurs francophones | La conversion n'est pas physiquement exacte (choix assumé)                                         |

## Décision

Toutes les distances et tous les poids sont **convertis une seule fois, à l'import du SRD**, puis stockés et servis par l'API en mètres et en kilogrammes. Les règles de conversion sont les conventions habituelles du jeu en français :

| Impérial         | Métrique   | Exemples                   |
| ---------------- | ---------- | -------------------------- |
| 5 pieds = 1 case | **1,5 m**  | 30 ft → 9 m, 120 ft → 36 m |
| 1 livre          | **0,5 kg** | 10 lb → 5 kg               |

- Une case de la carte mesure 1,5 m. Les déplacements et les portées se comptent en cases, puis s'affichent en mètres.
- Le moteur de règles, l'API, le web et le mobile ne convertissent jamais d'unités : ils reçoivent déjà des mètres et des kilogrammes.
- Le contrat d'API (ADR 0008) le précise dans la description des champs concernés.

### Mention des modifications

La licence CC BY 4.0 exige d'**indiquer si l'œuvre a été modifiée** (section 3(a)(1)(B) de la licence). Lanterne modifie le SRD 5.1 de trois façons :

1. conversion en données structurées, interprétées par le moteur de règles ;
2. conversion des unités au système métrique, selon les règles ci-dessus ;
3. traduction en français, si l'équipe la retient (voir `TODO.md`).

La mention d'attribution de l'ADR 0005 est donc toujours suivie d'une phrase qui liste ces modifications, par exemple : « Modifié : converti en format structuré, unités converties au système métrique. » L'API la renvoie dans le champ `changes` de `getSrdAttribution` (contrat, section Données SRD), et la page de crédits du web et du mobile l'affiche.

### Licence de la source de l'import

L'ADR 0005 demandait de vérifier la licence du dépôt de données de 5e-bits avant de figer la version. Vérification faite le 2026-11-03 :

| Élément                          | Constat                                                                                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dépôt actuel                     | `5e-bits/5e-srd-api`, qui a repris `5e-bits/5e-database` (désormais archivé)                                                                                                     |
| Licence du dépôt                 | **MIT**, « Copyright (c) [2018-2020] [Adrian Padua, Christopher Ward] »                                                                                                          |
| Licence annoncée pour le contenu | Le README de l'ancien dépôt indique : « The underlying material is released using the Open Gaming License Version 1.0a ». Le nouveau dépôt ne dit rien de la licence du contenu. |
| Version du SRD                   | Données de 2014 (SRD 5.1), servies sous le préfixe `/api/2014` ; `/api/2024` est annoncé mais pas encore disponible                                                              |

Ce qui en découle pour Lanterne :

- **Le contenu des règles est utilisé sous CC BY 4.0, pas sous OGL 1.0a.** Wizards of the Coast publie le même SRD 5.1 sous les deux licences ; le projet impose la CC BY 4.0 (fiche, règles d'or). Lanterne n'utilise donc pas l'OGL et n'en reprend pas la mention.
- **La structure des données de 5e-bits est sous licence MIT.** La MIT exige de conserver la mention de copyright et le texte de la licence dans toute copie ou partie substantielle. Les données importées en dérivent : la mention MIT de 5e-bits doit figurer avec l'attribution du SRD, dans le fichier de crédits du dépôt et dans la réponse de `getSrdAttribution`.
- L'import utilise uniquement les routes `/api/2014`, qui correspondent au SRD 5.1.

## Conséquences

**Positives**

- La fiche, la carte et le moteur affichent toujours les mêmes valeurs.
- Les valeurs restent rondes et familières aux joueurs francophones.

**Négatives ou à surveiller**

- Le script d'import doit convertir **tous** les champs d'unité, y compris ceux cachés dans les textes (description d'un sort : « une sphère de 20 pieds de rayon »). Un test d'import vérifie qu'il ne reste aucune mention de pieds ni de livres.
- Cette conversion fait partie de l'adaptation du SRD : la mention d'attribution liste toujours les modifications (voir ci-dessus), et y ajoute la traduction si elle est retenue.
- Si une traduction française est reprise d'une source tierce, sa licence doit être vérifiée et citée à son tour.
- La vérification de la licence de 5e-bits est à refaire au moment de figer la version des données, si plus de quelques semaines se sont écoulées.
- Une valeur qui n'est pas un multiple de 5 pieds (rare dans le SRD) est arrondie à la demi-case la plus proche ; le script d'import signale chaque arrondi.

## Références

- ADR 0005 - SRD 5.1, importé depuis la D&D 5e API
- ADR 0008 - Contrat d'API écrit en premier
- System Reference Document 5.1 : https://dnd.wizards.com/resources/systems-reference-document
- Licence Creative Commons BY 4.0, section 3 (attribution) : https://creativecommons.org/licenses/by/4.0/legalcode
- 5e-bits, 5e-srd-api : https://github.com/5e-bits/5e-srd-api
- 5e-bits, 5e-database (archivé) : https://github.com/5e-bits/5e-database
