#!/bin/bash

# Script pour installer l'extension VSIX et recharger VS Code
# Usage: ./install-and-reload.sh [path-to-vsix]

VSIX_FILE=${1:-"ai-developer-analytics-0.3.1.vsix"}

echo "🔧 Installation de l'extension VSIX..."
code --install-extension "$VSIX_FILE" --force

if [ $? -eq 0 ]; then
    echo "✅ Extension installée avec succès"
    
    echo "🔄 Rechargement de la fenêtre VS Code..."
    # Attendre un peu pour que l'installation se termine
    sleep 2
    
    # Envoyer la commande de reload via l'API VS Code
    code --command "workbench.action.reloadWindow"
    
    echo "✅ Fenêtre rechargée"
else
    echo "❌ Erreur lors de l'installation"
    exit 1
fi