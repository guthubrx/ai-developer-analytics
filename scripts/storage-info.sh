#!/bin/bash

# Script utilitaire pour inspecter le stockage de l'extension AI Developer Analytics
# Utility script to inspect AI Developer Analytics extension storage

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Chemin vers le stockage global
STORAGE_PATH="$HOME/Library/Application Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics"

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Erreur : jq n'est pas installé. Installez-le avec : brew install jq${NC}"
    exit 1
fi

# Vérifier que le répertoire existe
if [ ! -d "$STORAGE_PATH" ]; then
    echo -e "${RED}Erreur : Répertoire de stockage introuvable${NC}"
    echo "Chemin attendu : $STORAGE_PATH"
    exit 1
fi

# Fonction pour afficher le header
print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Fonction pour afficher une section
print_section() {
    echo ""
    echo -e "${GREEN}--- $1 ---${NC}"
    echo ""
}

# Menu principal
show_menu() {
    echo -e "${YELLOW}=== AI Developer Analytics - Inspecteur de Stockage ===${NC}"
    echo ""
    echo "1. Afficher les providers"
    echo "2. Afficher les statistiques des providers"
    echo "3. Afficher les analytics (requêtes)"
    echo "4. Afficher les statistiques des analytics"
    echo "5. Afficher le chemin de stockage"
    echo "6. Afficher tout"
    echo "7. Exporter les données"
    echo "8. Réinitialiser les données (avec backup)"
    echo "9. Quitter"
    echo ""
    read -p "Choisissez une option (1-9) : " choice

    case $choice in
        1) show_providers ;;
        2) show_providers_stats ;;
        3) show_analytics ;;
        4) show_analytics_stats ;;
        5) show_storage_path ;;
        6) show_all ;;
        7) export_data ;;
        8) reset_data ;;
        9) exit 0 ;;
        *) echo -e "${RED}Option invalide${NC}" ; show_menu ;;
    esac
}

