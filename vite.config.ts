import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";
import { copyStaticAssets } from "./build/copyStaticAssets";
import { APP_CONFIG } from "./src/config/app.config";

const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

// Version de l'app, lue dans package.json (source unique).
const APP_VERSION = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")).version;

// Remplace %APP_NAME% et %APP_THEME_COLOR% dans index.html (nom défini dans app.config.ts uniquement).
const injectAppConfigInHtml = (): Plugin => ({
    name: "inject-app-config-html",
    transformIndexHtml: (html) => html
        .replace(/%APP_NAME%/g, APP_CONFIG.name)
        .replace(/%APP_THEME_COLOR%/g, APP_CONFIG.themeColor),
});

// PWA : manifest + service worker Workbox qui précache toute l'app (hors ligne sur chantier).
// registerType « prompt » : la mise à jour attend l'accord de l'utilisateur (bandeau).
const pwaPlugin = () => VitePWA({
    registerType: "prompt",
    injectRegister: false, // enregistrement fait dans src/pwa/registerSW.ts
    includeManifestIcons: false, // déjà couvertes par globPatterns
    manifest: {
        name: APP_CONFIG.name,
        short_name: APP_CONFIG.shortName,
        description: APP_CONFIG.description,
        lang: APP_CONFIG.manifestLanguage,
        display: "standalone",
        orientation: "any",
        start_url: ".",
        scope: ".",
        theme_color: APP_CONFIG.themeColor,
        background_color: APP_CONFIG.backgroundColor,
        icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    },
    workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,ico,json,webmanifest,eds,pdf}"],
        globIgnores: ["**/*.map"],
        // Marge au-dessus de la limite par défaut (2 Mo par fichier) pour jsPDF et les manuels PDF
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
    },
});

// Mode « single » (npm run build:single) : ancien build en un seul index.html,
// utile hors ligne en simple fichier, mais pas pour la PWA.
// BASE_PATH : chemin de publication, par ex. /schema-unifilaire/ pour GitHub Pages ; / en local.
export default defineConfig(({ mode }) => {
    const singleFile = mode === "single";
    return {
        base: process.env.BASE_PATH || "/",
        // Test sur tablette via « tailscale serve » (adresse privée *.ts.net) : voir docs/TEST_TABLETTES.md
        preview: { allowedHosts: [".ts.net"] },
        define: {
            BUILD_DATE: JSON.stringify(formatDate()), // Injects current date/time
            APP_VERSION: JSON.stringify(APP_VERSION),
        },
        build: {
            target: "es2017", // Match your tsconfig.json
            outDir: singleFile ? "dist-single" : "dist",
            emptyOutDir: true,
            manifest: false, // We handle this ourselves, not through Vite
            rollupOptions: {
                input: {
                    main: 'index.html'
                },
                output: singleFile
                    ? {
                        inlineDynamicImports: true, // Forces everything into one file
                        format: "esm",              // Keeps ES module format
                        entryFileNames: "bundle.js" // Generates `bundle.js`
                    }
                    : { format: "esm" }
            }
        },
        plugins: singleFile
            ? [injectAppConfigInHtml(), viteSingleFile(), copyStaticAssets()]
            : [injectAppConfigInHtml(), copyStaticAssets(), pwaPlugin()]
    };
});
