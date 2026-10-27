// Test hors ligne de la PWA UniSchema avec Edge headless (playwright-core).
import { chromium } from "playwright-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL = process.argv[2] || "http://localhost:4173/schema-unifilaire/";
const profile = mkdtempSync(join(tmpdir(), "unischema-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {};

async function open(offline) {
    const ctx = await chromium.launchPersistentContext(profile, { channel: "msedge", headless: true });
    if (offline) await ctx.setOffline(true);
    const page = ctx.pages()[0] || (await ctx.newPage());
    page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log(`  [console ${m.type()}] ${m.text()}`); });
    page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
    return { ctx, page };
}

const cacheCount = (page) => page.evaluate(async () => {
    let n = 0;
    for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length;
    return n;
});

// 1) Premier lancement en ligne : enregistrement du SW et précache
let { ctx, page } = await open(false);
await page.goto(URL);
await page.waitForFunction(() => navigator.serviceWorker.controller !== null || navigator.serviceWorker.getRegistration().then((r) => r?.active), null, { timeout: 15000 });
await sleep(3000);
result.online = {
    title: await page.title(),
    swState: await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    cachedEntries: await cacheCount(page),
};

// 2) Ouverture d'un exemple pour avoir un schéma en mémoire (autosave IndexedDB)
await page.getByRole("button", { name: "Verdergaan met deze optie" }).first().click();
await sleep(6000);
result.online.itemsAfterExample = await page.evaluate(() => globalThis.structure?.data?.length);

// 3) Passage hors ligne et rechargement
await ctx.setOffline(true);
await page.reload();
await sleep(3000);
result.offlineReload = {
    title: await page.title(),
    items: await page.evaluate(() => globalThis.structure?.data?.length),
    offlineIndicatorVisible: await page.evaluate(() => document.getElementById("pwa-offline-indicator")?.hidden === false),
    jsPDFloaded: await page.evaluate(() => typeof window.jspdf),
};
await ctx.close();

// 4) Fermeture complète puis réouverture hors ligne : le schéma doit être retrouvé
({ ctx, page } = await open(true));
await page.goto(URL).catch((e) => (result.reopenGotoError = e.message));
await sleep(4000);
result.offlineReopen = {
    title: await page.title(),
    items: await page.evaluate(() => globalThis.structure?.data?.length),
    bodyStart: (await page.evaluate(() => document.body.innerText)).slice(0, 160).replace(/\s+/g, " "),
};
await ctx.close();

console.log(JSON.stringify(result, null, 2));
