// Plugin Vite : copie dans dist/ les ressources chargées hors bundle
// (scripts classiques, images, documentation…), pour que dist/ soit autonome.
// On copie plutôt que de déplacer les dossiers dans public/, afin de garder
// l'arborescence de l'upstream intacte et les merges simples.
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Chemins relatifs à la racine du projet, copiés tels quels dans dist/. */
export const STATIC_ASSETS = [
    "prop/prop_scripts_js.js",
    "resources",
    "gif",
    "examples",
    "Documentation",
    "favicon.ico",
    "license.html",
    "LICENSE.md",
];

export function copyStaticAssets(assets: string[] = STATIC_ASSETS): Plugin {
    let rootDir = "";
    let outDir = "";
    return {
        name: "copy-static-assets",
        apply: "build",
        configResolved(config) {
            rootDir = config.root;
            outDir = resolve(config.root, config.build.outDir);
        },
        // writeBundle (et non closeBundle) : les fichiers doivent exister avant que
        // vite-plugin-pwa ne liste dist/ pour le précache du service worker.
        writeBundle() {
            for (const asset of assets) {
                const source = resolve(rootDir, asset);
                if (!existsSync(source)) {
                    // Une ressource manquante casserait l'app hors ligne : on arrête le build.
                    throw new Error(`[copy-static-assets] ressource introuvable : ${asset}`);
                }
                cpSync(source, resolve(outDir, asset), { recursive: true });
            }
            console.log(`[copy-static-assets] ${assets.length} ressources copiées dans ${outDir}`);
        },
    };
}
