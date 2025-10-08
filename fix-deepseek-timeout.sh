#!/bin/bash

# Script de correction du timeout DeepSeek
# DeepSeek timeout fix script

echo "🔧 Correction du problème de timeout DeepSeek"
echo "=============================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

echo "✅ Répertoire de projet détecté"

# Vérifier les corrections
echo ""
echo "🔍 Vérification des corrections..."
node test-extension-deepseek.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Toutes les corrections sont en place !"
    
    echo ""
    echo "📦 Installation des dépendances..."
    npm install
    
    echo ""
    echo "🔨 Compilation TypeScript..."
    npm run compile
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Compilation réussie !"
        echo ""
        echo "🚀 Prochaines étapes:"
        echo "  1. Redémarrez VS Code ou rechargez l'extension"
        echo "  2. Ouvrez les paramètres de l'extension (Ctrl/Cmd + ,)"
        echo "  3. Recherchez 'AI Analytics'"
        echo "  4. Configurez votre clé API DeepSeek"
        echo "  5. Ajustez le timeout si nécessaire (défaut: 60s)"
        echo ""
        echo "🧪 Pour tester:"
        echo "  export DEEPSEEK_API_KEY='votre-clé-api'"
        echo "  node test-deepseek-fixed.js"
        echo ""
        echo "⚙️  Configuration recommandée:"
        echo "  - Timeout: 60000ms (60 secondes)"
        echo "  - Modèle: deepseek-chat"
        echo "  - Max tokens: 2048"
    else
        echo "❌ Erreur de compilation TypeScript"
        exit 1
    fi
else
    echo "❌ Des corrections sont manquantes"
    exit 1
fi