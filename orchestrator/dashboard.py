#!/usr/bin/env python3
# ===============================================================
# 🧠 AI Developer Orchestrator Dashboard (TUI via curses)
# Version stable + fix curseur + clignotement propre
# ===============================================================

import curses, time, threading, os, uuid, subprocess, signal

MODEL = "DeepSeek-V3.2-Exp"
SESSION_ID = str(uuid.uuid4())
AGENTS = [
    "ai-best-practices", "doc-samples", "git-mentor", "main-coordinator",
    "price-routing", "provider-integrator", "telemetry-coach", "ux-designer", "vsix-doctor"
]
START_TIME = time.time()
LOG_PATH = os.path.join(os.path.dirname(__file__), "logs/runtime.log")

# ---------------------------------------------------------------
#  🧩 Fonctions d'affichage
# ---------------------------------------------------------------
def draw_header(win):
    win.attron(curses.color_pair(2))
    win.box()
    win.addstr(1, 2, "🧠 AI Developer Orchestrator", curses.A_BOLD)
    win.addstr(2, 2, f"🔵 Agents actifs : {len(AGENTS)}    🕒 Uptime : 00:00")
    win.addstr(3, 2, f"🌐 Modèle : {MODEL}")
    win.addstr(4, 2, f"🔗 Session : {SESSION_ID[:8]}...")
    win.attroff(curses.color_pair(2))
    win.refresh()

def draw_agents(win, states):
    win.clear()
    win.attron(curses.color_pair(3))
    x = 2
    for a in AGENTS:
        color = curses.color_pair(states.get(a, 1))
        win.addstr(1, x, f"{a}", color)
        x += len(a) + 3
    win.attroff(curses.color_pair(3))
    win.refresh()

def draw_log(win, lines):
    win.box()
    max_y, max_x = win.getmaxyx()
    start = max(0, len(lines) - (max_y - 2))
    for i, line in enumerate(lines[start:]):
        win.addstr(i + 1, 2, line[:max_x - 4])
    win.refresh()

def draw_input(win, prompt):
    win.clear()
    win.box()
    win.addstr(1, 2, prompt, curses.A_DIM)
    win.refresh()

# ---------------------------------------------------------------
#  🧠 Interface principale curses
# ---------------------------------------------------------------
def ui(stdscr):
    signal.signal(signal.SIGTSTP, signal.SIG_IGN)
    curses.curs_set(1)
    curses.start_color()
    curses.noecho()
    curses.cbreak()
    stdscr.keypad(True)

    # 🎨 Couleurs
    curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)
    curses.init_pair(2, curses.COLOR_CYAN, curses.COLOR_BLACK)
    curses.init_pair(3, curses.COLOR_MAGENTA, curses.COLOR_BLACK)
    curses.init_pair(4, curses.COLOR_GREEN, curses.COLOR_BLACK)
    curses.init_pair(5, curses.COLOR_YELLOW, curses.COLOR_BLACK)
    curses.init_pair(6, curses.COLOR_RED, curses.COLOR_BLACK)

    max_y, max_x = stdscr.getmaxyx()
    header = curses.newwin(6, max_x, 0, 0)
    agents = curses.newwin(3, max_x, 6, 0)
    log = curses.newwin(max_y - 12, max_x, 9, 0)
    input_win = curses.newwin(3, max_x, max_y - 3, 0)

    logs = ["Bienvenue dans l'orchestrateur IA.", "Tapez une commande pour commencer."]
    states = {a: 4 for a in AGENTS}

    draw_header(header)

    # -----------------------------------------------------------
    # ⏱️ Uptime fluide (thread)
    # -----------------------------------------------------------
    def refresh_loop():
        while True:
            uptime = int(time.time() - START_TIME)
            mins, secs = divmod(uptime, 60)
            header.addstr(2, 28, f"{mins:02}:{secs:02} ")
            header.refresh()
            time.sleep(1)

    threading.Thread(target=refresh_loop, daemon=True).start()

    # -----------------------------------------------------------
    # 🔁 Boucle principale
    # -----------------------------------------------------------
    while True:
        draw_agents(agents, states)
        draw_log(log, logs)
        draw_input(input_win, "📝 Entrez une commande (ou 'exit' pour quitter)")
        curses.echo()

        max_y, max_x = input_win.getmaxyx()
        input_y = min(1, max_y - 2)
        input_x = 2

        input_win.move(input_y, input_x)
        input_win.clrtoeol()
        input_win.refresh()

        cmd = input_win.getstr(input_y, input_x).decode("utf-8").strip()
        curses.noecho()

        if not cmd:
            continue
        if cmd.lower() == "exit":
            break

        # ✏️ Log vers runtime.log
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] Prompt utilisateur: {cmd}\n")

        logs.append(f"> {cmd}")
        logs.append("🤖 Envoi à DeepSeek...")
        states = {a: 5 for a in AGENTS}  # Jaune : en cours
        draw_agents(agents, states)

        # -------------------------------------------------------
        # ⚙️ Activation DeepSeek locale
        # -------------------------------------------------------
        os.environ.update({
            "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
            "ANTHROPIC_AUTH_TOKEN": "sk-d5507b29cbda4398a11c21556f9c561b",
            "API_TIMEOUT_MS": "600000",
            "ANTHROPIC_MODEL": "deepseek-chat",
            "ANTHROPIC_SMALL_FAST_MODEL": "deepseek-chat",
            "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
        })

        # -------------------------------------------------------
        # 💬 Appel Claude (DeepSeek)
        # -------------------------------------------------------
        try:
            out = subprocess.check_output(
                ["claude", cmd, "-p", "--model", MODEL, "--session-id", SESSION_ID],
                stderr=subprocess.STDOUT, text=True
            )
            logs += ["🧩 Sortie DeepSeek :"] + out.splitlines()
        except subprocess.CalledProcessError as e:
            logs.append("❌ Erreur: " + e.output.strip())

        states = {a: 4 for a in AGENTS}  # Vert : terminé
        draw_agents(agents, states)
        draw_log(log, logs)

        # 🧹 Nettoyage champ de saisie
        input_win.clear()
        input_win.refresh()

    curses.endwin()
    print("\n✅ Orchestrator terminé proprement.")

# ---------------------------------------------------------------
#  🚀 Lancement
# ---------------------------------------------------------------
if __name__ == "__main__":
    curses.wrapper(ui)
