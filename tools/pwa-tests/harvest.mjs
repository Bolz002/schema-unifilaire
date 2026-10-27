// Relevé des textes affichés et non traduits, en parcourant tous les écrans de l'app.
// Usage : node harvest.mjs <url> <fichier_sortie.json>
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const URL = process.argv[2] || "http://localhost:4181/";
const OUT = process.argv[3] || "manquants.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
page.on("dialog", (d) => d.dismiss());
await page.addInitScript(() => { try { localStorage.setItem("unischema.i18n.releve", "1"); localStorage.setItem("unischema.langue", "fr"); } catch {} });

const TABS = { Nieuw: "Nouveau", Bestand: "Fichier", Situatieschema: "Plan de position", Print: "Imprimer", Documentatie: "Documentation", Info: "Infos" };
const tab = async (name) => { await page.locator("ul#minitabs a", { hasText: new RegExp(`^(${name}|${TABS[name] ?? name})`) }).first().click(); await sleep(900); };
const closePopups = async () => {
    for (const label of ["OK", "Annuleer", "Sluiten", "Cancel", "Annuler", "Fermer"]) {
        const b = page.getByRole("button", { name: label, exact: true });
        if (await b.count()) { await b.first().click().catch(() => {}); await sleep(200); }
    }
    await page.keyboard.press("Escape");
};

await page.goto(URL);
await sleep(2500);
await closePopups();

// Accueil, exemple 1
await tab("Nieuw");
await page.getByRole("button").filter({ hasText: /Verdergaan|Continuer/ }).first().click();
await sleep(1500);
await closePopups();

// Tous les types d'éléments : on change le type du dernier élément d'un circuit
const typeSelectWith = (value) => page.locator(`select:has(option[value="${value}"]), select:has(option:text-is("${value}"))`);
const allTypes = await page.evaluate(() => {
    const select = [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => (o.getAttribute("value") ?? o.text) === "Lichtpunt"));
    return select ? [...select.options].map((o) => o.getAttribute("value") ?? o.getAttribute("data-i18n-nl") ?? o.text) : [];
});
console.log(`${allTypes.length} types d'éléments`);
for (const type of allTypes) {
    const selects = typeSelectWith("Lichtpunt");
    const count = await selects.count();
    if (!count) break;
    await selects.nth(count - 1).selectOption(type).catch((e) => console.log("  type", type, e.message.split("\n")[0]));
    await sleep(350);
    await closePopups();
}

// Toutes les protections (disjoncteur, différentiel, fusible…) sur chaque liste de protection
await page.evaluate(() => globalThis.load_example(0));
await sleep(1500);
const protectionCount = await page.locator("select:has(option[value='differentieelautomaat'])").count();
for (let i = 0; i < protectionCount; i++) {
    const select = page.locator("select:has(option[value='differentieelautomaat'])").nth(i);
    const values = await select.locator("option").evaluateAll((os) => os.map((o) => o.value));
    for (const v of values) {
        await page.locator("select:has(option[value='differentieelautomaat'])").nth(i).selectOption(v).catch(() => {});
        await sleep(300);
    }
}

// Mode de travail « déplacer/cloner »
const modeSelect = page.locator("select:has(option[value='verplaatsen']), select:has(option:text-matches('Verplaatsen', 'i'))").first();
if (await modeSelect.count()) {
    const options = await modeSelect.locator("option").evaluateAll((os) => os.map((o) => o.value));
    for (const o of options) { await modeSelect.selectOption(o).catch(() => {}); await sleep(400); }
}

// Plan de position et ses fenêtres
await tab("Situatieschema");
await closePopups();
for (const label of ["Uit schema|Depuis le schéma", "Los symbool|Symbole libre", "Uit bestand|Depuis un fichier", "Bewerk|Modifier", "Schermvullend|Plein écran"]) {
    const button = page.locator(".icon", { hasText: new RegExp(`^(${label})$`) }).first();
    if (await button.count()) { await button.click().catch(() => {}); await sleep(700); await closePopups(); await sleep(200); }
}

// Autres onglets
for (const name of ["Print", "Bestand", "Documentatie", "Info", "Nieuw"]) { await tab(name); await closePopups(); }

const missing = await page.evaluate(() => window.__i18nManquants ? window.__i18nManquants() : null);
writeFileSync(OUT, JSON.stringify(missing, null, 1), "utf-8");
console.log(`${missing?.length ?? "?"} textes non traduits -> ${OUT}`);
await browser.close();
