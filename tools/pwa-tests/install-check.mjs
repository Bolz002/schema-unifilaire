// Vérifie les critères d'installation PWA avec un profil Edge normal (non privé).
import { chromium } from "playwright-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const URL = process.argv[2] || "http://localhost:4173/";
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "unischema-pc-")), { channel: "msedge", headless: true });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto(URL);
await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === "activated", null, { timeout: 15000 });
await page.reload();
await new Promise((r) => setTimeout(r, 2000));
const cdp = await ctx.newCDPSession(page);
const errors = (await cdp.send("Page.getInstallabilityErrors")).installabilityErrors;
console.log(JSON.stringify({ url: URL, installable: errors.length === 0, errors }));
await ctx.close();
