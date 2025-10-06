# 🧭 Contexte & objectif
Tu travailles sur un repo EXISTANT d’extension VS Code. Ta mission :
→ Ajouter un **backend local** (processus Node hors sandbox) DANS LE MÊME REPO
→ Le backend donne l’accès disque (lecture/écriture, glob, index projet) “à la Cursor”
→ L’extension ne lit PAS le disque directement (sandbox), elle passe par le backend local
→ ZÉRO fork d’IDE, publication Marketplace compatible

# 🧱 Hypothèse par défaut (Variant A – recommandé)
Le repo actuel a l’extension à la racine (ex. `src/extension.ts` et `package.json` avec `contributes`).
Si le repo contient déjà `packages/extension`, applique **Variant B** (monorepo). Choisis l’un des deux plans en inspectant le workspace.

───────────────────────────────────────────────────────────────────────────────
# ✅ Résultat attendu (livrables obligatoires)
1) **Arborescence** ajoutée :
   - Variant A (racine unique) :
     ```
     repo/
     ├─ server/                      ← NOUVEAU (backend local Node TS)
     │  ├─ src/
     │  │  ├─ index.ts               (bootstrap HTTP/WS + routes)
     │  │  ├─ fs/
     │  │  │  ├─ read.ts, write.ts, glob.ts, indexer.ts
     │  │  ├─ security/
     │  │  │  ├─ auth.ts, allowlist.ts, ratelimit.ts, validatePath.ts
     │  │  ├─ providers/
     │  │  │  └─ deepseek.ts (exemple) + openai.ts (stub)
     │  │  ├─ schema/
     │  │  │  └─ io.ts (zod: DTO d’entrée/sortie)
     │  │  └─ observability/otel.ts (DÉSACTIVÉ par défaut)
     │  ├─ test/ (vitest + supertest)
     │  ├─ package.json
     │  ├─ tsconfig.json
     │  └─ tsup.config.ts (ou esbuild)
     ├─ src/                         ← extension existante (conserver)
     ├─ package.json                 ← workspaces + scripts root
     ├─ .vscodeignore                ← exclure sources server du .vsix
     └─ .vscode/launch.json          ← debug extension + attach server
     ```
   - Variant B (monorepo) :
     ```
     repo/
     ├─ packages/
     │  ├─ extension/                ← extension actuelle (inchangée)
     │  └─ server/                   ← NOUVEAU backend local
     ├─ pnpm-workspace.yaml (ou npm workspaces)
     └─ configs (eslint, prettier, etc.)
     ```

2) **Sécurité et conformité** (non-négociable) :
   - Backend **uniquement** sur `127.0.0.1` (loopback), port libre (ex. get-port)
   - **Token éphémère** (≥ 32 bytes) exigé sur TOUTES les requêtes : `Authorization: Bearer <token>`
   - Validation stricte **zod** de chaque payload
   - **Anti-traversée** (`..`), normalisation des chemins, refus hors périmètre
   - **Allowlist/scopes** :
     - `scopeToWorkspace` (refuser chemins hors workspace si activé)
     - `respectGitignore` (ignorer patterns de `.gitignore`)
     - ignore par défaut : `.git/**`, `node_modules/**`, `*.key`, `*.pem`, `.env*`, `secrets/**`, `dist/**`, `build/**`, `target/**`
   - **Rate-limit** local (req/sec & octets max/réponse) + taille max lecture (`maxReadSizeMB`)
   - **Consentement explicite** utilisateur la 1re fois (toast + setting)
   - **Workspace Trust** respecté : si non-fiable ⇒ aucune fonctionnalité disque

3) **APIs backend minimales** (HTTP JSON, SSE pour stream) :
   - `GET /healthz` → 200 si OK
   - `POST /v1/fs/read`   `{ path }` → `{ content }`
   - `POST /v1/fs/write`  `{ path, content, createIfMissing? }` → `{ ok }`
   - `POST /v1/fs/glob`   `{ root, pattern, respectGitignore? }` → `{ files: string[] }`
   - `POST /v1/project/index` `{ root }` → `{ summary: { files, size, langStats… } }`
   - `POST /v1/llm/chat`  `{ provider, messages, files? }` → **SSE** token-by-token
   - Auth obligatoire sur toutes les routes (via header + loopback check)

4) **Extension VS Code** :
   - Settings (contributes.configuration) :
     - `myIa.allowFileAccess: boolean` (def: false)
     - `myIa.scopeToWorkspace: boolean` (def: true)
     - `myIa.respectGitignore: boolean` (def: true)
     - `myIa.maxReadSizeMB: number` (def: 2)
     - `myIa.provider: enum("deepseek","openai","none")` (def: "deepseek")
     - `myIa.provider.baseUrl`, `myIa.provider.apiKey`, `myIa.provider.model`…
   - Commandes :
     - `myIa.enableFileAccess` (consentement + bascule setting)
     - `myIa.readFileViaBackend` (demo)
     - `myIa.chatWithContext` (envoie extrait fichier + prompt au provider)
   - `extension.ts` :
     - Au `activate()` :
       - Vérifier Workspace Trust + setting `allowFileAccess`
       - Générer token, choisir port libre, **fork** le backend : `child_process.fork()` ou `spawn(process.execPath, ['server/dist/index.js'], { env: { PORT, TOKEN, … } })`
       - **Healthcheck** avant d’exposer les commandes
       - OutputChannel “My IA” = logs clairs (sans données sensibles)
     - Au `deactivate()` : SIGTERM + timeout + SIGKILL du backend si nécessaire

