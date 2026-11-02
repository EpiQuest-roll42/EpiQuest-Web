# ADR 0009 - Unités métriques et conversion du SRD

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

## Conséquences

**Positives**

- La fiche, la carte et le moteur affichent toujours les mêmes valeurs.
- Les valeurs restent rondes et familières aux joueurs francophones.

**Négatives ou à surveiller**

- Le script d'import doit convertir **tous** les champs d'unité, y compris ceux cachés dans les textes (description d'un sort : « une sphère de 20 pieds de rayon »). Un test d'import vérifie qu'il ne reste aucune mention de pieds ni de livres.
- Cette conversion fait partie de l'adaptation du SRD : si le contenu est traduit, la mention d'attribution indique « traduit et adapté » (voir `TODO.md`).
- Une valeur qui n'est pas un multiple de 5 pieds (rare dans le SRD) est arrondie à la demi-case la plus proche ; le script d'import signale chaque arrondi.

## Références

- ADR 0005 - SRD 5.1, importé depuis la D&D 5e API
- ADR 0008 - Contrat d'API écrit en premier
- System Reference Document 5.1 : https://dnd.wizards.com/resources/systems-reference-document
