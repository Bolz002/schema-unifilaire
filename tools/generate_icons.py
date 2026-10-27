"""Génère les icônes UniSchema (éclair jaune sur fond bleu nuit) dans public/icons/.

Icône originale (contrainte C1 : aucune ressource reprise d'un autre produit).
Usage : python tools/generate_icons.py   (Pillow requis)
"""
from pathlib import Path
from PIL import Image, ImageDraw

FOND = (30, 58, 95)        # bleu nuit, identique à theme_color
ECLAIR = (255, 196, 0)     # jaune
CONTOUR = (255, 255, 255)
SORTIE = Path(__file__).resolve().parent.parent / "public" / "icons"
SURECHANTILLON = 4         # dessin en grand puis réduction, pour lisser les bords

# Éclair dans un repère 0..1 (x, y)
ECLAIR_POINTS = [
    (0.58, 0.06), (0.22, 0.56), (0.47, 0.56),
    (0.38, 0.94), (0.78, 0.40), (0.53, 0.40), (0.66, 0.06),
]


def dessiner(taille: int, marge: float, arrondi: float) -> Image.Image:
    """marge : part de l'icône laissée autour de l'éclair ; arrondi : rayon relatif des coins (0 = carré plein)."""
    grand = taille * SURECHANTILLON
    image = Image.new("RGBA", (grand, grand), (0, 0, 0, 0))
    dessin = ImageDraw.Draw(image)
    if arrondi > 0:
        dessin.rounded_rectangle((0, 0, grand - 1, grand - 1), radius=int(grand * arrondi), fill=FOND)
    else:
        dessin.rectangle((0, 0, grand, grand), fill=FOND)
    zone = grand * (1 - 2 * marge)
    origine = grand * marge
    points = [(origine + x * zone, origine + y * zone) for x, y in ECLAIR_POINTS]
    dessin.polygon(points, fill=ECLAIR)
    # Contour tracé à part, avec jointures arrondies (le contour de polygon() crée des encoches)
    dessin.line(points + [points[0]], fill=CONTOUR, width=max(2, grand // 90), joint="curve")
    return image.resize((taille, taille), Image.LANCZOS)


def main() -> None:
    SORTIE.mkdir(parents=True, exist_ok=True)
    fichiers = {
        "icon-192.png": dessiner(192, 0.12, 0.18),
        "icon-512.png": dessiner(512, 0.12, 0.18),
        # maskable : fond plein bord à bord, éclair dans la zone sûre (80 % central)
        "icon-512-maskable.png": dessiner(512, 0.22, 0),
        # iOS arrondit lui-même et refuse la transparence
        "apple-touch-icon-180.png": dessiner(180, 0.14, 0).convert("RGB"),
        "favicon-32.png": dessiner(32, 0.06, 0.18),
    }
    for nom, image in fichiers.items():
        image.save(SORTIE / nom, optimize=True)
        print(f"{nom} ({image.size[0]} px)")


if __name__ == "__main__":
    main()
