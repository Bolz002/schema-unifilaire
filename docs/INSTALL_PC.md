# Installer UniSchema sur le PC Windows (avant publication)

UniSchema est la même application sur PC, Android et iPad. Sur Windows, Edge (ou Chrome) l'installe comme un programme : fenêtre à part, icône éclair dans le menu Démarrer et la barre des tâches, fonctionnement hors ligne.

## 1. Démarrer le serveur local

Double-cliquer sur **`Lancer UniSchema (serveur local).cmd`** dans le dossier du projet, ou dans le dossier `schema-unifilaire` :

```bash
npm run test:tablette
```

La fenêtre doit rester ouverte pendant l'installation et pour recevoir les mises à jour.

## 2. Installer l'app

1. Ouvrir **Edge** à l'adresse **http://localhost:4173**.
2. Dans la barre d'adresse, cliquer sur l'icône **« Application disponible / Installer »** (un écran avec une flèche), ou menu **⋯ → Applications → Installer UniSchema**.
3. Confirmer **Installer**. Cocher si on le souhaite « Épingler à la barre des tâches » et « Créer un raccourci sur le Bureau ».
4. UniSchema s'ouvre dans sa propre fenêtre.

Avec Chrome : menu **⋮ → Caster, enregistrer et partager → Installer la page en tant qu'application**.

## 3. Utilisation au quotidien

- Lancer UniSchema depuis le menu Démarrer ou la barre des tâches. **Le serveur n'est plus nécessaire** : l'app est en cache et fonctionne hors ligne.
- Les schémas sont enregistrés automatiquement dans le profil Edge du PC. Exporter régulièrement les `.eds` (menu Bestand) vers OneDrive pour la sauvegarde.
- Raccourcis clavier : Ctrl+Z / Ctrl+Y (annuler / rétablir), flèches pour déplacer un symbole, Ctrl+flèches pour le tourner, Ctrl+molette pour zoomer sur le plan de position.

## 4. Ouvrir un .eds par double-clic

Une fois UniSchema installé, Windows le propose pour les fichiers `.eds` :

1. Double-cliquer sur un `.eds` dans l'Explorateur (ou clic droit → **Ouvrir avec → UniSchema**). La première fois, Edge demande l'autorisation : cocher « Toujours autoriser » puis **Ouvrir**.
2. Si Windows ouvre encore un autre programme : clic droit sur le `.eds` → **Ouvrir avec → Choisir une autre application → UniSchema** → cocher « Toujours utiliser cette application ».
3. Le fichier s'ouvre dans la fenêtre UniSchema déjà ouverte. Si le schéma en cours a des modifications non enregistrées, UniSchema demande confirmation avant de le remplacer.
4. **Opslaan** (Bestand) réécrit directement dans ce même fichier.

Si UniSchema avait été installé avant cette fonction, le désinstaller puis le réinstaller pour que Windows enregistre l'association.

## 5. Mises à jour

Démarrer le serveur local (étape 1) après une nouvelle version, puis ouvrir UniSchema : le bandeau **« Nouvelle version disponible → Recharger »** apparaît. Rien n'est rechargé sans votre accord.

## 6. À savoir

- Les schémas sont liés à l'**adresse** depuis laquelle l'app a été installée. Après la publication sur GitHub Pages (`https://bolz002.github.io/schema-unifilaire/`), la version publiée aura ses propres données : exporter les `.eds` depuis la version locale, puis les rouvrir dans la version publiée.
- Désinstaller : dans UniSchema, menu **⋯ → Désinstaller**, ou Paramètres Windows → Applications.
