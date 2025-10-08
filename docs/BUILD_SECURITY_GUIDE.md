# 🛡️ Guide de Sécurisation des Builds - AI Developer Analytics

## 📋 Vue d'Ensemble

Ce guide décrit le système de build sécurisé mis en place pour éviter les problèmes de compilation et assurer des livraisons fiables.

## 🚀 Scripts Disponibles

### Scripts Principaux

| Script | Commande | Description |
|--------|----------|-------------|
| **Build Sécurisé** | `npm run build:safe` | Build complet avec vérifications |
| **Build Forcé** | `npm run build:force` | Nettoyage complet + build |
| **Vérification** | `npm run validate` | Vérification pré-build uniquement |
| **Réparation** | `npm run fix-dependencies` | Réparation des dépendances |

### Scripts Individuels

| Script | Commande | Description |
|--------|----------|-------------|
| **Pré-build** | `npm run pre-build-check` | Vérifications avant build |
| **Build Sécurisé** | `npm run secure-build` | Build avec gestion d'erreurs |
| **Validation** | `npm run post-build-validation` | Validation post-build |

## 🔧 Utilisation

### Build Standard (Recommandé)

```bash
# Build complet avec toutes les vérifications
npm run build:safe
```

### Build d'Urgence

```bash
# En cas de problème, nettoyage complet
npm run build:force
```

### Vérification Rapide

```bash
# Vérifier l'état sans builder
npm run validate
```

## 🛠️ Gestion des Dépendances

### Réparation Automatique

```bash
# Réparer les dépendances corrompues
npm run fix-dependencies
```

### Vérification Manuelle

```bash
# Vérifier les dépendances critiques
npm list @types/vscode
npm list typescript
npm list tsup
```

## 🔄 Système de Rollback

### Restaurer une Sauvegarde

```bash
# Lister les sauvegardes disponibles
node scripts/rollback.js list

# Restaurer une sauvegarde spécifique
node scripts/rollback.js restore build-1234567890
```

### Rollback Git

```bash
# Lister les commits récents
node scripts/rollback.js commits

# Rollback vers un commit
node scripts/rollback.js git abc1234
```

### Sauvegarde d'Urgence

```bash
# Créer une sauvegarde immédiate
node scripts/rollback.js emergency
```

## 📊 Monitoring et Rapports

### Fichiers de Rapport

- `dependency-lock.json` - Verrouillage des dépendances
- `dependency-report.json` - Rapport des dépendances
- `validation-report.json` - Rapport de validation

### Vérification de l'État

```bash
# Valider l'état actuel
node scripts/rollback.js validate
```

## 🚨 Dépannage

### Problèmes Courants

#### 1. Erreur "@types/vscode" manquant

```bash
# Solution automatique
npm run fix-dependencies

# Solution manuelle
npm install @types/vscode@1.104.0 --save-dev --force
```

#### 2. Erreurs de compilation TypeScript

```bash
# Nettoyage complet
npm run build:force

# Ou manuellement
rm -rf node_modules package-lock.json
npm install
npm run build:safe
```

#### 3. Problèmes de cache NPM

```bash
# Nettoyage du cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 4. Build MCP échoué

```bash
# Build manuel du MCP
cd server-mcp
npm install
npx tsup src/index.ts --format esm --dts --clean
```

### Codes d'Erreur

| Code | Description | Solution |
|------|-------------|----------|
| `TS2307` | Module non trouvé | `npm run fix-dependencies` |
| `ERR_MODULE_NOT_FOUND` | Package manquant | `npm install` |
| `EACCES` | Permissions | `sudo npm install` |
| `ENOENT` | Fichier manquant | Vérifier la structure |

## 📈 Bonnes Pratiques

### Avant Chaque Build

1. **Vérifier l'état** : `npm run validate`
2. **Nettoyer si nécessaire** : `npm run fix-dependencies`
3. **Builder** : `npm run build:safe`

### Maintenance Régulière

1. **Mise à jour des dépendances** : `npm update`
2. **Vérification de sécurité** : `npm audit`
3. **Nettoyage** : `npm prune`

### En Cas de Problème

1. **Sauvegarder** : `node scripts/rollback.js emergency`
2. **Diagnostiquer** : `npm run validate`
3. **Réparer** : `npm run fix-dependencies`
4. **Tester** : `npm run build:safe`

## 🔒 Sécurité

### Vérifications Automatiques

- Validation des dépendances critiques
- Vérification des vulnérabilités
- Contrôle des tailles de fichiers
- Validation de la syntaxe JavaScript

### Fichiers de Verrouillage

- `dependency-lock.json` - Verrouillage des versions
- `package-lock.json` - Verrouillage NPM
- `.vscodeignore` - Exclusion des fichiers sensibles

## 📞 Support

### Logs et Diagnostics

Les scripts génèrent des logs détaillés avec codes couleur :
- 🟢 Vert : Succès
- 🔴 Rouge : Erreur
- 🟡 Jaune : Avertissement
- 🔵 Bleu : Information

### Fichiers de Debug

- `validation-report.json` - Rapport de validation
- `dependency-report.json` - Rapport des dépendances
- Logs dans la console avec timestamps

## 🎯 Prochaines Étapes

1. **Automatisation** : Intégration CI/CD
2. **Monitoring** : Alertes automatiques
3. **Tests** : Tests de régression
4. **Documentation** : Mise à jour continue

---

*Dernière mise à jour : 2025-10-08*
*Version : 0.3.7*