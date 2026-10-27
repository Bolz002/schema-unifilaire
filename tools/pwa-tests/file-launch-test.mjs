// Simule l'ouverture d'un .eds par double-clic (API launchQueue) : sans et avec travail non enregistré.
import { chromium } from "playwright-core";

const URL = process.argv[2] || "http://localhost:4180/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {};

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

// launchQueue intercepté avant le chargement de l'app ; le test pilote le consommateur
await page.addInitScript(() => {
    // Edge a un launchQueue natif en lecture seule : on intercepte son setConsumer
    if (window.LaunchQueue) {
        const native = LaunchQueue.prototype.setConsumer;
        LaunchQueue.prototype.setConsumer = function (fn) { window.__launchConsumer = fn; return native.call(this, fn); };
    } else {
        window.launchQueue = { setConsumer: (fn) => { window.__launchConsumer = fn; } };
    }
    window.__launch = async (url, name) => {
        const text = await (await fetch(url)).text();
        const handle = { kind: "file", name, getFile: async () => new File([text], name) };
        window.__launchConsumer({ files: [handle] });
    };
});

await page.goto(URL);
await page.waitForFunction(() => typeof window.__launchConsumer === "function", null, { timeout: 15000 });
result.consumerRegistered = true;

const state = () => page.evaluate(() => ({
    items: globalThis.structure?.data?.length,
    filename: globalThis.structure?.properties?.filename,
    handleName: globalThis.fileAPIobj?.fileHandle?.name ?? null,
    dialog: document.getElementById("popupOverlay")?.innerText?.replace(/\s+/g, " ").slice(0, 120) ?? null,
}));

// 1) Pas de modification en cours → ouverture directe
await page.evaluate(() => globalThis.autoSaver.saveManually && globalThis.autoSaver.saveManually());
await page.evaluate(() => window.__launch("examples/example001.eds", "Maison_test.eds"));
await sleep(1500);
result.direct = await state();

// 2) Modifications non enregistrées → dialogue ; « Annuler » ne change rien
await page.evaluate(() => globalThis.autoSaver.forceHasChangesSinceLastManualSave());
await page.evaluate(() => window.__launch("examples/example000.eds", "Autre.eds"));
await sleep(800);
result.withChanges_dialog = (await state()).dialog;
await page.getByRole("button", { name: "Annuler" }).click();
await sleep(500);
result.afterCancel = await state();

// 3) Même cas, « Ouvrir » charge le fichier
await page.evaluate(() => window.__launch("examples/example000.eds", "Autre.eds"));
await sleep(800);
await page.getByRole("button", { name: "Ouvrir" }).click();
await sleep(1500);
result.afterOpen = await state();

console.log(JSON.stringify(result, null, 2));
await browser.close();
