# Baseline — application d'origine, sans modification

Relevé du 27/10/2026, avant toute modification du fork.

- Source : `igoethal/eendraadschema`, branche `master`, commit `a14513e` du 18/09/2025.
- Environnement : Windows 11, Node.js 24.20.0, npm 11.19.0, Vite 6.3.5.
- Lancement : `npm ci` puis `npm run dev` (http://localhost:5173).

## Fonctions vérifiées

| Fonction | Résultat | Preuve |
|---|---|---|
| Page d'accueil (Nieuw) et choix d'un exemple | OK | aucune erreur console |
| Schéma unifilaire (Eéndraadschema) : arbre + dessin SVG | OK | [capture](baseline/01_unifilaire_exemple1.jpg) |
| Plan de position (Situatieschema) : barre d'outils et page vide | OK | [capture](baseline/02_plan_de_position.jpg) |
| Impression : « Genereer PDF » | OK | message « PDF is klaar », aucune erreur |
| Ouverture `.eds` : `examples/example000.eds` et `example001.eds` via `EDStoStructure` | OK | 19 et 31 éléments chargés |
| Build de production `npm run build` | OK | `dist/index.html` 373 ko, un seul fichier |

## Non vérifié dans cette baseline

- Création manuelle d'un circuit, ajout d'éléments et placement de symboles sur le plan de position : pas testés à la main, seulement par chargement des exemples.
- Sauvegarde `.eds` vers le disque et autosave IndexedDB après rechargement.
- Comportement sur iPad (aucun test tactile à ce stade).

## Constats utiles pour la suite

- Le build signale 4 scripts non intégrés (`prop/prop_scripts_js.js`, `pako`, `jsPDF`, `print.js`) ; `dist/` ne contient que `index.html`. À corriger en phase 1.
- `tsc` sert uniquement au contrôle de types (`noEmit`) ; Vite résout `src/main.js` vers `main.ts`.
- Aucun `.gitignore` dans l'upstream : ajouté (`node_modules/`, `dist/`).
