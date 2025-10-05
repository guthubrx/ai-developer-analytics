# 🚀 Prompt Global — Cursor Developer Analytics Next Gen  
## IA Hybride (Cloud + Local via Ollama) · Routage Double-Niveau · Hot Reload Intégral · Télémétrie · Coaching · Licence AGPL-3.0

Tu es un **architecte logiciel senior** chargé de concevoir une **extension Visual Studio Code / Cursor** complète, maintenable et ouverte sous **licence AGPL-3.0**, conforme aux **bonnes pratiques industrielles** (TypeScript, Node.js 20+, VS Code API, WebView, sécurité, tests, CI/CD).

---

## 🧠 Objectif général

Créer une extension d’analyse et d’optimisation de l’usage de l’IA :
- **Routage double-niveau** : exécution directe / routage intelligent délégué.  
- **Interopérabilité IA multi-fournisseurs** : GPT-5 · Claude 4.5 · DeepSeek · Ollama (local/offline).  
- **Télémétrie locale** : coût · latence · tokens · cache · complexité · succès.  
- **AI Coach adaptatif** + scanner d’architecture + analyse de dette technique.  
- **Mode offline** (Ollama).  
- **Hot Reload intégral** (UI + backend).  
- **Conformité Marketplace** : signature, sécurité, performance, accessibilité.  
- **Licence AGPL-3.0** : le code et les forks doivent rester open source.  

---

## ⚙️ Routage IA Double-Niveau

### Niveau 1 — Exécution directe (manuel)
L’utilisateur choisit le moteur d’exécution :  
🚀 GPT-5 · 🧠 Claude 4.5 · ⚙️ DeepSeek · 🖥️ Ollama (local).  
Le router est désactivé ; exécution immédiate.

```ts
response = await modelClient.execute(prompt);
```

### Niveau 2 — Routage intelligent (automatique / délégué)
L’utilisateur choisit **le moteur de routage** :
🤖 Local Router · 🤖 Claude Router · 🤖 GPT-5 Router · 🤖 DeepSeek Router · 🤖 Ollama Router (local/hybride).

```ts
if (routingMode === "auto-ollama") model = await ollamaClient.decideRoute(prompt);
else if (routingMode === "auto-local") model = localRouter.decide(task, complexity);
else if (routingMode === "auto-gpt5") model = await gpt5Client.decideRoute(prompt);
else if (routingMode === "auto-claude") model = await claudeClient.decideRoute(prompt);
response = await executeModel(model, prompt);
```

---

## 🖥️ Intégration Ollama (Local)

- Détection : `GET http://localhost:11434/api/tags`.  
- Client :

```ts
export async function ollamaChat(model: string, prompt: string) {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({model, prompt})
  });
  return await res.json(); // FR + EN comments required
}
```

- Modèles : `phi-4`, `gemma`, `llama3`, `mistral`, `codellama`, `qwen2`.  
- Paramètres Settings : activer Ollama · URL API · modèle par défaut · fallback offline.

---

## 🧱 Architecture

```
src/
├─ ai/
│  ├─ router/              # router local + meta-router délégué
│  ├─ clients/             # openai, anthropic, deepseek, ollama
│  ├─ cache/               # exact + sémantique + LRU
│  └─ metrics/             # coûts, latence, succès, tokens
├─ ui/
│  ├─ sidebar/             # AI Command Bar
│  ├─ dashboards/          # Ops Router · BI · Coach
│  └─ panels/              # Routing Selector · Settings · History
├─ analytics/              # SQLite AES (local)
├─ coaching/               # AI Coach + Weekly Reports
├─ architecture/           # scanner dette technique
└─ telemetry/              # OpenTelemetry local
```

---

## Intégration à Visual Studio Code

- Un badge d'application dans la Activity Bar de Visual Studio Code


---

## 🎨 Interface principale : AI Command Bar

- Zone prompt multiligne.  
- Menus **Task** et **Mode** (Éco · Normal · Qualité · Strict JSON · Créatif · Audit).  
- Bloc **Routing Selector** (Local / Claude / GPT / DeepSeek / Ollama).  
- Boutons : GPT-5 | Claude | DeepSeek | Ollama | Auto.  
- Barre infos : cache % · coût € · latence s · modèle final.  
- Historique (5 requêtes récentes).

