// Vérifie qu'un nouveau build déclenche le bandeau de mise à jour, sans rechargement automatique,
// puis que « Recharger » active la nouvelle version. Cas réel : app déjà installée (page contrôlée par le SW).
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";

const URL = "http://localhost:4173/schema-unifilaire/";
const REPO = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bundle = (page) => page.evaluate(() => document.querySelector('script[type=module][src*="assets/main-"]')?.getAttribute("src"));

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.on("console", (m) => { if (m.text().startsWith("recouvert")) console.log(m.text()); });
await page.goto(URL);
await sleep(4000);
await page.reload(); // second lancement
await sleep(3000);
const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
const bundleBefore = await bundle(page);
await page.evaluate(() => { window.__marqueurSansRechargement = true; });

// Nouveau build : BUILD_DATE change à chaque build, donc le hash du bundle et le précache aussi
execSync("npm run build", { cwd: REPO, env: { ...process.env, BASE_PATH: "/schema-unifilaire/", MSYS_NO_PATHCONV: "1" }, stdio: "ignore" });

await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
const bannerShown = await page.waitForSelector("#pwa-update-banner", { timeout: 20000 }).then(() => true, () => false);
const noAutoReload = await page.evaluate(() => window.__marqueurSansRechargement === true);

let reloadedOnClick = false;
if (bannerShown) {
    await Promise.all([
        page.waitForNavigation({ timeout: 15000 }).then(() => (reloadedOnClick = true), () => {}),
        page.getByRole("button", { name: "Recharger" }).click({ timeout: 10000 }),
    ]);
    await sleep(2000);
}
const bundleAfter = await bundle(page);
console.log(JSON.stringify({ controlled, bannerShown, noAutoReload, reloadedOnClick, newBundleLoaded: bundleBefore !== bundleAfter, bundleBefore, bundleAfter }));
await browser.close();
