#!/usr/bin/env bash
# 🧠 Installateur Claude MCP Local Runtime
# Configure automatiquement un orchestrateur multi-agents basé sur .claude/agents/

set -e
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$BASE_DIR/../.claude"
SOCKET="/tmp/claude.sock"
LOG_DIR="$BASE_DIR/logs"

mkdir -p "$LOG_DIR"

echo "🚀 Installation du runtime local pour Claude Code CLI"
echo "📁 Agents détectés dans: $CLAUDE_DIR/agents"

# Liste des agents existants (hors main-coordinator)
AGENTS=($(ls "$CLAUDE_DIR/agents" | grep -v "main-coordinator" | sed 's/\.md//'))

echo "🧩 Agents détectés:"
for a in "${AGENTS[@]}"; do
  echo "  - $a"
done

# Génère script de démarrage des workers
cat > "$BASE_DIR/start_agents.sh" <<'EOF'
#!/usr/bin/env bash
SOCKET="/tmp/claude.sock"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_FILE="$BASE_DIR/agents.list"
LOG_DIR="$BASE_DIR/logs"
mkdir -p "$LOG_DIR"

echo "🚀 Lancement de tous les agents listeners"
while read -r AGENT_NAME; do
  [[ -z "$AGENT_NAME" ]] && continue
  echo "🎧 [\$AGENT_NAME] démarré"
  "$BASE_DIR/agent-worker.sh" "\$AGENT_NAME" &
done < "\$AGENTS_FILE"

wait
EOF

# Crée la liste des agents
printf "%s\n" "${AGENTS[@]}" > "$BASE_DIR/agents.list"
chmod +x "$BASE_DIR/start_agents.sh"

echo "✅ Installation terminée."
echo "ℹ️  Étapes suivantes :"
echo "   1. Lancer le bus : ./orchestrator.sh"
echo "   2. Lancer les agents : ./start_agents.sh"
echo "   3. Lancer le coordinateur : ./main-coordinator.sh"

