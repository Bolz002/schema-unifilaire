// Indicateur discret « Hors ligne », affiché seulement quand le réseau manque.

function updateIndicator(indicator: HTMLElement): void {
    indicator.hidden = navigator.onLine;
}

export function initOnlineIndicator(): void {
    const indicator = document.createElement("div");
    indicator.id = "pwa-offline-indicator";
    indicator.className = "pwa-offline";
    indicator.setAttribute("role", "status");
    indicator.textContent = "Hors ligne";
    document.body.appendChild(indicator);

    updateIndicator(indicator);
    window.addEventListener("online", () => updateIndicator(indicator));
    window.addEventListener("offline", () => updateIndicator(indicator));
}
