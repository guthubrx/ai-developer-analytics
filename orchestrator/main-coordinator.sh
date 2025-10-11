#!/usr/bin/env bash
# ==============================================================
# 🧭 Main Coordinator — Claude Runtime (CLI unifié 2025-10)
# ==============================================================

SOCKET="/tmp/claude.sock"
AGENT_FILE="../.claude/agents/main-coordinator.md"
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
DEBUG_LOG="$LOG_DIR/claude_debug.log"

if [[ -f .session-id ]]; then
  SESSION_ID=$(cat .session-id)
else
  if command -v uuidgen >/dev/null 2>&1; then
    SESSION_ID=$(uuidgen)
  else
    SESSION_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "00000000-0000-4000-8000-000000000000")
  fi
  echo "$SESSION_ID" > .session-id
fi

echo "🧭 Coordinateur (piloté par main-coordinator.md)"
echo "Session: $SESSION_ID"
echo "Tape 'exit' pour quitter."
echo ""

while true; do
  read -p "🗣  Commande > " input
  [[ "$input" == "exit" ]] && break
  [[ -z "$input" ]] && continue

  ID=$(date +%s%N)
  echo "" | tee -a "$DEBUG_LOG"
  echo "[$(date '+%T')] Prompt utilisateur: $input" | tee -a "$DEBUG_LOG"
  echo "🤖 Génération du plan via Claude..."

  cat >>"$DEBUG_LOG" <<EOF
[$(date '+%T')] Commande exécutée:
echo "$input" | claude -p --output-format text --session-id "$SESSION_ID" --agents '{"main-coordinator": {"description": "Agent coordinateur suprême", "prompt_file": "../.claude/agents/main-coordinator.md"}}'
EOF

  PLAN_TXT=$(echo "$input" | claude \
    -p \
    --output-format text \
    --session-id "$SESSION_ID" \
    --agents "{\"main-coordinator\": {\"description\": \"Agent coordinateur suprême\", \"prompt_file\": \"$AGENT_FILE\"}}" \
    2>&1 | tee -a "$DEBUG_LOG")

  PLAN_JSON=$(echo "$PLAN_TXT" | awk -v id="$ID" '
    /^[0-9]+\./ {
      agent=""
      if ($0 ~ /\[/) {
        start=index($0, "[")
        end=index($0, "]")
        if (start && end && end>start) {
          agent=substr($0, start+1, end-start-1)
        }
      }
      sub(/^[0-9]+\.\s*\[[^]]+\]\s*/, "", $0)
      task=$0
      if (agent != "")
        printf("{\"type\":\"plan\",\"id\":\"%s\",\"agent\":\"%s\",\"task\":\"%s\"}\n", id, agent, task)
    }' | jq -s '.')

  if [[ -z "$PLAN_JSON" || "$PLAN_JSON" == "[]" ]]; then
    echo "⚠️  Aucun plan détecté dans la sortie de Claude."
    echo "💡 Contenu brut (extrait) :" | tee -a "$DEBUG_LOG"
    echo "$PLAN_TXT" | head -n 20 | sed 's/^/   /'
    continue
  fi

  echo "$PLAN_JSON" | socat - UNIX-CONNECT:$SOCKET
  echo "📨 Plan envoyé aux agents."
  echo "⏳ En attente des réponses..."

  RESPONSES=()
  END_TIMER=0
  while [[ $END_TIMER -lt 3 ]]; do
    if read -t 2 -r line; then
      if echo "$line" | jq -e ".[] | select(.id==\"$ID\")" >/dev/null 2>&1; then
        agent=$(echo "$line" | jq -r ".[0].agent")
        output=$(echo "$line" | jq -r ".[0].output" | head -n 10)
        echo ""
        echo "🔹 Réponse de [$agent]:"
        echo "$output" | sed 's/^/   /'
        RESPONSES+=("$agent")
        END_TIMER=0
      fi
    else
      ((END_TIMER++))
    fi
  done

  echo ""
  if [[ ${#RESPONSES[@]} -eq 0 ]]; then
    echo "🤔 Aucun agent n’a répondu."
  else
    echo "✅ Agents ayant répondu: ${RESPONSES[*]}"
  fi
  echo "──────────────────────────────"
done

