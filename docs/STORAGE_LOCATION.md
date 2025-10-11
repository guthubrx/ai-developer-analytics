# Emplacement de Stockage des Données

Ce document décrit où et comment sont stockées les données de l'extension AI Developer Analytics, en particulier les **modèles disponibles par provider** et les **analytics**.

## Vue d'ensemble

L'extension utilise le système de **stockage global de VSCode** (`globalStorage`) pour persister les données entre les sessions. Toutes les données sont stockées au format JSON.

## Emplacement sur le disque

### Répertoire principal

```
/Users/[UTILISATEUR]/Library/Application Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/
```

Sur macOS, le chemin complet est :
```bash
~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/
```

### Fichiers de données

Le répertoire contient deux fichiers principaux :

1. **`providers.json`** - Informations sur les providers et leurs capacités
2. **`analytics.json`** - Historique des requêtes et métriques

## 1. Fichier `providers.json`

### Description

Ce fichier contient la liste des **providers AI disponibles** avec leurs métadonnées, mais **PAS** la liste des modèles spécifiques disponibles pour chaque provider.

### Structure

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-10-09T20:38:45.638Z",
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "description": "OpenAI GPT models (GPT-4, GPT-3.5)",
      "enabled": true,
      "apiKeyConfigured": false,
      "metadata": {
        "supportsStreaming": true,
        "supportsToolCalls": true,
        "maxContextTokens": 128000,
        "costPerMillionTokens": 30
      }
    }
    // ... autres providers
  ],
  "statistics": {
    "totalProviders": 5,
    "enabledProviders": 5,
    "configuredProviders": 1
  }
}
```

### Champs principaux

- **`id`** : Identifiant unique du provider (ex: "openai", "anthropic", "deepseek")
- **`name`** : Nom d'affichage du provider
- **`description`** : Description courte du provider
- **`enabled`** : Indique si le provider est activé
- **`apiKeyConfigured`** : Indique si une clé API est configurée
- **`metadata`** : Capacités techniques du provider (streaming, tool calls, contexte, coût)

### Accès au fichier

```bash
# Afficher le contenu
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/providers.json

# Afficher avec formatage
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/providers.json | jq '.'
```

## 2. Fichier `analytics.json`

### Description

Ce fichier contient l'**historique de toutes les requêtes** effectuées vers les providers AI, avec les métriques associées.

### Structure

```json
{
  "requests": [
    {
      "prompt_hash": "ec9c3a34e791bda21bbcb69ea0eb875857497e0d48c75771b3d1adb5073ce791",
      "response_hash": "8e77b3e178a8dd991d1242359c18d91ed30d9e42d1efa0294f3ad3c3edb15487",
      "provider": "deepseek",
      "routing_mode": "manual",
      "latency": 5122,
      "tokens": 468,
      "cost": 0.00007714,
      "success": 1,
      "cache_hit": 0,
      "timestamp": 1759946143802
    }
    // ... autres requêtes
  ]
}
```

### Champs principaux

- **`prompt_hash`** : Hash SHA-256 du prompt (pour identifier les requêtes similaires)
- **`response_hash`** : Hash SHA-256 de la réponse
- **`provider`** : Provider utilisé (ex: "deepseek", "openai")
- **`routing_mode`** : Mode de routage utilisé ("manual", "auto-local", etc.)
- **`latency`** : Temps de réponse en millisecondes
- **`tokens`** : Nombre de tokens utilisés
- **`cost`** : Coût estimé de la requête en USD
- **`success`** : Indicateur de succès (1 = succès, 0 = échec)
- **`cache_hit`** : Indicateur de hit cache (1 = cache, 0 = nouvelle requête)
- **`timestamp`** : Timestamp Unix en millisecondes

## 3. Modèles disponibles par provider

### Comment les modèles sont récupérés

Les **modèles disponibles** pour chaque provider ne sont **PAS stockés sur disque**. Ils sont récupérés dynamiquement via les APIs des providers :

1. **Récupération dynamique** : Quand l'utilisateur sélectionne un provider, l'extension appelle l'API du provider pour récupérer la liste des modèles disponibles
2. **Cache en mémoire** : Les résultats sont mis en cache pendant 5 minutes dans la mémoire de l'extension
3. **Modèles par défaut** : Si l'API échoue ou si la clé API n'est pas configurée, l'extension utilise une liste de modèles par défaut hardcodés

### Code source

Le code de récupération des modèles se trouve dans :

```
src/ai/model-checker.ts
```

### Méthodes principales

- **`checkProviderModels(provider: string)`** : Récupère les modèles pour un provider donné
- **`fetchOpenAIModels(apiKey: string)`** : Récupère les modèles OpenAI via l'API
- **`fetchAnthropicModels(apiKey: string)`** : Récupère les modèles Anthropic via l'API
- **`fetchDeepSeekModels(apiKey: string)`** : Récupère les modèles DeepSeek via l'API
- **`fetchMoonshotModels(apiKey: string)`** : Récupère les modèles Moonshot via l'API

### URLs des APIs

- **OpenAI** : `https://api.openai.com/v1/models`
- **Anthropic** : `https://api.anthropic.com/v1/models`
- **DeepSeek** : `https://api.deepseek.com/v1/models`
- **Moonshot** : `https://api.moonshot.cn/v1/models`
- **Ollama** : Local, pas d'API externe (pour l'instant non implémenté)

