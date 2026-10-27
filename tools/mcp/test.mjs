// Test du serveur MCP avec un vrai client MCP (stdio), comme le ferait Claude.
// Usage : node tools/mcp/test.mjs   (après « npm run build » à la racine du dépôt)
import { copyFile, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = dirname(fileURLToPath(import.meta.url));
const work = await mkdtemp(join(tmpdir(), "unischema-mcp-"));
const source = join(work, "maison.eds");
await copyFile(resolve(here, "../../examples/example000.eds"), source);

const client = new Client({ name: "test-unischema", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [join(here, "server.mjs")] }));

const call = async (name, args = {}) => {
    const response = await client.callTool({ name, arguments: args });
    const text = response.content[0].text;
    if (response.isError) return { error: text };
    return JSON.parse(text);
};
const check = (label, condition, detail = "") => { console.log(`${condition ? "OK  " : "ÉCHEC"} ${label}${detail ? " — " + detail : ""}`); if (!condition) process.exitCode = 1; };

const tools = (await client.listTools()).tools.map((t) => t.name);
check("outils exposés", tools.length >= 15, tools.join(", "));

const opened = await call("open_schema", { path: source });
check("ouverture .eds", opened.opened === source && opened.elements > 0, `${opened.elements} racine(s)`);

const tree = await call("get_tree", { props: false });
const flat = []; const walk = (n) => { flat.push(n); n.children.forEach(walk); }; tree.forEach(walk);
const kring = flat.find((n) => n.type === "Kring" && n.children.length > 0);
check("lecture arborescence", flat.length > 5 && !!kring, `${flat.length} éléments, circuit ${kring?.id}`);

const description = await call("describe_element", { id: kring.id });
check("description d'un circuit", description.fields.some((f) => f.prop === "bescherming"), description.fields.map((f) => f.prop).join(","));

const last = kring.children[kring.children.length - 1];
const added = await call("add_element", { type: "Contactdoos", refId: last.id, position: "after", props: { aantal: "2", adres: "Bureau" } });
check("ajout d'une prise double", added.type === "Contactdoos" && added.props.aantal === "2", `id ${added.id}`);

const refused = await call("set_props", { id: added.id, props: { aantal: "zéro" } });
check("valeur invalide refusée", !!refused.error, refused.error);

const changed = await call("set_props", { id: kring.id, props: { bescherming: "differentieelautomaat", differentieel_delta_amperage: "30" } });
check("protection du circuit", changed.props.bescherming === "differentieelautomaat" && changed.props.differentieel_delta_amperage === "30");

const saved = await call("save_schema", {});
check("enregistrement + sauvegarde .bak", saved.saved === source && saved.backup === source + ".bak");

const content = await readFile(source, "utf-8");
check("format .eds de l'app", content.startsWith("EDS0040000"));

await call("open_schema", { path: source });
const reopened = await call("get_tree", { props: true });
const flat2 = []; const walk2 = (n) => { flat2.push(n); n.children.forEach(walk2); }; reopened.forEach(walk2);
const again = flat2.find((n) => n.id === added.id);
check("relecture du fichier enregistré", again?.props.adres === "Bureau" && flat2.length === flat.length + 1);

const svg = await call("export_svg", { path: join(work, "maison.svg") });
check("export SVG", svg.bytes > 1000, `${svg.bytes} octets`);

console.log(`Dossier de test : ${work}`);
await client.close();
