# 📋 Documentation des Champs de Réponse des APIs

Ce document répertorie tous les champs disponibles dans les réponses des APIs des différents fournisseurs d'intelligence artificielle intégrés dans l'extension AI Developer Analytics.

## 📊 Vue d'ensemble

| Fournisseur | Endpoint | Format | Streaming | Modèles Supportés |
|-------------|----------|--------|-----------|-------------------|
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | JSON | ✅ | GPT-4o, GPT-4, GPT-3.5-turbo |
| **Anthropic** | `https://api.anthropic.com/v1/messages` | JSON | ✅ | Claude-3.5-Sonnet, Claude-3-Opus |
| **DeepSeek** | `https://api.deepseek.com/chat/completions` | JSON | ✅ | deepseek-chat, deepseek-coder |
| **Moonshot** | `https://api.moonshot.cn/v1/chat/completions` | JSON | ✅ | moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k |
| **Ollama** | `http://localhost:11434/api/generate` | JSON | ✅ | Tous les modèles locaux |

---

## 🔵 OpenAI API

### Structure de Réponse Complète

```json
{
  "id": "chatcmpl-1234567890abcdef",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "system_fingerprint": "fp_44709d6fcb",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Réponse de l'assistant IA..."
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

### Champs Disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | `string` | Identifiant unique de la réponse | ✅ |
| `object` | `string` | Type d'objet ("chat.completion") | ✅ |
| `created` | `integer` | Timestamp Unix de création | ✅ |
| `model` | `string` | Nom du modèle utilisé | ✅ |
| `system_fingerprint` | `string` | Empreinte du système | ❌ |
| `choices` | `array` | Liste des réponses générées | ✅ |
| `choices[].index` | `integer` | Index du choix | ✅ |
| `choices[].message` | `object` | Message de l'assistant | ✅ |
| `choices[].message.role` | `string` | Rôle ("assistant") | ✅ |
| `choices[].message.content` | `string` | Contenu de la réponse | ✅ |
| `choices[].logprobs` | `object\|null` | Probabilités logarithmiques | ❌ |
| `choices[].finish_reason` | `string` | Raison d'arrêt ("stop", "length", "content_filter") | ✅ |
| `usage` | `object` | Métriques d'utilisation | ✅ |
| `usage.prompt_tokens` | `integer` | Tokens d'entrée | ✅ |
| `usage.completion_tokens` | `integer` | Tokens de sortie | ✅ |
| `usage.total_tokens` | `integer` | Total des tokens | ✅ |

---

## 🟣 Anthropic API

### Structure de Réponse Complète

```json
{
  "id": "msg_01234567890abcdef",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Réponse de Claude..."
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  }
}
```

### Champs Disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | `string` | Identifiant unique du message | ✅ |
| `type` | `string` | Type de réponse ("message") | ✅ |
| `role` | `string` | Rôle de l'expéditeur ("assistant") | ✅ |
| `content` | `array` | Contenu du message | ✅ |
| `content[].type` | `string` | Type de contenu ("text") | ✅ |
| `content[].text` | `string` | Texte du contenu | ✅ |
| `model` | `string` | Nom du modèle utilisé | ✅ |
| `stop_reason` | `string` | Raison d'arrêt ("end_turn", "max_tokens", "stop_sequence") | ✅ |
| `stop_sequence` | `string\|null` | Séquence d'arrêt | ❌ |
| `usage` | `object` | Métriques d'utilisation | ✅ |
| `usage.input_tokens` | `integer` | Tokens d'entrée | ✅ |
| `usage.output_tokens` | `integer` | Tokens de sortie | ✅ |

---

## 🔴 DeepSeek API

### Structure de Réponse Complète

```json
{
  "id": "chatcmpl-1234567890abcdef",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Réponse de DeepSeek..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

### Champs Disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | `string` | Identifiant unique de la réponse | ✅ |
| `object` | `string` | Type d'objet ("chat.completion") | ✅ |
| `created` | `integer` | Timestamp Unix de création | ✅ |
| `model` | `string` | Nom du modèle utilisé | ✅ |
| `choices` | `array` | Liste des réponses générées | ✅ |
| `choices[].index` | `integer` | Index du choix | ✅ |
| `choices[].message` | `object` | Message de l'assistant | ✅ |
| `choices[].message.role` | `string` | Rôle ("assistant") | ✅ |
| `choices[].message.content` | `string` | Contenu de la réponse | ✅ |
| `choices[].finish_reason` | `string` | Raison d'arrêt ("stop", "length") | ✅ |
| `usage` | `object` | Métriques d'utilisation | ✅ |
| `usage.prompt_tokens` | `integer` | Tokens d'entrée | ✅ |
| `usage.completion_tokens` | `integer` | Tokens de sortie | ✅ |
| `usage.total_tokens` | `integer` | Total des tokens | ✅ |

---

## 🟡 Moonshot API

### Structure de Réponse Complète

```json
{
  "id": "chatcmpl-1234567890abcdef",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "moonshot-v1-8k",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Réponse de Moonshot..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

### Champs Disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | `string` | Identifiant unique de la réponse | ✅ |
| `object` | `string` | Type d'objet ("chat.completion") | ✅ |
| `created` | `integer` | Timestamp Unix de création | ✅ |
| `model` | `string` | Nom du modèle utilisé | ✅ |
| `choices` | `array` | Liste des réponses générées | ✅ |
| `choices[].index` | `integer` | Index du choix | ✅ |
| `choices[].message` | `object` | Message de l'assistant | ✅ |
| `choices[].message.role` | `string` | Rôle ("assistant") | ✅ |
| `choices[].message.content` | `string` | Contenu de la réponse | ✅ |
| `choices[].finish_reason` | `string` | Raison d'arrêt ("stop", "length") | ✅ |
| `usage` | `object` | Métriques d'utilisation | ✅ |
| `usage.prompt_tokens` | `integer` | Tokens d'entrée | ✅ |
| `usage.completion_tokens` | `integer` | Tokens de sortie | ✅ |
| `usage.total_tokens` | `integer` | Total des tokens | ✅ |

---

## 🟢 Ollama API

### Structure de Réponse Complète

```json
{
  "model": "phi-4",
  "created_at": "2024-01-01T00:00:00.000Z",
  "response": "Réponse d'Ollama...",
  "done": true,
  "context": [1, 2, 3, 4, 5],
  "total_duration": 1000000000,
  "load_duration": 100000000,
  "prompt_eval_count": 10,
  "prompt_eval_duration": 200000000,
  "eval_count": 20,
  "eval_duration": 700000000,
  "prompt_eval_rate": 50.0,
  "eval_rate": 28.57
}
```

### Champs Disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `model` | `string` | Nom du modèle utilisé | ✅ |
| `created_at` | `string` | Timestamp ISO de création | ✅ |
| `response` | `string` | Contenu de la réponse | ✅ |
| `done` | `boolean` | Indique si la réponse est complète | ✅ |
| `context` | `array` | Contexte pour les requêtes suivantes | ❌ |
| `total_duration` | `integer` | Durée totale en nanosecondes | ❌ |
| `load_duration` | `integer` | Durée de chargement du modèle | ❌ |
| `prompt_eval_count` | `integer` | Nombre de tokens évalués dans le prompt | ❌ |
| `prompt_eval_duration` | `integer` | Durée d'évaluation du prompt | ❌ |
| `eval_count` | `integer` | Nombre de tokens générés | ❌ |
| `eval_duration` | `integer` | Durée de génération | ❌ |
| `prompt_eval_rate` | `number` | Taux d'évaluation du prompt (tokens/sec) | ❌ |
| `eval_rate` | `number` | Taux de génération (tokens/sec) | ❌ |

---

## 🔄 Réponses de Streaming

### Format SSE (Server-Sent Events)

Tous les fournisseurs supportent le streaming via SSE. Le format général est :

```
data: {"id": "chatcmpl-123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4o", "choices": [{"index": 0, "delta": {"content": "Hello"}, "finish_reason": null}]}

data: {"id": "chatcmpl-123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4o", "choices": [{"index": 0, "delta": {"content": " world"}, "finish_reason": null}]}

data: [DONE]
```

### Champs Spécifiques au Streaming

| Champ | Type | Description |
|-------|------|-------------|
| `object` | `string` | "chat.completion.chunk" |
| `choices[].delta` | `object` | Changement incrémental |
| `choices[].delta.content` | `string` | Nouveau contenu |
| `choices[].delta.role` | `string` | Rôle (premier chunk) |
| `choices[].finish_reason` | `string\|null` | Raison d'arrêt (dernier chunk) |

---

## 📈 Métriques et Coûts

### Calcul des Coûts par Fournisseur

| Fournisseur | Coût Input (per 1K tokens) | Coût Output (per 1K tokens) |
|-------------|----------------------------|------------------------------|
| **OpenAI** | $0.01 | $0.03 |
| **Anthropic** | $0.015 | $0.075 |
| **DeepSeek** | $0.00014 | $0.00028 |
| **Moonshot** | $0.01 | $0.03 |
| **Ollama** | $0.00 | $0.00 (local) |

### Formule de Calcul

```typescript
const inputCost = (inputTokens / 1000) * costPerInputToken;
const outputCost = (outputTokens / 1000) * costPerOutputToken;
const totalCost = inputCost + outputCost;
```

---

## 🛠️ Utilisation dans l'Extension

### Extraction des Champs Principaux

```typescript
// Exemple d'extraction pour tous les fournisseurs
const extractResponseData = (apiResponse: any, provider: string) => {
  switch (provider) {
    case 'openai':
    case 'deepseek':
    case 'moonshot':
      return {
        content: apiResponse.choices[0].message.content,
        model: apiResponse.model,
        usage: apiResponse.usage,
        id: apiResponse.id
      };
    
    case 'anthropic':
      return {
        content: apiResponse.content[0].text,
        model: apiResponse.model,
        usage: {
          prompt_tokens: apiResponse.usage.input_tokens,
          completion_tokens: apiResponse.usage.output_tokens,
          total_tokens: apiResponse.usage.input_tokens + apiResponse.usage.output_tokens
        },
        id: apiResponse.id
      };
    
    case 'ollama':
      return {
        content: apiResponse.response,
        model: apiResponse.model,
        usage: {
          prompt_tokens: apiResponse.prompt_eval_count || 0,
          completion_tokens: apiResponse.eval_count || 0,
          total_tokens: (apiResponse.prompt_eval_count || 0) + (apiResponse.eval_count || 0)
        },
        id: apiResponse.created_at
      };
  }
};
```

---

## 📝 Notes Importantes

1. **Champs Obligatoires** : Tous les champs marqués comme obligatoires (✅) sont garantis d'être présents dans les réponses.

2. **Champs Optionnels** : Les champs marqués comme optionnels (❌) peuvent ne pas être présents selon la configuration ou la version de l'API.

3. **Versions d'API** : Les structures peuvent varier selon les versions d'API. Consultez la documentation officielle pour les dernières mises à jour.

4. **Gestion d'Erreurs** : Toutes les APIs peuvent retourner des erreurs avec des structures différentes. Implémentez une gestion d'erreur robuste.

5. **Rate Limiting** : Chaque fournisseur a ses propres limites de taux. Consultez leur documentation pour les détails.

---

## 🔗 Liens Utiles

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference)
- [DeepSeek API Documentation](https://platform.deepseek.com/api-docs/)
- [Moonshot API Documentation](https://platform.moonshot.ai/docs/guide/start-using-kimi-api)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

*Dernière mise à jour : Octobre 2024*
*Version de l'extension : 0.3.1*
