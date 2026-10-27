// Indicateur discret « Hors ligne », affiché seulement quand le réseau manque.
// main.ts reconstruit le contenu du body (document.body.innerHTML += …) pendant le démarrage :
// l'élément est donc recherché, et recréé si besoin, à chaque mise à jour.

const INDICATOR_ID = "pwa-offline-indicator";

function getIndicator(): HTMLElement {
    let indicator = document.getElementById(INDICATOR_ID);
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = INDICATOR_ID;
        indicator.className = "pwa-offline";
        indicator.setAttribute("role", "status");
        indicator.textContent = "Hors ligne";
        document.body.appendChild(indicator);
    }
    return indicator;
}

function updateIndicator(): void {
    getIndicator().hidden = navigator.onLine;
}

export function initOnlineIndicator(): void {
    updateIndicator();
    window.addEventListener("online", updateIndicator);
    window.addEventListener("offline", updateIndicator);
}
