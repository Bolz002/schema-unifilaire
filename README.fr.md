# UniSchema

**App en ligne : https://bolz002.github.io/schema-unifilaire/** — installation : [Android](docs/INSTALL_ANDROID.md), [PC](docs/INSTALL_PC.md), iPad (Safari → Partager → Sur l'écran d'accueil). LLM : [docs/LLM.md](docs/LLM.md).

Fork de [igoethal/eendraadschema](https://github.com/igoethal/eendraadschema) (© Ivan Goethals, GPLv3), modifié par Quentin Bolsée en 2026. Objectif : une PWA en français, utilisable hors ligne sur iPad. Le néerlandais reste disponible.

## Développement

```bash
npm ci
npm run dev            # http://localhost:5173
npm run build          # dist/ autonome (base /)
npm run preview
npm run build:single   # un seul index.html dans dist-single/
```

Build pour GitHub Pages : `BASE_PATH=/<depot>/ npm run build`. Sous Git Bash (Windows), préfixer par `MSYS_NO_PATHCONV=1`, sinon le chemin est converti en `C:/Program Files/Git/...`.

## Branches

- `master` : miroir de `upstream/master`, sans modification.
- `main` : branche de travail du fork.

Licence : GPLv3, voir [LICENSE.md](LICENSE.md). Journal : [CHANGELOG.md](CHANGELOG.md), tests : [docs/TEST_LOG.md](docs/TEST_LOG.md).
