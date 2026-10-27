// Pilote l'app UniSchema (build dist/) dans un Edge ou Chrome invisible et appelle window.UniSchema.
// Toute la logique métier reste celle de l'app : ce module ne fait que transmettre les appels.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const MIME = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
    ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
    ".pdf": "application/pdf", ".eds": "text/plain", ".md": "text/plain",
};

/** Petit serveur statique local (127.0.0.1, port libre) pour dist/. */
async function serveDirectory(root) {
    const server = createServer(async (request, response) => {
        try {
            const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
            let file = normalize(join(root, path));
            if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
            if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, "index.html");
            const body = await readFile(file);
            response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" }).end(body);
        } catch {
            response.writeHead(404).end();
        }
    });
    await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
    return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

async function launchBrowser() {
    const errors = [];
    for (const channel of ["msedge", "chrome"]) {
        try { return await chromium.launch({ channel, headless: true }); } catch (error) { errors.push(`${channel}: ${error.message.split("\n")[0]}`); }
    }
    throw new Error(`Aucun navigateur Edge ou Chrome utilisable.\n${errors.join("\n")}`);
}

export class UniSchemaApp {
    /** @param {string} distDir dossier du build de l'app (npm run build) */
    constructor(distDir) {
        this.distDir = resolve(distDir);
        this.page = null;
    }

    async start() {
        await stat(join(this.distDir, "index.html")).catch(() => {
            throw new Error(`Build introuvable dans ${this.distDir}. Lancer « npm run build » dans le dépôt UniSchema.`);
        });
        const { server, url } = await serveDirectory(this.distDir);
        this.server = server;
        this.browser = await launchBrowser();
        // Contexte jetable : pas de service worker ni d'autosave partagés avec l'app de l'utilisateur
        this.context = await this.browser.newContext({ serviceWorkers: "block" });
        this.page = await this.context.newPage();
        this.page.on("dialog", (dialog) => { this.lastDialog = dialog.message(); dialog.dismiss().catch(() => {}); });
        await this.page.addInitScript(() => { try { localStorage.setItem("unischema.langue", "fr") /* libellés *_fr ; les valeurs restent en NL */; } catch {} });
        await this.page.goto(url);
        await this.page.waitForFunction(() => !!window.UniSchema, null, { timeout: 30000 });
    }

    /** Appelle window.UniSchema[method](...args) ; les erreurs de l'API remontent avec leur message. */
    async call(method, ...args) {
        if (!this.page) await this.start();
        this.lastDialog = null;
        const result = await this.page.evaluate(([name, params]) => {
            try { return { ok: true, value: window.UniSchema[name](...params) }; }
            catch (error) { return { ok: false, error: error.message }; }
        }, [method, args]);
        if (!result.ok) throw new Error(result.error);
        if (this.lastDialog) throw new Error(`L'app a signalé : ${this.lastDialog}`);
        return result.value;
    }

    async stop() {
        await this.browser?.close().catch(() => {});
        this.server?.close();
    }
}
