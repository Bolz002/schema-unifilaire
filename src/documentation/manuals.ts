import { getLanguage } from "../i18n";

/** Keep the contextual plan help and the Help tab on the same language-specific PDF. */
export function getSituationPlanManualUrl(): string {
    return getLanguage() === "fr"
        ? "Documentation/plan_position_fr.pdf"
        : "Documentation/sitplandoc.pdf";
}
