/// <reference types="vite/client" />
// Logger à niveaux : « debug » en développement, « warn » en production.

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minimumLevel: LogLevel = import.meta.env.DEV ? "debug" : "warn";

function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[minimumLevel];
}

/** Crée un logger préfixé par le nom du module, par ex. createLogger("pwa"). */
export function createLogger(moduleName: string) {
    const prefix = `[${moduleName}]`;
    return {
        debug: (...args: unknown[]) => { if (shouldLog("debug")) console.debug(prefix, ...args); },
        info: (...args: unknown[]) => { if (shouldLog("info")) console.info(prefix, ...args); },
        warn: (...args: unknown[]) => { if (shouldLog("warn")) console.warn(prefix, ...args); },
        error: (...args: unknown[]) => { if (shouldLog("error")) console.error(prefix, ...args); },
    };
}
