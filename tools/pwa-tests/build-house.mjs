// Construit la maison du tutoriel dans l'app (API window.UniSchema), écran iPad, et enregistre .eds + captures.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const URL = process.argv[2] || "http://localhost:4173/";
const OUT = process.argv[3] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("dialog", (d) => { console.log("[dialog]", d.message()); d.dismiss(); });
await page.goto(URL);
await page.waitForFunction(() => !!window.UniSchema);

// 1) Schéma vierge comme dans l'app : Nouveau → Schéma vierge (300 mA, 40 A, 2 phases)
await page.locator("ul#minitabs a", { hasText: "Nouveau" }).click();
await sleep(600);
await page.screenshot({ path: `${OUT}/tuto_1_nouveau.png` });
await page.evaluate(() => {
    document.getElementById("differentieel_droog").value = "300";
    document.getElementById("hoofdzekering").value = "40";
    document.getElementById("aantal_fazen_droog").value = "2";
    globalThis.read_settings();
});
await sleep(1200);
await page.screenshot({ path: `${OUT}/tuto_2_vierge.png` });

const report = await page.evaluate(() => {
    const U = window.UniSchema;
    const flat = () => { const out = []; const walk = (n) => { out.push(n); n.children.forEach(walk); }; U.getTree({ props: true }).forEach(walk); return out; };
    const [raccordement, tableau, diff30, tableauHumide] = flat();

    // Raccordement : câble après compteur
    U.setProps(raccordement.id, { type_kabel_na_teller: "2x16" });

    // Premier enfant avec « ↳ », les suivants avec « ↓ » (après le précédent), comme dans l'app
    const lastChild = {};
    const add = (type, parentId, props) => {
        const el = lastChild[parentId] === undefined
            ? U.addElement({ type, parentId })
            : U.addElement({ type, refId: lastChild[parentId], position: "after" });
        lastChild[parentId] = el.id;
        if (props) U.setProps(el.id, props);
        return el;
    };
    const circuit = (parentId, props, enfants) => {
        const c = add("Kring", parentId);
        U.setProps(c.id, { bescherming: "automatisch" });
        U.setProps(c.id, props);
        for (const [type, p] of enfants) add(type, c.id, p);
        return c.id;
    };
    const cable15 = { kabel_is_aanwezig: true, type_kabel: "XVB 3G1,5", kabel_locatie: "In wand" };
    const cable25 = { kabel_is_aanwezig: true, type_kabel: "XVB 3G2,5", kabel_locatie: "In wand" };

    // Tableau principal (300 mA)
    circuit(tableau.id, { amperage: "16", curve_automaat: "C", tekst: "Éclairage séjour/cuisine", ...cable15 }, [
        ["Lichtpunt", { aantal: "2", adres: "Séjour" }], ["Lichtpunt", { adres: "Cuisine" }], ["Lichtpunt", { adres: "Hall" }]]);
    circuit(tableau.id, { amperage: "20", curve_automaat: "C", tekst: "Prises séjour", ...cable25 }, [
        ["Contactdoos", { aantal: "2", adres: "Séjour TV" }], ["Contactdoos", { aantal: "2", adres: "Séjour canapé" }], ["Contactdoos", { adres: "Hall" }]]);
    circuit(tableau.id, { amperage: "20", curve_automaat: "C", tekst: "Prises cuisine", ...cable25 }, [
        ["Contactdoos", { aantal: "2", adres: "Plan de travail" }], ["Koelkast", { adres: "Frigo" }], ["Microgolfoven", { adres: "Cuisine" }]]);
    circuit(tableau.id, { amperage: "32", curve_automaat: "C", tekst: "Cuisinière", kabel_is_aanwezig: true, type_kabel: "XVB 3G6", kabel_locatie: "In wand" }, [
        ["Kookfornuis", { adres: "Cuisine" }]]);
    circuit(tableau.id, { amperage: "16", curve_automaat: "C", tekst: "Éclairage étage", ...cable15 }, [
        ["Lichtpunt", { adres: "Chambre 1" }], ["Lichtpunt", { adres: "Chambre 2" }], ["Lichtpunt", { adres: "Palier" }]]);

    // Tableau pièces humides (différentiel 30 mA)
    circuit(tableauHumide.id, { amperage: "20", curve_automaat: "C", tekst: "Lave-linge", ...cable25 }, [["Wasmachine", { adres: "Buanderie" }]]);
    circuit(tableauHumide.id, { amperage: "20", curve_automaat: "C", tekst: "Sèche-linge", ...cable25 }, [["Droogkast", { adres: "Buanderie" }]]);
    circuit(tableauHumide.id, { amperage: "20", curve_automaat: "C", tekst: "Lave-vaisselle", ...cable25 }, [["Vaatwasmachine", { adres: "Cuisine" }]]);
    circuit(tableauHumide.id, { amperage: "16", curve_automaat: "C", tekst: "Salle de bain", ...cable25 }, [
        ["Lichtpunt", { adres: "SDB", is_halfwaterdicht: true }], ["Contactdoos", { adres: "SDB lavabo", is_halfwaterdicht: true }]]);

    const all = flat();
    return { elements: all.length, circuits: all.filter((n) => n.type === "Kring").map((n) => `${n.props.naam || "?"} ${n.props.amperage}A ${n.props.tekst ?? ""}`) };
});
console.log(JSON.stringify(report, null, 1));

await page.locator("ul#minitabs a", { hasText: "Schéma unifilaire" }).click();
await sleep(1500);
await page.screenshot({ path: `${OUT}/tuto_3_maison_arbre.png` });
// Dessin seul (colonne de droite) en grand
const drawing = page.locator("#right_col_inner #EDS");
await drawing.screenshot({ path: `${OUT}/tuto_4_maison_dessin.png` });
writeFileSync(`${OUT}/exemple_maison.eds`, await page.evaluate(() => window.UniSchema.exportEds()), "utf-8");
await browser.close();
