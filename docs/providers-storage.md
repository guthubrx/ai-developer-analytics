# Système de Stockage Persistant des Providers

## Vue d'ensemble

Ce système permet de stocker de manière persistante tous les providers disponibles dans le menu déroulant de l'extension VS Code. Il offre une gestion centralisée des providers avec métadonnées détaillées et statistiques d'utilisation.

## Architecture

### Composants principaux

1. **ProviderStorage** (`src/ai/providers/provider-storage.ts`)
   - Gestion du stockage sur disque (JSON)
   - Persistance dans le dossier de stockage global de l'extension
   - Gestion des providers par défaut

2. **ProviderManager** (`src/ai/providers/provider-manager.ts`)
   - Interface VSCode pour la gestion des providers
   - Barre d'état avec informations en temps réel
   - Commandes de gestion

3. **Diagnostic Tools** (`src/ai/providers/diagnostic.ts`)
   - Scripts de diagnostic et validation
   - Export des configurations
   - Rapports détaillés

## Structure des données

### Fichier de stockage

**Emplacement**: `~/.config/Code/User/globalStorage/your-extension-id/providers.json`

**Structure**:
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

### Providers par défaut

| Provider | ID | Description | Streaming | Tool Calls | Max Context | Coût/M tokens |
|----------|----|-------------|-----------|------------|-------------|---------------|
| OpenAI | `openai` | OpenAI GPT models | ✅ | ✅ | 128K | $30.0 |
| Anthropic | `anthropic` | Anthropic Claude models | ✅ | ✅ | 200K | $15.0 |
| DeepSeek | `deepseek` | DeepSeek AI models | ✅ | ✅ | 64K | $0.14 |
| Moonshot | `moonshot` | Moonshot AI (Kimi) | ✅ | ❌ | 128K | $2.0 |
| Ollama | `ollama` | Local Ollama models | ✅ | ✅ | 32K | $0.0 |

## Utilisation

### Commandes disponibles

1. **Afficher le statut des providers**
   ```
   AI Developer Analytics: Show Provider Status
   ```
   - Affiche un menu rapide avec le statut de tous les providers
   - Options d'export et de réinitialisation

2. **Diagnostic complet**
   ```
   AI Developer Analytics: Provider Diagnostic
   ```
   - Génère un rapport détaillé dans le panneau de sortie
   - Inclut toutes les métadonnées et statistiques

3. **Exporter en JSON**
   ```
   AI Developer Analytics: Export Provider Configuration
   ```
   - Exporte la configuration complète dans un document JSON

4. **Validation du stockage**
   ```
   AI Developer Analytics: Validate Provider Storage
   ```
   - Vérifie l'intégrité du stockage
   - Détecte les problèmes potentiels

### Barre d'état

La barre d'état affiche en temps réel:
- Nombre de providers activés
- Nombre de providers configurés
- Statut global de disponibilité

**Exemple**: `🤖 4/2 Providers` (4 activés, 2 configurés)

## API de programmation

### ProviderManager

```typescript
// Obtenir tous les providers
const providers = await providerManager.getAllProviders();

// Obtenir les IDs disponibles pour le menu déroulant
const providerIds = await providerManager.getAvailableProviderIds();

// Mettre à jour le statut d'un provider
await providerManager.updateProviderApiKeyStatus('openai', true);

// Activer/désactiver un provider
await providerManager.setProviderEnabled('ollama', false);
```

### ProviderStorage

```typescript
// Charger les providers depuis le disque
const providers = await storage.loadProviders();

// Sauvegarder les providers
await storage.saveProviders(updatedProviders);

// Obtenir les statistiques
const stats = await storage.getStatistics();

// Réinitialiser aux valeurs par défaut
await storage.resetToDefaults();
```

## Intégration avec l'interface

### Menu déroulant

Les providers disponibles dans le menu déroulant sont automatiquement chargés depuis le stockage persistant via:

```typescript
// Dans ConfigurationPanel.tsx
const { models, loading, error } = useModels(vscode, configuration.provider);
```

### Mise à jour automatique

Le système met automatiquement à jour:
- La barre d'état lors des changements
- Le cache local des providers
- Les statistiques d'utilisation

## Dépannage

### Problèmes courants

1. **Providers non visibles**
   - Vérifier que les providers sont activés (`enabled: true`)
   - Exécuter la commande de validation

2. **Erreur de chargement**
   - Vérifier les permissions du dossier de stockage
   - Réinitialiser aux valeurs par défaut si nécessaire

3. **Métadonnées obsolètes**
   - Les métadonnées sont mises à jour automatiquement
   - Forcer une réinitialisation si besoin

### Commandes de diagnostic

```bash
# Via Command Palette dans VSCode
> AI Developer Analytics: Provider Diagnostic
> AI Developer Analytics: Validate Provider Storage
> AI Developer Analytics: Export Provider Configuration
```

## Évolutivité

### Ajouter un nouveau provider

1. Modifier `DEFAULT_PROVIDERS` dans `provider-storage.ts`
2. Ajouter l'option dans `ConfigurationPanel.tsx`
3. Implémenter le client correspondant

### Personnalisation

Le système supporte:
- Métadonnées personnalisées
- Providers désactivés par défaut
- Configuration par environnement
- Export/import de configurations

## Sécurité

- **Aucune clé API stockée** - Seul le statut de configuration est enregistré
- **Stockage local** - Données stockées localement dans le dossier de l'extension
- **Validation des données** - Vérification de l'intégrité au chargement