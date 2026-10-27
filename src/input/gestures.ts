// Gestes tactiles ajoutés à l'app d'origine, sans modifier sa logique métier :
//  - appui long (doigt ou Pencil) = clic droit, car Safari iPad n'émet pas de « contextmenu » ;
//  - pinch-zoom et déplacement à deux doigts sur le plan de position.
import { createLogger } from "../utils/logger";

const log = createLogger("gestes");

/** Durée d'appui avant d'ouvrir le menu contextuel (valeur iOS habituelle). */
export const LONG_PRESS_DELAY_MS = 500;
/** Mouvement toléré pendant l'appui long avant de le considérer comme un glisser. */
export const LONG_PRESS_TOLERANCE_PX = 10;
/** Fenêtre pendant laquelle on ignore le contextmenu natif ou le clic qui suivent un appui long. */
const AFTER_LONG_PRESS_GUARD_MS = 800;

/** Vrai si le déplacement depuis le point de départ dépasse la tolérance de l'appui long. */
export function exceedsTolerance(startX: number, startY: number, x: number, y: number, tolerance = LONG_PRESS_TOLERANCE_PX): boolean {
    return Math.hypot(x - startX, y - startY) > tolerance;
}

/** Champs de saisie : l'appui long y sert au curseur et à la sélection de texte, on ne l'intercepte pas. */
function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Appui long → événement « contextmenu » synthétique sur l'élément touché.
 * Les gestionnaires existants (clic droit) s'exécutent donc tels quels.
 * Sur Android, Chrome émet déjà un contextmenu natif : le premier arrivé gagne, l'autre est ignoré.
 */
export function enableLongPressContextMenu(root: Document = document): void {
    let timer: number | null = null;
    let start: { x: number, y: number, target: EventTarget | null, pointerId: number } | null = null;
    let activePointers = 0;
    let lastLongPressAt = -Infinity;

    const cancel = () => {
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
        start = null;
    };

    root.addEventListener("pointerdown", (event: PointerEvent) => {
        activePointers++;
        if (event.pointerType === "mouse" || activePointers > 1 || isEditable(event.target)) { cancel(); return; }
        start = { x: event.clientX, y: event.clientY, target: event.target, pointerId: event.pointerId };
        timer = window.setTimeout(() => {
            if (!start || !start.target) return;
            lastLongPressAt = performance.now();
            log.debug("appui long → contextmenu");
            start.target.dispatchEvent(new MouseEvent("contextmenu", {
                bubbles: true, cancelable: true, view: window,
                clientX: start.x, clientY: start.y, button: 2, buttons: 2,
            }));
            if (navigator.vibrate) navigator.vibrate(10); // retour haptique léger (Android)
            cancel();
        }, LONG_PRESS_DELAY_MS);
    }, { capture: true, passive: true });

    root.addEventListener("pointermove", (event: PointerEvent) => {
        if (start && event.pointerId === start.pointerId && exceedsTolerance(start.x, start.y, event.clientX, event.clientY)) cancel();
    }, { capture: true, passive: true });

    const release = () => { activePointers = Math.max(0, activePointers - 1); cancel(); };
    root.addEventListener("pointerup", release, { capture: true, passive: true });
    root.addEventListener("pointercancel", release, { capture: true, passive: true });

    // Dédoublonnage : contextmenu natif (Android) pendant ou juste après un appui long synthétique
    root.addEventListener("contextmenu", (event: MouseEvent) => {
        if (!event.isTrusted) return;
        if (performance.now() - lastLongPressAt < AFTER_LONG_PRESS_GUARD_MS) {
            event.preventDefault();
            event.stopImmediatePropagation();
        } else {
            cancel(); // le natif est arrivé le premier
        }
    }, { capture: true });

    // Le relâchement après un appui long ne doit pas déclencher de clic (qui fermerait le menu)
    root.addEventListener("click", (event: MouseEvent) => {
        if (performance.now() - lastLongPressAt < AFTER_LONG_PRESS_GUARD_MS) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, { capture: true });
}

/** Vue qui sait zoomer autour d'un point du canevas (SituationPlanView). */
export interface ZoomableView {
    zoomIncrement(increment: number, canvasx: number, canvasy: number): void;
}

/** Facteur à appliquer pour passer de l'écart initial à l'écart courant entre deux doigts. */
export function pinchIncrement(previousDistance: number, currentDistance: number): number {
    if (previousDistance <= 0) return 0;
    return currentDistance / previousDistance - 1;
}

/**
 * Pinch-zoom (centré entre les doigts) et déplacement à deux doigts sur un canevas défilant.
 * Un doigt seul reste géré par le navigateur (défilement) ou par l'app (glisser un symbole).
 */
export function enablePinchZoom(canvas: HTMLElement, view: ZoomableView): void {
    let previous: { distance: number, midX: number, midY: number } | null = null;

    const measure = (touches: TouchList) => {
        const [a, b] = [touches[0], touches[1]];
        return {
            distance: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
            midX: (a.clientX + b.clientX) / 2,
            midY: (a.clientY + b.clientY) / 2,
        };
    };

    canvas.addEventListener("touchstart", (event: TouchEvent) => {
        previous = event.touches.length === 2 ? measure(event.touches) : null;
    }, { passive: true });

    canvas.addEventListener("touchmove", (event: TouchEvent) => {
        if (event.touches.length !== 2 || !previous) return;
        event.preventDefault(); // le geste est à nous : pas de zoom de page ni de défilement natif
        const current = measure(event.touches);
        const rect = canvas.getBoundingClientRect();

        // Déplacement : le contenu suit le milieu des deux doigts (1:1)
        canvas.scrollLeft -= current.midX - previous.midX;
        canvas.scrollTop -= current.midY - previous.midY;

        const increment = pinchIncrement(previous.distance, current.distance);
        if (Math.abs(increment) > 0.002) view.zoomIncrement(increment, current.midX - rect.left, current.midY - rect.top);
        previous = current;
    }, { passive: false });

    const end = (event: TouchEvent) => { if (event.touches.length < 2) previous = null; };
    canvas.addEventListener("touchend", end, { passive: true });
    canvas.addEventListener("touchcancel", end, { passive: true });

    // Safari émet aussi des « gesture* » propriétaires qui zoomeraient la page entière
    canvas.addEventListener("gesturestart", (event) => event.preventDefault());
}
