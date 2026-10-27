// API UniSchema pour un LLM (ou un script) : lire et modifier le schéma unifilaire ouvert dans l'app.
// Exposée sur window.UniSchema. Chaque opération passe par les mêmes fonctions que les boutons de
// l'app (types d'enfants autorisés, nombre maximal d'enfants, numérotation, annuler/rétablir, autosave).
// Les valeurs restent celles de l'app d'origine (néerlandais) : ce sont elles qui sont enregistrées dans les .eds.
import type { Electro_Item } from "../List_Item/Electro_Item";
import { EDStoStructure } from "../importExport/importExport";
import { flattenSVGfromString } from "../general";
import { t } from "../i18n";
import { createLogger } from "../utils/logger";
import { PROP_DESCRIPTIONS_FR } from "./props";

const log = createLogger("llm-api");

export const API_VERSION = "1.0";

/** Types proposés à la racine du schéma (même liste que l'app, sans l'entrée vide). */
const ROOT_TYPES = ["Aansluiting", "Zekering/differentieel", "Kring"];
const SEPARATORS = new Set(["", "-", "---", "---------------------------"]);

export type Position = "child" | "after" | "before";

export interface ElementSummary {
    id: number;
    parentId: number;
    type: string;
    type_fr: string;
    props: Record<string, unknown>;
    children?: ElementSummary[];
}

export interface FieldDescription {
    prop: string;
    kind: "text" | "checkbox" | "select";
    value: string | boolean;
    label_nl: string;
    label_fr: string;
    description_fr: string;
    options?: { value: string; label_fr: string }[];
    readonly?: boolean;
}

class UniSchemaError extends Error {
    constructor(message: string) { super(message); this.name = "UniSchemaError"; }
}

function structure(): any {
    const s = (globalThis as any).structure;
    if (!s) throw new UniSchemaError("Aucun schéma chargé dans l'application.");
    return s;
}

function getItem(id: number): Electro_Item {
    const item = structure().getElectroItemById(id) as Electro_Item | null;
    if (!item) throw new UniSchemaError(`Élément ${id} introuvable.`);
    return item;
}

function allowedTypesUnder(parentId: number): string[] {
    const types = parentId === 0 ? ROOT_TYPES : getItem(parentId).allowedChilds();
    return types.filter((type) => !SEPARATORS.has(type));
}

/** Après chaque modification : numérotation, attributs domotique, point d'annulation, redessin si visible. */
function commit(): void {
    const s = structure();
    s.voegAttributenToeAlsNodigEnReSort();
    s.reNumber();
    (globalThis as any).undostruct.store();
    if (s.properties.currentView === "2col") (globalThis as any).HLRedrawTree();
}

function summarize(item: Electro_Item, withProps: boolean): ElementSummary {
    const props = withProps ? JSON.parse(JSON.stringify(item.props)) : {};
    return { id: item.id, parentId: item.parent, type: item.getType() ?? "", type_fr: t(item.getType() ?? ""), props };
}

/** Texte qui précède un champ dans le formulaire de l'app (son libellé). */
function labelBefore(field: Element): string {
    let text = "";
    for (let node = field.previousSibling; node; node = node.previousSibling) {
        if (node.nodeType === Node.TEXT_NODE) text = (node.textContent ?? "") + text;
        else if ((node as Element).id?.startsWith("HL_edit_")) break;
        else text = ((node as HTMLElement).innerText ?? node.textContent ?? "") + text;
        if (/[A-Za-z]{2}/.test(text) && text.includes(":")) break;
    }
    const match = /([^,:]*[A-Za-zÀ-ÿ][^,:]*):?\s*$/.exec(text.replace(/\s+/g, " "));
    return match ? match[1].replace(/^[\s,]+/, "").trim() : "";
}

