# 🔍 Guide de Débogage - Problème de Chargement Infini

## Symptôme
Jauge bleue qui tourne indéfiniment au démarrage de l'extension.

## 🔧 Corrections Appliquées

### Version 0.3.9
1. ✅ Ajout du champ `publisher` dans `package.json`
2. ✅ Gestion d'erreur robuste dans `AnalyticsManager.initialize()`
3. ✅ Imports synchrones déplacés au niveau module
4. ✅ Protection de l'activation avec try-catch
5. ✅ Initialisation non-bloquante de `AIClientManager`

## 📋 Étapes de Débogage

### 1. Installation Propre

```bash
# Exécuter le script d'installation
./install-extension.sh

# OU manuellement:
code --uninstall-extension undefined_publisher.ai-developer-analytics
code --uninstall-extension ai-analytics.ai-developer-analytics
code --install-extension ai-developer-analytics-0.3.9.vsix --force
```

### 2. Ouvrir la Console de Développement

1. **Ouvrir VSCode**
2. **Menu** : `Help` → `Toggle Developer Tools`
3. **Aller à l'onglet Console**
4. **Rechercher les erreurs** (texte en rouge)

### 3. Identifier le Problème

Regardez les messages dans la console :

#### ✅ Messages Normaux (Bon)
```
AI Developer Analytics extension is now active!
WebView HTML loaded, checking for file-autocomplete...
WebView is ready and loaded
AI Developer Analytics extension initialized successfully
```

#### ❌ Messages d'Erreur (Problème)
```
Failed to initialize analytics: ...
Error checking models for ...: ...
TypeError: Cannot read property '...' of undefined
Failed to initialize AI clients: ...
```

### 4. Vérifications Spécifiques

#### A. Vérifier l'installation
```bash
code --list-extensions | grep ai-developer-analytics
# Devrait afficher: ai-analytics.ai-developer-analytics
```

#### B. Vérifier les fichiers compilés
```bash
ls -la out/extension.js
ls -la media/main.bundle.js
```

#### C. Vérifier la configuration VSCode
```bash
# Ouvrir les paramètres
code --open-settings-json

# Chercher "aiAnalytics" et vérifier qu'il n'y a pas de valeurs invalides
```

### 5. Solutions par Type d'Erreur

#### Erreur: "Failed to initialize analytics"
- **Cause**: Problème de permissions sur le dossier de stockage
- **Solution**: 
  ```bash
  # Supprimer le dossier de stockage global
  rm -rf ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/
  ```

#### Erreur: "Cannot find module"
- **Cause**: Fichiers manquants après compilation
- **Solution**:
  ```bash
  npm run compile
  npm run package
  ./install-extension.sh
  ```

#### Erreur: "WebView failed to load"
- **Cause**: CSP (Content Security Policy) bloque le chargement
- **Solution**: Vérifier la console pour les erreurs CSP

#### Erreur: "AI clients initialization failed"
- **Cause**: Problème avec les clés API ou la configuration
- **Solution**: Cette erreur ne devrait plus bloquer l'activation (correction v0.3.9)

### 6. Mode Debug Avancé

Pour activer des logs détaillés :

1. **Ouvrir la Command Palette** (`Cmd/Ctrl + Shift + P`)
2. **Taper**: `Developer: Set Log Level`
3. **Sélectionner**: `Trace`
4. **Redémarrer VSCode**
5. **Menu**: `Help` → `Toggle Developer Tools` → `Console`

### 7. Test Minimal

Créer un fichier de test pour vérifier l'activation :

```bash
# Dans un nouveau terminal VSCode
node -e "console.log('Test Node.js OK')"

# Vérifier TypeScript
npx tsc --version

# Vérifier la compilation
npm run compile
```

## 🚨 Si le Problème Persiste

### A. Vérifier les Conflits d'Extensions
1. Désactiver **toutes** les autres extensions
2. Redémarrer VSCode
3. Tester si l'extension charge

### B. Réinitialisation Complète
```bash
# 1. Désinstaller l'extension
code --uninstall-extension ai-analytics.ai-developer-analytics

# 2. Supprimer tous les caches
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*/ai-analytics.ai-developer-analytics/

# 3. Nettoyer le projet
cd /path/to/project
rm -rf node_modules out media/main.bundle.js
npm install
npm run compile

# 4. Recréer le package
npm run package

# 5. Réinstaller
./install-extension.sh
```

### C. Créer un Nouveau Profil VSCode
```bash
# Créer un profil propre pour tester
code --profile test-extension
# Installer l'extension dans ce profil
```

## 📊 Informations à Fournir si le Problème Continue

Si aucune solution ne fonctionne, fournir :

1. **Logs de la console** (copier tout le texte)
2. **Version de VSCode**: `code --version`
3. **Système d'exploitation**: `uname -a` (macOS/Linux) ou `ver` (Windows)
4. **Liste des extensions**: `code --list-extensions`
5. **Contenu de package.json**: lignes 1-20
6. **Message d'erreur exact**

## 🔄 Dernières Modifications (v0.3.9)

```diff
+ Ajout du champ "publisher": "ai-analytics"
+ Gestion d'erreur non-bloquante dans AnalyticsManager
+ Initialisation asynchrone non-bloquante de AIClientManager
+ Protection try-catch dans extension.ts
+ Imports fs/path au niveau module
```

---

**Fichiers Modifiés:**
- `package.json` (version, publisher)
- `src/analytics/manager.ts` (gestion d'erreur)
- `src/extension.ts` (initialisation robuste)
