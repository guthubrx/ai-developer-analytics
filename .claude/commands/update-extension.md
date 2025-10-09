---
description: Mise à jour complète de l'extension - build VSIX, désinstallation, installation et rechargement
allowed-tools: Bash
---
# Mise à jour complète de l'extension AI Developer Analytics

## Étape 1: Construction du VSIX
Construire la nouvelle version de l'extension
!npm run package

## Étape 2: Désinstallation de l'ancienne version
Désinstaller l'extension précédente si elle existe
!code --list-extensions | grep ai-developer-analytics && code --uninstall-extension moi.ai-developer-analytics || echo "Extension non installée"

## Étape 3: Installation de la nouvelle version
Installer la nouvelle version du VSIX
!code --install-extension ai-developer-analytics-0.3.10.vsix

## Étape 4: Rechargement de l'interface
Redémarrer VSCode pour appliquer les changements
!echo "✅ Extension mise à jour avec succès !"
!echo "📦 Nouvelle version installée: ai-developer-analytics-0.3.10.vsix"
!echo "🔄 Redémarrez VSCode pour appliquer les changements"