// Scénario LLM sur window.UniSchema : lecture, ajout, contrôles, export/import aller-retour.
import { chromium } from "playwright-core";

const URL = process.argv[2] || "http://localhost:4182/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
page.on("dialog", (d) => { console.log("  [dialog]", d.message()); d.dismiss(); });
await page.goto(URL);
await page.waitForFunction(() => !!window.UniSchema, null, { timeout: 15000 });

const result = await page.evaluate(() => {
    const U = window.UniSchema;
    const out = {};
    const tryErr = (fn) => { try { fn(); return "PAS D'ERREUR"; } catch (e) { return e.message; } };
    U.importEds(globalThis.EXAMPLE0);
    out.help = U.help().split("\n")[0];
    out.types = U.listTypes().length;
    const tree = U.getTree({ props: false });
    const flat = []; const walk = (n) => { flat.push(n); n.children.forEach(walk); }; tree.forEach(walk);
    out.treeCount = flat.length;
    const kring = flat.find((n) => n.type === "Kring" && n.children.length < 5 && n.children.length > 0);
    out.kring = { id: kring.id, children: kring.children.length };
    const d = U.describeElement(kring.id);
    out.kringFields = d.fields.slice(0, 6).map((f) => `${f.prop}:${f.kind}:${f.label_fr}`);
    out.kringAllowed = d.allowedChildTypes.length;

    // Ajout d'un point lumineux en fin de circuit, avec propriétés
    const last = kring.children[kring.children.length - 1];
    const lp = U.addElement({ type: "Lichtpunt", refId: last.id, position: "after" });
    const lpDesc = U.describeElement(lp.id);
    out.lpFields = lpDesc.fields.map((f) => f.prop);
    const aantal = lpDesc.fields.find((f) => f.prop === "aantal");
    out.lpAantalOptions = aantal?.options?.map((o) => o.value);
    out.afterSet = U.setProps(lp.id, { aantal: "2", adres: "Cuisine plafond" }).props;

    // Contrôles
    out.errBadType = tryErr(() => U.addElement({ type: "Aansluiting", parentId: kring.id }));
    out.errBadValue = tryErr(() => U.setProps(lp.id, { aantal: "99" }));
    out.errBadProp = tryErr(() => U.setProps(lp.id, { couleur: "rouge" }));
    out.errMissing = tryErr(() => U.getElement(99999));

    // Protection du circuit : disjoncteur différentiel, puis champs dépendants
    out.kringProt = U.setProps(kring.id, { bescherming: "differentieelautomaat" }).props.bescherming;

    // Aller-retour .eds
    const eds = U.exportEds();
    const before = globalThis.structure.toJsonObject(true);
    U.importEds(eds);
    out.roundTripIdentical = globalThis.structure.toJsonObject(true) === before;
    out.edsPrefix = eds.slice(0, 10);
    out.svgLength = U.renderSvg().length;
    U.undo();
    out.undoWorks = true;
    return out;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