# Afficher les providers
show_providers() {
    print_header "PROVIDERS"

    if [ -f "$STORAGE_PATH/providers.json" ]; then
        echo "Liste des providers :"
        echo ""
        jq -r '.providers[] | "- \(.name) (\(.id))\n  Activé: \(.enabled)\n  API configurée: \(.apiKeyConfigured)\n  Description: \(.description)\n  Coût/M tokens: $\(.metadata.costPerMillionTokens)\n  Context max: \(.metadata.maxContextTokens) tokens\n"' "$STORAGE_PATH/providers.json"
    else
        echo -e "${RED}Fichier providers.json introuvable${NC}"
    fi

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Afficher les statistiques des providers
show_providers_stats() {
    print_header "STATISTIQUES DES PROVIDERS"

    if [ -f "$STORAGE_PATH/providers.json" ]; then
        echo "Dernière mise à jour : $(jq -r '.lastUpdated' "$STORAGE_PATH/providers.json")"
        echo "Version : $(jq -r '.version' "$STORAGE_PATH/providers.json")"
        echo ""
        echo "Statistiques :"
        jq -r '.statistics | "- Total : \(.totalProviders)\n- Activés : \(.enabledProviders)\n- Configurés : \(.configuredProviders)"' "$STORAGE_PATH/providers.json"
        echo ""

        print_section "Providers activés"
        jq -r '.providers[] | select(.enabled == true) | "- \(.name) (\(.id))"' "$STORAGE_PATH/providers.json"

        print_section "Providers avec API configurée"
        jq -r '.providers[] | select(.apiKeyConfigured == true) | "- \(.name) (\(.id))"' "$STORAGE_PATH/providers.json"
    else
        echo -e "${RED}Fichier providers.json introuvable${NC}"
    fi

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Afficher les analytics
show_analytics() {
    print_header "ANALYTICS (Dernières requêtes)"

    if [ -f "$STORAGE_PATH/analytics.json" ]; then
        local total=$(jq '.requests | length' "$STORAGE_PATH/analytics.json")
        echo "Nombre total de requêtes : $total"
        echo ""

        if [ "$total" -gt 0 ]; then
            echo "Dernières 10 requêtes :"
            echo ""
            jq -r '.requests[-10:] | reverse | .[] | "Provider: \(.provider)\nMode: \(.routing_mode)\nLatence: \(.latency)ms\nTokens: \(.tokens)\nCoût: $\(.cost)\nDate: \(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))\n---"' "$STORAGE_PATH/analytics.json"
        else
            echo "Aucune requête enregistrée."
        fi
    else
        echo -e "${RED}Fichier analytics.json introuvable${NC}"
    fi

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Afficher les statistiques des analytics
show_analytics_stats() {
    print_header "STATISTIQUES DES ANALYTICS"

    if [ -f "$STORAGE_PATH/analytics.json" ]; then
        local total=$(jq '.requests | length' "$STORAGE_PATH/analytics.json")

        if [ "$total" -gt 0 ]; then
            echo "Nombre total de requêtes : $total"
            echo ""

            print_section "Par provider"
            jq -r '[.requests[]] | group_by(.provider) | .[] | "\(.[0].provider): \(length) requêtes"' "$STORAGE_PATH/analytics.json"

            print_section "Par mode de routage"
            jq -r '[.requests[]] | group_by(.routing_mode) | .[] | "\(.[0].routing_mode): \(length) requêtes"' "$STORAGE_PATH/analytics.json"

            print_section "Métriques globales"
            local total_cost=$(jq '[.requests[].cost] | add' "$STORAGE_PATH/analytics.json")
            local total_tokens=$(jq '[.requests[].tokens] | add' "$STORAGE_PATH/analytics.json")
            local avg_latency=$(jq '[.requests[].latency] | add / length' "$STORAGE_PATH/analytics.json")
            local success_count=$(jq '[.requests[] | select(.success == 1)] | length' "$STORAGE_PATH/analytics.json")
            local cache_hits=$(jq '[.requests[] | select(.cache_hit == 1)] | length' "$STORAGE_PATH/analytics.json")

            echo "Coût total : $${total_cost}"
            echo "Tokens total : ${total_tokens}"
            echo "Latence moyenne : ${avg_latency}ms"
            echo "Requêtes réussies : ${success_count}/${total}"
            echo "Cache hits : ${cache_hits}/${total}"
        else
            echo "Aucune requête enregistrée."
        fi
    else
        echo -e "${RED}Fichier analytics.json introuvable${NC}"
    fi

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Afficher le chemin de stockage
show_storage_path() {
    print_header "CHEMIN DE STOCKAGE"

    echo "Répertoire de stockage :"
    echo "$STORAGE_PATH"
    echo ""

    echo "Fichiers présents :"
    ls -lh "$STORAGE_PATH"
    echo ""

    echo "Taille totale :"
    du -sh "$STORAGE_PATH"

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Afficher tout
show_all() {
    show_providers_stats
    echo ""
    show_analytics_stats
    echo ""
    show_storage_path

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Exporter les données
export_data() {
    print_header "EXPORT DES DONNÉES"

    local export_dir="$HOME/Desktop/ai-analytics-export-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$export_dir"

    if [ -f "$STORAGE_PATH/providers.json" ]; then
        cp "$STORAGE_PATH/providers.json" "$export_dir/"
        echo "✓ providers.json exporté"
    fi

    if [ -f "$STORAGE_PATH/analytics.json" ]; then
        cp "$STORAGE_PATH/analytics.json" "$export_dir/"
        echo "✓ analytics.json exporté"
    fi

    echo ""
    echo -e "${GREEN}Données exportées vers :${NC}"
    echo "$export_dir"

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Réinitialiser les données
reset_data() {
    print_header "RÉINITIALISATION DES DONNÉES"

    echo -e "${YELLOW}ATTENTION : Cette action va supprimer toutes les données stockées.${NC}"
    echo "Un backup sera créé automatiquement."
    echo ""
    read -p "Êtes-vous sûr ? (oui/non) : " confirm

    if [ "$confirm" != "oui" ]; then
        echo "Opération annulée."
        read -p "Appuyez sur Entrée pour continuer..."
        show_menu
        return
    fi

    # Créer le backup
    local backup_dir="$HOME/Desktop/ai-analytics-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    if [ -f "$STORAGE_PATH/providers.json" ]; then
        cp "$STORAGE_PATH/providers.json" "$backup_dir/"
        echo "✓ providers.json sauvegardé"
    fi

    if [ -f "$STORAGE_PATH/analytics.json" ]; then
        cp "$STORAGE_PATH/analytics.json" "$backup_dir/"
        echo "✓ analytics.json sauvegardé"
    fi

    echo ""
    echo -e "${GREEN}Backup créé dans :${NC}"
    echo "$backup_dir"
    echo ""

    # Supprimer les fichiers
    rm -f "$STORAGE_PATH/providers.json"
    rm -f "$STORAGE_PATH/analytics.json"

    echo -e "${GREEN}Données supprimées.${NC}"
    echo "Les fichiers seront recréés au prochain lancement de l'extension."

    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Lancer le menu
show_menu
