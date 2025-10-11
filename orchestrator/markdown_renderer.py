# -*- coding: utf-8 -*-
from rich.console import Console
from rich.markdown import Markdown
from io import StringIO

console = Console(record=True, width=100)

def render_markdown(text: str) -> str:
    """Transforme du markdown brut en texte ANSI lisible pour Textual."""
    try:
        md = Markdown(text, code_theme="monokai", hyperlinks=False)
        buf = StringIO()
        console.file = buf
        console.print(md)
        console.file = None
        return buf.getvalue()
    except Exception as e:
        return f"[Erreur rendu markdown] {e}\n{text}"
