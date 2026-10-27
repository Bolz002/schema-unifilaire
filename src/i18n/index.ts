// Langue de l'interface (FR par défaut, NL d'origine conservé) et dictionnaire de traduction.
// Le texte néerlandais d'origine sert de clé : le code de l'app d'origine n'est pas modifié.
import { APP_CONFIG } from "../config/app.config";
import { createLogger } from "../utils/logger";
import { DomTranslator, translateWithEdges } from "./domTranslator";
import * as dictionnaireFr from "./fr.json";
import "./i18n.css";
import { getCorner } from "../ui/corner";

const log = createLogger("i18n");

export type Language = "fr" | "nl";
const STORAGE_KEY = "unischema.langue";

interface Dictionary { textes: Record<string, string>; motifs: [string, string][]; }

/** Unités électriques qui précèdent un libellé dans les formulaires d'origine. */
const UNIT_PREFIX = /^(A|mA|kA|V|kV|W|kW|kVA|Hz|mm²|m), (.+)$/;

const dictionaries: Record<Exclude<Language, "nl">, Dictionary> = { fr: dictionnaireFr as unknown as Dictionary };
let translator: DomTranslator | null = null;

export function getLanguage(): Language {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "fr" || stored === "nl") return stored;
    } catch { /* stockage indisponible (navigation privée) : langue par défaut */ }
    return APP_CONFIG.defaultLanguage as Language;
}

/** Change de langue et recharge : le schéma en cours est restauré par l'autosave de l'app. */
export function setLanguage(language: Language): void {
    try { localStorage.setItem(STORAGE_KEY, language); } catch (error) { log.warn("langue non mémorisée", error); }
    location.reload();
}

/** Construit la fonction de recherche : texte exact, puis motifs (textes avec nombres ou noms). */
export function createLookup(dictionary: Dictionary): (text: string) => string | null {
    const patterns = dictionary.motifs.map(([source, replacement]) => [new RegExp(`^${source}$`), replacement] as const);
    const lookup = (text: string): string | null => {
        const exact = dictionary.textes[text];
        if (exact !== undefined) return exact;
        for (const [regex, replacement] of patterns) if (regex.test(text)) return text.replace(regex, replacement);

        // Libellé précédé d'une unité, collé au champ précédent : « A, Fase » → « A, Phase »
        const unit = UNIT_PREFIX.exec(text);
        if (unit) {
            const rest = lookup(unit[2]);
            if (rest !== null) return `${unit[1]}, ${rest}`;
        }
        // Donnée suivie d'un type : « A.1 | Contactdoos » → « A.1 | Prise de courant »
        const separator = text.lastIndexOf(" | ");
        if (separator > 0) {
            const type = lookup(text.slice(separator + 3));
            if (type !== null) return `${text.slice(0, separator + 3)}${type}`;
        }
        return null;
    };
    return lookup;
}

/** Traduction d'un texte isolé (nouveau code UniSchema, PDF…). Renvoie le texte d'origine si inconnu. */
export function t(nlText: string): string {
    const language = getLanguage();
    if (language === "nl") return nlText;
    return translateWithEdges(nlText, createLookup(dictionaries[language])) ?? nlText;
}

function addLanguageSwitch(current: Language): void {
    const container = document.createElement("div");
    container.className = "i18n-switch notranslate";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", "Langue / Taal");
    for (const language of ["fr", "nl"] as const) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.lang = language;
        button.textContent = language.toUpperCase();
        button.setAttribute("aria-pressed", String(language === current));
        container.appendChild(button);
    }
    getCorner().appendChild(container);

    // Écoute au niveau du document : main.ts reconstruit le body (innerHTML +=) au démarrage,
    // ce qui recrée le sélecteur sans ses écouteurs.
    document.addEventListener("click", (event) => {
        const button = (event.target as Element | null)?.closest?.(".i18n-switch button[data-lang]") as HTMLElement | null;
        const language = button?.dataset.lang as Language | undefined;
        if (language && language !== current) setLanguage(language);
    });
}

export function initI18n(): void {
    const language = getLanguage();
    document.documentElement.lang = language;
    addLanguageSwitch(language);
    if (language === "nl") return;

    // Relevé des textes non traduits : actif en développement, ou avec localStorage « unischema.i18n.releve » = 1
    let collect = import.meta.env.DEV;
    try { collect ||= localStorage.getItem("unischema.i18n.releve") === "1"; } catch { /* ignoré */ }

    const translations = new Set(Object.values(dictionaries[language].textes));
    translator = new DomTranslator(createLookup(dictionaries[language]), collect, (text) => translations.has(text));
    translator.start(document.body);
    if (collect) (window as any).__i18nManquants = () => [...translator!.missing].sort();
    log.debug(`interface en ${language}`);
}
