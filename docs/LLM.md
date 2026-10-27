# Faire travailler un LLM dans les schémas UniSchema

Deux portes d'entrée, avec la même API et les mêmes règles que l'app :

| Porte | Pour | Fonctionne sur |
|---|---|---|
| **Serveur MCP** (`tools/mcp/`) | Claude Code, Claude Desktop : travailler sur des fichiers `.eds` | PC Windows (Node.js + Edge ou Chrome) |
| **API dans l'app** (`window.UniSchema`) | Un LLM qui pilote le navigateur (Claude in Chrome…) dans l'app ouverte | Partout où l'app tourne |

Les opérations passent par le code de l'app d'origine : types d'enfants autorisés, nombre maximal d'enfants, valeurs permises des listes, numérotation, annuler/rétablir. Le fichier produit est un `.eds` normal, lisible par l'app d'origine.

## 1. Serveur MCP

### Installation (une fois)

```bash
cd tools/mcp
npm install
cd ../..
npm run build
```

Le serveur utilise le build `dist/`. Le reconstruire après une mise à jour de l'app.

### Brancher Claude Code

```bash
claude mcp add unischema -- node "C:/Users/x/Documents/Projets/Application - Ipad - iphone/Schema Unifilaire/schema-unifilaire/tools/mcp/server.mjs"
```

### Brancher Claude Desktop

Dans `%APPDATA%\Claude\claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "unischema": {
      "command": "node",
      "args": ["C:/Users/x/Documents/Projets/Application - Ipad - iphone/Schema Unifilaire/schema-unifilaire/tools/mcp/server.mjs"]
    }
  }
}
```

### Outils

| Outil | Rôle |
|---|---|
| `open_schema(path)` / `new_schema()` | Ouvrir un `.eds` / partir d'un schéma vierge |
| `get_tree(props?)`, `get_element(id)` | Lire l'arborescence, un élément |
| `describe_element(id)` | Champs modifiables, valeurs permises, description FR, enfants autorisés |
| `list_types()`, `allowed_child_types(parentId)` | Types d'éléments |
| `add_element(type, parentId \| refId, position, props)` | Ajouter (enfant, avant, après) |
| `set_props(id, props)`, `set_type(id, type)` | Modifier |
| `delete_element`, `move_element`, `clone_element`, `undo` | Réorganiser, annuler |
| `save_schema(path?)` | Enregistrer en `.eds` (l'ancien fichier est copié en `.bak`) |
| `export_svg(path)` | Dessin du schéma unifilaire en SVG |

Rien n'est écrit sur le disque avant `save_schema`. Les valeurs à envoyer sont celles de l'app d'origine, en néerlandais (`Lichtpunt`, `differentieelautomaat`…). Leur traduction figure dans les champs `*_fr`.

### Exemples de demandes

- « Ouvre `C:\…\maison.eds`, liste les circuits avec leur protection et leur câble. »
- « Dans le circuit B, ajoute deux prises doubles avec terre au bureau, puis enregistre. »
- « Vérifie que tous les circuits de prises ont un disjoncteur 20 A courbe C et un câble 3G2,5 ; corrige ceux qui ne le sont pas. »
- « Crée un nouveau schéma : raccordement 2×40 A différentiel 300 mA, tableau, trois circuits d'éclairage et quatre circuits de prises ; enregistre-le sous `C:\…\nouveau.eds` et exporte le SVG. »

### Test

```bash
node tools/mcp/test.mjs
```

## 2. API dans l'app (`window.UniSchema`)

Disponible dans la console du navigateur ou pour un LLM qui pilote la page :

```js
UniSchema.help()
const tree = UniSchema.getTree({ props: false })
UniSchema.describeElement(19)
UniSchema.addElement({ type: "Lichtpunt", parentId: 19, props: { aantal: "2" } })
UniSchema.setProps(19, { bescherming: "differentieelautomaat", differentieel_delta_amperage: "30" })
UniSchema.exportEds()          // contenu .eds, comme « Enregistrer »
UniSchema.renderSvg()          // dessin SVG
```

L'écran se met à jour, et chaque modification peut être annulée avec le bouton « Défaire ».

## Limites actuelles

- Le **plan de position** (situatieschema) n'est pas encore couvert par l'API : seulement le schéma unifilaire.
- Les messages d'erreur sont en français, les noms de propriétés restent les noms internes de l'app (décrits en français par `describe_element`).
- Le serveur MCP fonctionne sur le PC (Node.js + Edge/Chrome), pas sur l'iPad.
