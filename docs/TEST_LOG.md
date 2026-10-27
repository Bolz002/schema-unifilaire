# Journal des tests

| Date | Phase | Test | Environnement | Résultat |
|---|---|---|---|---|
| 2026-10-27 | 0 | App d'origine en local, exemples, plan de position, PDF, build | Windows 11, navigateur intégré (Chromium), Node 24.20 | OK, détails dans [BASELINE.md](BASELINE.md) |
| 2026-10-27 | 1 | `rm -rf node_modules/.vite && npm run build`, puis `vite preview --base /schema-unifilaire/` : exemple 1, plan de position, PDF, manuel PDF, `.eds`, licence, images | Windows 11, navigateur intégré, `BASE_PATH=/schema-unifilaire/` | OK : toutes les requêtes en 200, aucune 404 |
| 2026-10-27 | 1 | `npm run build:single` | Windows 11 | OK : `dist-single/index.html` unique + ressources copiées |
| 2026-10-27 | 2 | `offline-test.mjs` : 1er lancement en ligne (SW activé, 27 réponses en cache), exemple 1 chargé, passage hors ligne + rechargement, puis fermeture et réouverture hors ligne | Edge headless (playwright-core 1.56.1), `vite preview --base /schema-unifilaire/` | OK : app et schéma (19 éléments) présents hors ligne, indicateur « Hors ligne » visible, jsPDF chargé |
| 2026-10-27 | 2 | `update-test.mjs` : app contrôlée par le SW, nouveau build, vérification de mise à jour | idem | OK : bandeau affiché, pas de rechargement automatique, « Recharger » charge le nouveau bundle. Défaut corrigé : bandeau non cliquable quand une fenêtre de l'app est ouverte (`pointer-events`) |
| 2026-10-27 | 2 | Stockage persistant | Edge headless | Refusé par le navigateur (attendu hors installation) ; à revérifier sur iPad installé |
| 2026-10-27 | 2 | Lighthouse installabilité | — | **Non fait** ; navigateur intégré Claude incompatible avec les service workers |
