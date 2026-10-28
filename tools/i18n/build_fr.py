"""Construit src/i18n/fr.json à partir du relevé des textes affichés (harvest) et des traductions ci-dessous.

Les clés du dictionnaire sont le texte néerlandais d'origine, sans la ponctuation qui l'entoure
(même règle que src/i18n/domTranslator.ts). Les traductions sont indexées sur le relevé pour ne
jamais retaper une clé néerlandaise à la main (accents, apostrophes).

Usage : python tools/i18n/build_fr.py <manquants.json>
Les textes déjà présents dans fr.json sont conservés ; les nouvelles traductions les complètent.
"""
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
SORTIE = RACINE / "src" / "i18n" / "fr.json"
EDGES = re.compile(r"^([\s,;:.()\-–|*]*)([\s\S]*?)([\s,;:.()\-–|*?!]*)$")

# Index du relevé du 27/10/2026 → traduction. Les entrées absentes sont des données (noms, ID, URL)
# ou des textes déjà en français.
TRADUCTIONS = {
    0: '" pour dupliquer un élément.',
    1: '(Dessin seul, choisissez « Générer le PDF » pour voir aussi les données textuelles)',
    2: "(remplacé en cas de pagination manuelle dans le menu Imprimer)",
    3: ", Nombre d'armatures :", 4: ", Nombre de boutons par armature :", 5: ", Nombre de lampes :",
    6: ", Nombre de points lumineux :", 7: ", Nombre d'interrupteurs :", 8: ", Nombre :",
    9: ", Adresse/texte :", 10: ", Adresse :", 11: ", Blindé :", 12: ", Largeur :", 13: ", Italique :",
    14: ", Détection :", 15: ", Source d'énergie :", 16: ", Commande externe :", 17: ", Phase :",
    18: ", Mis à la terre :", 19: ", Programmé :", 20: ", Semi-étanche :", 21: ", Alignement horizontal :",
    22: ", Installation domestique :", 23: ", Sous tube :", 24: ", Dans le tableau :", 25: ", Interrupteur intégré :",
    26: ", Câble :", 27: ", Type de câble après compteur :", 28: ", Type de câble avant compteur :",
    29: ", Sécurité enfants :", 30: ", Courant de court-circuit :", 31: ", Bouton-poussoir local :",
    32: ", Polyphasé :", 33: ", Parent :", 34: ", Éclairage de secours :", 35: ", Pose :", 36: ", Lampe de signalisation :",
    37: ", Symbole :", 38: ", Texte :", 39: ", Interrupteur à tirette :", 40: ", Type :", 41: ", Voyant témoin :",
    42: ", Gras :", 43: ", Applique :", 44: ", Fonction chauffage :",
    45: "-champ pour rattacher un composant ailleurs dans le schéma.",
    46: "300 dpi (standard)", 47: "600 dpi (meilleur mais plus lent)", 48: "A, Courbe :",
    55: "Personnalisé", 56: "Raccordement", 57: "Point de raccordement", 58: "Nombre de phases :", 59: "Nombre :",
    60: "Sectionneur de terre", 61: "Accumulation :", 62: "Adresse/texte :",
    63: "Ajouter un élément dépendant en dessous (niveau inférieur)", 64: "Boîte de dérivation",
    65: "Une boîte de dérivation peut désormais contenir plusieurs enfants.", 66: "Tout", 67: "Annuler",
    68: "Automatique", 69: "Numérotation et dénomination automatiques des circuits.", 70: "Batterie", 71: "Sonnette",
    72: "Protection :", 73: "Fichier", 74: "Modifier",
    75: "En pagination manuelle, un texte d'information différent peut être choisi pour chaque page du schéma unifilaire, affiché en bas à droite à l'impression.",
    76: "Boiler", 77: "Tableau", 78: "Haut", 79: "Largeur :", 80: "Annuler", 81: "Centralisé",
    82: 'Cliquez sur « Ouvrir » et sélectionnez un fichier EDS enregistré précédemment.', 83: "Cloner", 84: "Prise de courant",
    85: "Chargement de l'application.", 86: "Décentralisé",
    87: "Cet outil gratuit permet de dessiner des schémas unifilaires et des plans de position, y compris des schémas plus complexes avec par exemple de la domotique. Les schémas peuvent être exportés en PDF et imprimés. Les experts peuvent aussi les convertir au format vectoriel SVG pour les retravailler dans d'autres programmes.",
    88: "Ne plus afficher ce texte dans ce navigateur.", 89: "Congélateur",
    91: "Nouvelle fonction pour dessiner dans le plan de position des éléments absents du schéma unifilaire. Pour l'instant, seul un nombre limité de symboles est pris en charge ; la liste sera étendue.",
    92: "Version autonome (développement) dont certaines fonctions sont désactivées.",
    93: "Aide", 94: "Domotique", 95: "Récepteur piloté par domotique", 96: "Module domotique (vertical)",
    97: "Sans fil :", 98: "Sèche-linge", 99: "Bouton-poussoir", 100: "Borne de recharge VE", 101: "Une création de",
    102: "Un manuel complet est disponible au format PDF (en néerlandais). Cliquez à gauche pour l'ouvrir dans une autre fenêtre.",
    103: "Dessiner un schéma unifilaire.", 104: "Schéma unifilaire en ligne",
    105: "Schéma simple, uniquement des prises de courant et des points lumineux.",
    106: "Premiers pas pour ajouter au plan de position des symboles absents du schéma unifilaire.",
    107: "Électricité", 108: "Compteur électrique", 109: "Four électrique", 110: "Ajouter/modifier un élément", 111: "Élément :",
    112: "Aucune modification non enregistrée. Allez dans le menu « Fichier »", 113: "Organisme agréé (contrôle)",
    114: "Un instant", 115: "Options de développement expert. À n'utiliser que si vous savez ce que vous faites.",
    116: "Schéma unifilaire", 117: "Répartir manuellement le schéma unifilaire sur plusieurs pages",
    118: "Allez dans le menu Imprimer pour imprimer le dessin ou l'exporter en graphique vectoriel SVG.",
    119: "Gaz (atmosphérique)", 120: "Gaz (avec ventilateur)", 121: "Mis à la terre :", 122: "Utilisez les",
    123: "Utilisez la version en ligne sur", 124: "Utilisez le", 125: "Aucun", 126: "Générer le PDF", 127: "Semi-étanche :",
    128: "Manuel", 129: "Manuel", 130: "Il est recommandé d'enregistrer votre travail avant d'utiliser cette fonction !",
    131: "Le programme est en plein développement : certaines parties du manuel peuvent être un peu dépassées.",
    132: "Différentiel général (en mA)", 133: "Protection générale (en A)", 135: "ID :",
    143: "Schéma un peu plus complexe avec télérupteurs, récepteurs derrière des prises et circuits divisés.",
    144: "Zoom +", 145: "Encastré", 146: "Infos", 147: "Infos/Contact", 148: "Installateur", 149: "Insertion",
    150: "Insérer un élément au-dessus (même niveau)", 151: "Insérer un élément en dessous (même niveau)",
    152: "Supprimer l'élément", 154: "Chaudière", 155: "Choisir", 156: 'Choisissez "', 157: "Choisissez l'un des exemples ci-dessous pour commencer, ou partez d'un schéma vierge (option 3).",
    158: "Cliquez", 159: "Refroidissant", 160: "Réfrigérateur", 161: "Cuisinière", 162: "Circuit",
    163: "Les circuits et raccordements acceptent maintenant aussi la protection « sectionneur-fusible ».",
    164: "Circuit :", 165: "Chargez un plan avec le bouton « Depuis un fichier » et ajoutez des symboles avec le bouton « Depuis le schéma ».",
    166: "Texte de l'étiquette :", 167: "Type d'étiquette :", 168: "Schéma vierge", 169: "Légende :", 170: "Canalisation",
    171: "Circuit d'éclairage", 172: "Point lumineux", 173: "Gauche", 174: "Charger depuis le champ", 175: "Symbole libre",
    176: "Symbole libre (absent du schéma unifilaire)", 177: "Ligne aérienne", 178: "Multimédia", 179: "Plusieurs récepteurs",
    180: "Avec boiler", 181: "Avec serpentin",
    182: "Option micro-onduleur ajoutée. Pour les onduleurs à un seul raccordement au maximum, « micro » peut être coché, ce qui donne un trait plus fin dans le schéma.",
    183: "Four à micro-ondes", 184: "Parent", 185: "Possibilité de n'imprimer que certaines pages du schéma.", 186: "Moteur",
    187: "Nom :", 188: "Vers l'arrière", 189: "Vers l'avant", 190: "Nouveau", 191: "OK",
    192: "Pour découvrir les possibilités du programme, il vaut souvent mieux examiner d'abord un schéma d'exemple avant de partir d'un schéma vierge.",
    193: "Onduleur", 194: "Bas", 195: "Enterré", 196: "Défaire", 197: "Sur cette page, vous pouvez dessiner un plan de position.",
    198: "Apparent",
    199: "Ouvrez un schéma enregistré précédemment sur votre ordinateur (fichier EDS). Seuls les fichiers créés après le 12 juillet 2019 sont reconnus.",
    200: "Ouvrez un second fichier EDS et ajoutez son contenu au fichier EDS actuel.", 201: "Ouvrir", 202: "Ouvrir depuis un fichier",
    203: "Attention !", 204: "Refaire", 205: "Enregistrer", 206: "Enregistrer sous", 207: "Enregistrer sans compression (fichier plus gros)",
    208: "Protection contre les surtensions", 209: "Page", 210: "Pages :", 211: "Lieu de l'installation électrique", 212: "Imprimer",
    213: "Aperçu avant impression :", 214: "Fonctions ajoutées récemment", 215: "Droite", 216: "Rotation (°) :", 217: "Fusionner",
    218: "Fusionner (expert !)", 219: "Échelle (%) :", 220: "Interrupteurs", 221: "Plein écran", 222: "Plan de position",
    223: "Dessiner un plan de position",
    224: "Enregistrez le dessin ci-dessous en SVG et convertissez-le en PDF avec un autre programme (p. ex. Inkscape).",
    225: "Un document plus court a été rédigé spécialement pour le plan de position (en néerlandais). Cliquez sur le lien pour l'ouvrir dans une autre fenêtre.",
    226: "Division", 227: "Four vapeur",
    228: "Symbole pour hotte (dans Ventilateur) et mise à la terre (dans Symboles rares).", 229: "Symbole :",
    230: "TL", 231: "Taille du texte (px) :", 232: "Dessin :", 233: 'Texte (nouvelle ligne = "|") :', 234: "Texte :",
    235: "Conditions", 236: "Astuce :", 237: "Transformateur", 238: "Type :",
    239: "Vous avez des modifications non enregistrées. Cliquez ici pour enregistrer", 240: "Chargeur USB",
    241: "Zoom −", 242: "Depuis un fichier", 243: "Depuis le schéma", 244: "Décompresser",
    245: "Votre travail n'a pas encore été enregistré pendant cette session. Cliquez à gauche sur « Enregistrer sous ».",
    246: "Lave-vaisselle", 247: "Combustible solide", 248: "Ventilateur",
    249: "Améliorations et nouvelles possibilités pour le symbole contact/contacteur (dans Circuit ou Interrupteurs).",
    250: "Récepteur", 251: "Continuer avec cette option", 252: "Prolongation", 253: "Déplacer/Cloner", 255: "Chauffant",
    256: "Chauffant et refroidissant", 257: "Appareil de chauffage", 258: "Supprimer", 259: "Combustible liquide",
    260: "Fusionne les schémas unifilaires et ajoute aussi des pages au plan de position si nécessaire.", 261: "Tension :",
    262: "Pour les éléments du niveau le plus haut, on peut choisir de toujours commencer une nouvelle page à l'impression.",
    263: "Exemple 1", 264: "Exemple 2", 265: "Espace libre", 266: "Texte libre", 267: "Fonction chauffage :",
    268: "Cogénération", 269: "Pompe à chaleur/climatisation", 270: "Échangeur de chaleur", 271: "Lave-linge",
    272: "Nous améliorons ce programme chaque jour. Remarques et idées sont les bienvenues via le formulaire de contact.",
    273: "Bienvenue dans le schéma unifilaire", 274: "Mode de travail", 275: "Fusible/différentiel", 276: "Symboles rares",
    277: "Définir cette échelle par défaut pour tous les futurs nouveaux symboles.",
    278: "Définir cette taille de texte et cette échelle par défaut pour tous les futurs nouveaux symboles.",
    279: "Enregistrer la page visible en SVG", 280: "Sans nom", 281: "Panneau solaire", 282: "mise à la terre", 283: "hotte",
    284: "auto", 285: "disjoncteur", 286: "détecteur de mouvement", 287: "bleue", 288: "batterie bloc", 289: "centrer",
    290: "cloner", 291: "contact", 292: "gâche électrique", 293: "différentiel", 294: "disjoncteur différentiel", 295: "variateur",
    296: "interrupteur variateur", 297: "interrupteur variateur va-et-vient", 298: "triangle", 299: "tripolaire",
    300: "double allumage", 301: "bipolaire", 302: "unipolaire", 303: "aucune", 304: "manuel", 305: "ici",
    307: "dans le menu pour continuer à dessiner.", 308: "si vous souhaitez tout de même enregistrer.", 309: "parlophone",
    310: "kA, Phase :", 311: "kA, Sélectif :", 312: "permutateur", 313: "led", 314: "gauche", 315: "haut-parleur",
    316: "mA, Type :", 317: "contact magnétique", 318: "manuel", 319: "minuterie",
    320: "ou allez dans le menu « Fichier » pour plus d'options.", 321: "pour consulter la documentation dans une nouvelle fenêtre.",
    322: "pour accéder au formulaire de contact.", 323: "protection contre les surtensions",
    324: "flèches pour modifier l'ordre des éléments.", 325: "flèches", 326: "droite", 327: "relais", 328: "volet",
    329: "interrupteur de volet", 330: "crépusculaire", 331: "interrupteur crépusculaire", 332: "fusible", 333: "spot",
    334: "standard", 335: "télérupteur", 336: "thermostat", 337: "interrupteur horaire", 338: "ventilateur",
    339: "récepteur", 340: "va-et-vient double", 341: "va-et-vient", 342: "sectionneur-fusible",
}

