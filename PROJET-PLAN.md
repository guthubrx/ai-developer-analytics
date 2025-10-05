# Plan de Projet - AI Developer Analytics

## 📋 Vue d'ensemble

Extension VS Code/Cursor pour l'analyse des développeurs avec IA, supportant le routage multi-niveaux, Ollama local, coaching adaptatif et serveur MCP local.

**Statut actuel:** ✅ Architecture de base complète
**Prochaine étape:** 🚀 Test dans VS Code
**Nouvelle fonctionnalité:** 🧭 Serveur MCP local (planifié)

## 🎯 Objectifs du Projet

- [x] **Architecture de base** - Structure complète d'extension VS Code
- [x] **Routage IA dual** - Exécution directe + routage intelligent
- [x] **Multi-fournisseurs IA** - OpenAI, Anthropic, DeepSeek, Ollama
- [x] **Analytics SQLite** - Suivi des coûts, latence, stockage sécurisé
- [x] **Sécurité** - CSP, SecretStorage, chiffrement AES
- [x] **Hot Reload** - Développement rapide
- [ ] **Tests complets** - Extension dans VS Code
- [ ] **UI Dashboard** - Composants d'interface utilisateur
- [ ] **Scanner architecture** - Analyse automatique du code
- [ ] **Serveur MCP local** - Outils filesystem et web search sécurisés

## 📁 Structure du Projet

```
ai-developer-analytics-next-gen/
├── server-mcp/                    # Serveur MCP local (NOUVEAU)
│   ├── src/
│   │   ├── index.ts              # Serveur MCP principal
│   │   ├── tools/                # Outils fs et web
│   │   ├── security/             # Validation scope et permissions
│   │   └── schema/               # Schémas E/S
│   └── dist/                     # Build output
├── src/
│   ├── extension.ts              # Point d'entrée principal
│   ├── ai/
│   │   ├── router/router.ts      # Système de routage dual
│   │   └── clients/              # Clients IA (OpenAI, Anthropic, DeepSeek, Ollama)
│   ├── analytics/
│   │   ├── manager.ts            # Gestionnaire SQLite
│   │   └── models.ts             # Modèles de données
│   ├── ui/
│   │   └── webviews/             # Composants WebView
│   ├── mcpClient.ts              # Client MCP (NOUVEAU)
│   └── policies/                 # Gestion permissions (NOUVEAU)
├── package.json                  # Configuration extension
├── tsconfig.json                 # Configuration TypeScript
├── test-deepseek-simple.js       # Test manuel DeepSeek
└── PROJET-PLAN.md               # Ce fichier
```

## ✅ Tâches Accomplies

### 🏗️ Architecture de Base
- [x] Configuration complète `package.json` avec licence AGPL-3.0
- [x] Structure TypeScript avec mode strict et ESLint
- [x] Points d'entrée d'extension VS Code
- [x] Système de WebViews pour l'interface utilisateur

### 🔄 Routage IA Dual
- [x] **Niveau 1:** Exécution directe (provider spécifique)
- [x] **Niveau 2:** Routage intelligent (auto-local, auto-ollama, etc.)
- [x] Support de 4 providers: OpenAI, Anthropic, DeepSeek, Ollama

### 🛡️ Sécurité et Confidentialité
- [x] Content Security Policy (CSP) pour WebViews
- [x] SecretStorage VS Code pour clés API
- [x] Chiffrement AES des données analytiques
- [x] Protection de la vie privée par conception

### 📊 Système d'Analytics
- [x] Base de données SQLite locale
- [x] Suivi des coûts et latence
- [x] Métriques de performance IA
- [x] Chiffrement des données sensibles

### 🧪 Infrastructure de Test
- [x] Configuration Vitest pour tests unitaires
- [x] Fichier de test manuel DeepSeek (`test-deepseek-simple.js`)
- [x] Tests sans compilation TypeScript

### 🧭 Architecture MCP (Planifiée)
- [ ] **Serveur MCP** - Structure de base et outils core
- [ ] **Sécurité MCP** - Workspace Trust et permissions
- [ ] **Intégration** - Client et policies dans l'extension

## 🚀 Prochaines Étapes

### Phase 1: Test Extension (Immédiat)
1. **Compiler l'extension**
   ```bash
   npm run compile
   ```

