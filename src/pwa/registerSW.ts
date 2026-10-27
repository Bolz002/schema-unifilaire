/// <reference types="vite-plugin-pwa/client" />
// Enregistrement du service worker et bandeau « Nouvelle version disponible ».
// Jamais de rechargement automatique : un schéma en cours ne doit pas être perdu.
import { registerSW } from "virtual:pwa-register";
import { createLogger } from "../utils/logger";

const log = createLogger("pwa");

/** Intervalle de recherche de mise à jour quand l'app reste ouverte longtemps (1 h). */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

function showUpdateBanner(applyUpdate: () => Promise<void>): void {
    if (document.getElementById("pwa-update-banner")) return;

    const banner = document.createElement("div");
    banner.id = "pwa-update-banner";
    banner.className = "pwa-banner";
    banner.setAttribute("role", "status");

    const message = document.createElement("span");
    message.textContent = "Nouvelle version disponible.";

    const reloadButton = document.createElement("button");
    reloadButton.type = "button";
    reloadButton.className = "pwa-banner-action";
    reloadButton.textContent = "Recharger";
    reloadButton.addEventListener("click", () => {
        log.info("mise à jour acceptée par l'utilisateur");
        applyUpdate().catch((error) => log.error("échec de l'activation de la mise à jour", error));
    });

    const laterButton = document.createElement("button");
    laterButton.type = "button";
    laterButton.className = "pwa-banner-close";
    laterButton.textContent = "Plus tard";
    laterButton.addEventListener("click", () => banner.remove());

    banner.append(message, reloadButton, laterButton);
    document.body.appendChild(banner);
}

export function initServiceWorker(): void {
    if (!("serviceWorker" in navigator)) {
        log.warn("service worker non pris en charge : pas de mode hors ligne");
        return;
    }

    const updateServiceWorker = registerSW({
        onNeedRefresh() {
            log.info("nouvelle version en attente");
            showUpdateBanner(() => updateServiceWorker(true));
        },
        onOfflineReady() {
            log.info("application prête hors ligne");
        },
        onRegisteredSW(swUrl, registration) {
            log.debug("service worker enregistré", swUrl);
            if (!registration) return;
            setInterval(() => {
                if (navigator.onLine) registration.update().catch((error) => log.warn("vérification de mise à jour impossible", error));
            }, UPDATE_CHECK_INTERVAL_MS);
        },
        onRegisterError(error) {
            log.error("enregistrement du service worker impossible", error);
        },
    });
}
