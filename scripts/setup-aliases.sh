#!/bin/bash

# Script d'installation des alias pour AI Developer Analytics
# Version: 0.3.7

echo "🚀 Installation des alias AI Developer Analytics..."
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
log() {
    echo -e "${BLUE}$1${NC}"
}

success() {
    echo -e "${GREEN}$1${NC}"
}

warning() {
    echo -e "${YELLOW}$1${NC}"
}

error() {
    echo -e "${RED}$1${NC}"
}

# Détecter le shell de l'utilisateur
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    SHELL_NAME="bash"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
    SHELL_NAME="bash"
else
    error "❌ Aucun fichier de configuration de shell trouvé"
    error "   Supporté: .zshrc, .bashrc, .bash_profile"
    exit 1
fi

log "📋 Shell détecté: $SHELL_NAME"
log "📁 Fichier de configuration: $SHELL_CONFIG"

# Vérifier si les alias existent déjà
if grep -q "# AI Developer Analytics Aliases" "$SHELL_CONFIG"; then
    warning "⚠️  Les alias existent déjà dans $SHELL_CONFIG"
    echo ""
    read -p "Voulez-vous les remplacer ? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "❌ Installation annulée"
        exit 0
    fi
    
    # Supprimer les anciens alias
    log "🗑️  Suppression des anciens alias..."
    sed -i.bak '/# AI Developer Analytics Aliases/,/# End AI Developer Analytics Aliases/d' "$SHELL_CONFIG"
    success "✅ Anciens alias supprimés"
fi

# Créer une sauvegarde
log "💾 Création d'une sauvegarde de $SHELL_CONFIG..."
cp "$SHELL_CONFIG" "${SHELL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
success "✅ Sauvegarde créée"

# Ajouter les alias
log "📝 Ajout des alias..."

cat >> "$SHELL_CONFIG" << 'EOF'

# AI Developer Analytics Aliases
# Version: 0.3.7
# Dernière mise à jour: 2025-10-08

# Alias principaux
alias build="npm run build:safe"
alias build-clean="npm run build:force"
alias build-check="npm run validate"
alias build-test="npm run test:build-system"

# Alias de maintenance
alias fix-deps="npm run fix-dependencies"
alias build-validate="npm run post-build-validation"

# Alias de rollback
alias rollback-list="node scripts/rollback.js list"
alias rollback-restore="node scripts/rollback.js restore"
alias rollback-emergency="node scripts/rollback.js emergency"
alias rollback-validate="node scripts/rollback.js validate"

# Alias de développement
alias dev-build="npm run build:frontend"
alias dev-watch="npm run watch:frontend"
alias dev-test="npm run test"

# Alias d'information
alias build-help="echo '🚀 AI Developer Analytics - Commandes disponibles:'
echo '  build          - Build sécurisé (recommandé)'
echo '  build-clean    - Build avec nettoyage complet'
echo '  build-check    - Vérification rapide'
echo '  build-test     - Test complet du système'
echo '  fix-deps       - Réparer les dépendances'
echo '  rollback-list  - Lister les sauvegardes'
echo '  rollback-emergency - Sauvegarde d''urgence'
echo '  build-help     - Afficher cette aide'"

# End AI Developer Analytics Aliases
EOF

success "✅ Alias ajoutés à $SHELL_CONFIG"

# Créer un script de test des alias
log "🧪 Création d'un script de test..."

cat > "test-aliases.sh" << 'EOF'
#!/bin/bash
echo "🧪 Test des alias AI Developer Analytics"
echo ""

# Charger les alias
source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null

echo "✅ Alias chargés"
echo ""
echo "📋 Test des alias principaux:"
echo "  build: $(type build 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-clean: $(type build-clean 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-check: $(type build-check 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-test: $(type build-test 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  fix-deps: $(type fix-deps 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  rollback-list: $(type rollback-list 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo "  build-help: $(type build-help 2>/dev/null && echo "✅ OK" || echo "❌ Manquant")"
echo ""
echo "🎉 Test terminé !"
EOF

chmod +x test-aliases.sh
success "✅ Script de test créé: test-aliases.sh"

# Instructions finales
echo ""
success "🎉 Installation terminée !"
echo ""
log "📋 Prochaines étapes:"
echo "  1. Redémarre ton terminal ou exécute: source $SHELL_CONFIG"
echo "  2. Teste les alias avec: ./test-aliases.sh"
echo "  3. Utilise 'build-help' pour voir toutes les commandes"
echo ""
log "🚀 Commandes principales:"
echo "  build          - Build sécurisé (recommandé)"
echo "  build-clean    - Build avec nettoyage complet"
echo "  build-check    - Vérification rapide"
echo "  build-test     - Test complet du système"
echo ""
log "💡 Exemple d'utilisation:"
echo "  build          # au lieu de npm run build:safe"
echo "  build-clean    # au lieu de npm run build:force"
echo "  build-check    # au lieu de npm run validate"
echo ""
warning "⚠️  N'oublie pas de redémarrer ton terminal !"
echo ""