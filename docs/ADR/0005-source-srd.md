# ADR 0005 - Source et version des données SRD

- **Statut** : accepté
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-01 (#1), réalisée par P2-02 (#20)

## Contexte

La fiche (règles d'or et bloc 02-C) impose :

- des règles issues **uniquement** du SRD 5e publié par Wizards of the Coast sous licence **Creative Commons CC BY 4.0**, avec la mention d'attribution exigée, et aucun contenu des livres payants ;
- un contenu **importé dans la base du produit** depuis une source publique (API ouverte comme Open5e ou la D&D 5e API, ou fichiers du SRD) ;
- un produit qui fonctionne ensuite **sans dépendre de l'API externe**, avec un import **rejouable et versionné** ;
- des règles décrites **en données**, interprétées par le moteur de règles.

Deux versions du SRD existent sous CC BY 4.0 :

- **SRD 5.1**, qui correspond aux règles de 2014 ;
- **SRD 5.2**, qui correspond aux règles révisées de 2024.

Elles ne sont pas compatibles entre elles : il faut en choisir une seule.

## Options envisagées

### Version

| Option      | Avantages                                                                                                                           | Inconvénients                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **SRD 5.1** | Correspond aux maquettes (Haut-elfe, rôdeur avec ennemi juré et explorateur-né) ; données structurées déjà disponibles et éprouvées | Un seul historique disponible dans ce SRD                           |
| **SRD 5.2** | Règles les plus récentes, plusieurs historiques                                                                                     | Maquettes à revoir ; jeux de données structurées encore peu matures |

### Source de l'import

| Option                             | Avantages                                                                     | Inconvénients                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Document officiel du SRD (PDF)** | Source primaire de Wizards of the Coast                                       | Aucune donnée structurée : il faudrait extraire et retaper tout le contenu à la main                                        |
| **D&D 5e API (projet 5e-bits)**    | Données SRD 5.1 en JSON structuré, version 2014 stable, contenu limité au SRD | Format propre au projet, à convertir vers notre format de règles                                                            |
| **Open5e**                         | API ouverte, nombreuses ressources                                            | Mélange le SRD avec d'autres contenus sous licence ouverte : filtre obligatoire sur le document SRD de Wizards of the Coast |

## Décision

Nous utilisons le **SRD 5.1**, importé depuis les données JSON de la **D&D 5e API** (projet 5e-bits).

- Le contenu reste celui du SRD publié par Wizards of the Coast sous CC BY 4.0 ; la D&D 5e API n'est que le moyen de le récupérer sous forme structurée.
- Une version précise des données est figée : le script d'import la télécharge une fois, la convertit dans **notre** format de règles (documenté dans `docs/`), puis l'enregistre en base avec son numéro de version.
- Après l'import, le produit ne contacte plus jamais l'API externe.
- L'import est lancé par la commande d'installation et peut être rejoué sans créer de doublons.
- Tout contenu qui ne figure pas dans le SRD 5.1 est exclu, même s'il apparaît dans une maquette.

## Mention d'attribution

À placer dans le README, dans un fichier `NOTICE` ou `ATTRIBUTION.md`, et sur une page de crédits du produit :

> This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

Le texte exact est à vérifier sur la page officielle du SRD avant la livraison.

## Conséquences

**Positives**

- Les maquettes restent valables pour les espèces et les classes.
- L'import part de données déjà structurées : pas de saisie manuelle du SRD.
- Le format de règles reste le nôtre, conforme à l'exigence « les règles sont des données, pas du code ».

**Négatives ou à surveiller**

- Le SRD 5.1 ne contient qu'un historique (Acolyte). L'historique « Sauvageon » des maquettes ne fait pas partie du SRD : il doit être retiré des maquettes et des données.
- Il faut vérifier, avant de figer la version, la licence du dépôt de données de 5e-bits et la noter dans cette ADR.
- Toute donnée ajoutée à la main pour la campagne de démonstration doit rester dans le périmètre du SRD 5.1.

## Références

- Wizards of the Coast, System Reference Document : https://dnd.wizards.com/resources/systems-reference-document
- D&D Beyond, annonce du SRD 5.2 : https://www.dndbeyond.com/posts/1949-you-can-now-publish-your-own-creations-using-the
- D&D 5e API (5e-bits) : https://www.dnd5eapi.co
- Open5e : https://open5e.com/api-docs
