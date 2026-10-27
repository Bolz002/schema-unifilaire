# Tester UniSchema sur tablette Android et iPad, avant publication

L'app est servie par le PC. Rien n'est publié sur Internet. La même app (PWA) fonctionne sur Android et iPad.

Le mode hors ligne (service worker) exige une adresse **HTTPS**. Le plus simple est **Tailscale**, déjà installé sur le PC : il donne l'adresse privée `https://desktop-bol.tail7507a1.ts.net`, visible seulement par vos appareils.

## 1. Sur le PC (à chaque séance de test)

```bash
npm run test:tablette
```

Cette commande reconstruit l'app et la sert sur le port 4173. Si Windows demande l'accès réseau pour Node.js, choisir **Réseaux privés**.

Activation de l'adresse HTTPS Tailscale (une seule fois, la règle reste active) :

```bash
tailscale serve --bg 4173
```

Pour l'arrêter après les tests : `tailscale serve --https=443 off`.

## 2. Tablette Android (Chrome)

### Méthode A — Tailscale (recommandée : HTTPS, hors ligne testable)
1. Installer **Tailscale** depuis le Play Store et se connecter avec le **même compte** que le PC (quentin.bolsee@gmail.com).
2. Dans Chrome, ouvrir `https://desktop-bol.tail7507a1.ts.net`.
3. Menu ⋮ → **Installer l'application** (ou **Ajouter à l'écran d'accueil** → Installer).
4. Lancer UniSchema depuis l'icône éclair : l'app s'ouvre en plein écran.

### Méthode B — même Wi-Fi, sans Tailscale
1. La tablette doit être sur le **même réseau** que le PC (aujourd'hui : le partage de connexion de l'iPhone).
2. Dans Chrome, ouvrir `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, saisir `http://172.20.10.9:4173`, passer à **Enabled**, puis **Relaunch**. Sans ce réglage, Chrome refuse le mode hors ligne en HTTP.
3. Ouvrir `http://172.20.10.9:4173`, puis faire comme à la méthode A (étape 3).
4. L'adresse IP du PC peut changer d'un réseau à l'autre : la relire avec `ipconfig` sur le PC.

## 3. iPad (Safari)

Safari n'a pas de réglage équivalent : seule la méthode **Tailscale** permet le mode hors ligne avant publication.
1. Installer **Tailscale** depuis l'App Store et se connecter avec le même compte.
2. Dans **Safari** (pas Chrome), ouvrir `https://desktop-bol.tail7507a1.ts.net`.
3. Toucher **Partager** (carré avec une flèche) → **Sur l'écran d'accueil** → vérifier le nom « UniSchema » → **Ajouter**.
4. Lancer l'app depuis l'icône.

## 4. Scénario de test (Android puis iPad)

Noter le résultat de chaque ligne (OK / KO + remarque) dans `docs/TEST_LOG.md`.

| # | Action | Résultat attendu |
|---|---|---|
| 1 | Lancer l'app depuis l'icône | Plein écran, nom UniSchema, icône éclair |
| 2 | Accueil → « Verdergaan met deze optie » sous Voorbeeld 1 | Le schéma unifilaire s'affiche |
| 3 | Ajouter un circuit, modifier une protection | Le dessin se met à jour |
| 4 | Onglet Situatieschema : ajouter un symbole « Uit schema », le déplacer au doigt | Le symbole se place et se déplace |
| 5 | Onglet Print → Genereer PDF | Le PDF s'ouvre ou se télécharge |
| 6 | Bestand → enregistrer un `.eds` | Le fichier est proposé au téléchargement |
| 7 | Fermer l'app, activer le **mode Avion**, relancer | L'app s'ouvre, badge « Hors ligne », le schéma est toujours là |
| 8 | En mode Avion, refaire 3 et 5 | Fonctionne sans réseau |
| 9 | Couper le mode Avion. Sur le PC, relancer `npm run test:tablette`, puis rouvrir l'app | Bandeau « Nouvelle version disponible » → Recharger |
| 10 | Tourner la tablette (portrait / paysage) | Mise en page utilisable |

## Limites connues à ce stade

- Interface encore **en néerlandais** (traduction : phase 4).
- Tactile pas encore optimisé (phase 3) : certains gestes (clic droit, glisser fin, zoom à deux doigts) peuvent être difficiles. C'est justement ce que ce test doit relever.
- Le PC doit rester allumé avec `npm run test:tablette` actif pour la **première** installation et pour les mises à jour. Ensuite, l'app fonctionne seule hors ligne.
