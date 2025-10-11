# -*- coding: utf-8 -*-
"""
agent_runner.py
----------------
Lance plusieurs agents Claude / IA en parallèle (non bloquant, sûr).
Chaque agent est exécuté dans un thread isolé.
"""

import subprocess, threading, queue, uuid
from pathlib import Path

CLAUDE_BIN = "claude"
AGENTS_PATH = Path(".claude/agents")


def run_agent(agent_file: Path, message: str, output_q: queue.Queue):
    """Exécute un agent et place sa sortie dans la queue."""
    try:
        session_id = str(uuid.uuid4())[:8]
        cmd = [CLAUDE_BIN, "--system-prompt-file", str(agent_file), message]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        output = []
        for line in process.stdout:
            output.append(line.rstrip())
        process.wait()
        output_q.put((agent_file.stem, "\n".join(output)))
    except Exception as e:
        output_q.put((agent_file.stem, f"[Erreur agent {agent_file.stem}] {e}"))


def run_agents_parallel(plan: list[str], message: str) -> dict[str, str]:
    """
    Exécute plusieurs agents Claude en parallèle.
    plan : liste de noms d’agents (ex: ["ui-designer", "provider-integrator"])
    message : requête utilisateur.
    Retourne un dict {nom_agent: sortie}.
    """
    results, output_q = {}, queue.Queue()
    threads = []

    for agent in plan:
        file = AGENTS_PATH / f"{agent}.md"
        if not file.exists():
            output_q.put((agent, f"[Agent manquant] {file.name}")); continue
        t = threading.Thread(target=run_agent, args=(file, message, output_q), daemon=True)
        threads.append(t); t.start()

    for t in threads: t.join()
    while not output_q.empty():
        name, out = output_q.get()
        results[name] = out

    return results
