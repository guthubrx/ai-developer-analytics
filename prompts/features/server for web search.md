# 🎯 Mission
Dans le repo EXISTANT de ton extension VS Code, ajouter un **serveur MCP (stdio)** dédié à la recherche Web :
- Tool MCP: **`web.search`** (et optionnellement `web.fetch` plus tard).
- Moteurs supportés: **bing**, **google_cse**, **brave**, **serpapi**, **searxng**, **ddg** (par défaut).
- **Gouvernance** stricte : clés/API côté serveur (env), **rate-limit/quota**, **SafeSearch**, **allow/block domains**, **https-only**, **respect robots.txt** si fetch, **fallback** moteur, **cache LRU**, **logs sans contenu sensible**.
- Transport: **JSON-RPC 2.0** ligne-par-ligne sur **stdio** (MCP “client” = l’extension).

# ✅ Résultat attendu (livrables obligatoires)
1) Nouveau paquet **`server-mcp-web/`** (TypeScript, ESM, Node 20+) avec :
   - `src/index.ts` : boucle stdio MCP (methods: `mcp/initialize`, `mcp/ping`, `mcp/listTools`, `mcp/callTool`).
   - `src/tools/websearch.ts` : impl. `web.search` + adapters par moteur.
   - `src/policy.ts` : charge une **Policy** (YAML/JSON) → garde-fous (SafeSearch, allow/block lists, https-only, quotas, fallback).
   - `src/security/rateLimit.ts` : rate-limit per-user & per-engine + circuit breaker.
   - `src/cache/lru.ts` : cache LRU (clé = `engine+normalizedQuery+params`), TTL configurable.
   - `src/observability/logger.ts` : pino-like minimal (structuré), **aucun contenu sensible**.
   - `test/` : Vitest (adapters mockés, quotas, dedupe, filters, fallback, erreurs typées).
   - `package.json`, `tsconfig.json`, `tsup.config.ts`.
2) **Contrat MCP** du tool `web.search` **standardisé** (input/output schemas) — voir plus bas.
3) **Variables d’environnement** attendues (jamais hardcodées) :
   - `MYIA_BING_KEY`, `MYIA_GOOGLE_KEY`, `MYIA_GOOGLE_CX`, `MYIA_BRAVE_KEY`, `MYIA_SERPAPI_KEY`, `MYIA_SEARXNG_URL`
   - `MYIA_POLICY_PATH` (YAML/JSON de policy) — sinon defaults sûrs.
4) **Sécurité & Conformité** :
   - Pas de scraping direct de moteurs hors ToS — utiliser APIs officielles ou **SearxNG** auto-hébergé pour agrégation.
   - **Consentement** côté extension avant la 1re utilisation.
   - **Logs** : latences, engineUsed, tookMs, hit/miss cache, **sans query complète** ni PII.
5) **Qualité BigMind** :
   - TS `strict: true`, ESLint strict, Prettier, EditorConfig, Husky pre-commit (`lint && test && typecheck && build`).
   - Couverture tests **≥ 80 %**.
   - CI GitHub Actions: build/test, publie artefact (si besoin).

# 🧱 Arborescence à produire
repo/
├─ server-mcp-web/
│  ├─ src/
│  │  ├─ index.ts
│  │  ├─ tools/websearch.ts
│  │  ├─ policy.ts
│  │  ├─ security/rateLimit.ts
│  │  ├─ cache/lru.ts
│  │  └─ observability/logger.ts
│  ├─ test/ (vitest)
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ tsup.config.ts
└─ (optionnel) docs/WEB-POLICY.md

# 🧩 Contrat du tool MCP `web.search`
## Input (tous champs validés côté serveur)
- `query: string` (min 2)
- `topK?: number` (1..50, def 5)
- `engine?: "bing"|"google_cse"|"brave"|"serpapi"|"searxng"|"ddg"` (def "ddg")
- `lang?: string` (ex "fr")
- `region?: string` (ex "fr-FR")
- `site?: string` (ex "docs.github.com")
- `timeRange?: "any"|"d"|"w"|"m"|"y"` (def "any")
- `safeSearch?: "off"|"moderate"|"strict"` (def "moderate")
- `sortBy?: "relevance"|"date"` (def "relevance")
- `offset?: number` (def 0)
- `dedupeByDomain?: boolean` (def true)
- `snippetChars?: number` (def 240)
- `fetchPage?: boolean` (def false)  ← (prévu pour plus tard si tu veux `web.fetch`)
- `maxFetchBytes?: number` (def 2_000_000)
- `timeoutMs?: number` (def 12_000)
- `enginesFallback?: string[]` (ordre de repli, ex `["bing","brave","ddg"]`)
- (facultatifs, souvent imposés par policy): `allowDomains?: string[]`, `blockDomains?: string[]`, `allowProtocols?: ("https"|"http")[]`

## Output
```json
{
  "results": [
    {
      "title": "string",
      "url": "https://…",
      "displayUrl": "string (optionnel)",
      "snippet": "string (optionnel)",
      "source": "bing|google_cse|brave|serpapi|searxng|ddg",
      "rank": 1,
      "score": 0.78,
      "publishedAt": "2025-10-06T08:00:00.000Z",
      "favicon": "https://…/favicon.ico"
    }
  ],
  "engineUsed": "bing",
  "tookMs": 742,
  "cached": false,
  "warnings": ["string (optionnel)"]
}
