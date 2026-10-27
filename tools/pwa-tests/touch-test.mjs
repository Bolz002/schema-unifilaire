// Test tactile (Edge headless, écran tactile émulé type tablette) : appui long, pinch-zoom, mise en page.
import { chromium } from "playwright-core";

const URL = process.argv[2] || "http://localhost:4180/";
const OUT = process.argv[3] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {};

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
const cdp = await context.newCDPSession(page);
const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });

await page.goto(URL);
await sleep(1500);
result.media = await page.evaluate(() => ({
    coarse: matchMedia("(pointer: coarse)").matches,
    hoverNone: matchMedia("(hover: none)").matches,
}));

// Ouvre l'exemple 1 au doigt
await page.evaluate(() => globalThis.load_example(0));
await sleep(1500);
await page.screenshot({ path: `${OUT}/tactile_unifilaire.png` });
result.smallTargets = await page.evaluate(() => {
    const els = [...document.querySelectorAll("button, select, input[type=checkbox], ul#minitabs a")].filter((e) => e.offsetParent);
    const small = els.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 24 || r.width < 24; });
    return { total: els.length, under24px: small.length };
});
result.inputFontSize = await page.evaluate(() => getComputedStyle(document.querySelector("input[type=text], input:not([type])")).fontSize);

// Appui long (700 ms immobile) → contextmenu synthétique
await page.evaluate(() => { window.__ctx = []; document.addEventListener("contextmenu", (e) => window.__ctx.push({ trusted: e.isTrusted, tag: e.target.tagName }), true); });
const tab = await page.locator("ul#minitabs a").first().boundingBox();
await touch("touchStart", [[tab.x + 5, tab.y + 5]]);
await sleep(700);
await touch("touchEnd", []);
await sleep(300);
result.longPress = await page.evaluate(() => window.__ctx);

// Appui court : pas de contextmenu
await page.evaluate(() => { window.__ctx = []; });
await touch("touchStart", [[tab.x + 5, tab.y + 5]]);
await sleep(100);
await touch("touchEnd", []);
await sleep(700);
result.shortTapContextmenus = await page.evaluate(() => window.__ctx.length);

// Plan de position : pinch-zoom écartant les doigts
await page.locator("ul#minitabs a", { hasText: /Situatieschema|Plan de position/ }).tap();
await sleep(1500);
const okButton = page.getByRole("button", { name: "OK" });
if (await okButton.count()) await okButton.first().tap();
await sleep(500);
const canvas = await page.locator("#canvas").boundingBox();
const zoomBefore = await page.evaluate(() => globalThis.structure.sitplanview.zoomfactor);
const cx = canvas.x + canvas.width / 2, cy = canvas.y + canvas.height / 2;
await touch("touchStart", [[cx - 50, cy], [cx + 50, cy]]);
for (let i = 1; i <= 10; i++) { await touch("touchMove", [[cx - 50 - i * 10, cy], [cx + 50 + i * 10, cy]]); await sleep(16); }
await touch("touchEnd", []);
await sleep(300);
const zoomAfter = await page.evaluate(() => globalThis.structure.sitplanview.zoomfactor);
result.pinch = { zoomBefore, zoomAfter, expectedRatio: 3, ratio: +(zoomAfter / zoomBefore).toFixed(2) };
await page.screenshot({ path: `${OUT}/tactile_plan_de_position.png` });

console.log(JSON.stringify(result, null, 2));
await browser.close();
