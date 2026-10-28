# À faire plus tard

Points repérés pendant P1-03, P1-04 et l'issue des fichiers du dépôt. Chaque point a vocation à devenir une issue dans le GitHub Project ; une fois l'issue créée, cocher la case ici.

## Documentation et licences

- [ ] **Captures du README** : remplacer l'emplacement vide de la section « Captures » par des images de la vue MJ, de la vue joueurs et de l'assistant de création, rangées dans `docs/captures/`, chacune avec un texte alternatif (WCAG 1.1.1). Exigé par la fiche (bloc 03-B).
- [ ] **Attribution du SRD dans le produit** : page « À propos » ou « Mentions légales » dans l'application web, avec la mention d'attribution CC BY 4.0 du SRD 5.1 (le README ne suffit pas : l'utilisateur ne le lit pas).
- [ ] **Traduction du SRD** : décider en équipe si le contenu est affiché en français. Si oui, ajouter « traduit et adapté » à la mention d'attribution (README et page « À propos »), comme l'exige la CC BY 4.0.

## Outillage

- [ ] **Script `test` à la racine** : ajouter `turbo run test`, documenté dans le README mais absent du `package.json`. À faire avec le premier test du moteur de règles, ou dans la CI.
- [ ] **Version de PostgreSQL** : fixer l'image sur une version précise (par exemple `postgres:17.11-alpine`) dans `compose.yaml`, comme Adminer.
- [ ] **Vérifier `compose.yaml` en CI** : `docker compose config --quiet`, avec un `.env` créé à partir de `.env.example` et des valeurs factices.
- [ ] **TypeScript** : remonter au-delà de `~6.0.x` quand typescript-eslint le prendra en charge.

## À vérifier avant la soutenance

- [ ] `main` et `dev` sont bien protégées (CI obligatoire et relecture), comme l'annonce `CONTRIBUTING.md`.
- [ ] Le formulaire de signalement privé du dépôt est activé (utilisé par `CODE_OF_CONDUCT.md`).
- [ ] Chaque membre a complété le tableau « Usage de l'IA » du README.
- [ ] Test du nouvel arrivant : une personne extérieure lance le produit et les tests avec le seul README, en moins de 15 minutes.
