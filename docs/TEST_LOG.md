# Journal des tests

| Date | Phase | Test | Environnement | Résultat |
|---|---|---|---|---|
| 2026-10-27 | 0 | App d'origine en local, exemples, plan de position, PDF, build | Windows 11, navigateur intégré (Chromium), Node 24.20 | OK, détails dans [BASELINE.md](BASELINE.md) |
| 2026-10-27 | 1 | `rm -rf node_modules/.vite && npm run build`, puis `vite preview --base /schema-unifilaire/` : exemple 1, plan de position, PDF, manuel PDF, `.eds`, licence, images | Windows 11, navigateur intégré, `BASE_PATH=/schema-unifilaire/` | OK : toutes les requêtes en 200, aucune 404 |
| 2026-10-27 | 1 | `npm run build:single` | Windows 11 | OK : `dist-single/index.html` unique + ressources copiées |
