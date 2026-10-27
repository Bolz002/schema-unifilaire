// Test PC (Edge headless, souris) : installabilité PWA, survol, clic droit, absence d'effets tactiles.
import { chromium } from "playwright-core";

const URL = process.argv[2] || "http://localhost:4173/";
const OUT = process.argv[3] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {};

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
const cdp = await context.newCDPSession(page);

await page.goto(URL);
await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === "activated", null, { timeout: 15000 });
await page.reload();
await sleep(2000);

// Critères d'installation tels que vus par le navigateur
result.installabilityErrors = (await cdp.send("Page.getInstallabilityErrors")).installabilityErrors.map((e) => e.errorId);
result.manifest = await cdp.send("Page.getAppManifest").then((m) => ({ url: m.url, errors: m.errors.length }));

result.media = await page.evaluate(() => ({
    fine: matchMedia("(pointer: fine)").matches,
    hover: matchMedia("(hover: hover)").matches,
}));

// Après rechargement l'app rouvre le dernier schéma (autosave) : on repasse par l'onglet « Nieuw »
await page.locator("ul#minitabs a", { hasText: "Nieuw" }).click();
await sleep(800);
await page.getByRole("button", { name: "Verdergaan met deze optie" }).first().click();
const confirmNew = page.getByRole("button", { name: /^(OK|Ja|Doorgaan)/ });
if (await confirmNew.count()) await confirmNew.first().click();
await sleep(1500);

// Les règles tactiles ne doivent pas s'appliquer à la souris
result.inputFontSize = await page.evaluate(() => getComputedStyle(document.querySelector("input[type=text], input:not([type])")).fontSize);
result.checkboxSize = await page.evaluate(() => { const r = document.querySelector("input[type=checkbox]").getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; });

// Survol des onglets toujours actif à la souris
const tab = page.locator("ul#minitabs a", { hasText: "Print" });
const colorBefore = await tab.evaluate((e) => getComputedStyle(e).color);
await tab.hover();
await sleep(200);
result.hoverChangesTabColor = colorBefore !== (await tab.evaluate((e) => getComputedStyle(e).color));

// Clic droit : un seul contextmenu, natif ; un appui long à la souris n'en crée pas
await page.evaluate(() => { window.__ctx = []; document.addEventListener("contextmenu", (e) => window.__ctx.push(e.isTrusted), true); });
await tab.click({ button: "right" });
await sleep(200);
const box = await tab.boundingBox();
await page.mouse.move(box.x + 5, box.y + 5);
await page.mouse.down();
await sleep(800);
await page.mouse.up();
await sleep(200);
result.contextmenus = await page.evaluate(() => window.__ctx);

// Raccourci clavier Ctrl+Z sur le plan de position ne doit pas lever d'erreur
await page.locator("ul#minitabs a", { hasText: "Situatieschema" }).click();
await sleep(1200);
const ok = page.getByRole("button", { name: "OK" });
if (await ok.count()) await ok.first().click();
await page.keyboard.press("Control+z");
await page.keyboard.press("Meta+z");
await page.screenshot({ path: `${OUT}/pc_plan_de_position.png` });

console.log(JSON.stringify(result, null, 2));
await browser.close();
