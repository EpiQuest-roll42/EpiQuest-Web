# À faire plus tard

Points repérés pendant P1-03, P1-04 et l'issue des fichiers du dépôt. Chaque point a vocation à devenir une issue dans le GitHub Project ; une fois l'issue créée, cocher la case ici.

## En cours : #75 Thème de la charte (section temporaire)

> Liste de travail de la branche `feat/75-theme-de-la-charte`, PR vers `feat/14-squelette-react-mvvm-et-composants-accessibles`. À supprimer au merge de la PR. 🔍 = montrer le résultat pour revue avant de continuer. Lancer `pnpm --filter @lanterne/web typecheck && pnpm --filter @lanterne/web test` **avant chaque commit**.

**1. Transcription de la charte** (faite par Claude, exception de `CLAUDE.md`)

- [x] Variables de couleur des deux palettes, mêmes noms que Figma (`apps/web/src/theme/tokens.css`) ; palette sombre au premier lancement si le système est en mode sombre, sans JavaScript.
- [x] Typographie en `rem` (Lora pour les titres, Inter pour le texte, Cinzel réservée au logo), échelle « table de jeu » × 1,5 (`data-text-scale="table"`), espacements, rayons, focus, `--duration-animation` à `0s` avec `prefers-reduced-motion`.
- [x] Styles globaux (`theme/base.css`) : couleurs des variables, focus de la charte, lien d'évitement, page en cours de la navigation repérée sans la couleur seule (`aria-current`, point noté pendant #74).
- [x] Test des contrastes (`src/tests/themeTokens.test.ts`) : les 104 ratios de la charte recalculés depuis les variables, tailles en `rem`, animation à 0, aucune couleur en dur, aucune police chargée depuis un tiers.
- [x] Doc `docs/technique/theme.md` (tableau des couples autorisés), ADR 0012 Lucide, licence OFL dans `THIRD_PARTY_NOTICES.md`, CHANGELOG, README.

**2. Les paquets** (`feat(web): add charter theme tokens and self-hosted fonts`)

- [x] `pnpm --filter @lanterne/web add @fontsource-variable/inter @fontsource-variable/lora lucide-react` : sans ces paquets, `pnpm build` échoue (`fonts.css` les importe).
- [x] `pnpm --filter @lanterne/web build`, puis `grep -rl "googleapis\|gstatic" apps/web/dist` ne doit rien afficher.
- [x] Ouvrir le site : les titres sont en Lora, le texte en Inter, le focus au clavier montre l'anneau bleu de la charte.

**3. Le choix de palette** (`feat(web): let users choose the color palette`)

- [ ] **Model** : `models/preferences/themePreferenceStorage.ts`, lit et écrit `'clair' | 'table' | null` dans `localStorage`, chaque accès dans un `try/catch` (`localStorage` peut lever une erreur en navigation privée). Pas de React dans ce fichier.
- [ ] **ViewModel** : `viewModels/useThemePreference.ts`, expose la palette affichée (le choix enregistré, sinon celle du système via `matchMedia('(prefers-color-scheme: dark)')`) et une commande pour en changer.
- [ ] **app/** : poser `data-theme` sur `<html>` (`document.documentElement`) **seulement** quand l'utilisateur a choisi ; sans choix, ne rien poser, le CSS suit le système.
- [ ] **View** : un bouton dans l'en-tête d'`AppLayout`, libellé fixe « Palette table de jeu », état porté par `aria-pressed` (WCAG 4.1.2).
- [ ] Tests (Claude peut les écrire) : au premier lancement la palette suit le système ; le choix est conservé après rechargement ; un `localStorage` qui lève une erreur ne fait pas planter l'application ; le bouton change `aria-pressed`.
- [ ] 🔍 Montrer le choix de palette.

**4. La vue joueurs** (`feat(web): use the game table palette on the player display`)

- [ ] `PlayerDisplayLayout` pose `data-theme="table"` et `data-text-scale="table"` : l'écran partagé est toujours en « table de jeu », texte agrandi, quel que soit le choix sur l'ordinateur du MJ.
- [ ] Test : sur `/vue-joueurs`, ces deux attributs sont présents.

**5. À décider en équipe**

- [ ] Valider l'échelle d'espacements et de rayons proposée (absente de la charte), puis la reporter dans les variables Figma.
- [ ] Faire relire l'ADR 0012 (statut « proposé »).

**6. PR**

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check` à la racine.
- [ ] PR vers `feat/14-squelette-react-mvvm-et-composants-accessibles` : « Closes #75 ».
- [ ] « vérifie » avec Claude avant de la proposer à l'équipe.

## Documentation et licences

- [ ] **Captures du README** : remplacer l'emplacement vide de la section « Captures » par des images de la vue MJ, de la vue joueurs et de l'assistant de création, rangées dans `docs/captures/`, chacune avec un texte alternatif (WCAG 1.1.1). Exigé par la fiche (bloc 03-B).
- [ ] **Attribution du SRD dans le produit** : page « À propos » ou « Mentions légales » dans l'application web, avec la mention d'attribution CC BY 4.0 du SRD 5.1 (le README ne suffit pas : l'utilisateur ne le lit pas).
- [ ] **Traduction du SRD** : décider en équipe si le contenu est affiché en français. Si oui, ajouter « traduit et adapté » à la mention d'attribution (README et page « À propos »), comme l'exige la CC BY 4.0.

- [ ] **Déclaration de limites** : lister dans `docs/` les limites connues du produit, en commençant par celle-ci : murs et portes seulement sur grille carrée (le contrat renvoie `walls_require_square_grid` sur une grille hexagonale).
- [ ] **Icônes** : les composants de la charte utilisent Lucide (licence ISC). Utiliser la même bibliothèque dans le code (`lucide-react` côté web, équivalent côté mobile), le noter dans un ADR, et passer les icônes restantes des maquettes sur Lucide.

## Outillage

- [x] **Script `test` à la racine** : ajouter `turbo run test`, documenté dans le README mais absent du `package.json`. À faire avec le premier test du moteur de règles, ou dans la CI.
- [ ] **Version de PostgreSQL** : fixer l'image sur une version précise (par exemple `postgres:17.11-alpine`) dans `compose.yaml`, comme Adminer.
- [ ] **Vérifier `compose.yaml` en CI** : `docker compose config --quiet`, avec un `.env` créé à partir de `.env.example` et des valeurs factices.
- [ ] **TypeScript** : remonter au-delà de `~6.0.x` quand typescript-eslint le prendra en charge.

## À vérifier avant la soutenance

- [ ] `main` et `dev` sont bien protégées (CI obligatoire et relecture), comme l'annonce `CONTRIBUTING.md`.
- [ ] Le formulaire de signalement privé du dépôt est activé (utilisé par `CODE_OF_CONDUCT.md`).
- [ ] Chaque membre a complété le tableau « Usage de l'IA » du README.
- [ ] Test du nouvel arrivant : une personne extérieure lance le produit et les tests avec le seul README, en moins de 15 minutes.

- [x] Renommer `CampaignRepositoryError` en une erreur commune, et partager un seul client HTTP, avec le deuxième repository (fait dans #74).
- [ ] Interdire au web le point d'entrée « jets » du moteur de règles (ADR 0007), quand le moteur aura ses deux points d'entrée.
- [ ] **Variables d'environnement vides** : un `.env` copié tel quel depuis `.env.example` contient `VITE_API_MODE=` (chaîne vide) et empêche l'application de démarrer. Traiter une valeur vide comme une variable absente dans `createRepositories.ts`, ou commenter ces lignes dans `.env.example`.
