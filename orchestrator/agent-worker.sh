#!/usr/bin/env bash
# ==============================================================
# 🤖 Agent Worker – écoute et exécution de tâches
# ==============================================================

AGENT_NAME="$1"
SOCKET="/tmp/claude.sock"
SESSION_ID=$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]')
LOG_DIR="$(dirname "$0")/logs/$AGENT_NAME"
mkdir -p "$LOG_DIR"

echo "🎧 [$AGENT_NAME] connecté au bus"

socat -u UNIX-CONNECT:$SOCKET - | jq -c '.[]?' | while read -r msg; do
  agent=$(echo "$msg" | jq -r '.agent')
  task=$(echo "$msg" | jq -r '.task')
  id=$(echo "$msg" | jq -r '.id')

  if [[ "$agent" == "$AGENT_NAME" ]]; then
    echo "🧩 [$AGENT_NAME] tâche reçue : $task"

    echo "[$(date +'%H:%M:%S')] 💬 Tâche : $task" >> "$LOG_DIR/activity.log"

    OUTPUT=$(echo "$task" | claude \
      -p \
      --output-format text \
      --session-id "$SESSION_ID" \
      --agents "{\"$AGENT_NAME\": {\"description\": \"Agent $AGENT_NAME autonome\", \"prompt_file\": \"../.claude/agents/$AGENT_NAME.md\"}}" \
      2>&1)

    echo "[$(date +'%H:%M:%S')] ✅ Sortie : $OUTPUT" >> "$LOG_DIR/activity.log"
    echo "💾 [$AGENT_NAME] résultat enregistré."

    jq -nc --arg agent "$AGENT_NAME" --arg id "$id" --arg output "$OUTPUT" \
      '[{type:"result", agent:$agent, id:$id, output:$output}]' \
      | socat - UNIX-CONNECT:$SOCKET
  fi
done

