#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Claude Code Agents Pack (non intrusif) — pour projet VS Code extension
# Crée .claude/agents/*, Makefile avec cibles, et un .env.example
# Conditions: "claude" CLI installé et accessible dans le PATH.
# ──────────────────────────────────────────────────────────────────────────────

root_dir="$(pwd)"
agents_dir="$root_dir/.claude/agents"
mkdir -p "$agents_dir"
echo $agents_dir
exit

# ───────────────── .env.example ─────────────────
cat > "$root_dir/.env.example" << 'EOF'
# Dupliquez ce fichier en ".env" puis remplissez.
# (Votre extension VS Code lira ces variables via process.env ou équivalent.)

# Anthropic / Claude
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-openai-...

# Moonshot (Kimi)
MOONSHOT_API_KEY=sk-kimi-...

# Deepseek
DEEPSEEK_API_KEY=sk-deepseek-...

# Mistral
MISTRAL_API_KEY=sk-mistral-...

# Ollama (local)
OLLAMA_BASE_URL=http://127.0.0.1:11434
# Optionnel: modèle par défaut (ex: "qwen2.5-coder:7b" ou "llama3.1:8b")
OLLAMA_DEFAULT_MODEL=qwen2.5-coder:7b
EOF

# ───────────────── helpers communs (insérés en tête des rôles) ───────────────
read -r -d '' COMMON_PREAMBLE << 'EOF'
# PRINCIPES GÉNÉRAUX — À LIRE PAR L’AGENT
- Tu es exécuté via **Claude Code CLI** en mode agentique. Tu peux:
  - Lire/écrire des fichiers, exécuter des commandes, proposer un plan (Plan Mode).
  - **Toujours** proposer un plan (liste numérotée de tâches atomiques) quand le risque est non trivial.
- **Respect absolu de l’architecture existante** : ne modifie pas la structure du repo, ajoute seulement des fichiers complémentaires (prompt, scripts, docs) dans des dossiers déjà créés par ce pack (.claude/agents, docs/…).
- Sorties attendues : patches précis, commandes à exécuter, chemins relatifs corrects, et messages de commit clairs.
- Langue : réponds en **FR** avec fragments de code/commentaires **FR/EN** quand utile.
- Qualité : lintable, typée (TS), testable, reproductible. Si tu touches au build VSIX, fournis scripts & vérifs.

EOF

# ───────────────── Agent 1: Provider-Integrator ─────────────────
cat > "$agents_dir/provider-integrator.md" << 'EOF'
# ROLE: Provider-Integrator (Anthropic, OpenAI, Moonshot/Kimi, Ollama, Deepseek, Mistral)
# MISSION: Ajouter/fiabiliser l’accès multi-fournisseurs pour l’extension VS Code, sans changer l’archi projet.

<<COMMON_PREAMBLE>>

## Objectifs
1. **Connecteurs** propres par fournisseur (service classes/strategies) + types TS:
   - createChat(params), stream, tool-use support si dispo, gestion d’erreurs/rate-limits.
2. **Auth** via variables d’environnement (.env) et validation au démarrage.
3. **Compat d’API**: normaliser input/output (messages, tool calls, JSON schema).
4. **Test rapide** : commandes `npm run ai:ping:<provider>`.

## Spécifs par fournisseur (endpoints & entêtes usuels)
> Implémente *adapters* sûrs et minimalistes sans présumer des SDKs; si SDK officiel dispo dans le projet, ok.
- **Anthropic**: base `https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version`.
- **OpenAI**: base `https://api.openai.com/v1/chat/completions` (ou `responses`), header `Authorization: Bearer`.
- **Moonshot (Kimi)**: base cloud Kimi, auth Bearer (clé MOONSHOT_API_KEY).
- **Deepseek**: base officielle DeepSeek, auth Bearer.
- **Mistral**: `https://api.mistral.ai/v1/chat/completions` (ou /responses), auth Bearer.
- **Ollama (local)**: `OLLAMA_BASE_URL` (par défaut `http://127.0.0.1:11434`), routes `/api/chat` ou `/api/generate`.

