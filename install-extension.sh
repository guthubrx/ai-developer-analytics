#!/bin/bash

# Script d'installation et de rechargement de l'extension
# Installation and reload script for the extension

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Installation AI Developer Analytics Extension      ║"
echo "║                  Version 0.3.9                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Désinstaller les anciennes versions
print_step "Étape 1/5: Désinstallation des anciennes versions..."
code --uninstall-extension undefined_publisher.ai-developer-analytics 2>/dev/null
code --uninstall-extension ai-analytics.ai-developer-analytics 2>/dev/null
code --uninstall-extension user.ai-developer-analytics 2>/dev/null
echo "  ✓ Anciennes versions supprimées"
echo ""

# 2. Nettoyer les caches
print_step "Étape 2/5: Nettoyage des caches..."
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics/ 2>/dev/null
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/undefined_publisher.ai-developer-analytics/ 2>/dev/null
echo "  ✓ Caches nettoyés"
echo ""

# 3. Trouver le fichier VSIX le plus récent
print_step "Étape 3/5: Recherche du fichier VSIX..."
VSIX_FILE=$(ls -t ai-developer-analytics-*.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    print_error "Aucun fichier VSIX trouvé!"
    echo "   Exécutez d'abord: npm run package"
    exit 1
fi

echo "  ✓ Fichier trouvé: $VSIX_FILE"
VSIX_SIZE=$(du -h "$VSIX_FILE" | cut -f1)
echo "  ✓ Taille: $VSIX_SIZE"
echo ""

# 4. Installer la nouvelle version
print_step "Étape 4/5: Installation de la nouvelle version..."
code --install-extension "$VSIX_FILE" --force

if [ $? -eq 0 ]; then
    echo "  ✓ Installation réussie"
    echo ""
    
    # 5. Vérification
    print_step "Étape 5/5: Vérification de l'installation..."
    INSTALLED_VERSION=$(code --list-extensions --show-versions | grep ai-developer-analytics)
    if [ -n "$INSTALLED_VERSION" ]; then
        echo "  ✓ Extension installée: $INSTALLED_VERSION"
    else
        print_warning "Impossible de vérifier l'installation"
    fi
    echo ""
    
    # Instructions finales
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              ✅ Installation Terminée !               ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_warning "ÉTAPES SUIVANTES IMPORTANTES:"
    echo ""
    echo "1️⃣  Fermez TOUTES les fenêtres VSCode"
    echo "    > Cmd+Q (macOS) ou Ctrl+Q (Linux/Windows)"
    echo ""
    echo "2️⃣  Relancez VSCode"
    echo ""
    echo "3️⃣  Ouvrez la Console de Développement"
    echo "    > Menu: Help → Toggle Developer Tools"
    echo "    > Onglet: Console"
    echo ""
    echo "4️⃣  Cherchez ces messages dans la console:"
    echo "    ✅ [ACTIVATION] AI Developer Analytics extension is now active!"
    echo "    ✅ [ACTIVATION] ...initialized successfully!"
    echo ""
    echo "5️⃣  Si la jauge bleue tourne toujours:"
    echo "    > Copiez TOUS les logs de la console"
    echo "    > Consultez: DEBUG_LOADING_ISSUE.md"
    echo "    > Consultez: RESOLUTION_CHARGEMENT_INFINI.md"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "🔍 Commandes utiles:"
    echo ""
    echo "  # Vérifier l'installation"
    echo "  code --list-extensions | grep ai-developer-analytics"
    echo ""
    echo "  # Voir les logs VSCode"
    echo "  tail -f ~/Library/Application\\ Support/Code/logs/*/main.log"
    echo ""
    echo "  # Réinstallation complète si problème"
    echo "  ./install-extension.sh"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
else
    echo ""
    print_error "Échec de l'installation"
    echo ""
    echo "Essayez:"
    echo "  1. Vérifiez que VSCode est installé: code --version"
    echo "  2. Vérifiez le fichier VSIX: ls -lh $VSIX_FILE"
    echo "  3. Installez manuellement: code --install-extension $VSIX_FILE"
    exit 1
fi