2. **Packager pour VS Code**
   ```bash
   npm run package
   ```

3. **Tester dans VS Code**
   - Installer l'extension `.vsix`
   - Tester les commandes IA
   - Vérifier l'interface utilisateur

### Phase 2: Interface Utilisateur
- [ ] Implémenter les dashboards WebView
- [ ] Composant barre de commandes IA
- [ ] Panneau de coaching adaptatif
- [ ] Visualisation des métriques

### Phase 3: Serveur MCP Local
- [ ] **Configuration monorepo** - Workspaces et dépendances
- [ ] **Serveur MCP core** - Outils fs et web search
- [ ] **Intégration extension** - Client et policies
- [ ] **Tests sécurité** - Validation scope et conformité
- [ ] **Packaging** - Validation inclusion dist/ uniquement

### Phase 4: Fonctionnalités Avancées
- [ ] Scanner d'architecture automatique
- [ ] Recommandations de refactoring
- [ ] Intégration CI/CD
- [ ] Documentation utilisateur

## 🧪 Tests Disponibles

### Test Manuel DeepSeek
```bash
# Tester sans installer l'extension
export DEEPSEEK_API_KEY="votre-clé-api"
node test-deepseek-simple.js
```

### Tests Unitaires
```bash
npm test              # Exécuter tous les tests
npm run test:watch    # Mode surveillance
```

### Tests E2E
```bash
npm run e2e           # Tests Playwright
```

### Tests MCP (Nouveaux)
```bash
npm run test:mcp      # Tests serveur MCP (Vitest)
# Tests manuels MCP :
# - Workspace non fiable → MCP désactivé
# - Consentement → Prompt affiché
# - Scope validation → Erreur OUT_OF_SCOPE
# - Web search → Résultats normalisés
```

## 📊 Métriques de Suivi

- **Latence IA:** Temps de réponse des providers
- **Coûts:** Estimation des coûts par requête
- **Utilisation:** Fréquence et types de requêtes
- **Performance:** Métriques de routage intelligent
- **Performance MCP:** Latence outils fs et web
- **Sécurité MCP:** Taux de refus OUT_OF_SCOPE
- **Utilisation MCP:** Fréquence outils par type

## 🔧 Développement

### Commandes Disponibles
```bash
npm run compile       # Compilation TypeScript
npm run watch         # Surveillance des changements
npm run lint          # Vérification ESLint
npm run package       # Création package .vsix
npm run publish       # Publication (si configuré)
# Nouvelles commandes MCP :
npm run build:mcp     # Build serveur MCP
npm run test:mcp      # Tests serveur MCP
```

### Configuration
- **Mode routage:** `aiAnalytics.routingMode` (auto-local, direct, etc.)
- **Ollama:** URL et modèle par défaut configurables
- **Télémétrie:** Activation/désactivation locale
- **Hot Reload:** Pour développement
- **MCP:** `aiAnalytics.mcpEnabled` - Activation serveur MCP
- **Scope MCP:** `aiAnalytics.mcpScopeToWorkspace` - Restriction workspace
- **Dossiers MCP:** `aiAnalytics.mcpAdditionalDirectories` - Dossiers supplémentaires

## 🎯 Points Clés Réalisés

1. **✅ Architecture complète** - Tous les composants principaux implémentés
2. **✅ Sécurité robuste** - CSP, chiffrement, SecretStorage
3. **✅ Multi-providers** - 4 services IA supportés
4. **✅ Analytics privés** - Stockage local chiffré
5. **✅ Tests manuels** - Validation sans VS Code
6. **🔄 Prêt pour VS Code** - Compilation et packaging restants
7. **🧭 Serveur MCP planifié** - Architecture définie et prête pour implémentation

## 📞 Prochaines Actions

L'extension est prête pour la phase de test dans VS Code. Les composants principaux sont fonctionnels et peuvent être compilés pour installation. Le serveur MCP local est planifié et prêt pour implémentation après validation de l'extension de base.

**Actions recommandées:**
1. **Immédiat:** Compiler et tester l'extension dans VS Code
2. **Court terme:** Implémenter l'interface utilisateur (Phase 2)
3. **Moyen terme:** Développer le serveur MCP local (Phase 3)
4. **Long terme:** Fonctionnalités avancées et documentation (Phase 4)