import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";
import { copyStaticAssets } from "./build/copyStaticAssets";

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

// Mode « single » (npm run build:single) : ancien build en un seul index.html,
// utile hors ligne en simple fichier, mais pas pour la PWA.
// BASE_PATH : chemin de publication, par ex. /schema-unifilaire/ pour GitHub Pages ; / en local.
export default defineConfig(({ mode }) => {
    const singleFile = mode === "single";
    return {
        base: process.env.BASE_PATH || "/",
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
        plugins: singleFile ? [viteSingleFile(), copyStaticAssets()] : [copyStaticAssets()]
    };
});