> Normalise **ModelId** et **Capabilities** (code, json-strict, long-context…). Mappe vers des presets (eco/normal/quality).

## Checklist de livraison (ne pas changer l’archi)
- [ ] Créer `src/ai/providers/{anthropic,openai,moonshot,deepseek,mistral,ollama}.ts`
- [ ] Créer `src/ai/router.ts` (sélection auto par coût/capacités → voir agent Pricing & Routing)
- [ ] Créer `src/ai/types.ts` (Message, ToolCall, ProviderId, CostEstimation)
- [ ] Ajouter scripts npm: `ai:ping:*`, `ai:whoami:*` (diagnostics)
- [ ] Ajouter tests minimaux `tests/ai/*.test.ts` (smoke)

## Exigences de code
- **TS strict**, pas de `any` sauvage, `zod`/`valibot` pour valider env & réponses.
- **Réseau**: timeouts, retries exponentiels, 429/5xx backoff, log structuré.
- **Sécurité**: ne loggue jamais les clés. Masque-les si affichage.

## Plan de travail (toujours proposer avant d’écrire)
1) Générer types & interfaces.  
2) Implémenter adapters fournisseurs + mocks.  
3) Ajouter scripts npm & tests.  
4) Vérifier end-to-end avec l’extension.

EOF

# ───────────────── Agent 2: Pricing & Routing Optimizer ─────────────────
cat > "$agents_dir/pricing-routing.md" << 'EOF'
# ROLE: Pricing & Routing Optimizer
# MISSION: Minimiser le coût tout en maintenant la qualité (modes auto/eco/normal/quality/strict-json/creative).

<<COMMON_PREAMBLE>>

## Livrables
- `src/ai/pricing.ts`: tables de prix (input/output tokens), heuristiques, coûts estimés.
- `src/ai/routing.ts`: règles de routage par tâche (code/doc/debug) + mode (eco/quality…).
- `src/ai/history-cache.ts`: cache clé→réponse (hash prompt+files) avec TTL & invalidation simple.
- Métriques: expose `cost_estimate`, `cache_hit`, `route_taken` (hook pour Telemetry Coach).

## Heuristiques minimales
- **eco** → Mistral/Deepseek/Ollama local si assez bon; **quality** → Anthropic/OpenAI top coder.
- **strict-json** → modèles réputés stables en JSON (activer tool-use si dispo).
- **creative** → modèles avec temperature/Top-P plus hauts.
- **code** → préférer modèles “coder” s’ils existent.

## Plan de travail
1) Définir interfaces PricingModel, ProviderCapability.  
2) Écrire tables de prix (valeurs paramétrables via config JSON).  
3) Implémenter `route(task, mode, context)`.  
4) Brancher la télémétrie (events ‘cost_estimate’, ‘routed_to’).

EOF

# ───────────────── Agent 3: UI/UX Designer (VS Code) ─────────────────
cat > "$agents_dir/ui-designer.md" << 'EOF'
# ROLE: UI/UX Designer (VS Code Extension)
# MISSION: Concevoir/raffiner l’UI (sidebar/chat, menus, dropdowns Task/Mode, paramètres provider, états, vidages).

<<COMMON_PREAMBLE>>

## Contraintes
- Style **sobre, moderne, Apple-like**, cohérent VS Code (HIG VS Code).
- Accessibilité: contrastes, tailles, focus states, i18n FR/EN.
- **Ne change pas** la structure existante; ne touche qu'aux composants UI prévus.
- Fournir **composants TSX** et **CSS/variables** prêts à coller, + stories (Storybook si déjà présent).

## Livrables attendus
- Composants:
  - <ProviderSelect /> (liste connue + “Ajouter…”)
  - <TaskSelect /> {general, code, documentation, debug}
  - <ModeSelect /> {auto, eco, normal, quality, strict-json, creative}
  - <CostBadge /> (estimation live)
  - <RouteChip /> (provider choisi + raison)
  - <TelemetryPanel /> (progress dev, best-practices)
