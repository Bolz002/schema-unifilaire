// Configuration centrale de l'application (nom, couleurs, liens).
// Ce fichier est aussi lu par vite.config.ts : il ne doit dépendre ni du DOM ni du navigateur.

export const APP_CONFIG = {
    /** Nom affiché (manifest, écran d'accueil iPad, titre de la page). */
    name: "UniSchema",
    shortName: "UniSchema",
    description: "Schéma unifilaire et plan de position conformes au RGIE, utilisable hors ligne.",
    /** Langue par défaut de l'interface. */
    defaultLanguage: "fr",
    manifestLanguage: "fr-BE",
    /** Couleurs du manifest ; themeColor = fond de l'icône. */
    themeColor: "#1e3a5f",
    backgroundColor: "#ffffff",
    /** Code source du fork (obligation GPLv3, écran « À propos »). À remplacer par l'URL du fork. */
    sourceUrl: "https://github.com/igoethal/eendraadschema",
    upstreamUrl: "https://github.com/igoethal/eendraadschema",
    upstreamAuthor: "Ivan Goethals",
    modifiedBy: "Quentin Bolsée, 2026",
} as const;
