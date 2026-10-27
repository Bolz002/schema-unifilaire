// Demande un stockage persistant, pour qu'iOS n'efface pas les schémas en IndexedDB.
import { createLogger } from "../utils/logger";

const log = createLogger("stockage");

export async function requestPersistentStorage(): Promise<void> {
    if (!navigator.storage || !navigator.storage.persist) {
        log.warn("API StorageManager indisponible : stockage persistant non demandé");
        return;
    }
    try {
        const alreadyPersisted = await navigator.storage.persisted();
        const persisted = alreadyPersisted || await navigator.storage.persist();
        const estimate = await navigator.storage.estimate();
        const usedMb = ((estimate.usage ?? 0) / 1048576).toFixed(1);
        const quotaMb = ((estimate.quota ?? 0) / 1048576).toFixed(0);
        // Un refus reste visible en production (niveau warn) : utile au diagnostic sur iPad.
        if (persisted) log.info(`stockage persistant accordé (${usedMb} Mo utilisés sur ${quotaMb} Mo)`);
        else log.warn(`stockage persistant refusé (${usedMb} Mo utilisés sur ${quotaMb} Mo) : exporter régulièrement les .eds`);
    } catch (error) {
        log.error("demande de stockage persistant en échec", error);
    }
}
