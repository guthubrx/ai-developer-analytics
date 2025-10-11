# 🛠️ Scripts de Build Sécurisé - AI Developer Analytics

## Résumé ##
⏺ Voici les scripts npm disponibles dans votre projet :

  🛠️ Scripts de Build & Développement

  Build principal :

  - npm run compile - Compilation complète (TypeScript + MCP + Webview)
  - npm run package - Création du VSIX

  Composants individuels :

  - npm run build:mcp - Build du serveur MCP
  - npm run build:webview - Build du webview React
  - npm run dev:webview - Dev server webview

  Validation & Sécurité :

  - npm run build:safe - Build avec vérifications
  - npm run validate - Validation pré-build
  - npm run pre-build-check - Vérifications avant build

  Déploiement :

  - npm run deploy - Déploiement standard
  - npm run deploy:next - Déploiement avec version patch

  Utilitaires :

  - npm run storage:info - Info stockage providers
  - npm run storage:quick - Résumé rapide stockage
  - npm run commit - Commit intelligent

  🎯 Pour créer un VSIX :

  npm run package

  🔧 Pour build complet :

  npm run compile

  Votre projet a une configuration très complète avec de nombreux scripts utilitaires !


  
## 📋 Vue d'Ensemble

Ce dossier contient tous les scripts nécessaires pour un système de build sécurisé et fiable.

## 📁 Structure des Scripts

```
scripts/
├── README.md                    # Ce fichier
├── pre-build-check.js          # Vérifications pré-build
├── secure-build.js             # Build sécurisé avec gestion d'erreurs
├── dependency-manager.js       # Gestion des dépendances
├── post-build-validation.js    # Validation post-build
├── rollback.js                 # Système de rollback
└── test-build-system.js        # Tests du système
```

## 🚀 Scripts Principaux

### 1. `pre-build-check.js`
**Vérifications pré-build**

```bash
npm run pre-build-check
# ou
node scripts/pre-build-check.js
```

**Fonctionnalités :**
- Vérification des dépendances critiques
- Contrôle de la version Node.js
- Validation de la structure des fichiers
- Vérification de la configuration TypeScript
- Contrôle des artefacts de build existants

### 2. `secure-build.js`
**Build sécurisé avec gestion d'erreurs**

```bash
npm run secure-build
# ou
node scripts/secure-build.js
```

**Fonctionnalités :**
- Sauvegarde automatique avant build
- Réparation des dépendances
- Compilation TypeScript avec contournements
- Build MCP et frontend
- Validation du build final
- Packaging de l'extension

### 3. `dependency-manager.js`
**Gestion des dépendances**

```bash
npm run fix-dependencies
# ou
node scripts/dependency-manager.js
```

**Fonctionnalités :**
- Analyse des dépendances actuelles
- Installation des packages manquants
- Résolution des conflits
- Création de fichiers de verrouillage
- Génération de rapports

### 4. `post-build-validation.js`
**Validation post-build**

```bash
npm run post-build-validation
# ou
node scripts/post-build-validation.js
```

**Fonctionnalités :**
- Validation de la structure des fichiers
- Contrôle des tailles de fichiers
- Vérification de la syntaxe JavaScript
- Validation du package.json
- Contrôle du package VSIX
- Vérification de sécurité

### 5. `rollback.js`
**Système de rollback**

```bash
# Lister les sauvegardes
node scripts/rollback.js list

# Restaurer une sauvegarde
node scripts/rollback.js restore <backup-name>

# Rollback Git
node scripts/rollback.js git <commit-hash>

# Sauvegarde d'urgence
node scripts/rollback.js emergency

# Valider l'état actuel
node scripts/rollback.js validate
```

**Fonctionnalités :**
- Gestion des sauvegardes
- Restauration depuis sauvegarde
- Rollback Git
- Sauvegarde d'urgence
- Validation de l'état

### 6. `test-build-system.js`
**Tests du système**

```bash
npm run test:build-system
# ou
node scripts/test-build-system.js
```

**Fonctionnalités :**
- Test de tous les scripts
- Vérification de la structure
- Test des dépendances
- Validation du système complet

## 🔧 Utilisation Recommandée

### Build Standard
```bash
npm run build:safe
```

### Build d'Urgence
```bash
npm run build:force
```

### Vérification Rapide
```bash
npm run validate
```

### Test Complet
```bash
npm run test:build-system
```

## 📊 Fichiers de Rapport

Les scripts génèrent plusieurs fichiers de rapport :

- `dependency-lock.json` - Verrouillage des dépendances
- `dependency-report.json` - Rapport des dépendances
- `validation-report.json` - Rapport de validation
- `test-report.json` - Rapport de tests

## 🚨 Dépannage

### Problèmes Courants

1. **Script non exécutable**
   ```bash
   chmod +x scripts/*.js
   ```

2. **Dépendances manquantes**
   ```bash
   npm run fix-dependencies
   ```

3. **Erreurs de permissions**
   ```bash
   sudo npm install
   ```

4. **Cache corrompu**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs et Debug

Tous les scripts génèrent des logs détaillés avec :
- Codes couleur pour la lisibilité
- Timestamps pour le suivi
- Messages d'erreur détaillés
- Suggestions de résolution

## 🔒 Sécurité

### Vérifications Automatiques

- Validation des dépendances critiques
- Contrôle des vulnérabilités
- Vérification des tailles de fichiers
- Validation de la syntaxe

### Fichiers de Verrouillage

- `dependency-lock.json` - Versions exactes
- `package-lock.json` - Verrouillage NPM
- `.vscodeignore` - Exclusion des fichiers sensibles

## 📈 Maintenance

### Vérifications Régulières

1. **Hebdomadaire** : `npm run test:build-system`
2. **Avant chaque build** : `npm run validate`
3. **Mensuelle** : `npm audit` et `npm update`

### Mise à Jour

1. Vérifier les nouvelles versions des dépendances
2. Tester avec `npm run test:build-system`
3. Mettre à jour si nécessaire

## 📞 Support

### En Cas de Problème

1. Consulter les logs détaillés
2. Vérifier les fichiers de rapport
3. Utiliser le système de rollback
4. Consulter la documentation

### Fichiers d'Aide

- `docs/BUILD_SECURITY_GUIDE.md` - Guide complet
- `test-report.json` - Rapport de tests
- Logs dans la console

---

*Dernière mise à jour : 2025-10-08*
*Version : 0.3.7*