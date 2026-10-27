// Interface FR : captures des écrans, .eds identiques FR/NL après les mêmes manipulations, sélecteur de langue.
import { chromium } from "playwright-core";

const URL = process.argv[2] || "http://localhost:4181/";
const OUT = process.argv[3] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {};
const browser = await chromium.launch({ channel: "msedge", headless: true });

/** Même scénario dans une langue donnée ; renvoie le JSON .eds produit par l'app. */
async function scenario(language, screenshots) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on("pageerror", (e) => console.log(`  [pageerror ${language}]`, e.message));
    page.on("dialog", (d) => { result.dialogs = [...(result.dialogs ?? []), d.type()]; d.type() === "beforeunload" ? d.accept() : d.dismiss(); });
    await page.addInitScript((lang) => { try { if (!sessionStorage.getItem("init")) { localStorage.setItem("unischema.langue", lang); sessionStorage.setItem("init", "1"); } } catch {} }, language);
    await page.goto(URL);
    await sleep(2000);
    if (screenshots) await page.screenshot({ path: `${OUT}/fr_1_accueil.png` });
    await page.evaluate(() => globalThis.load_example(0));
    await sleep(1500);

    // Manipulations dans les listes déroulantes (valeurs enregistrées dans le .eds)
    const protection = page.locator("select:has(option[value='differentieelautomaat'])").first();
    await protection.selectOption("differentieelautomaat");
    await sleep(500);
    const types = page.locator("select:has(option[value='Lichtpunt'])");
    await types.nth((await types.count()) - 1).selectOption("Lichtpunt");
    await sleep(500);
    if (screenshots) await page.screenshot({ path: `${OUT}/fr_2_unifilaire.png` });

    const eds = await page.evaluate(() => globalThis.structure.toJsonObject(true));
    if (screenshots) {
        for (const [name, file] of [["Plan de position", "fr_3_plan.png"], ["Imprimer", "fr_4_imprimer.png"], ["Fichier", "fr_5_fichier.png"]]) {
            await page.locator("ul#minitabs a", { hasText: name }).first().click();
            await sleep(1200);
            const ok = page.getByRole("button", { name: "OK", exact: true });
            if (await ok.count()) await ok.first().click();
            await sleep(300);
            await page.screenshot({ path: `${OUT}/${file}` });
        }
        // Sélecteur de langue : passage en NL puis retour en FR
        await page.locator(".i18n-switch button", { hasText: "NL" }).click();
        await page.waitForLoadState("load");
        await sleep(2000);
        result.afterSwitchToNL = await page.locator("ul#minitabs a").first().innerText();
        await page.locator(".i18n-switch button", { hasText: "FR" }).click();
        await page.waitForLoadState("load");
        await sleep(2000);
        result.afterSwitchToFR = await page.locator("ul#minitabs a").first().innerText();
    }
    await page.close();
    return eds;
}

const edsFr = await scenario("fr", true);
const edsNl = await scenario("nl", false);
result.edsIdentical = edsFr === edsNl;
result.edsLength = edsFr.length;
result.frenchWordsInEds = ["Point lumineux", "Prise de courant", "disjoncteur", "Tableau", "Circuit"].filter((w) => edsFr.includes(`"${w}"`));
result.nlValuesInEds = ["Lichtpunt", "differentieelautomaat", "Kring", "Bord"].filter((w) => edsFr.includes(`"${w}"`));
console.log(JSON.stringify(result, null, 2));
await browser.close();
