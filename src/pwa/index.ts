// Point d'entrée des fonctions PWA, appelé une fois au démarrage depuis main.ts.
import { initServiceWorker } from "./registerSW";
import { requestPersistentStorage } from "./storagePersist";
import { initOnlineIndicator } from "./onlineStatus";
import "./pwa.css";

export function initPWA(): void {
    initServiceWorker();
    initOnlineIndicator();
    void requestPersistentStorage();
}
