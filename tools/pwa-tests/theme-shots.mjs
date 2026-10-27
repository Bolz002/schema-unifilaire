// Captures du thème : PC (souris, 1440×900) et tablette (tactile, 1180×820).
import { chromium } from "playwright-core";

const URL = process.argv[2] || "http://localhost:4183/";
const OUT = process.argv[3] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });

for (const [name, options] of [
    ["pc", { viewport: { width: 1440, height: 900 } }],
    ["tablette", { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true }],
]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    page.on("pageerror", (e) => console.log(`  [pageerror ${name}]`, e.message));
    page.on("dialog", (d) => d.dismiss());
    await page.goto(URL);
    await sleep(2000);
    const ok = page.getByRole("button", { name: "OK", exact: true });
    if (await ok.count()) await ok.first().click();
    await page.screenshot({ path: `${OUT}/theme_${name}_1_accueil.png` });
    await page.evaluate(() => globalThis.load_example(1));
    await sleep(1500);
    await page.screenshot({ path: `${OUT}/theme_${name}_2_unifilaire.png` });
    await page.locator("ul#minitabs a", { hasText: "Plan de position" }).click();
    await sleep(1200);
    if (await ok.count()) await ok.first().click();
    await sleep(300);
    await page.screenshot({ path: `${OUT}/theme_${name}_3_plan.png` });
    await page.locator("ul#minitabs a", { hasText: "Imprimer" }).click();
    await sleep(1200);
    await page.screenshot({ path: `${OUT}/theme_${name}_4_imprimer.png` });
    await context.close();
}
await browser.close();
console.log("captures OK");