### Modèles par défaut

Chaque provider a une liste de modèles par défaut définie dans le code :

- **OpenAI** : GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic** : Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **DeepSeek** : DeepSeek Chat, DeepSeek Reasoner
- **Moonshot** : Moonshot v1 8k, Moonshot v1 32k, Moonshot v1 128k

## 4. Accès programmatique

### Via TypeScript (dans l'extension)

```typescript
import { ProviderStorage } from './ai/providers/provider-storage';
import { ModelChecker } from './ai/model-checker';

// Accès aux providers
const storage = new ProviderStorage(context);
await storage.initialize();
const providers = await storage.loadProviders();

// Accès aux modèles
const modelChecker = new ModelChecker();
const models = await modelChecker.checkProviderModels('openai');
```

### Via WebView (depuis l'interface)

```typescript
// Demander les modèles depuis la WebView
vscode.postMessage({
  type: 'getModels',
  provider: 'openai'
});

// Écouter la réponse
window.addEventListener('message', (event) => {
  if (event.data.type === 'modelsLoaded') {
    console.log('Modèles reçus:', event.data.models);
  }
});
```

## 5. Commandes utiles

### Afficher les données

```bash
# Providers
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/providers.json | jq '.'

# Analytics
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/analytics.json | jq '.'

# Statistiques providers
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/providers.json | jq '.statistics'

# Liste des providers activés
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/providers.json | jq '.providers[] | select(.enabled == true) | .name'

# Nombre total de requêtes
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/analytics.json | jq '.requests | length'

# Coût total
cat ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/analytics.json | jq '[.requests[].cost] | add'
```

### Réinitialiser les données

```bash
# Sauvegarder avant
cp ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/providers.json ~/providers.backup.json
cp ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/analytics.json ~/analytics.backup.json

# Supprimer les données
rm ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/*.json

# Les fichiers seront recréés au prochain lancement de l'extension
```

## 6. Cache des modèles (en mémoire)

### Cache WebView

Le hook `useModels` maintient un cache en mémoire avec une durée de vie de **5 minutes** :

```typescript
const modelCache = new Map<string, { models: ModelInfo[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

**Emplacement** : `webview/src/command-bar/hooks/useModels.ts`

### Invalidation du cache

Le cache est automatiquement invalidé après 5 minutes. Pour forcer un refresh :

1. Rechargez la WebView (rechargez la vue dans VSCode)
2. Changez de provider et revenez au provider d'origine
3. Redémarrez VSCode

## 7. Script utilitaire

Un script bash est disponible pour faciliter l'accès aux données :

```bash
npm run storage:info
```

Voir le fichier `scripts/storage-info.sh` pour plus de détails.

## Résumé

| Donnée | Stockage | Emplacement | Format |
|--------|----------|-------------|--------|
| **Providers** | Disque (persistent) | `providers.json` | JSON |
| **Analytics** | Disque (persistent) | `analytics.json` | JSON |
| **Modèles disponibles** | Mémoire (cache 5min) | En mémoire uniquement | JavaScript Map |
| **Modèles par défaut** | Code source | `src/ai/model-checker.ts` | TypeScript |

## Notes importantes

1. **Les modèles ne sont PAS stockés sur disque** - ils sont récupérés dynamiquement depuis les APIs
2. **Le cache des modèles est temporaire** - il est perdu au redémarrage de l'extension
3. **Les providers sont persistants** - leurs métadonnées sont sauvegardées sur disque
4. **Les analytics sont cumulatives** - elles s'accumulent au fil du temps (pas de rotation automatique)

## Liens utiles

- Code des providers : `src/ai/providers/provider-storage.ts`
- Code du model checker : `src/ai/model-checker.ts`
- Code du hook useModels : `webview/src/command-bar/hooks/useModels.ts`
- Documentation des APIs : Voir la documentation de chaque provider
