// Traduction à l'affichage : remplace dans le DOM les textes néerlandais de l'app d'origine par leur
// traduction, sans modifier le code d'origine ni les données. Les valeurs des listes déroulantes, qui
// sont enregistrées dans les .eds, restent en néerlandais (contrainte C5 : compatibilité des fichiers).

/** Traduit un texte exact ; renvoie null s'il est inconnu. */
export type Lookup = (text: string) => string | null;

/** Attribut gardant le texte d'origine d'une option (pour le code qui compare option.text). */
export const ORIGINAL_ATTR = "data-i18n-nl";

const TRANSLATED_ATTRIBUTES = ["title", "placeholder", "alt", "aria-label"];
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE"]);
// Ponctuation et espaces autour du texte utile, conservés tels quels (« , Kabel: » → « , Câble : »)
const EDGES = /^([\s,;:.()\-–|*]*)([\s\S]*?)([\s,;:.()\-–|*?!]*)$/;

/** Traduit un texte en conservant la ponctuation et les espaces qui l'entourent. */
export function translateWithEdges(text: string, lookup: Lookup): string | null {
    const exact = lookup(text.trim());
    if (exact !== null) return text.replace(text.trim(), exact);
    const match = EDGES.exec(text);
    if (!match || !match[2]) return null;
    const [, before, core, after] = match;
    const translated = lookup(core.replace(/\s+/g, " "));
    if (translated === null) return null;
    // Typographie française : espace avant « : », « ! » et « ? »
    const frAfter = /^[:!?]/.test(after) && !before.includes(":") ? " " + after : after;
    return before + translated + frAfter;
}

export class DomTranslator {
    private observer: MutationObserver | null = null;
    /** Textes vus mais non traduits (aide à compléter le dictionnaire). */
    readonly missing = new Set<string>();

    /**
     * @param isTranslation - vrai si le texte est déjà une traduction (évite de le relever comme manquant)
     */
    constructor(private readonly lookup: Lookup, private readonly collectMissing = false,
                private readonly isTranslation: (text: string) => boolean = () => false) {}

    start(root: Node = document.body): void {
        this.translateTree(root);
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "characterData") this.translateText(mutation.target as Text);
                else if (mutation.type === "attributes") this.translateElementAttributes(mutation.target as Element);
                else mutation.addedNodes.forEach((node) => this.translateTree(node));
            }
        });
        this.observer.observe(root, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES, "value"],
        });
        // Les fenêtres natives (alert/confirm/prompt) passent aussi par le dictionnaire
        for (const name of ["alert", "confirm", "prompt"] as const) {
            const native = window[name].bind(window) as (message?: unknown, ...rest: unknown[]) => unknown;
            (window as any)[name] = (message?: unknown, ...rest: unknown[]) =>
                native(typeof message === "string" ? this.translateMessage(message) : message, ...rest);
        }
    }

    /** Traduit un message multi-lignes (alert/confirm), ligne par ligne. */
    translateMessage(message: string): string {
        return message.split("\n").map((line) => translateWithEdges(line, this.lookup) ?? this.note(line)).join("\n");
    }

    private note(text: string): string {
        if (!this.collectMissing || !/[A-Za-zÀ-ÿ]{2,}/.test(text)) return text;
        const normalized = text.trim().replace(/\s+/g, " ");
        const core = EDGES.exec(normalized)?.[2] ?? normalized;
        if (!this.isTranslation(core) && !this.isTranslation(normalized)) this.missing.add(normalized);
        return text;
    }

    private isSkipped(element: Element | null): boolean {
        for (let el = element; el; el = el.parentElement) {
            if (SKIPPED_TAGS.has(el.tagName)) return true;
            if (el.namespaceURI === "http://www.w3.org/2000/svg") return true; // dessin : données de l'utilisateur
            if (el.getAttribute("translate") === "no" || el.classList.contains("notranslate")) return true;
            if ((el as HTMLElement).isContentEditable) return true;
        }
        return false;
    }

    private translateTree(node: Node): void {
        if (node.nodeType === Node.TEXT_NODE) { this.translateText(node as Text); return; }
        if (!(node instanceof Element) || this.isSkipped(node)) return;
        this.translateElementAttributes(node);
        node.querySelectorAll("*").forEach((el) => this.translateElementAttributes(el));
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        for (let text = walker.nextNode(); text; text = walker.nextNode()) this.translateText(text as Text);
    }

    private translateText(textNode: Text): void {
        const text = textNode.data;
        if (!text.trim() || this.isSkipped(textNode.parentElement)) return;
        const parent = textNode.parentElement;
        const translated = translateWithEdges(text, this.lookup);
        if (translated === null) { this.note(text); return; }
        if (translated === text) return;
        // Option sans attribut value : sa valeur (enregistrée dans le .eds) est son texte → on la fige en NL
        if (parent instanceof HTMLOptionElement) {
            if (!parent.hasAttribute("value")) parent.setAttribute("value", text.trim());
            if (!parent.hasAttribute(ORIGINAL_ATTR)) parent.setAttribute(ORIGINAL_ATTR, text.trim());
        }
        textNode.data = translated;
    }

    private translateElementAttributes(element: Element): void {
        if (this.isSkipped(element.parentElement) && !(element instanceof HTMLInputElement)) return;
        for (const attr of TRANSLATED_ATTRIBUTES) {
            const value = element.getAttribute(attr);
            if (!value) continue;
            const translated = translateWithEdges(value, this.lookup);
            if (translated !== null && translated !== value) element.setAttribute(attr, translated);
        }
        // Boutons <input type="button|submit"> : le libellé est dans value
        if (element instanceof HTMLInputElement && (element.type === "button" || element.type === "submit")) {
            const translated = translateWithEdges(element.value, this.lookup);
            if (translated === null) this.note(element.value);
            else if (translated !== element.value) element.value = translated;
        }
    }
}
