#!/opt/homebrew/bin/bash
# ==============================================================
# 🧠 AI Developer Orchestrator – DeepSeek + UI + Session persistante
# ==============================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOCKET="/tmp/claude.sock"
BUS_FILE="/tmp/claude.bus"
LOG_DIR="$ROOT_DIR/logs"
AGENTS_DIR="$(cd "$ROOT_DIR/../.claude/agents" && pwd)"
SESSION_ID=$(uuidgen)  # 🧠 Session unique
MODEL="DeepSeek-V3.2-Exp"
START_TIME=$(date +%s)
mkdir -p "$LOG_DIR" "$LOG_DIR/agents"

# --------------------------------------------------------------
# 🚀 Configuration DeepSeek
# --------------------------------------------------------------
activate_deepseek() {
  export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
  export ANTHROPIC_AUTH_TOKEN="sk-d5507b29cbda4398a11c21556f9c561b"
  export API_TIMEOUT_MS=600000
  export ANTHROPIC_MODEL="$MODEL"
  export ANTHROPIC_SMALL_FAST_MODEL="$MODEL"
  export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
  echo "🌟 Environnement DeepSeek configuré ! (${ANTHROPIC_BASE_URL})"
}

# --------------------------------------------------------------
# 🎨 Couleurs et états agents
# --------------------------------------------------------------
COLORS=(36 32 33 35 34 91 92 93 94 95 96)
AGENTS=($(ls "$AGENTS_DIR" | sed 's/\.md$//'))
declare -A AGENT_STATE
declare -A AGENT_COLOR
for i in "${!AGENTS[@]}"; do
  AGENT_STATE["${AGENTS[$i]}"]="waiting"
  AGENT_COLOR["${AGENTS[$i]}"]="${COLORS[$((i % ${#COLORS[@]}))]}"
done

# --------------------------------------------------------------
# 🧩 Interface
# --------------------------------------------------------------
draw_header() {
  local uptime=$(( $(date +%s) - START_TIME ))
  local mins=$((uptime/60)) secs=$((uptime%60))
  tput cup 0 0
  echo -e "╭──────────────────────────────────────────────╮"
  printf "│ 🧠  AI Developer Orchestrator               │\n"
  printf "│ 🔵 Agents actifs : %-2s  🕒 Uptime : %02d:%02d │\n" "${#AGENTS[@]}" "$mins" "$secs"
  printf "│ 🌐 Modèle : %-30s│\n" "$MODEL"
  echo -e "│ 🔗 Session : ${SESSION_ID:0:8}... │"
  echo -e "╰──────────────────────────────────────────────╯\033[0K"
}

draw_agents() {
  local line=""
  for agent in "${AGENTS[@]}"; do
    local color="${AGENT_COLOR[$agent]}"
    local state="${AGENT_STATE[$agent]}"
    local icon="⚫"
    case "$state" in
      waiting) icon="⚫"; color="90" ;;
      working) icon="🟡" ;;
      done) icon="✅" ;;
    esac
    line+="\033[${color}m${icon} ${agent}\033[0m  "
  done
  echo -e "$line\033[0K"
}

draw_input_box() {
  echo -e "\n╭──────────────────── Entrée utilisateur ────────────────────╮"
  echo -e "│ Tapez votre commande (exit pour quitter)...               │"
  echo -e "╰────────────────────────────────────────────────────────────╯"
  echo -n "> "
}

# --------------------------------------------------------------
# 🔄 Thread de rafraîchissement de l’uptime
# --------------------------------------------------------------
refresh_loop() {
  while true; do
    tput sc
    draw_header
    tput rc
    sleep 1
  done
}

# --------------------------------------------------------------
# 🚀 Main
# --------------------------------------------------------------
trap 'tput cnorm; pkill -P $$; echo; echo "🧹 Orchestrator arrêté.";' EXIT INT
tput civis
clear

draw_header
draw_agents
refresh_loop &

# Lance tous les agents (en arrière-plan)
echo ""
for agent in "${AGENTS[@]}"; do
  "$ROOT_DIR/agent-worker.sh" "$agent" >>"$LOG_DIR/agents/${agent}.log" 2>&1 &
done

activate_deepseek
echo ""
echo "🧭 Coordinateur interactif – session $SESSION_ID"
echo "Tape 'exit' pour quitter ou 'dash' pour afficher le dashboard."
echo ""

# --------------------------------------------------------------
# 💬 Boucle principale : envoi vers DeepSeek
# --------------------------------------------------------------
while true; do
  draw_input_box
  IFS= read -er input || break
  [[ "$input" == "exit" ]] && break
  [[ -z "$input" ]] && continue

  for agent in "${AGENTS[@]}"; do AGENT_STATE["$agent"]="working"; done
  draw_agents

  echo ""
  echo "🤖 Envoi à DeepSeek (session persistante $SESSION_ID)..."

  ATTEMPTS=0
  while true; do
    OUTPUT=$(claude "$input" \
      -p \
      --model "$MODEL" \
      --output-format text \
      --session-id "$SESSION_ID" \
      2>&1) || true

    if echo "$OUTPUT" | grep -q "already in use"; then
      ((ATTEMPTS++))
      if [[ $ATTEMPTS -gt 3 ]]; then
        echo "❌ Erreur : session toujours occupée après 3 tentatives."
        break
      fi
      echo "⚠️  Session encore occupée, nouvelle tentative dans 3s..."
      sleep 3
    else
      break
    fi
  done

  for agent in "${AGENTS[@]}"; do AGENT_STATE["$agent"]="done"; done

  echo -e "\n🧩 Sortie Claude (DeepSeek) :"
  echo "──────────────────────────────────────────────"
  echo "$OUTPUT"
  echo "──────────────────────────────────────────────"
  echo ""
done

tput cnorm
echo "🧹 Fin de session orchestrateur."


