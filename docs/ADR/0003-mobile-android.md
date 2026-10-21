# ADR 0003 - Android comme plateforme mobile cible

- **Statut** : accepté
- **Date** : 2026-10-21
- **Décideurs** : Vivien, Alexandre, Killian
- **Tâche** : P1-01 (#1)

## Contexte

La fiche (bloc 02-K) impose une application mobile native ou multiplateforme, avec **une seule plateforme cible au choix, iOS ou Android**, justifiée dans la documentation technique. Les sites emballés (PWA, Ionic, Capacitor, Cordova, WebView) sont interdits. Aucune publication sur les stores n'est demandée : une démo sur téléphone ou sur émulateur suffit.

L'application est écrite en **Flutter**. Elle doit être compatible avec le lecteur d'écran de la plateforme, gérer les tailles de texte dynamiques et des zones tactiles d'au moins 48 dp (exigence 03-A). Chaque merge doit produire un build installable, disponible en artefact du pipeline (exigence 03-B).

## Options envisagées

| Option | Avantages | Inconvénients |
| --- | --- | --- |
| **Android** | Build et émulateur sur Windows, macOS et Linux ; APK installable directement sur un téléphone ; build en CI sur un runner Linux gratuit ; TalkBack disponible sur tout appareil | Diversité des appareils et des versions d'Android à tester |
| **iOS** | Écosystème homogène, VoiceOver très abouti | Build et simulateur réservés à macOS ; installation sur un vrai iPhone soumise à un compte développeur Apple ; runners macOS en CI plus rares et plus lents |

## Décision

L'application cible **Android**.

- La version minimale d'Android supportée est fixée dans `android/app/build.gradle` et rappelée dans le README.
- La CI construit un **APK** à chaque merge sur `main` et le publie en artefact du pipeline.
- Les tests d'accessibilité mobile se font avec **TalkBack**.

## Conséquences

**Positives**

- Toute l'équipe peut développer, lancer l'émulateur et construire l'application, quel que soit son ordinateur.
- Le jury peut installer l'APK sur un téléphone Android sans passer par un store.
- La CI mobile tourne sur le même type de runner Linux que le reste du projet.

**Négatives ou à surveiller**

- Le code Flutter reste compatible iOS, mais aucun build iOS n'est testé ni livré : il ne faut pas l'annoncer comme supporté.
- Tester au moins un émulateur récent et un appareil plus ancien, pour couvrir les écarts entre versions d'Android.

## Références

- Flutter, construire une application Android : https://docs.flutter.dev/deployment/android
- Android, accessibilité et TalkBack : https://developer.android.com/guide/topics/ui/accessibility
