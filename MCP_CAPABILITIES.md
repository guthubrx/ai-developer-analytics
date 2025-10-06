# Capacités MCP de l'Extension AI Developer Analytics

## 📋 Table des Matières
- [Objectif](#objectif)
- [Fonctionnalités](#fonctionnalités)
- [Utilisation](#utilisation)
- [Développement](#développement)
- [Architecture Technique](#architecture-technique)

## 🎯 Objectif

Le serveur MCP (Model Context Protocol) de l'extension AI Developer Analytics fournit des outils d'accès aux systèmes de fichiers et de recherche web aux assistants IA. Il permet aux modèles de langage d'interagir avec l'environnement de développement local et d'accéder à des informations externes de manière sécurisée et contrôlée.

## 🚀 Fonctionnalités

### Outils Disponibles

#### 📁 `read_file`
- **Description**: Lit le contenu d'un fichier depuis le système de fichiers
- **Paramètres**:
  - `path` (string, requis): Chemin vers le fichier à lire
- **Retour**: Contenu textuel du fichier

#### 📂 `list_directory`
- **Description**: Liste le contenu d'un répertoire
- **Paramètres**:
  - `path` (string, requis): Chemin vers le répertoire à lister
- **Retour**: Liste structurée des fichiers et dossiers avec leurs types

#### 🔍 `search_web`
- **Description**: Effectue une recherche web
- **Paramètres**:
  - `query` (string, requis): Requête de recherche
  - `max_results` (number, optionnel, défaut: 5): Nombre maximum de résultats
- **Retour**: Résultats de recherche structurés

## 🛠️ Utilisation

### Installation et Activation

1. **Installation de l'extension**
   - L'extension est disponible dans le marketplace VS Code
   - Elle s'installe automatiquement avec toutes ses dépendances

2. **Démarrage du serveur MCP**
   - Ouvrez la palette de commandes (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Tapez "AI Analytics: Start MCP Server"
   - Le serveur démarre en arrière-plan

3. **Vérification du statut**
   - Commande: "AI Analytics: Show MCP Server Status"
   - Affiche l'état du serveur et son PID

### Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `AI Analytics: Start MCP Server` | Démarre le serveur MCP |
| `AI Analytics: Stop MCP Server` | Arrête le serveur MCP |
| `AI Analytics: Restart MCP Server` | Redémarre le serveur MCP |
| `AI Analytics: Show MCP Server Status` | Affiche le statut du serveur |

### Intégration avec les Assistants IA

Le serveur MCP peut être utilisé par:
- **Claude Desktop** via la configuration MCP
- **Autres clients MCP** compatibles
- **L'extension elle-même** pour les fonctionnalités d'analyse

## 👨‍💻 Développement

### Structure du Code

#### Serveur MCP (`server-mcp/`)

```
server-mcp/
├── src/
│   └── index.ts          # Point d'entrée du serveur MCP
├── dist/                 # Fichiers compilés
├── package.json          # Configuration du package
├── tsconfig.json         # Configuration TypeScript
└── tsup.config.ts        # Configuration de build
```

#### Intégration Extension (`src/mcp/`)

```
src/
└── mcp/
    └── mcp-manager.ts    # Gestionnaire MCP pour l'extension
```

### Implémentation Technique

#### Serveur MCP Core (`server-mcp/src/index.ts`)

**Architecture du Serveur:**
- Utilise le SDK MCP officiel (`@modelcontextprotocol/sdk`)
- Implémente le transport stdio pour la communication
- Gère les requêtes de liste d'outils et d'exécution

**Gestion des Outils:**
```typescript
const tools: ToolSchema[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to read' }
      },
      required: ['path']
    }
  },
  // ... autres outils
];
```

**Exécution des Outils:**
- Lecture de fichiers avec `fs.readFile`
- Listing de répertoires avec `fs.readdir`
- Recherche web (implémentation mock pour le moment)

#### Gestionnaire MCP (`src/mcp/mcp-manager.ts`)

**Cycle de Vie du Serveur:**
```typescript
export class MCPManager {
  private serverProcess: ChildProcess | null = null;
  private isRunning: boolean = false;

  async startServer(): Promise<boolean>
  async stopServer(): Promise<void>
  async restartServer(): Promise<boolean>
  getServerStatus(): { isRunning: boolean; pid?: number | undefined }
}
```

**Configuration du Serveur:**
- Chemin d'exécution: `extensionPath/server-mcp/dist/index.js`
- Environnement: `NODE_ENV=production`
- Gestion des erreurs et timeouts

#### Intégration Extension (`src/extension.ts`)

**Initialisation:**
```typescript
// Global reference to MCP manager for deactivation
let mcpManager: MCPManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
  // ... autres initialisations
  mcpManager = new MCPManager(context);
}
```

**Commandes:**
- Enregistrement des commandes MCP dans VS Code
- Gestion des erreurs et messages utilisateur
- Intégration avec le système de commandes existant

**Nettoyage:**
```typescript
export async function deactivate() {
  if (mcpManager) {
    await mcpManager.dispose();
    mcpManager = null;
  }
}
```

## 🏗️ Architecture Technique

### Stack Technologique

- **Langage**: TypeScript
- **Protocole**: MCP (Model Context Protocol)
- **Build**: tsup pour le serveur MCP, tsc pour l'extension
- **Gestion de Processus**: Node.js Child Process

### Sécurité

- **Accès Contrôlé**: Seulement les outils définis sont exposés
- **Isolation**: Le serveur tourne dans un processus séparé
- **Gestion d'Erreurs**: Erreurs capturées et rapportées proprement

### Extensibilité

**Ajout de Nouveaux Outils:**
1. Définir le schéma dans `tools[]`
2. Implémenter le handler dans `CallToolRequestSchema`
3. Tester et déployer

**Exemple d'Extension:**
```typescript
{
  name: 'new_tool',
  description: 'Description du nouvel outil',
  inputSchema: {
    type: 'object',
    properties: { /* schéma */ },
    required: [/* champs requis */]
  }
}
```

## 🔧 Développement et Tests

### Build
```bash
# Build complet (extension + serveur MCP)
npm run compile

# Build uniquement du serveur MCP
npm run build:mcp

# Build en mode développement
npm run dev
```

### Tests
```bash
# Tests unitaires
npm test

# Tests du serveur MCP
npm run test:mcp
```

### Structure des Tests
- Tests unitaires pour le gestionnaire MCP
- Tests d'intégration pour le serveur MCP
- Tests end-to-end pour l'extension complète

## 🚀 Prochaines Étapes

### Améliorations Planifiées

1. **Outils Additionnels**:
   - Accès aux bases de données
   - Outils de développement spécifiques
   - Intégration avec les APIs externes

2. **Sécurité Renforcée**:
   - Configuration des permissions
   - Audit des accès
   - Chiffrement des communications

3. **Performance**:
   - Cache des résultats
   - Gestion des connexions multiples
   - Optimisation de la mémoire

### Contribution

Les contributions sont les bienvenues! Voir le fichier `CONTRIBUTING.md` pour les guidelines de développement.

---

**Version**: 1.0.0
**Dernière Mise à Jour**: Octobre 2025
**Mainteneurs**: Équipe AI Developer Analytics