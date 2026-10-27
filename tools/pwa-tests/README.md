# Tests PWA (Edge headless)

Scripts de recette de la phase 2, à lancer contre `vite preview` :

```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/schema-unifilaire/ npm run build
MSYS_NO_PATHCONV=1 npx vite preview --port 4173 --base /schema-unifilaire/
node tools/pwa-tests/offline-test.mjs          # précache, rechargement et réouverture hors ligne
node tools/pwa-tests/update-test.mjs "$(pwd)"  # bandeau de mise à jour (relance un build)
```

Prérequis : `playwright-core` (installé hors du dépôt pour l'instant, par ex. `npm i -g playwright-core`) et Microsoft Edge.
Le navigateur intégré à l'application Claude refuse les service workers : utiliser Edge ou Chrome.
