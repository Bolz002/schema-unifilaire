import { getLanguage } from "../i18n";
import { getSituationPlanManualUrl } from "./manuals";
import "./documentation.css";

function showFrenchHelp(): void {
    const section = document.getElementById("configsection");
    if (!section) return;
    section.innerHTML = `
      <section class="help-page" lang="fr" translate="no" aria-labelledby="help-title">
        <h1 id="help-title">Aide UniSchema</h1>
        <p class="help-intro">Choisissez un guide pour commencer ou retrouver une procédure.
          Les PDF s’ouvrent dans un nouvel onglet, en gardant votre schéma ouvert.</p>
        <div class="help-guides">
          <article class="help-card">
            <p class="help-meta">Pour commencer · 2 pages</p>
            <h2>Démarrage rapide</h2>
            <p>Créez votre premier schéma de maison : éclairage, prises, sauvegarde .eds et PDF.</p>
            <a class="help-link" id="Btn_downloadQuickStart" href="Documentation/guide_demarrage_fr.pdf"
              target="_blank" rel="noopener noreferrer">Ouvrir le guide de démarrage <span class="help-format">PDF</span></a>
          </article>
          <article class="help-card">
            <p class="help-meta">Toutes les fonctions · 31 pages</p>
            <h2>Manuel d’utilisation</h2>
            <p>Installation, interface, circuits, symboles, enregistrement, impression et dépannage.</p>
            <a class="help-link" id="Btn_downloadManual" href="Documentation/manuel_fr.pdf"
              target="_blank" rel="noopener noreferrer">Ouvrir le manuel complet <span class="help-format">PDF</span></a>
          </article>
          <article class="help-card">
            <p class="help-meta">Guide autonome · 9 pages</p>
            <h2>Plan de position</h2>
            <p>Importez votre fond de plan, placez les symboles et préparez les pages à imprimer.</p>
            <a class="help-link" id="Btn_downloadSitPlanManual" href="${getSituationPlanManualUrl()}"
              target="_blank" rel="noopener noreferrer">Ouvrir le guide du plan de position <span class="help-format">PDF</span></a>
          </article>
        </div>
        <p class="help-note">Édition R01 du 28/10/2026. Les emplacements de captures sont indiqués.
          Les parcours à vérifier sur iPad, notamment l’enregistrement .eds et le PDF, portent la mention « À confirmer ».</p>
        <details class="help-originals">
          <summary>Notices d’origine en néerlandais</summary>
          <ul>
            <li><a href="Documentation/edsdoc.pdf" target="_blank" rel="noopener noreferrer" lang="nl">Handleiding ééndraadschema (PDF)</a></li>
            <li><a href="Documentation/sitplandoc.pdf" target="_blank" rel="noopener noreferrer" lang="nl">Werken met het situatieschema (PDF)</a></li>
          </ul>
        </details>
      </section>`;
    globalThis.toggleAppView('config');
}

/* FUNCTION showFilePage
   
   Shows the Documentation-Page.

*/

export function showDocumentationPage() {

    if (getLanguage() === "fr") {
        showFrenchHelp();
        return;
    }

    let strleft = `
    <table border="1px" style="border-collapse:collapse" align="center" width="100%">
      <tr>
        <td width="100%" align="center" bgcolor="LightGrey">
          <b>Handleiding</b>
        </td>
      </tr>
      <tr>
        <td width="100%" align="left">
            <table border=0>
              <tr>
                <td width=100 style="vertical-align:top;padding:5px">
                  <button style="font-size:14px" id="Btn_downloadManual">Eéndraadschema</button>
                </td>
                <td style="vertical-align:top;padding:7px">
                  Een volledige handleiding is beschikbaar in PDF formaat.
                  Klik links om deze in een ander venster te openen.
                  <br>
                  Het programma is in volle ontwikkeling dus delen van de handleiding zijn
                  mogelijk ietwat verouderd.  
                </td>
              </tr>
              <tr>
                <td width=100 style="vertical-align:top;padding:5px">
                  <button style="font-size:14px" id="Btn_downloadSitPlanManual">Situatieschema</button>
                </td>
                <td style="vertical-align:top;padding:7px">
                  Specifiek voor het werken met het situatieschema werd een ander korter document opgesteld.
                  Klik link om deze in een ander venster te openen.
                </td>
              </tr>
            </table>
        </td>
      </tr>
    </table>`;

    const configsection = document.getElementById("configsection");
    if (configsection != null) configsection.innerHTML = strleft;
    globalThis.toggleAppView('config');

    (document.getElementById('Btn_downloadManual') as HTMLElement).onclick = () => { window.open('Documentation/edsdoc.pdf', '_blank') };
    (document.getElementById('Btn_downloadSitPlanManual') as HTMLElement).onclick = () => { window.open('Documentation/sitplandoc.pdf', '_blank') };
}
