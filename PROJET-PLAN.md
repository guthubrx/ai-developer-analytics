# Plan de Projet - AI Developer Analytics

## 📋 Vue d'ensemble

Extension VS Code/Cursor pour l'analyse des développeurs avec IA, supportant le routage multi-niveaux, Ollama local, coaching adaptatif, gestion de sessions et serveur MCP local.

**Statut actuel:** ✅ Extension fonctionnelle avec gestion de sessions
**Prochaine étape:** 🚀 Tests avancés et améliorations UI
**Nouvelle fonctionnalité:** ✅ Gestion de sessions avec métriques persistantes

## 🎯 Objectifs du Projet

- [x] **Architecture de base** - Structure complète d'extension VS Code
- [x] **Routage IA dual** - Exécution directe + routage intelligent
- [x] **Multi-fournisseurs IA** - OpenAI, Anthropic, DeepSeek, Ollama
- [x] **Analytics SQLite** - Suivi des coûts, latence, stockage sécurisé
- [x] **Sécurité** - CSP, SecretStorage, chiffrement AES
- [x] **Hot Reload** - Développement rapide
- [x] **Gestion de sessions** - Onglets multiples avec métriques persistantes
- [x] **Interface command bar** - UI WhatsApp style avec onglets sticky
- [x] **Animation thinking** - Points animés pendant l'exécution
- [x] **Extracteur métriques Claude** - Analyse interface Claude Code
- [x] **Serveur MCP local** - Structure implémentée avec outils fs et web
- [ ] **Tests complets** - Extension dans VS Code
- [ ] **UI Dashboard** - Composants d'interface utilisateur
- [ ] **Scanner architecture** - Analyse automatique du code

## 📁 Structure du Projet

