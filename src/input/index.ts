// Point d'entrée de la couche tactile, appelé une fois au démarrage depuis main.ts.
import { enableLongPressContextMenu } from "./gestures";
import "./touch.css";

export { enablePinchZoom } from "./gestures";

export function initTouchInput(): void {
    enableLongPressContextMenu(document);
}
