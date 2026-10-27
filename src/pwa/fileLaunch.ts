// Ouverture d'un .eds par double-clic dans l'Explorateur Windows (PWA installée, Edge/Chrome).
// Le manifest déclare « file_handlers » ; le navigateur transmet le fichier via window.launchQueue.
// Le fichier reste lié à l'app : « Opslaan » réécrit directement dans ce même fichier.
import { EDStoStructure } from "../importExport/importExport";
import { Dialog } from "../documentation/Dialog";
import { createLogger } from "../utils/logger";

const log = createLogger("fichiers");

// API Launch Handler (Chromium), absente des types DOM de TypeScript
interface LaunchParams { readonly files: readonly FileSystemFileHandle[]; }
interface LaunchQueue { setConsumer(consumer: (params: LaunchParams) => void): void; }

async function openFileHandle(handle: FileSystemFileHandle): Promise<void> {
    const file = await handle.getFile();
    const contents = await file.text();

    // Même séquence que le bouton « Openen » (globalThis.loadClicked dans importExport.ts)
    const fileApi = globalThis.fileAPIobj;
    fileApi.fileHandle = handle;
    fileApi.filename = file.name;
    fileApi.setSaveNeeded(false);
    fileApi.updateLastSaved();

    EDStoStructure(contents);
    globalThis.structure.properties.filename = file.name;
    if (globalThis.structure.sitplan) globalThis.structure.sitplan.activePage = 1;
    log.info(`fichier ouvert : ${file.name}`);
}

function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Ouvre le fichier, après confirmation si le schéma courant a des modifications non enregistrées. */
function openWithConfirmation(handle: FileSystemFileHandle): void {
    const open = () => openFileHandle(handle).catch((error) => {
        log.error("ouverture impossible", error);
        new Dialog("Ouverture impossible", `Le fichier « ${escapeHtml(handle.name)} » n'a pas pu être lu.`).show();
    });

    if (!globalThis.autoSaver?.hasChangesSinceLastManualSave()) { void open(); return; }

    new Dialog(
        "Ouvrir un autre schéma ?",
        `Le schéma en cours contient des modifications non enregistrées. Ouvrir « ${escapeHtml(handle.name)} » quand même ?`,
        [
            { text: "Annuler", callback: () => log.info("ouverture annulée par l'utilisateur") },
            { text: "Ouvrir", callback: () => { void open(); } },
        ],
    ).show();
}

/** À appeler une fois l'app démarrée (après la récupération de l'autosave). */
export function initFileLaunch(): void {
    const launchQueue = (window as unknown as { launchQueue?: LaunchQueue }).launchQueue;
    if (!launchQueue) return; // Safari, Firefox, ou app non installée : rien à faire

    launchQueue.setConsumer((params) => {
        const handle = params.files?.[0];
        if (!handle) return;
        if (params.files.length > 1) log.warn(`${params.files.length} fichiers reçus : seul le premier est ouvert`);
        openWithConfirmation(handle);
    });
}