export const UniSchemaApi = {
    version: API_VERSION,

    /** Mode d'emploi court, destiné au LLM. */
    help(): string {
        return [
            `UniSchema API ${API_VERSION} — schéma unifilaire RGIE.`,
            "Lecture : getTree({props?}), getElement(id), describeElement(id), listTypes(), allowedChildTypes(parentId).",
            "Écriture : addElement({parentId|refId, position, type, props}), setProps(id, props), setType(id, type),",
            "           deleteElement(id), move(id, 'up'|'down'), clone(id), undo(), redo().",
            "Fichiers : exportEds({compressed?}), importEds(text), newSchema(). Dessin : renderSvg().",
            "Règles : les valeurs (type, options des listes) sont les valeurs d'origine en néerlandais, avec leur",
            "traduction dans *_fr. Toujours appeler describeElement(id) avant setProps pour connaître les champs",
            "et valeurs permises. parentId 0 = racine (Aansluiting, Zekering/differentieel, Kring).",
        ].join("\n");
    },

    /** Tous les types d'éléments connus, atteignables depuis la racine. */
    listTypes(): { type: string; type_fr: string }[] {
        const s = structure();
        const seen = new Set<string>();
        const queue = [...ROOT_TYPES];
        while (queue.length) {
            const type = queue.shift()!;
            if (seen.has(type) || SEPARATORS.has(type)) continue;
            seen.add(type);
            const probe = s.createItem(type) as Electro_Item;
            try { for (const child of probe.allowedChilds()) if (!seen.has(child)) queue.push(child); } catch { /* type sans enfants */ }
        }
        return [...seen].sort().map((type) => ({ type, type_fr: t(type) }));
    },

    allowedChildTypes(parentId: number): { type: string; type_fr: string }[] {
        return allowedTypesUnder(parentId).map((type) => ({ type, type_fr: t(type) }));
    },

    /** Arborescence du schéma (éléments actifs). props: false pour une vue compacte. */
    getTree(options: { props?: boolean } = {}): ElementSummary[] {
        const s = structure();
        const withProps = options.props !== false;
        const nodes = new Map<number, ElementSummary>();
        const roots: ElementSummary[] = [];
        for (let i = 0; i < s.length; i++) {
            if (!s.active[i]) continue;
            const item = s.data[i] as Electro_Item;
            if (item.getType?.() === "Container") continue;
            nodes.set(item.id, { ...summarize(item, withProps), children: [] });
        }
        for (const node of nodes.values()) {
            const parent = nodes.get(node.parentId);
            (parent ? parent.children! : roots).push(node);
        }
        return roots;
    },

    getElement(id: number): ElementSummary {
        return summarize(getItem(id), true);
    },

    /** Champs éditables de l'élément tels que l'app les propose (selon son type et ses valeurs actuelles). */
    describeElement(id: number): { id: number; type: string; type_fr: string; allowedChildTypes: string[]; canAddChild: boolean; fields: FieldDescription[] } {
        const item = getItem(id);
        const container = document.createElement("div");
        container.innerHTML = (item as any).toHTML(structure().mode ?? "edit");
        const fields: FieldDescription[] = [];
        container.querySelectorAll<HTMLElement>(`[id^="HL_edit_${id}_"]`).forEach((element) => {
            const prop = element.id.slice(`HL_edit_${id}_`.length);
            if (prop === "type") return; // le type se change avec setType
            const label_nl = labelBefore(element);
            const description_fr = PROP_DESCRIPTIONS_FR[prop] ?? (label_nl ? t(label_nl) : prop);
            const base = { prop, label_nl, label_fr: label_nl ? t(label_nl) : description_fr, description_fr, readonly: (element as HTMLInputElement).disabled || undefined };
            if (element instanceof HTMLSelectElement) {
                const options = Array.from(element.options).filter((o) => !o.disabled).map((o) => ({ value: o.value, label_fr: t(o.value) }));
                fields.push({ ...base, kind: "select", value: element.value, options });
            } else if (element instanceof HTMLInputElement && element.type === "checkbox") {
                fields.push({ ...base, kind: "checkbox", value: element.checked });
            } else if (element instanceof HTMLInputElement) {
                fields.push({ ...base, kind: "text", value: element.value });
            }
        });
        let allowed: string[] = [];
        try { allowed = allowedTypesUnder(id); } catch { /* pas d'enfants */ }
        return { id, type: item.getType(), type_fr: t(item.getType()), allowedChildTypes: allowed, canAddChild: item.checkInsertChild(), fields };
    },

    /**
     * Ajoute un élément.
     * - position "child" (défaut) : sous parentId (0 = racine) ;
     * - position "after" / "before" : à côté de refId, au même niveau.
     */
    addElement(request: { type: string; parentId?: number; refId?: number; position?: Position; props?: Record<string, unknown> }): ElementSummary {
        const s = structure();
        const position = request.position ?? "child";
        const ElectroItemClass = (s.createItem("") as any).constructor;
        let newItem: Electro_Item;

        if (position === "child") {
            const parentId = request.parentId ?? 0;
            const allowed = allowedTypesUnder(parentId);
            if (!allowed.includes(request.type))
                throw new UniSchemaError(`Type « ${request.type} » non autorisé sous l'élément ${parentId}. Types permis : ${allowed.join(", ")}.`);
            if (parentId === 0) {
                newItem = s.addItem(request.type);
                s.reSort();
            } else {
                const parent = getItem(parentId);
                if (!parent.checkInsertChild())
                    throw new UniSchemaError(`L'élément ${parentId} (${t(parent.getType())}) ne peut plus recevoir d'enfant (maximum ${parent.getMaxNumChilds()}).`);
                const placeholder = new ElectroItemClass(s);
                s.insertChildAfterId(placeholder, parentId);
                s.adjustTypeById(placeholder.id, request.type);
                newItem = getItem(placeholder.id);
                s.getElectroItemById(parentId).collapsed = false;
            }
        } else {
            if (request.refId === undefined) throw new UniSchemaError("refId est requis pour position « after » ou « before ».");
            const ref = getItem(request.refId);
            if (!ref.checkInsertSibling()) throw new UniSchemaError(`Impossible d'ajouter un élément à côté de ${request.refId}.`);
            const allowed = allowedTypesUnder(ref.parent);
            if (!allowed.includes(request.type))
                throw new UniSchemaError(`Type « ${request.type} » non autorisé à cet endroit. Types permis : ${allowed.join(", ")}.`);
            const placeholder = new ElectroItemClass(s);
            if (position === "after") s.insertItemAfterId(placeholder, request.refId); else s.insertItemBeforeId(placeholder, request.refId);
            s.reSort();
            s.adjustTypeById(placeholder.id, request.type);
            newItem = getItem(placeholder.id);
        }

        if (request.props) Object.assign(newItem.props, UniSchemaApi.validateProps(newItem.id, request.props));
        commit();
        log.info(`élément ${newItem.id} (${request.type}) ajouté`);
        return summarize(getItem(newItem.id), true);
    },

    /** Vérifie des propriétés contre le formulaire de l'élément ; renvoie les valeurs normalisées. */
    validateProps(id: number, props: Record<string, unknown>): Record<string, unknown> {
        const { fields } = UniSchemaApi.describeElement(id);
        const byProp = new Map(fields.map((field) => [field.prop, field]));
        const result: Record<string, unknown> = {};
        for (const [prop, value] of Object.entries(props)) {
            if (prop === "type") throw new UniSchemaError("Utilisez setType(id, type) pour changer le type.");
            const field = byProp.get(prop);
            if (!field) throw new UniSchemaError(`Propriété « ${prop} » inconnue pour cet élément. Propriétés : ${[...byProp.keys()].join(", ")}.`);
            if (field.readonly) throw new UniSchemaError(`Propriété « ${prop} » en lecture seule (valeur automatique).`);
            if (field.kind === "checkbox") {
                if (typeof value !== "boolean") throw new UniSchemaError(`« ${prop} » attend true ou false.`);
                result[prop] = value;
            } else if (field.kind === "select") {
                const allowed = field.options!.map((o) => o.value);
                if (!allowed.includes(String(value)))
                    throw new UniSchemaError(`Valeur « ${value} » refusée pour « ${prop} ». Valeurs permises : ${allowed.join(", ")}.`);
                result[prop] = String(value);
            } else {
                result[prop] = String(value);
            }
        }
        return result;
    },

    /** Modifie des propriétés. Les champs qui dépendent d'autres (ex. protection) sont revérifiés un par un. */
    setProps(id: number, props: Record<string, unknown>): ElementSummary {
        const item = getItem(id);
        // Un champ peut en faire apparaître d'autres (ex. « bescherming » → « curve ») : on applique dans l'ordre fourni
        for (const [prop, value] of Object.entries(props)) {
            Object.assign(item.props, UniSchemaApi.validateProps(id, { [prop]: value }));
        }
        commit();
        return summarize(getItem(id), true);
    },

    setType(id: number, type: string): ElementSummary {
        const item = getItem(id);
        const allowed = allowedTypesUnder(item.parent);
        if (!allowed.includes(type)) throw new UniSchemaError(`Type « ${type} » non autorisé ici. Types permis : ${allowed.join(", ")}.`);
        structure().adjustTypeById(id, type);
        commit();
        return summarize(getItem(id), true);
    },

    deleteElement(id: number): { deleted: number } {
        getItem(id);
        structure().deleteById(id);
        commit();
        return { deleted: id };
    },

    move(id: number, direction: "up" | "down"): ElementSummary {
        getItem(id);
        if (direction === "up") structure().moveUp(id); else structure().moveDown(id);
        commit();
        return summarize(getItem(id), false);
    },

    clone(id: number): ElementSummary[] {
        getItem(id);
        const before = new Set<number>(structure().id);
        structure().clone(id);
        commit();
        return (structure().id as number[]).filter((newId) => !before.has(newId)).map((newId) => summarize(getItem(newId), false));
    },

    undo(): void { (globalThis as any).undostruct.undo(); },
    redo(): void { (globalThis as any).undostruct.redo(); },

    /** Contenu .eds, identique à « Enregistrer » de l'app. compressed: false → format TXT lisible. */
    exportEds(options: { compressed?: boolean } = {}): string {
        const json: string = structure().toJsonObject(true);
        if (options.compressed === false) return "TXT0040000" + json;
        const pako = (window as any).pako;
        const deflated: Uint8Array = pako.deflate(new TextEncoder().encode(json));
        let binary = "";
        for (let i = 0; i < deflated.length; i += 0x8000) binary += String.fromCharCode(...deflated.subarray(i, i + 0x8000));
        return "EDS0040000" + btoa(binary);
    },

    importEds(text: string): { elements: number } {
        if (!/^(EDS|TXT)\d{3}/.test(text) && !text.trim().startsWith("{")) throw new UniSchemaError("Contenu .eds non reconnu.");
        EDStoStructure(text);
        return { elements: UniSchemaApi.getTree({ props: false }).length };
    },

    /** Nouveau schéma vierge (même départ que l'app : un raccordement). */
    newSchema(): ElementSummary[] {
        EDStoStructure((globalThis as any).EXAMPLE_DEFAULT);
        for (const root of UniSchemaApi.getTree({ props: false })) structure().deleteById(root.id);
        commit();
        return UniSchemaApi.getTree();
    },

    /** Dessin SVG du schéma unifilaire, tel qu'affiché et imprimé. */
    renderSvg(): string {
        return flattenSVGfromString(structure().toSVG(0, "horizontal").data, 10);
    },
};

export type UniSchemaApiType = typeof UniSchemaApi;