```
ai-developer-analytics-next-gen/
├── server-mcp/                    # Serveur MCP local
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
│   │   └── sidebar/              # Barre de commande IA
│   │       └── command-bar-provider.ts
│   ├── sessions/                 # Gestion de sessions (NOUVEAU)
│   │   ├── manager.ts            # Gestionnaire sessions
│   │   └── types.ts              # Types sessions et métriques
│   ├── coaching/                 # Coach IA adaptatif
│   ├── utils/                    # Utilitaires
│   │   └── claude-metrics-extractor.js
│   ├── mcpClient.ts              # Client MCP
│   └── policies/                 # Gestion permissions
├── media/                        # Assets UI
│   ├── main.css                  # Styles command bar
│   ├── main.js                   # JavaScript command bar
│   ├── reset.css
│   └── vscode.css
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

### 🗂️ Gestion de Sessions (NOUVEAU)
- [x] **Architecture sessions** - Modèle de données complet avec métriques
- [x] **Manager sessions** - CRUD avec persistance VS Code globalState
- [x] **UI onglets** - Interface avec onglets sticky et création/fermeture
- [x] **Métriques persistantes** - Tokens, coûts, cache conservés entre sessions
- [x] **Conversations par session** - Historique séparé pour chaque onglet

### 🎨 Interface Utilisateur (NOUVEAU)
- [x] **Barre de commande** - Style WhatsApp avec zone de conversation
- [x] **Onglets sticky** - Barre d'onglets toujours visible pendant le scroll
- [x] **Animation thinking** - Points animés pendant l'exécution IA
- [x] **Dropdowns compactes** - Sélection task, mode, engine
- [x] **Coach advice** - Section collapsible pour conseils IA

### 🔧 Utilitaires et Extraction (NOUVEAU)
- [x] **Extracteur métriques Claude** - Analyse interface Claude Code
- [x] **Format unifié** - Structure de données compatible Cursor/Claude
- [x] **Tests manuels** - Validation extraction métriques
- [x] **Streaming réel IA** - Réception progressive avec formatage en temps réel

### 🧭 Architecture MCP (IMPLÉMENTÉE)
- [x] **Serveur MCP** - Structure complète avec outils fs et web
- [x] **Sécurité MCP** - Workspace Trust et validation scope
- [x] **Intégration** - Client et policies dans l'extension
- [x] **Build MCP** - Configuration monorepo et compilation

## 🚀 Prochaines Étapes

### Phase 1: Tests et Améliorations UI (Immédiat)
- [ ] **Tests complets VS Code** - Validation extension installée
- [ ] **Améliorations UI** - Refinements interface utilisateur
- [ ] **Tests sessions** - Validation gestion onglets multiples
- [ ] **Tests métriques** - Vérification persistance données

### Phase 2: Dashboard et Analytics
- [ ] **Dashboard Ops Router** - Visualisation coûts et performance
- [ ] **Dashboard BI Dev** - Analytics par projet
- [ ] **Dashboard AI Coach** - Conseils personnalisés
- [ ] **Visualisation métriques** - Graphiques et rapports

### Phase 3: Serveur MCP Local (AMÉLIORATIONS)
- [ ] **Tests MCP avancés** - Validation outils fs et web
- [ ] **Intégration extension** - Utilisation outils MCP
- [ ] **Sécurité renforcée** - Validation permissions workspace
- [ ] **Documentation MCP** - Guide utilisation serveur

### Phase 4: Fonctionnalités Avancées
- [ ] **Scanner architecture** - Analyse automatique du code
- [ ] **Recommandations refactoring** - Suggestions améliorations
- [ ] **Intégration CI/CD** - Pipeline automatisation
- [ ] **Documentation utilisateur** - Guide complet

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

### Tests MCP
```bash
npm run test:mcp      # Tests serveur MCP (Vitest)
# Tests manuels MCP :
# - Workspace non fiable → MCP désactivé
# - Consentement → Prompt affiché
# - Scope validation → Erreur OUT_OF_SCOPE
# - Web search → Résultats normalisés
```

### Tests Sessions (NOUVEAU)
```bash
# Tests manuels sessions :
# - Création onglets multiples
# - Persistance métriques entre sessions
# - Fermeture onglets (sauf dernier)
# - Switch entre sessions
# - Animation thinking pendant exécution
```

## 📊 Métriques de Suivi

- **Latence IA:** Temps de réponse des providers
- **Coûts:** Estimation des coûts par requête
- **Utilisation:** Fréquence et types de requêtes
- **Performance:** Métriques de routage intelligent
- **Performance MCP:** Latence outils fs et web
- **Sécurité MCP:** Taux de refus OUT_OF_SCOPE
- **Utilisation MCP:** Fréquence outils par type
- **Sessions:** Nombre d'onglets actifs, durée moyenne
- **Métriques persistantes:** Tokens, coûts, cache par session
- **Animation thinking:** Temps moyen d'exécution

## 🔧 Développement

### Commandes Disponibles
```bash
npm run compile       # Compilation TypeScript + MCP
npm run watch         # Surveillance des changements
npm run lint          # Vérification ESLint
npm run package       # Création package .vsix
npm run publish       # Publication (si configuré)
npm run build:mcp     # Build serveur MCP uniquement
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
- **Engine par défaut:** `aiAnalytics.defaultEngine` - DeepSeek par défaut
- **Métriques sessions:** Persistance automatique activée

## 🎯 Points Clés Réalisés

1. **✅ Architecture complète** - Tous les composants principaux implémentés
2. **✅ Sécurité robuste** - CSP, chiffrement, SecretStorage
3. **✅ Multi-providers** - 4 services IA supportés
4. **✅ Analytics privés** - Stockage local chiffré
5. **✅ Tests manuels** - Validation sans VS Code
6. **✅ Gestion sessions** - Onglets multiples avec métriques persistantes
7. **✅ Interface utilisateur** - Barre de commande WhatsApp style
8. **✅ Serveur MCP** - Structure complète implémentée
9. **✅ Animation thinking** - Feedback visuel pendant exécution
10. **✅ Extracteur métriques** - Compatibilité Claude Code

## 📞 Prochaines Actions

L'extension est fonctionnelle avec toutes les fonctionnalités principales implémentées. Les sessions multiples, l'interface utilisateur et le serveur MCP sont opérationnels.

**Actions recommandées:**
1. **Immédiat:** Tests approfondis dans VS Code
2. **Court terme:** Améliorations UI et validation sessions
3. **Moyen terme:** Dashboard analytics et visualisation
4. **Long terme:** Scanner architecture et documentation