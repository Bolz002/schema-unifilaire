#!/usr/bin/env node
// Serveur MCP UniSchema : permet à Claude (Code ou Desktop) de lire et modifier des schémas unifilaires .eds.
// Transport stdio. Les opérations passent par l'API de l'app (window.UniSchema), donc par ses propres règles.
// Usage : node tools/mcp/server.mjs [--dist <dossier du build>]   (par défaut : ../../dist)
import { copyFile, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { UniSchemaApp } from "./app.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const distArg = process.argv.indexOf("--dist");
const distDir = distArg > 0 ? process.argv[distArg + 1] : resolve(here, "../../dist");

const app = new UniSchemaApp(distDir);
let currentFile = null; // fichier .eds ouvert

const json = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 1) }] });
const fail = (error) => ({ isError: true, content: [{ type: "text", text: error.message ?? String(error) }] });
const tool = (handler) => async (args) => { try { return json(await handler(args ?? {})); } catch (error) { return fail(error); } };

const server = new McpServer(
    { name: "unischema", version: "0.1.0" },
    {
        instructions: [
            "UniSchema : schémas unifilaires électriques belges (RGIE), fichiers .eds.",
            "Démarche : open_schema (ou new_schema) → get_tree → describe_element(id) avant toute modification",
            "→ add_element / set_props → save_schema. Les valeurs de type et d'options sont celles de l'app d'origine",
            "(néerlandais), avec leur traduction dans *_fr : toujours envoyer la valeur, jamais la traduction.",
            "parentId 0 = racine. Rien n'est écrit sur disque avant save_schema.",
        ].join(" "),
    },
);

server.registerTool("open_schema", {
    description: "Ouvre un fichier .eds (chemin absolu). Il devient le fichier courant.",
    inputSchema: { path: z.string().describe("Chemin absolu du fichier .eds") },
}, tool(async ({ path }) => {
    const text = await readFile(path, "utf-8");
    const result = await app.call("importEds", text);
    currentFile = resolve(path);
    return { opened: currentFile, ...result, help: await app.call("help") };
}));

server.registerTool("new_schema", {
    description: "Commence un schéma vierge (non enregistré ; utiliser save_schema avec un chemin).",
    inputSchema: {},
}, tool(async () => { currentFile = null; return { tree: await app.call("newSchema") }; }));

server.registerTool("get_tree", {
    description: "Arborescence du schéma : id, parentId, type (valeur) et type_fr, propriétés (sauf si props=false), enfants.",
    inputSchema: { props: z.boolean().optional().describe("false pour une vue compacte sans propriétés") },
}, tool(async ({ props }) => app.call("getTree", { props: props !== false })));

server.registerTool("get_element", {
    description: "Un élément avec toutes ses propriétés.",
    inputSchema: { id: z.number().int() },
}, tool(async ({ id }) => app.call("getElement", id)));

server.registerTool("describe_element", {
    description: "Champs modifiables d'un élément (nom, sorte, valeur actuelle, valeurs permises, description FR), types d'enfants autorisés. À appeler avant set_props.",
    inputSchema: { id: z.number().int() },
}, tool(async ({ id }) => app.call("describeElement", id)));

server.registerTool("list_types", {
    description: "Tous les types d'éléments (valeur NL et traduction FR).",
    inputSchema: {},
}, tool(async () => app.call("listTypes")));

server.registerTool("allowed_child_types", {
    description: "Types autorisés sous un parent (0 = racine).",
    inputSchema: { parentId: z.number().int() },
}, tool(async ({ parentId }) => app.call("allowedChildTypes", parentId)));

server.registerTool("add_element", {
    description: "Ajoute un élément. position « child » (défaut) sous parentId ; « after »/« before » à côté de refId. props facultatives, vérifiées comme dans le formulaire de l'app.",
    inputSchema: {
        type: z.string().describe("Valeur du type, ex. « Lichtpunt », « Contactdoos », « Kring »"),
        parentId: z.number().int().optional(),
        refId: z.number().int().optional(),
        position: z.enum(["child", "after", "before"]).optional(),
        props: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    },
}, tool(async (request) => app.call("addElement", request)));

server.registerTool("set_props", {
    description: "Modifie des propriétés d'un élément (appliquées dans l'ordre : une protection peut faire apparaître d'autres champs).",
    inputSchema: { id: z.number().int(), props: z.record(z.union([z.string(), z.number(), z.boolean()])) },
}, tool(async ({ id, props }) => app.call("setProps", id, props)));

server.registerTool("set_type", {
    description: "Change le type d'un élément (réinitialise ses propriétés).",
    inputSchema: { id: z.number().int(), type: z.string() },
}, tool(async ({ id, type }) => app.call("setType", id, type)));

server.registerTool("delete_element", {
    description: "Supprime un élément et ses enfants.",
    inputSchema: { id: z.number().int() },
}, tool(async ({ id }) => app.call("deleteElement", id)));

server.registerTool("move_element", {
    description: "Déplace un élément d'un cran parmi ses frères.",
    inputSchema: { id: z.number().int(), direction: z.enum(["up", "down"]) },
}, tool(async ({ id, direction }) => app.call("move", id, direction)));

server.registerTool("clone_element", {
    description: "Duplique un élément et ses enfants.",
    inputSchema: { id: z.number().int() },
}, tool(async ({ id }) => app.call("clone", id)));

server.registerTool("undo", {
    description: "Annule la dernière modification.",
    inputSchema: {},
}, tool(async () => { await app.call("undo"); return { undone: true }; }));

server.registerTool("save_schema", {
    description: "Enregistre le schéma en .eds (format de l'app, lisible par l'original). Sans chemin : fichier courant. Un fichier existant est d'abord copié en .bak.",
    inputSchema: { path: z.string().optional().describe("Chemin absolu .eds ; par défaut le fichier ouvert") },
}, tool(async ({ path }) => {
    const target = path ? resolve(path) : currentFile;
    if (!target) throw new Error("Aucun fichier courant : indiquer un chemin.");
    if (!target.toLowerCase().endsWith(".eds")) throw new Error("Le chemin doit se terminer par .eds");
    if (await stat(target).catch(() => null)) await copyFile(target, target + ".bak");
    await writeFile(target, await app.call("exportEds"), "utf-8");
    currentFile = target;
    return { saved: target, backup: (await stat(target + ".bak").catch(() => null)) ? target + ".bak" : null };
}));

server.registerTool("export_svg", {
    description: "Enregistre le dessin du schéma unifilaire en SVG (chemin absolu .svg).",
    inputSchema: { path: z.string() },
}, tool(async ({ path }) => {
    if (!path.toLowerCase().endsWith(".svg")) throw new Error("Le chemin doit se terminer par .svg");
    const svg = await app.call("renderSvg");
    await writeFile(path, svg, "utf-8");
    return { saved: resolve(path), bytes: svg.length };
}));

const transport = new StdioServerTransport();
await server.connect(transport);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await app.stop(); process.exit(0); });
process.stdin.on("close", async () => { await app.stop(); process.exit(0); });
