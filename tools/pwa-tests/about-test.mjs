import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on("pageerror", (e) => console.log("[pageerror]", e.message));
await p.goto("http://localhost:4173/"); await new Promise(r => setTimeout(r, 2000));
await p.locator(".about-button").click(); await new Promise(r => setTimeout(r, 500));
console.log(await p.evaluate(() => document.getElementById("popup")?.innerText));
await p.screenshot({ path: "about.png" });
await b.close();