# Textes repérés dans le code source mais absents du relevé (fenêtres, messages, menus contextuels, PDF).
# Clé = texte néerlandais tel qu'affiché, sans la ponctuation qui l'entoure.
AJOUTS = {
    "Aanpassing symbolen schakelaars": "Adaptation des symboles d'interrupteurs",
    "Aantal buizen": "Nombre de tubes", "Aantal fasen": "Nombre de phases", "Acties": "Actions",
    "Alles (standaard": "Tout (standard",
    "Annuleer": "Annuler", "Bestandsnaam": "Nom du fichier", "Bewerken": "Modifier", "Curve": "Courbe",
    "Bespaar tijd en gebruik de 'Delete' toets op het toetsenbord om symbolen te verwijderen":
        "Gagnez du temps : utilisez la touche « Suppr » du clavier pour supprimer des symboles",
    "Beste gebruiker. Uw situatieschema bevat symbolen voor schakelaars": "Cher utilisateur, votre plan de position contient des symboles d'interrupteurs",
    "Circulaire referentie. Nieuwe moeder kan geen afstammeling van het te verplaatsen element zijn":
        "Référence circulaire : le nouveau parent ne peut pas être un descendant de l'élément à déplacer",
    "Compatibiliteitsmodus, kies aantal schakelaars verschillend van 0 of gebruik element lichtpunt":
        "Mode de compatibilité : choisissez un nombre d'interrupteurs différent de 0 ou utilisez l'élément point lumineux",
    "Dat is geen geldig moeder-object. Probeer opnieuw": "Ce n'est pas un parent valide. Réessayez",
    "De browsercache is een tijdelijke opslag, en wordt occasioneel gewist":
        "Le cache du navigateur est un stockage temporaire, effacé de temps en temps",
    "Deze afbeelding werd automatisch verkleind om binnen de tekenzone te blijven":
        "Cette image a été réduite automatiquement pour rester dans la zone de dessin",
    "Deze appicatie werkt niet in Internet Explorer. Wij raden aan een moderne browser te gebruiken zoals Edge, Firefox, Google Chrome, Opera, Vivaldi":
        "Cette application ne fonctionne pas dans Internet Explorer. Utilisez un navigateur moderne : Edge, Firefox, Google Chrome, Opera, Vivaldi",
    "Deze tool vond een schema in de browsercache": "Un schéma a été trouvé dans le cache du navigateur",
    "Dit bestand is met": "Ce fichier fait", "Dit bestand kan bijgevolg niet geladen worden": "Ce fichier ne peut donc pas être chargé",
    "Dit bestand wordt door de browser herkend als een afbeelding met hoogte of breedte gelijk aan 0":
        "Le navigateur reconnaît ce fichier comme une image de hauteur ou de largeur nulle",
    "Dit schema dateert van": "Ce schéma date du",
    "Doorgaans zal het dan ook niet langer noodzakelijk zijn om dergelijke schakelaars te roteren":
        "Il ne sera généralement plus nécessaire de faire pivoter ces interrupteurs",
    "Draai links": "Pivoter à gauche", "Draai rechts": "Pivoter à droite", "Druk daarna op enter": "Appuyez ensuite sur Entrée",
    "Eens opgeslagen kan het schema later opnieuw geladen worden door in het menu \"openen\" te kiezen en vervolgens het bestand op uw harde schijf te selecteren":
        "Une fois enregistré, le schéma peut être rechargé plus tard via « Ouvrir » en sélectionnant le fichier sur votre disque",
    "Eindig met \".eds\"": "Terminez par « .eds »", "Element niet gevonden": "Élément introuvable",
    "Er is een element in het situatieschema dat verwijst naar een andere website en dit veroorzaakt een security-error in deze browser. Dit kan bijvoorbeeld gebeuren indien u een plattegrond gemaakt heeft met online tools zoals draw.io. Probeer uw plattegrond op te slaan in een ander formaat. Indien het probleem blijft aanhouden, contacteer ons dan via het contactformulier":
        "Un élément du plan de position renvoie à un autre site web, ce qui provoque une erreur de sécurité dans ce navigateur. Cela peut arriver avec un plan créé dans un outil en ligne comme draw.io. Enregistrez votre plan dans un autre format. Si le problème persiste, contactez-nous via le formulaire de contact",
    "Erkend Organisme": "Organisme agréé",
    "Gebruik enkel alphanumerieke karakters a-z A-Z 0-9, streepjes en spaties": "Utilisez uniquement les caractères a-z A-Z 0-9, des tirets et des espaces",
    "Geen ID ingegeven": "Aucun ID saisi", "Geen bestand geselecteerd": "Aucun fichier sélectionné", "Geen geldig ID ingegeven": "ID saisi invalide",
    "Het blijft belangrijk uw werk regelmatig op te slaan om gegevensverlies te voorkomen":
        "Il reste important d'enregistrer régulièrement votre travail pour éviter toute perte de données",
    "Het formaat van deze file wordt niet ondersteund": "Le format de ce fichier n'est pas pris en charge",
    "Het genereren van de PDF is om onduidelijke redenen vastgelopen. Contacteer ons via het contactformulier":
        "La génération du PDF s'est bloquée pour une raison inconnue. Contactez-nous via le formulaire de contact",
    "Het maximum aantal kinderen van dit element is": "Le nombre maximal d'enfants de cet élément est de",
    "Hoogte": "Hauteur", "In kring": "Dans le circuit",
    "In de meeste gevallen zal uw browser het bestand automatisch plaatsen in de Downloads-folder tenzij u uw browser instelde dat die eerst een locatie moet vragen":
        "Le plus souvent, le navigateur place le fichier dans le dossier Téléchargements, sauf s'il est réglé pour demander un emplacement",
    "Je kan eventueel ook de tekst (info) aanpassen die op elke pagina rechts onderaan komt te staan":
        "Vous pouvez aussi modifier le texte (info) affiché en bas à droite de chaque page",
    "Kies \"Bewerk\" in het menu om de schaalfactor verder aan te passen indien gewenst":
        "Choisissez « Modifier » dans le menu pour ajuster l'échelle si nécessaire",
    "Kies (expert": "Choisir (expert",
    "Klik links op \"Opslaan\" om bij te werken": "Cliquez à gauche sur « Enregistrer » pour mettre à jour",
    "Klik op uitpakken indien u de onderliggende elementen in het situatieschema wil kunnen plaatsen":
        "Cliquez sur Décompresser pour pouvoir placer les éléments sous-jacents dans le plan de position",
    "Klik vervolgens op \"opslaan\" en volg de instructies van uw browser": "Cliquez ensuite sur « Enregistrer » et suivez les instructions du navigateur",
    "Laatst geopend of opgeslagen om": "Dernière ouverture ou sauvegarde à",
    "Laatste schema geladen uit browsercache": "Dernier schéma rechargé depuis le cache du navigateur",
    "Leeg": "Vide", "MB behoorlijk groot en kan uw browser vertragen": "Mo, ce qui est assez gros et peut ralentir le navigateur",
    "Mededeling": "Information", "Meerdere elementen bewerken": "Modifier plusieurs éléments", "Met nul": "Avec neutre",
    "Micro": "Micro", "Naam wijzigen": "Renommer", "Naar pagina": "Vers la page", "Nieuwe pagina": "Nouvelle page",
    "Normaal Gesloten": "Normalement fermé",
    "Om te vermijden dat u per ongeluk de pagina ververst en uw werk verliest is de refresh sneltoets uitgeschakeld in het situatieschema":
        "Pour éviter d'actualiser la page par erreur et de perdre votre travail, le raccourci d'actualisation est désactivé dans le plan de position",
    "Onderaan kan je bekijken welk deel van het schema op welke pagina belandt": "En bas, vous voyez quelle partie du schéma se trouve sur quelle page",
    "Ongeldige afmetingen": "Dimensions invalides", "Ongeldige invoer": "Saisie invalide",
    "Ongeldige invoer: alleen cijfers, spaties, komma's en streepjes toegestaan": "Saisie invalide : uniquement des chiffres, espaces, virgules et tirets",
    "Ontgrendel": "Déverrouiller", "Vergrendel": "Verrouiller", "Pagina verwijderen": "Supprimer la page",
    "PDF is klaar. Kijk in uw Downloads folder indien deze niet spontaan wordt geopend":
        "Le PDF est prêt. Regardez dans le dossier Téléchargements s'il ne s'ouvre pas tout seul",
    "PDF wordt gegenereerd. Even geduld": "Génération du PDF, un instant",
    "Plaats van de elektrische installatie": "Lieu de l'installation électrique",
    "Selectief": "Sélectif", "Signalisatielamp": "Lampe de signalisation", "Spot": "Spot",
    "Start op nieuwe pagina": "Commencer sur une nouvelle page", "Sturing": "Commande", "Suggereer X-posities": "Suggérer les positions X",
    "Tekenfout": "Erreur de dessin", "Tip: Symbolen verplaatsen": "Astuce : déplacer des symboles", "Tip: Symbolen verwijderen": "Astuce : supprimer des symboles",
    "Toepassen": "Appliquer",
    "Tot nogtoe werden die altijd afgebeeld met een klein lijntje (leiding) aan de zijkant":
        "Jusqu'ici, ils étaient toujours dessinés avec un petit trait (canalisation) sur le côté",
    "U behoudt de symbolen zoals voorheen voor dit schema": "Vous gardez les symboles comme avant pour ce schéma",
    "U gebruikt de nieuwe symbolen zonder lijntje. De oorspronkelijke rotatie wordt hersteld. Mogelijk zal u bepaalde symbolen zelf opnieuw moeten roteren":
        "Vous utilisez les nouveaux symboles sans trait. La rotation d'origine est rétablie ; certains symboles devront peut-être être pivotés à nouveau",
    "U kan het schema opslaan op uw lokale harde schijf voor later gebruik. De standaard-naam is eendraadschema.eds. U kan deze wijzigen door links op \"wijzigen\" te klikken":
        "Vous pouvez enregistrer le schéma sur votre disque pour plus tard. Le nom par défaut est eendraadschema.eds ; modifiez-le en cliquant à gauche sur « Modifier »",
    "U kan op dit gerecupereerde schema verder werken of een ander schema laden in het \"Bestand\"-menu":
        "Vous pouvez continuer ce schéma récupéré ou en charger un autre dans le menu « Fichier »",
    "Versie": "Version",
    "Verwijder het teveel aan elementen of gebruik de werkmodus \"Verplaatsen/Clone\" bovenaan om ze onder elkaar te hangen":
        "Supprimez les éléments en trop ou utilisez le mode « Déplacer/Cloner » en haut pour les placer les uns sous les autres",
    "Voeg eerste object toe of kies bovenaan \"Nieuw\"": "Ajoutez un premier objet ou choisissez « Nouveau » en haut",
    "Voor dit schema kan u zelf nog kiezen hoe u de symbolen wenst weer te geven": "Pour ce schéma, vous pouvez encore choisir l'affichage des symboles",
    "Voor fijnere controle tijdens het verschuiven van symbolen kan u ook de pijltjes op het toetsenbord gebruiken":
        "Pour un déplacement plus précis des symboles, utilisez aussi les flèches du clavier",
    "We raden aan het bestand te verkleinen tot beneden 5MB, bijvoorbeeld": "Nous conseillons de réduire le fichier sous 5 Mo, par exemple",
    "Wijzigen": "Modifier", "Zeer groot bestand": "Fichier très volumineux",
    "door het gebruik van het jpeg-bestandsformaat en/of verlagen van de resolutie": "en utilisant le format JPEG et/ou en réduisant la résolution",
    "met als naam": "nommé", "met kader": "avec cadre", "zonder kader": "sans cadre",
    "of tot moeilijkheden leiden bij het opslaan en/of printen": "ou poser problème à l'enregistrement et/ou à l'impression",
    "lamp": "lampe", "spoel": "bobine", "bliksem": "éclair", "ster": "étoile", "enkel": "simple", "dubbel": "double",
    "pagina": "page", "Installateur": "Installateur",
    "mA, Curve": "mA, Courbe", "Nr": "N°",
}

