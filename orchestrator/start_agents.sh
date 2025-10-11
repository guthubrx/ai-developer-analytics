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