- États vides/erreur/chargement + tests de rendu.

## Plan UI
1) Esquisser wireframes (ASCII + TODO).  
2) Générer TSX + styles modulaires, sans casser l’existant.  
3) Ajouter stories/fixtures.  
4) Petits tests vitals (render/props).

EOF

# ───────────────── Agent 4: Telemetry & Dev-Progress Coach ─────────────────
cat > "$agents_dir/telemetry-coach.md" << 'EOF'
# ROLE: Telemetry & Dev-Progress Coach
# MISSION: Tracer l’usage IA & la progression dev pour recommandations best-practices “au bon moment”.

<<COMMON_PREAMBLE>>

## Livrables
- `src/telemetry/index.ts`: events (cache_hit, token_in/out, model, route_taken, duration_ms).
- `src/telemetry/policy.ts`: règles de conseils (ex: abuser d’output tokens → proposer “summary-first”).
- `src/telemetry/storage.ts`: stockage léger (SQLite/sql.js ou fichier JSONL, selon existant).
- UI: exposer KPI (courbe coût vs cache-hit, temps de feedback).

## Bonnes pratiques détectables
- Longs prompts répétitifs → suggérer extraits réutilisables.
- Sorties verbeuses → proposer “strict-json” + schemas.
- Boucles d’essais sans tests → nudges TDD rapides.

EOF

# ───────────────── Agent 5: Git Mentor ─────────────────
cat > "$agents_dir/git-mentor.md" << 'EOF'
# ROLE: Git Mentor
# MISSION: Aider aux branches, rebase, worktrees, messages, release tagging, protections.

<<COMMON_PREAMBLE>>

## Capacités
- Générer commandes sûres (avec explication), éviter actions destructrices sans confirmation.
- Rédiger messages **concis** (Conventional Commits).
- Proposer stratégie tags/versions de l’extension.

## Playbook
- Feature rapide: `git switch -c feat/...`
- Exp propre avant release: `git rebase -i`, `--autosquash`
- Worktrees pour dev parallèle (utile avec CLI & tests).

EOF

# ───────────────── Agent 6: VSIX Build Doctor ─────────────────
cat > "$agents_dir/vsix-doctor.md" << 'EOF'
# ROLE: VSIX Build Doctor
# MISSION: Aider à packager/signaler les erreurs de build VSIX, scripts npm, CI, et diagnostics.

<<COMMON_PREAMBLE>>

## Livrables
- Scripts npm: `build`, `package`, `package:prod`, `clean`.
- Vérif: version VS Code Engine, deps, icônes, contribution points, activationEvents.
- Commandes reproductibles: `vsce package` / `ovsx publish` si pertinent, avec vérifs.

## Diagnostic
- Si une erreur survient, imprimer: contexte, commande, extraits de logs, suggestion de fix, lien doc.

EOF

# ───────────────── Agent 7: Docs & Samples Generator ─────────────────
cat > "$agents_dir/docs-samples.md" << 'EOF'
# ROLE: Docs & Samples Generator
# MISSION: Rédiger docs claires (README sections, HOWTOs) et snippets d’intégration côté utilisateurs.

<<COMMON_PREAMBLE>>

## Livrables
- `docs/providers.md`: comment configurer chaque IA (env vars, limites, modèles suggérés).
- `docs/routing-modes.md`: tâches vs modes et logique de sélection.
- Exemples: scripts Node/TS montrant l’appel unifié.

EOF

