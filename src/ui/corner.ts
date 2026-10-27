// Zone fixe en haut à droite de la barre de menu (sélecteur de langue, bouton « À propos »…).
// Recherchée à chaque appel : main.ts reconstruit le body (innerHTML +=) pendant le démarrage.
import "./corner.css";

const CORNER_ID = "us-corner";

export function getCorner(): HTMLElement {
    let corner = document.getElementById(CORNER_ID);
    if (!corner) {
        corner = document.createElement("div");
        corner.id = CORNER_ID;
        corner.className = "notranslate";
        document.body.appendChild(corner);
    }
    return corner;
}
