# Journal des modifications

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]

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
