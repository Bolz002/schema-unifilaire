// Expose l'API UniSchema sur window, pour un LLM qui pilote le navigateur ou pour le serveur MCP (tools/mcp).
import { UniSchemaApi } from "./api";

declare global {
    interface Window { UniSchema?: typeof UniSchemaApi; }
}

/** À appeler une fois l'app démarrée (schéma chargé). */
export function installLlmApi(): void {
    window.UniSchema = UniSchemaApi;
    window.dispatchEvent(new CustomEvent("unischema:ready", { detail: { version: UniSchemaApi.version } }));
}
