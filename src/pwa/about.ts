// Écran « À propos » : obligations de la GPLv3 (auteur d'origine, modifications, licence, code source).
// Ouvert par le bouton « i » à côté du sélecteur de langue.
import { APP_CONFIG } from "../config/app.config";
import { Dialog } from "../documentation/Dialog";
import { getCorner } from "../ui/corner";

declare const APP_VERSION: string;
declare const BUILD_DATE: string;

/** Contenu inséré par Dialog dans un paragraphe : pas de <p> imbriqués, des sauts de ligne. */
function aboutHtml(): string {
    return `<b>${APP_CONFIG.name}</b> — version ${APP_VERSION} (build ${BUILD_DATE})<br>
        ${APP_CONFIG.description}<br><br>
        Basé sur <a href="${APP_CONFIG.upstreamUrl}" target="_blank" rel="noopener">Eendraadschema</a>
        © 2019-2025 ${APP_CONFIG.upstreamAuthor}.<br>
        Modifié par ${APP_CONFIG.modifiedBy} : application installable hors ligne, interface française, tactile, interface LLM.<br><br>
        Logiciel libre sous licence <a href="license.html" target="_blank" rel="noopener">GNU GPL v3</a>, fourni sans garantie.<br>
        Code source : <a href="${APP_CONFIG.sourceUrl}" target="_blank" rel="noopener">${APP_CONFIG.sourceUrl.replace(/^https:\/\//, "")}</a>`;
}

export function showAbout(): void {
    new Dialog("À propos", aboutHtml()).show();
}

/** Bouton « i » en haut à droite, à gauche du sélecteur de langue. Écoute au niveau du document
 *  car main.ts reconstruit le body au démarrage. */
export function initAboutButton(): void {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "about-button notranslate";
    button.setAttribute("aria-label", "À propos");
    button.title = "À propos";
    button.textContent = "i";
    getCorner().prepend(button);
    document.addEventListener("click", (event) => {
        if ((event.target as Element | null)?.closest?.(".about-button")) showAbout();
    });
}