# ───────────────── Wrapper commun: insérer le préambule dans chaque agent ────
# (On remplace le placeholder <<COMMON_PREAMBLE>> par le vrai contenu.)
for f in "$agents_dir"/*.md; do
  tmp="$(mktemp)"
  awk -v RS='\0' '1' "$f" > "$tmp" # normalize
  sed "s#<<COMMON_PREAMBLE>>#$(printf "%s" "$COMMON_PREAMBLE" | sed -e 's/[\/&]/\\&/g')#g" "$tmp" > "$f"
  rm -f "$tmp"
done

# ───────────────── Makefile avec cibles pratiques ─────────────────
cat > "$root_dir/Makefile" << 'EOF'
# Makefile — lance Claude Code CLI avec l'agent voulu
# Usage: make cc-ui  /  make cc-provider  /  make cc-pricing  / etc.
# Conseil: active Plan Mode (Shift+Tab x2) avant d'éditer.

CLAUDE?=claude
MODEL?=claude-3.7-sonnet  # override: make cc-ui MODEL=claude-3.5
SYS?=

cc-provider:
	$(CLAUDE) --system-prompt-file .claude/agents/provider-integrator.md

cc-pricing:
	$(CLAUDE) --system-prompt-file .claude/agents/pricing-routing.md

cc-ui:
	$(CLAUDE) --system-prompt-file .claude/agents/ui-designer.md

cc-telemetry:
	$(CLAUDE) --system-prompt-file .claude/agents/telemetry-coach.md

cc-git:
	$(CLAUDE) --system-prompt-file .claude/agents/git-mentor.md

cc-vsix:
	$(CLAUDE) --system-prompt-file .claude/agents/vsix-doctor.md

cc-docs:
	$(CLAUDE) --system-prompt-file .claude/agents/docs-samples.md
EOF

# ───────────────── Snippets TypeScript collables (adapters squelette) ────────
mkdir -p "$root_dir/snippets/ai/providers"
cat > "$root_dir/snippets/ai/providers/adapters.ts" << 'EOF'
// Coller ces classes dans votre src/ai/providers/* en respectant VOTRE arborescence existante.
// Les signatures sont minimales pour que ça compile vite et soit extensible.

export type ChatMessage = { role: 'system'|'user'|'assistant'; content: string };
export type ChatParams = {
  model: string; messages: ChatMessage[];
  temperature?: number; top_p?: number;
  json?: boolean; // strict-json intent
  signal?: AbortSignal;
};
export type ChatResult = { text: string; usage?: { input_tokens?: number; output_tokens?: number } };

export interface AIProvider {
  id: string;
  supportsJSON(): boolean;
  chat(p: ChatParams): Promise<ChatResult>;
}

// Utils
const env = (k: string, req = true) => {
  const v = process.env[k];
  if (!v && req) throw new Error(`Missing env var: ${k}`);
  return v ?? '';
};

// ───────── Anthropic
export class AnthropicProvider implements AIProvider {
  id = 'anthropic';
  supportsJSON() { return true; }
  async chat(p: ChatParams): Promise<ChatResult> {
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'content-type': 'application/json',
      'x-api-key': env('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
    };
    const body = {
      model: p.model,
      messages: p.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: p.temperature ?? 0,
    };
    const res = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = (data?.content?.[0]?.text) || (data?.content?.[0]?.text ?? data?.content?.[0]?.text);
    return { text: text ?? JSON.stringify(data), usage: data?.usage };
  }
}

// ───────── OpenAI
export class OpenAIProvider implements AIProvider {
  id = 'openai';
  supportsJSON() { return true; }
  async chat(p: ChatParams): Promise<ChatResult> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = { 'content-type':'application/json', 'authorization': `Bearer ${env('OPENAI_API_KEY')}` };
    const body:any = {
      model: p.model,
      messages: p.messages,
      temperature: p.temperature ?? 0,
    };
    if (p.json) body.response_format = { type: 'json_object' };
    const res = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const choice = data.choices?.[0];
    return { text: choice?.message?.content ?? '', usage: data?.usage };
  }
}

// ───────── Moonshot (Kimi)
export class MoonshotProvider implements AIProvider {
  id = 'moonshot';
  supportsJSON() { return true; }
  async chat(p: ChatParams): Promise<ChatResult> {
    const url = 'https://api.moonshot.cn/v1/chat/completions'; // adapter si nécessaire
    const headers = { 'content-type':'application/json', 'authorization': `Bearer ${env('MOONSHOT_API_KEY')}` };
    const body:any = { model: p.model, messages: p.messages, temperature: p.temperature ?? 0 };
    const res = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Moonshot error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const choice = data.choices?.[0];
    return { text: choice?.message?.content ?? '', usage: data?.usage };
  }
}

// ───────── Deepseek
export class DeepseekProvider implements AIProvider {
  id = 'deepseek';
  supportsJSON() { return true; }
  async chat(p: ChatParams): Promise<ChatResult> {
    const url = 'https://api.deepseek.com/chat/completions'; // adapter si nécessaire
    const headers = { 'content-type':'application/json', 'authorization': `Bearer ${env('DEEPSEEK_API_KEY')}` };
    const body:any = { model: p.model, messages: p.messages, temperature: p.temperature ?? 0 };
    const res = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Deepseek error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const choice = data.choices?.[0];
    return { text: choice?.message?.content ?? '', usage: data?.usage };
  }
}

// ───────── Mistral
export class MistralProvider implements AIProvider {
  id = 'mistral';
  supportsJSON() { return true; }
  async chat(p: ChatParams): Promise<ChatResult> {
    const url = 'https://api.mistral.ai/v1/chat/completions';
    const headers = { 'content-type':'application/json', 'authorization': `Bearer ${env('MISTRAL_API_KEY')}` };
    const body:any = { model: p.model, messages: p.messages, temperature: p.temperature ?? 0 };
    const res = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Mistral error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const choice = data.choices?.[0];
    return { text: choice?.message?.content ?? '', usage: data?.usage };
  }
}

// ───────── Ollama (local)
export class OllamaProvider implements AIProvider {
  id = 'ollama';
  supportsJSON() { return false; }
  async chat(p: ChatParams): Promise<ChatResult> {
    const base = env('OLLAMA_BASE_URL', false) || 'http://127.0.0.1:11434';
    const url = `${base}/api/chat`;
    const body:any = { model: p.model, messages: p.messages, options: { temperature: p.temperature ?? 0 } };
    const res = await fetch(url, { method:'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data?.message?.content ?? '';
    return { text };
  }
}
EOF

# ───────────────── Scripts npm suggérés (non intrusifs) ──────────────────────
mkdir -p "$root_dir/snippets/scripts"
cat > "$root_dir/snippets/scripts/package.json.additions.json" << 'EOF'
{
  "scripts": {
    "ai:ping:anthropic": "node -e \"console.log(!!process.env.ANTHROPIC_API_KEY?'OK Anthropic key':'Missing ANTHROPIC_API_KEY')\"",
    "ai:ping:openai": "node -e \"console.log(!!process.env.OPENAI_API_KEY?'OK OpenAI key':'Missing OPENAI_API_KEY')\"",
    "ai:ping:moonshot": "node -e \"console.log(!!process.env.MOONSHOT_API_KEY?'OK Moonshot key':'Missing MOONSHOT_API_KEY')\"",
    "ai:ping:deepseek": "node -e \"console.log(!!process.env.DEEPSEEK_API_KEY?'OK Deepseek key':'Missing DEEPSEEK_API_KEY')\"",
    "ai:ping:mistral": "node -e \"console.log(!!process.env.MISTRAL_API_KEY?'OK Mistral key':'Missing MISTRAL_API_KEY')\"",
    "ai:ping:ollama": "node -e \"console.log(process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434')\""
  }
}
EOF

echo "✅ Agents installés dans $agents_dir"
echo "➡️  Lancement exemples:"
echo "   make cc-provider   # intégration multi-fournisseurs"
echo "   make cc-pricing    # coût & routage"
echo "   make cc-ui         # UI/UX VS Code"
echo "   make cc-telemetry  # coaching & métriques"
echo "   make cc-git        # mentor Git"
echo "   make cc-vsix       # build doctor"
echo "   make cc-docs       # docs & samples"

