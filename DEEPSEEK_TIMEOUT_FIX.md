# 🔧 Correction du Timeout DeepSeek

## Problème identifié

L'erreur `Request timeout - AI service did not respond` était causée par plusieurs problèmes :

1. **URL API incorrecte** : L'URL utilisée était `https://api.deepseek.com/chat/completions` au lieu de `https://api.deepseek.com/v1/chat/completions`
2. **Absence de timeout configuré** : Les requêtes HTTPS n'avaient pas de timeout configuré
3. **Gestion d'erreur insuffisante** : Les erreurs de timeout n'étaient pas spécifiquement gérées

## Corrections appliquées

### 1. URL API corrigée
```typescript
// Avant
const apiUrl = 'https://api.deepseek.com/chat/completions';

// Après
const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
```

### 2. Configuration de timeout ajoutée
```typescript
// Dans package.json
"aiAnalytics.apiTimeout": {
  "type": "number",
  "default": 60000,
  "description": "API request timeout in milliseconds"
}

// Dans DeepSeekClient
private timeout: number = 60000; // Default 60 seconds
this.timeout = config.get('apiTimeout') as number || 60000;
```

### 3. Gestion d'erreurs améliorée
```typescript
// Timeout configuré dans les options
const options = {
    // ... autres options
    timeout: this.timeout
};

// Gestion des timeouts
const timeoutId = setTimeout(() => {
    req.destroy();
    reject(new Error(`Request timeout after ${this.timeout}ms - DeepSeek API did not respond`));
}, this.timeout);

// Nettoyage des timeouts
clearTimeout(timeoutId);

// Gestion des erreurs réseau
req.on('error', (error) => {
    clearTimeout(timeoutId);
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        reject(new Error(`Connection timeout or reset - DeepSeek API may be unavailable: ${error.message}`));
    } else {
        reject(new Error(`Network error: ${error.message}`));
    }
});
```

## Utilisation

### 1. Redémarrer l'extension
```bash
# Option 1: Script automatique
./fix-deepseek-timeout.sh

# Option 2: Manuel
npm install
npm run compile
# Puis redémarrer VS Code
```

### 2. Configurer la clé API
1. Ouvrir les paramètres VS Code (Ctrl/Cmd + ,)
2. Rechercher "AI Analytics"
3. Configurer `aiAnalytics.deepseekApiKey`
4. Ajuster `aiAnalytics.apiTimeout` si nécessaire (défaut: 60000ms)

### 3. Tester la connexion
```bash
export DEEPSEEK_API_KEY="votre-clé-api"
node test-deepseek-fixed.js
```

## Configuration recommandée

- **Timeout** : 60000ms (60 secondes)
- **Modèle** : deepseek-chat
- **Max tokens** : 2048
- **Streaming** : Activé

## Dépannage

### Erreur de timeout persistante
1. Vérifier la clé API DeepSeek
2. Augmenter le timeout dans les paramètres
3. Vérifier la connexion internet
4. Tester avec un prompt plus court

### Erreur 401 (Unauthorized)
- Vérifier que la clé API est correcte
- S'assurer que la clé API a les bonnes permissions

### Erreur 429 (Rate Limited)
- Attendre quelques minutes avant de réessayer
- Réduire la fréquence des requêtes

## Fichiers modifiés

- `src/ai/clients/deepseek-client.ts` - Client DeepSeek avec corrections
- `package.json` - Configuration de timeout ajoutée
- `test-deepseek-fixed.js` - Script de test
- `test-extension-deepseek.js` - Vérification des corrections
- `fix-deepseek-timeout.sh` - Script d'installation

## Support

Si le problème persiste après ces corrections :
1. Vérifier les logs de l'extension dans VS Code
2. Tester avec le script `test-deepseek-fixed.js`
3. Vérifier la documentation DeepSeek API
4. Contacter le support DeepSeek si nécessaire