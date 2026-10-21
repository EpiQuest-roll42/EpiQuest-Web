# ADR 0004 - Déploiement continu sur un VPS OVHcloud avec Docker

- **Statut** : accepté
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-01 (#1), réalisée par P1-06 (#6)

## Contexte

La fiche marque le déploiement continu comme **obligatoire** (bloc 03-B) : chaque merge sur la branche principale met à jour automatiquement le produit, **accessible en ligne** avec la campagne de démonstration. L'URL doit figurer dans le README (livrable « Environnement en ligne »). Les secrets du pipeline restent dans les secrets GitHub, jamais dans le code.

Le produit comprend une API NestJS avec une gateway WebSocket, une application web React et une base PostgreSQL. En local, tout tourne déjà avec Docker Compose (ADR 0001, tâche P1-04).

## Options envisagées

| Option | Avantages | Inconvénients |
| --- | --- | --- |
| **Offres gratuites de type PaaS** | Aucun coût | Mise en veille après inactivité, limites sur les WebSocket ou sur la base selon les offres, conditions qui changent souvent |
| **VPS OVHcloud avec Docker Compose** | La même configuration Docker qu'en local ; WebSocket et PostgreSQL sans limite d'offre ; serveur toujours allumé pour la démo ; coût le plus bas parmi les offres payantes étudiées | Coût mensuel ; serveur à administrer et à sécuriser nous-mêmes |

## Décision

Le produit est déployé sur un **VPS OVHcloud** (offre d'entrée de gamme), avec **Docker Compose**.

Déroulé à chaque merge sur `main` :

1. La CI construit les images Docker de l'API et du web.
2. Elle les publie dans le registre de conteneurs GitHub (`ghcr.io`), étiquetées avec le hash du commit.
3. Un job de déploiement se connecte au VPS en SSH, récupère les nouvelles images et relance les services avec `docker compose`.
4. Les migrations, l'import SRD et la campagne de démonstration sont rejoués au démarrage, sans doublon.

Organisation sur le serveur :

- un **reverse proxy** (Caddy ou Traefik) gère le HTTPS automatique et transmet les WebSocket ;
- PostgreSQL tourne dans un conteneur avec un volume persistant, **sans port exposé** sur Internet ;
- le fichier d'environnement de production est créé sur le serveur, ou injecté depuis les secrets GitHub au déploiement.

## Règles de sécurité

- Pare-feu : seuls les ports 22 (SSH), 80 et 443 sont ouverts.
- Connexion SSH par clé uniquement, connexion root désactivée, un utilisateur dédié au déploiement.
- La clé SSH de déploiement, l'adresse du serveur et les mots de passe sont stockés dans les **secrets GitHub**.
- Mises à jour de sécurité du système activées.

## Conséquences

**Positives**

- Une seule façon de lancer le produit, en local comme en production : `docker compose`.
- Le serveur reste disponible pour le follow-up et la soutenance, sans mise en veille.
- La gateway WebSocket fonctionne sans contrainte d'offre.

**Négatives ou à surveiller**

- **Coût** : environ 8 € par mois pour l'offre d'entrée de gamme depuis la hausse d'avril 2026, soit une trentaine d'euros sur la durée du projet. Le tarif exact est à vérifier sur la page OVHcloud au moment de la commande. La fiche évoque une offre gratuite « au choix » : le choix d'une offre payante est justifié ici.
- L'équipe administre elle-même le serveur : les étapes d'installation et de déploiement sont décrites dans la documentation technique (rubrique « Exploitation »).
- Le serveur n'a qu'une seule instance : une panne coupe la démo. Il faut garder la possibilité de faire la démo en local avec `docker compose` en secours.

## Références

- OVHcloud, serveurs privés virtuels : https://www.ovhcloud.com/fr/vps/
- Digitiz, hausse des prix des VPS en 2026 : https://digitiz.fr/hausse-prix-vps-2026/
- GitHub, publier des images dans le registre de conteneurs : https://docs.github.com/fr/packages/working-with-a-github-packages-registry/working-with-the-container-registry