5) **Qualité BigMind** :
   - Node 20+, ESM partout, TS `strict: true`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
   - ESLint strict (erreurs sur promesses non-awaitées, eqeqeq, prefer-const, exhaustive-deps), Prettier, EditorConfig
   - **Tests** :
     - Backend : vitest + supertest (routes, zod, traversal, rate-limit, scopes)
     - Extension : mocha + @vscode/test-electron (activate, consentement, spawn, healthcheck, commandes)
     - Couverture **≥ 80 %** lignes/branches server & extension
   - Husky pre-commit : `lint && test && typecheck && build`
   - CI (GitHub Actions) : matrix node/os, cache pnpm/npm, artefacts (coverage, .vsix)
   - CHANGELOG via Changesets (ou équivalent)

6) **DX & Build** :
   - Workspaces (npm/pnpm) au **même repo**
   - Scripts root :
     - `build`: build server puis extension
     - `test`: tests server puis extension
     - `package`: build server → s’assurer que `server/dist/**` est présent → `vsce package`
   - `.vscodeignore` : **exclure** `server/src/**`, `server/test/**`, `server/node_modules/**`, maps, configs — **n’embarquer que `server/dist/**`**
   - `launch.json` : “Run Extension” + “Attach to Backend (Inspect)”

7) **Observabilité (optionnelle et OFF par défaut)** :
   - Pino (logs structurés, niveaux), bandeau “debug” dans OutputChannel
   - OpenTelemetry **derrière un flag** ; ne JAMAIS inclure prompts/contenus
   - Variables d’env : `MYIA_DEBUG=1` pour logs verbeux

8) **Plan de test manuel (acceptation)** :
   1. Repo non fiable (Restricted) → commandes disque **grisé** / toast explicatif
   2. `allowFileAccess=false` → exécution `myIa.readFileViaBackend` : **refusée** avec prompt de consentement
   3. Consentement donné → lecture fichier choisi : afficher les 200 1ers caractères
   4. Écriture : créer `tmp_myia.txt` à la racine workspace et ouvrir l’éditeur
   5. Sécurité : tentative `../../etc/hosts` → **refusée** (message clair)
   6. `scopeToWorkspace=true` → chemin hors workspace refusé
   7. `respectGitignore=true` → un fichier ignoré n’apparaît pas dans glob
   8. Chat provider (DeepSeek stub si pas de clé) → **stream SSE** fluide + Annulation (AbortController)
   9. Crash backend simulé → l’extension détecte, propose redémarrage
   10. Packaging : `.vsix` fonctionnel, sans sources server, avec `server/dist/**`

───────────────────────────────────────────────────────────────────────────────
# 🧩 Tâches à exécuter (étapes détaillées)

## Étape 0 — Déterminer le plan
- Inspecte le workspace :
  - S’il existe `packages/extension`, applique **Variant B** (monorepo).
  - Sinon, applique **Variant A** (racine unique).

## Étape 1 — Workspaces & scripts root
- **Variant A** : mets à jour `package.json` (racine) :
  - `"private": true`, `"workspaces": [".", "server"]`
  - Scripts root : `build`, `test`, `package`, `lint`, `typecheck`
- **Variant B** : crée `pnpm-workspace.yaml` (ou npm workspaces) avec `packages/*`

## Étape 2 — Backend local (server/)
- Crée `server/package.json` (type: module, TS/ESM, scripts `dev`, `build`, `test`)
- Ajoute deps : `zod`, `get-port`, `pino`, `undici`, `fastify` (ou `express`), `@fastify/rate-limit`, `glob`, `ignore`
- Ajoute devDeps : `typescript`, `tsup` (ou esbuild), `vitest`, `supertest`, `@types/node`, `@types/supertest`
- Implémente :
  - **Bootstrap** (`src/index.ts`) : lecture env `PORT`, `TOKEN`, bind `127.0.0.1`
  - **Middleware auth** (header Bearer + refus hors loopback)
  - **Validation** zod pour entrées/sorties (schéma dédié `schema/io.ts`)
  - **Sécurité FS** :
    - `validatePath.ts` : `path.resolve`, blocage `..`, Windows & POSIX support
    - `allowlist.ts` : scope workspace + ignore par défaut + support `.gitignore`
  - **Routes** : `healthz`, `fs.read`, `fs.write`, `fs.glob`, `project.index`, `llm.chat (SSE)`
  - **Providers** : `providers/deepseek.ts` (wrapper fetch avec retries, timeout, abort)
  - **Observabilité** : pino + flag `MYIA_DEBUG`; OTel en module désactivé
- Tests vitest/supertest : happy paths + attaques (traversée, taille, rate-limit)

## Étape 3 — Extension (activation & commandes)
- Dans `package.json` de l’extension :
  - Ajoute `contributes.configuration` (settings listés ↑)
  - Ajoute `contributes.commands` (`myIa.enableFileAccess`, `myIa.readFileViaBackend`, `myIa.chatWithContext`)
- Dans `src/extension.ts` :
  - Crée un **OutputChannel** “My IA”
  - Si `!workspace.isTrusted` → toast + retour, ne rien lancer
  - Si `allowFileAccess=false` → proposer `myIa.enableFileAccess`
  - Génère TOKEN (crypto), trouve PORT libre, `fork` backend avec `env`
  - **Healthcheck** avec header `Authorization` avant d’activer les commandes
  - Implémente `readFileViaBackend` : `showOpenDialog` → POST `/v1/fs/read` → `showInformationMessage` avec extrait
  - Implémente `chatWithContext` : récupérer éditeur actif, extrait sélection, POST `/v1/llm/chat` (SSE) → panneau output
  - `deactivate()` : arrêter proprement le process backend

## Étape 4 — Packaging & ignore
- Crée/complète `.vscodeignore` pour EXCLURE :
