# Guide d'Utilisation - Système de Stockage des Providers

## 🚀 Démarrage rapide

### 1. Commandes disponibles

Ouvrez la **Command Palette** (`Ctrl+Shift+P` ou `Cmd+Shift+P`) et tapez :

- **`AI Developer Analytics: Show Provider Status`**
  - Affiche le statut de tous les providers
  - Permet d'exporter ou réinitialiser

- **`AI Developer Analytics: Provider Diagnostic`**
  - Rapport détaillé dans le panneau de sortie
  - Toutes les métadonnées et statistiques

- **`AI Developer Analytics: Export Provider Configuration`**
  - Exporte la configuration en JSON

- **`AI Developer Analytics: Validate Provider Storage`**
  - Vérifie l'intégrité du stockage

### 2. Barre d'état

La barre d'état affiche :
- **`🤖 4/2 Providers`** = 4 providers activés, 2 configurés
- Cliquez pour ouvrir le menu de statut

## 📊 Visualisation des données

### Emplacement du stockage

```
~/.config/Code/User/globalStorage/your-extension-id/providers.json
```

### Structure des données stockées

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "description": "OpenAI GPT models (GPT-4, GPT-3.5)",
      "enabled": true,
      "apiKeyConfigured": false,
      "lastChecked": "2024-01-15T10:30:00.000Z",
      "metadata": {
        "supportsStreaming": true,
        "supportsToolCalls": true,
        "maxContextTokens": 128000,
        "costPerMillionTokens": 30.0
      }
    }
  ],
  "statistics": {
    "totalProviders": 5,
    "enabledProviders": 4,
    "configuredProviders": 2
  }
}
```

## 🔧 Utilisation avancée

### Via l'API TypeScript

```typescript
// Dans votre extension
import { ProviderManager } from './ai/providers/provider-manager';

// Initialiser
const providerManager = new ProviderManager(context);
await providerManager.initialize();

// Obtenir tous les providers
const providers = await providerManager.getAllProviders();

// Obtenir les IDs pour le menu déroulant
const providerIds = await providerManager.getAvailableProviderIds();

// Mettre à jour un provider
await providerManager.updateProviderApiKeyStatus('openai', true);
```

### Script de test

```bash
# Tester le système de stockage
node test-providers-storage.js
```

## 📋 Providers disponibles

| Provider | ID | Statut | Streaming | Tool Calls | Coût |
|----------|----|--------|-----------|------------|------|
| OpenAI | `openai` | ✅ Activé | ✅ | ✅ | $30/M |
| Anthropic | `anthropic` | ✅ Activé | ✅ | ✅ | $15/M |
| DeepSeek | `deepseek` | ✅ Activé | ✅ | ✅ | $0.14/M |
| Moonshot | `moonshot` | ✅ Activé | ✅ | ❌ | $2/M |
| Ollama | `ollama` | ✅ Activé | ✅ | ✅ | Gratuit |

## 🛠️ Dépannage

### Problèmes courants

1. **Providers non visibles**
   - Vérifier `enabled: true` dans le stockage
   - Exécuter la commande de validation

2. **Erreur de chargement**
   - Vérifier les permissions du dossier
   - Réinitialiser aux valeurs par défaut

3. **Métadonnées obsolètes**
   - Les métadonnées se mettent à jour automatiquement
   - Forcer une réinitialisation si nécessaire

### Commandes de diagnostic

```bash
# Dans VSCode
> AI Developer Analytics: Provider Diagnostic
> AI Developer Analytics: Validate Provider Storage
```

## 📈 Monitoring

Le système fournit :
- **Statistiques en temps réel** via la barre d'état
- **Rapports détaillés** via les commandes de diagnostic
- **Export des données** pour analyse externe
- **Validation automatique** de l'intégrité

## 🔒 Sécurité

- **Aucune clé API stockée** - Seul le statut de configuration
- **Stockage local sécurisé** - Dans le dossier de l'extension
- **Validation des données** - Vérification au chargement

---

**Documentation complète** : Voir `docs/providers-storage.md`