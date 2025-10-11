#!/usr/bin/env bash
echo "🧹 Nettoyage complet de l'environnement..."
pkill -9 socat >/dev/null 2>&1
rm -f /tmp/claude.sock
echo "✅ Bus nettoyé."
cd orchestrator
./orchestrator.sh