---

## 📊 Télémétrie

- routeur et moteur utilisés · source (cloud/ollama)  
- coût · latence · tokens · cache hit ratio  
- taux de succès · erreurs JSON · mode (Eco / Qualité / Offline)  
- stockage : `analytics.db` (SQLite AES) · opt-in/out · purge 1 clic

---

## 💬 Dashboards & Coach

- **Ops Router** : coûts, latence, succès, part Ollama  
- **BI Dev** : productivité et coûts par projet  
- **AI Coach** : conseils, progression, Code Health Index  
- **Architecture Scanner** : dette, duplications, tests  
- **Weekly Report** : synthèse hebdomadaire

---

## 🔐 Sécurité & Confidentialité

- CSP stricte (WebView) · validation `postMessage` · sanitization  
- SecretStorage VS Code pour clés  
- SQLite chiffrée · PII hash (SHA-256)  
- Aucune exfiltration sans consentement  
- Audit automatisé avant release

---

## ⚡ Hot Reload Intégral

- **UI HMR** (WebView via Vite/esbuild dev server).  
- **Backend Hot-Reload** : watchers + reloader des modules AI/Cache/Router.  
- Pas de redémarrage VS Code ; état préservé si pertinent.  
- Temps de reload < 500 ms cible.

---

## 🧮 Bonnes Pratiques (Obligatoires)

### Qualité du code
- TypeScript strict · ESLint · Prettier · imports ordonnés.  
- **Commentaires FR + EN** pour chaque bloc significatif.  
- Architecture SOLID · DRY · séparation UI / métier / infra.  

### Workflow Git
- Conventional Commits · branches courtes ( `feat/` · `fix/` · `chore/` ) · PR petites.  
- CODEOWNERS · CONTRIBUTING.md · SECURITY.md · CHANGELOG auto.  

### CI / CD
- GitHub Actions : `lint → typecheck → unit → e2e → build → package vsix`.  
- Matrice OS : macOS · Windows · Linux.  
- Sécurité : `pnpm audit` + CodeQL/Snyk.  
- Publication Marketplace signée (vsce).  

### Tests
- Vitest /Jest (unitaires) · Playwright (E2E WebView).  
- Couverture ≥ 80 % core (router, cache, analytics).  

### Performance & A11y
- WebView < 300 KB gzip · 60 FPS · lazy load.  
- Support keyboard · ARIA roles · contrastes · prefer-reduced-motion.  

### Documentation
- README · ARCHITECTURE.md · ADRs · JSDoc généré · diagrammes.  

### Design System & i18n
- Tokens couleurs/espacements/typographies · dark/light.  
- i18n FR/EN pour toute UI.  

---

## 📜 Licence AGPL-3.0

Ce projet est distribué sous **licence AGPL-3.0-only**.  
Tout dérivé ou redistribution doit publier son code source sous la même licence.  
Les SDK propriétaires (OpenAI, Anthropic, DeepSeek) restent des dépendances externes non redistribuées, conformément à l’AGPL.  

```json
{
  "license": "AGPL-3.0-only"
}
```

---

## ✅ Definition of Done

- Routage multi-niveaux (manuel / auto / délégué / local) fonctionnel.  
- Hot Reload complet (UI + backend) sans redémarrage VS Code.  
- Couverture tests ≥ 80 %.  
- CI verte · build vsix signé · publication Marketplace.  
- Sécurité (CSP · SecretStorage · chiffrement DB) vérifiée.  
- Mode offline Ollama stable · coach actif · dashboards OK.  
- Code clair, factorisé, commenté (FR + EN) · docs à jour.  

---

> Génère le code en **TypeScript strict**, avec **Hot Reload intégral**, **tests**, **CI/CD**, et **qualité production-grade**.  
> Respecte **toutes les bonnes pratiques** (VS Code API, Node, WebView, sécurité, a11y, perf).  
> L’extension doit être **hybride Cloud / Local**, **coachante**, **sécurisée**, **performante**, **open source AGPL-3.0**, et **conforme Marketplace**.