# Textes comprenant des données variables
MOTIFS = [
    [r"Getekend met (\S+)", r"Dessiné avec $1"],
    [r"Ongeldige invoer: niet-geheel getal \((.+?)\)", r"Saisie invalide : nombre non entier ($1)"],
    [r"Ongeldige invoer: niet-geheel getal in bereik \((.+?)\)", r"Saisie invalide : nombre non entier dans la plage ($1)"],
    [r"Ongeldige invoer: overlappende of niet-oplopende pagina's \((.+?)\)", r"Saisie invalide : pages qui se chevauchent ou non croissantes ($1)"],
    [r"Ongeldige invoer: pagina buiten bereik \((.+?)\), toegestaan: 1-(\d+)", r"Saisie invalide : page hors plage ($1), autorisé : 1-$2"],
    [r"Ongeldige invoer: startpagina groter dan eindpagina \((.+?)\)", r"Saisie invalide : page de début après la page de fin ($1)"],
    [r"PDF (.+) wordt gegenereerd\. Even geduld", r"Génération du PDF $1, un instant"],
    [r"Versie: (\S+) \(C\) Ivan Goethals --", r"Version : $1 (C) Ivan Goethals --"],
    [r"ID: (\d+)", r"ID : $1"],
    [r"Pagina (\d+) volledig verwijderen\?", r"Supprimer entièrement la page $1 ?"],
]


def coeur(texte: str) -> str:
    m = EDGES.match(texte)
    return re.sub(r"\s+", " ", m.group(2)) if m else texte


def main() -> None:
    releve = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    existant = json.loads(SORTIE.read_text(encoding="utf-8")) if SORTIE.exists() else {"textes": {}, "motifs": []}
    textes = dict(existant.get("textes", {}))
    for index, fr in TRADUCTIONS.items():
        nl = coeur(releve[index])
        textes[nl] = coeur(fr)
    for nl, fr in AJOUTS.items():
        textes[coeur(nl)] = coeur(fr)
    sortie = {"textes": dict(sorted(textes.items())), "motifs": MOTIFS}
    SORTIE.write_text(json.dumps(sortie, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(textes)} textes, {len(MOTIFS)} motifs -> {SORTIE.relative_to(RACINE).as_posix()}")


if __name__ == "__main__":
    main()
