#!/bin/bash

# Script rapide pour afficher les informations de stockage de l'extension
# Quick script to display AI Developer Analytics storage information

STORAGE_PATH="$HOME/Library/Application Support/Code/User/globalStorage/ai-analytics.ai-developer-analytics"

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    echo "Erreur : jq n'est pas installé. Installez-le avec : brew install jq"
    exit 1
fi

# Vérifier que le répertoire existe
if [ ! -d "$STORAGE_PATH" ]; then
    echo "Erreur : Répertoire de stockage introuvable"
    echo "Chemin attendu : $STORAGE_PATH"
    exit 1
fi

echo "=== AI Developer Analytics - Informations de Stockage ==="
echo ""

# Providers
echo "📊 PROVIDERS"
echo "------------"
if [ -f "$STORAGE_PATH/providers.json" ]; then
    echo "Dernière mise à jour : $(jq -r '.lastUpdated' "$STORAGE_PATH/providers.json")"
    echo "Version : $(jq -r '.version' "$STORAGE_PATH/providers.json")"
    echo ""

    # Statistiques
    echo "Statistiques :"
    jq -r '.statistics | "- Total : \(.totalProviders)\n- Activés : \(.enabledProviders)\n- Configurés : \(.configuredProviders)"' "$STORAGE_PATH/providers.json"
    echo ""

    # Liste des providers
    echo "Liste des providers :"
    jq -r '.providers[] | "- \(.name) (\(.id)) - Activé: \(.enabled), API: \(.apiKeyConfigured)"' "$STORAGE_PATH/providers.json"
else
    echo "❌ Fichier providers.json introuvable"
fi

echo ""
echo ""

# Analytics
echo "📈 ANALYTICS"
echo "------------"
if [ -f "$STORAGE_PATH/analytics.json" ]; then
    total=$(jq '.requests | length' "$STORAGE_PATH/analytics.json")
    echo "Nombre total de requêtes : $total"

    if [ "$total" -gt 0 ]; then
        # Métriques globales
        total_cost=$(jq '[.requests[].cost] | add' "$STORAGE_PATH/analytics.json")
        total_tokens=$(jq '[.requests[].tokens] | add' "$STORAGE_PATH/analytics.json")
        avg_latency=$(jq '[.requests[].latency] | add / length' "$STORAGE_PATH/analytics.json")
        success_count=$(jq '[.requests[] | select(.success == 1)] | length' "$STORAGE_PATH/analytics.json")
        cache_hits=$(jq '[.requests[] | select(.cache_hit == 1)] | length' "$STORAGE_PATH/analytics.json")

        echo "Coût total : $${total_cost}"
        echo "Tokens total : ${total_tokens}"
        echo "Latence moyenne : ${avg_latency}ms"
        echo "Requêtes réussies : ${success_count}/${total}"
        echo "Cache hits : ${cache_hits}/${total}"
        echo ""

        # Répartition par provider
        echo "Répartition par provider :"
        jq -r '[.requests[]] | group_by(.provider) | .[] | "- \(.[0].provider): \(length) requêtes"' "$STORAGE_PATH/analytics.json"
    else
        echo "Aucune requête enregistrée."
    fi
else
    echo "❌ Fichier analytics.json introuvable"
fi

echo ""
echo ""

# Informations système
echo "💾 STOCKAGE"
echo "------------"
echo "Répertoire : $STORAGE_PATH"
echo "Taille : $(du -sh "$STORAGE_PATH" | cut -f1)"
echo ""
echo "Fichiers :"
ls -lh "$STORAGE_PATH"

echo ""
echo "=== Fin ==="