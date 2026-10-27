# Glossaire NL → FR (terminologie RGIE)

Statut : **à valider par Quentin** (⛔ HANDOFF phase 4). Les termes sont déjà appliqués dans `fr.json`. Une correction se fait dans `tools/i18n/build_fr.py`, puis on relance `python tools/i18n/build_fr.py tools/i18n/releve_2026-10-27.json`. Seul l'affichage change : les `.eds` ne sont pas touchés.

Légende : ✅ terme courant et sûr · ❓ à confirmer (choix d'usage ou de contexte).

## Documents et structure

| NL | FR | |
|---|---|---|
| Eéndraadschema | Schéma unifilaire | ✅ |
| Situatieschema | Plan de position | ❓ terme du RGIE à confirmer (alternative : « schéma de position ») |
| Aansluiting | Raccordement | ✅ |
| Aansluitpunt | Point de raccordement | ✅ |
| Bord | Tableau | ✅ |
| Kring | Circuit | ✅ |
| Splitsing | Division | ❓ (alternative : « Dérivation ») |
| Aftakdoos | Boîte de dérivation | ✅ |
| Leiding | Canalisation | ✅ |
| Lichtcircuit | Circuit d'éclairage | ✅ |
| Moeder | Parent | ❓ (champ technique de l'arborescence) |

## Protections

| NL | FR | |
|---|---|---|
| automatisch (protection) | disjoncteur | ❓ en minuscule = type de protection ; « Automatisch » (majuscule) = « Automatique » ailleurs |
| differentieel | différentiel (interrupteur différentiel) | ✅ |
| differentieelautomaat | disjoncteur différentiel | ✅ |
| smelt | fusible | ✅ |
| zekeringscheider | sectionneur-fusible | ✅ |
| Zekering/differentieel | Fusible/différentiel | ✅ |
| Hoofdzekering | Protection générale | ❓ (littéralement « fusible principal ») |
| Hoofddifferentieel | Différentiel général | ✅ |
| Aardingsonderbreker | Sectionneur de terre | ❓ |
| Overspanningsbeveiliging | Protection contre les surtensions | ✅ |
| Kortsluitstroom | Courant de court-circuit | ✅ |
| Selectief | Sélectif | ✅ |
| Curve | Courbe | ✅ |
| Kabeltype na / vóór teller | Type de câble après / avant compteur | ✅ |
| Elektriciteitsmeter | Compteur électrique | ✅ |

## Pose et caractéristiques

| NL | FR | |
|---|---|---|
| Plaatsing | Pose | ✅ |
| In wand / Op wand | Encastré / Apparent | ✅ |
| In buis | Sous tube | ✅ |
| Ondergronds / Luchtleiding | Enterré / Ligne aérienne | ✅ |
| Geaard | Mis à la terre | ✅ |
| Halfwaterdicht | Semi-étanche | ✅ |
| Kinderveiligheid | Sécurité enfants | ✅ |
| Huishoudelijke installatie | Installation domestique | ✅ |
| Met nul | Avec neutre | ❓ |
| Meerfasig | Polyphasé | ✅ |
| Afgeschermd | Blindé | ❓ |

## Appareils de commande

| NL | FR | |
|---|---|---|
| Schakelaar(s) | Interrupteur(s) | ✅ |
| enkelpolig / dubbelpolig / driepolig | unipolaire / bipolaire / tripolaire | ✅ |
| wissel_enkel / wissel_dubbel | va-et-vient / va-et-vient double | ✅ |
| kruis_enkel | permutateur | ✅ |
| teleruptor | télérupteur | ✅ |
| dimschakelaar | interrupteur variateur | ✅ |
| bewegingsschakelaar | détecteur de mouvement | ✅ |
| schemerschakelaar | interrupteur crépusculaire | ✅ |
| tijdschakelaar | interrupteur horaire | ✅ |
| rolluikschakelaar | interrupteur de volet | ✅ |
| Trekschakelaar | Interrupteur à tirette | ✅ |
| Drukknop | Bouton-poussoir | ✅ |
| dubbelaansteking | double allumage | ✅ |
| Verklikkerlampje / Signalisatielampje | Voyant témoin / Lampe de signalisation | ✅ |

## Points d'utilisation et récepteurs

| NL | FR | |
|---|---|---|
| Lichtpunt | Point lumineux | ✅ |
| Contactdoos | Prise de courant | ✅ |
| Verbruiker | Récepteur | ✅ |
| Noodverlichting | Éclairage de secours | ✅ |
| Wandlamp | Applique | ✅ |
| Boiler | Boiler | ❓ (usage belge ; alternative « chauffe-eau ») |
| Ketel | Chaudière | ✅ |
| Warmtepomp/airco | Pompe à chaleur/climatisation | ✅ |
| Warmtekrachtkoppeling | Cogénération | ✅ |
| Omvormer | Onduleur | ✅ |
| Zonnepaneel | Panneau solaire | ✅ |
| EV lader | Borne de recharge VE | ✅ |
| Domotica | Domotique | ✅ |
| Droogkast | Sèche-linge | ✅ |
| deurslot | gâche électrique | ✅ |
| intercom | parlophone | ✅ (usage belge) |

## Interface

| NL | FR | |
|---|---|---|
| Ongedaan maken / Opnieuw | Défaire / Refaire | ✅ (évite la confusion avec « Annuler » = Cancel) |
| Werkmodus : Invoegen / Verplaatsen-Clone | Mode de travail : Insertion / Déplacer-Cloner | ✅ |
| Uit bestand / Uit schema / Los symbool | Depuis un fichier / Depuis le schéma / Symbole libre | ✅ |
| In / Uit (zoom) | Zoom + / Zoom − | ✅ |

## Non traduit à ce stade

- Les textes **dessinés dans le schéma** (SVG), par exemple « Curve C » sous les disjoncteurs : ils font partie du dessin et du PDF. À traiter séparément si souhaité.
- Les manuels PDF de l'auteur (néerlandais).
- Les noms saisis par l'utilisateur (Keuken, Badkamer…) : ce sont des données.
