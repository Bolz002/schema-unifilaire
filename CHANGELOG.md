# Journal des modifications

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté (interface LLM)
- API `window.UniSchema` (`src/llm/`) : lire, décrire, ajouter, modifier, déplacer, supprimer, annuler, importer/exporter `.eds`, rendu SVG — via les fonctions et contrôles de l'app ; descriptions françaises des 62 propriétés.
- Serveur MCP `tools/mcp/` (16 outils) pour Claude Code / Claude Desktop sur des fichiers `.eds` ; test client MCP de bout en bout.
- Documentation `docs/LLM.md`.

### Ajouté (phase 4 — interface en français)
- Couche de traduction à l'affichage (`src/i18n/`) : les textes néerlandais d'origine servent de clés, le code d'origine et les valeurs des `.eds` ne changent pas (fichiers identiques FR/NL, vérifié).
- Dictionnaire `src/i18n/fr.json` (421 textes, 10 motifs) construit par `tools/i18n/build_fr.py` à partir d'un relevé de tous les écrans, des 48 types d'éléments et de toutes les protections.
- Sélecteur de langue FR / NL en haut à droite (FR par défaut).
- En-têtes du PDF traduits ; glossaire RGIE `src/i18n/glossary.md` (à valider).

### Corrigé
- Indicateur « Hors ligne » inopérant : `main.ts` reconstruit le body au démarrage (`innerHTML +=`), l'élément est maintenant recherché à chaque mise à jour.
- Menu : sélection d'un onglet par sa position et non par son texte (`TopMenu.selectMenuItemByName`), nécessaire une fois traduit.

### Ajouté (PC Windows)
- Ouverture d'un `.eds` par double-clic quand UniSchema est installé (manifest `file_handlers`, `launch_handler` focus-existing, `src/pwa/fileLaunch.ts`) ; confirmation si travail non enregistré ; « Opslaan » réécrit dans le même fichier.
- Guide `docs/INSTALL_PC.md`, lanceur du serveur local à la racine du projet.

### Ajouté (phase 3 — ergonomie tactile, première passe)
- `src/input/gestures.ts` : appui long (doigt ou Pencil) = menu contextuel, y compris sur iPad ; pinch-zoom et déplacement à deux doigts sur le plan de position.
- `src/input/touch.css` : pas de flash au toucher ni de rebond de page, survols neutralisés sur écran tactile avec retour à l'appui, cibles d'au moins 44 px et champs à 16 px quand le pointeur est un doigt, respect de « réduire les animations ».
- Raccourcis ⌘ (Magic Keyboard) en plus de Ctrl sur le plan de position (annuler/rétablir, rotation).

### Ajouté (phase 2 — PWA)
- Nom de l'app **UniSchema**, défini dans `src/config/app.config.ts` (injecté dans le manifest et `index.html`).
- Icône originale « éclair » (`tools/generate_icons.py` → `public/icons/`), maskable et apple-touch-icon.
- `vite-plugin-pwa` 1.x : manifest, service worker Workbox qui précache toute l'app (28 fichiers, 2,2 Mo).
- Bandeau « Nouvelle version disponible — Recharger / Plus tard », sans rechargement automatique.
- Demande de stockage persistant (`navigator.storage.persist`) et indicateur « Hors ligne ».
- Balises iOS (écran d'accueil, plein écran, viewport `viewport-fit=cover`), `<html lang="fr">`.
- `src/utils/logger.ts` : logger à niveaux (debug en dev, warn en prod).
- Scripts de recette `tools/pwa-tests/`.

### Ajouté
- Build autonome : le plugin `build/copyStaticAssets.ts` copie dans `dist/` les ressources chargées hors bundle (pako, jsPDF, `prop/`, images, documentation, exemples, licence).
- `BASE_PATH` (variable d'environnement) fixe le chemin de publication, par ex. `/schema-unifilaire/` pour GitHub Pages ; `/` par défaut.
- `APP_VERSION` injecté au build depuis `package.json`.
- Script `npm run build:single` : ancien build en un seul fichier, dans `dist-single/`.

### Modifié
- Le build par défaut n'utilise plus `vite-plugin-singlefile` (fichiers JS/CSS séparés et hashés, adaptés au cache du service worker).

## [0.1.0] - 2026-10-27

### Ajouté
- Fork de `igoethal/eendraadschema` (commit `a14513e`), remote `upstream` conservé.
- `docs/BASELINE.md` : état de l'application d'origine avant modification.
- `docs/TEST_LOG.md`, `CHANGELOG.md`, `.gitignore`.

### Modifié
- Version du paquet : `0.0.0` → `0.1.0`.
