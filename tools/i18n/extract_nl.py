"""Inventaire des textes néerlandais affichés par l'interface (aide à la traduction, ne modifie pas le code).

Extrait des .ts les littéraux de chaîne et le texte des gabarits HTML, garde ceux qui ressemblent
à du texte pour l'utilisateur, et écrit tools/i18n/nl_inventaire.json (texte -> fichiers).
Usage : python tools/i18n/extract_nl.py
"""
import json
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
DOSSIERS = ["src", "prop"]
EXCLUS = ("src/i18n", "src/pwa", "src/input", "src/config", "src/utils")

LITTERAL = re.compile(r"""'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`""", re.S)
BALISE = re.compile(r"<[^>]*>")
INTERPOLATION = re.compile(r"\$\{[^}]*\}")
MOT = re.compile(r"[A-Za-zÀ-ÿ]{3,}")


def ressemble_a_du_texte(texte: str) -> bool:
    if not MOT.search(texte):
        return False
    if " " not in texte and re.search(r"[_./#()=\[\]{}]|[a-z][A-Z]", texte):
        return False  # identifiant, chemin, sélecteur ou code
    if re.search(r"^https?:|^#[0-9a-f]{3,6}$", texte, re.I):
        return False
    return True


def morceaux(litteral: str):
    texte = INTERPOLATION.sub("{}", litteral)
    for partie in BALISE.split(texte):
        partie = re.sub(r"\s+", " ", partie).strip(" ,;:.")
        if partie and ressemble_a_du_texte(partie):
            yield partie


def main() -> None:
    inventaire: dict[str, set[str]] = {}
    for dossier in DOSSIERS:
        for fichier in sorted((RACINE / dossier).rglob("*.ts")):
            rel = fichier.relative_to(RACINE).as_posix()
            if rel.startswith(EXCLUS) or rel.endswith(".d.ts"):
                continue
            source = fichier.read_text(encoding="utf-8")
            source = re.sub(r"^\s*//.*$", "", source, flags=re.M)
            for m in LITTERAL.finditer(source):
                contenu = next((g for g in m.groups() if g is not None), "")
                for partie in morceaux(contenu):
                    inventaire.setdefault(partie, set()).add(rel)
    sortie = RACINE / "tools" / "i18n" / "nl_inventaire.json"
    donnees = {k: sorted(v) for k, v in sorted(inventaire.items())}
    sortie.write_text(json.dumps(donnees, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(donnees)} textes -> {sortie.relative_to(RACINE).as_posix()}")


if __name__ == "__main__":
    main()
