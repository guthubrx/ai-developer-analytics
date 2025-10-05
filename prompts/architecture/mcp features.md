# 🧭 CONTEXTE
Repo EXISTANT d’extension VS Code. Objectif : ajouter un **serveur MCP local (stdio)** qui expose des outils
1) `fs.*` : `fs.read`, `fs.write`, `fs.glob`, `fs.search`, `project.index`
2) `web.search` : recherche Web paramétrable (Bing, Google CSE, Brave, SerpAPI, SearxNG, DuckDuckGo)

Gouvernance **“Claude-like”** (permissions explicites + périmètre add-dir), **Workspace Trust**, **consentement**, **conformité Marketplace**, **télémétrie off par défaut**. Zéro fork d’IDE. Qualité **BigMind** (TS strict, tests, CI/CD).

───────────────────────────────────────────────────────────────────────────────
# ✅ RÉSULTAT ATTENDU (OBLIGATOIRE)
- Même repo, avec un nouveau paquet `server-mcp/` (TypeScript, ESM, Node 20+) lancé par l’extension en **stdio** (JSON-RPC 2.0, newline-delimited).
- L’extension agit en **client MCP** : policies (scope + permissions) **avant** tout `mcp/callTool`.
- Outils livrés : `fs.read`, `fs.write`, `fs.glob`, `fs.search`, `project.index`, `web.search`.
- **Conformité VS Code Marketplace** : respect Workspace Trust / Restricted Mode, consentement explicite, Privacy.md, télémétrie optionnelle (off), `.vscodeignore` propre.
- **Qualité** : TS strict, ESLint/Prettier, Husky, tests (Vitest coté serveur, Mocha+@vscode/test-electron côté extension), couverture ≥ 80 %, CI GitHub Actions.

───────────────────────────────────────────────────────────────────────────────
# 🔒 EXIGENCES NON-NÉGOCIABLES (SÉCURITÉ & CONFORMITÉ)
1) **Workspace Trust** : si non-trusted ⇒ MCP **désactivé** (pas de spawn, pas d’accès disque/web).
2) **Consentement explicite** : 1re activation ⇒ prompt “Autoriser l’accès fichier & Web ?”.
3) **Périmètre** : `effectiveScope = workspaceFolders ∪ additionalDirectories[]`. Si `scopeToWorkspace=true`, tout chemin hors périmètre ⇒ **refus**.
4) **Permissions** (Claude-like) :
   - Allowlist de tools. Lecture (`fs.read/glob/search`, `web.search`) permissive.
   - Écriture (`fs.write`) et exécution (si un jour `exec.shell`) ⇒ **confirmation** (Allow once / Always allow / Deny).
   - UI “Gérer les permissions…”, persistance dans `globalState`.
5) **Anti-traversée** : normaliser chemins, bloquer `..`, refuser chemins UNC hors scope, denylist `.git/**`, `node_modules/**`, secrets connus. Respect `.gitignore` si configuré.
6) **Télémétrie** : **OFF par défaut**. Si activée, **jamais** de prompts/contenus. Respect `telemetry.telemetryLevel`.
7) **Privacy** : `docs/PRIVACY.md` clair (ce qui est lu/envoyé, conservation, opt-out).
8) **Packaging** : `.vsix` n’embarque que `server-mcp/dist/**` (sources exclues).

───────────────────────────────────────────────────────────────────────────────
# 🧱 STRUCTURE À PRODUIRE
Variante A (extension à la racine) :
repo/
├─ server-mcp/                    ← NOUVEAU (serveur MCP stdio)
│  ├─ src/
│  │  ├─ index.ts                 (boucle MCP stdio + registre tools)
│  │  ├─ tools/
│  │  │  ├─ registry.ts
│  │  │  ├─ fs.ts                 (fs.read/write/glob/search/index)
│  │  │  └─ websearch.ts          (adapters Bing/GoogleCSE/Brave/SerpAPI/Searx/ DDG)
│  │  ├─ security/
│  │  │  ├─ validatePath.ts
│  │  │  └─ allowlist.ts
│  │  ├─ schema/
│  │  │  └─ io.ts                 (schémas Zod E/S)
│  │  └─ observability/logger.ts  (pino; OTel OFF par défaut)
│  ├─ test/                       (Vitest)
│  ├─ package.json, tsconfig.json, tsup.config.ts
├─ src/                           ← extension existante (TS)
│  ├─ extension.ts                (spawn MCP stdio, policies, commandes)
│  ├─ mcpClient.ts                (client JSON-RPC stdio)
│  └─ policies/
│     ├─ permissions.ts           (Allow once / Always / Deny)
│     └─ scope.ts                 (effectiveScope + add-dir)
├─ package.json                   (root workspaces + scripts)
├─ .vscodeignore                  (exclure sources server)
├─ .vscode/launch.json            (Run Extension + Attach MCP)
└─ docs/PRIVACY.md, SECURITY.md, CONTRIBUTING.md, CHANGELOG.md

(Variante B : place `server-mcp/` dans `packages/` si monorepo déjà en place.)

───────────────────────────────────────────────────────────────────────────────
# 🧩 SETTINGS & COMMANDES EXTENSION (à ajouter dans contributes.configuration/commands)
- `myIa.allowFileAccess: boolean` (def: false)
- `myIa.scopeToWorkspace: boolean` (def: true)
- `myIa.respectGitignore: boolean` (def: true)
- `myIa.additionalDirectories: string[]` (def: [])
- `myIa.maxReadSizeMB: number` (def: 2)
- `myIa.tools.allowed: string[]` (def: ["fs.read","fs.glob","fs.search","web.search"])
- `myIa.tools.needsConfirm: string[]` (def: ["fs.write"])
- `myIa.webSearch.engine: "bing"|"google_cse"|"brave"|"serpapi"|"searxng"|"ddg"` (def: "ddg")
- `myIa.webSearch.lang: string` (def: auto)
- `myIa.webSearch.site: string|null`
- `myIa.webSearch.timeRange: "any"|"d"|"w"|"m"|"y"`

Commandes :
- **MyIA: Autoriser l’accès fichiers…** (consentement + bascule setting)
- **MyIA: Ajouter un dossier au périmètre…**
- **MyIA: Lire un fichier (MCP)**
- **MyIA: Chercher sur le Web (MCP)**
- **MyIA: Gérer les permissions…** (Allow once / Always / Deny)

───────────────────────────────────────────────────────────────────────────────
# 🔧 PLAN D’EXÉCUTION PAS-À-PAS
1) **Workspaces** : au root `package.json`, active workspaces `[".", "server-mcp"]`. Ajoute scripts root : `build`, `test`, `package`.
2) **Serveur MCP** :
   - Node 20+, ESM, TS strict. Build avec tsup/esbuild vers `server-mcp/dist/`.
   - Transport JSON-RPC 2.0 **ligne par ligne** (stdin→stdout).
   - `mcp/initialize`, `mcp/ping`, `mcp/listTools`, `mcp/callTool`.
   - Outils : `fs.*`, `project.index`, `web.search` (adapters moteurs).
   - Sécurité : normalisation chemins, anti-traversée, scope, respect `.gitignore`, rate-limit et bornes de taille.
   - Logs pino structurés, **sans contenu** (jamais de code ni prompts).
3) **Extension** :
   - Au `activate()` :
     - Bloquer si `!workspace.isTrusted`.
     - Si `myIa.allowFileAccess=false`, prompt consentement.
     - Générer `effectiveScope` = `workspace ∪ additionalDirectories`.
     - `spawn(process.execPath, ['server-mcp/dist/index.js'], stdio: pipe)` avec env :
       - `MYIA_SCOPE_DIRS` = dirs séparés par `path.delimiter`
       - `MYIA_SCOPE_TO_WS` = "true"/"false"
       - `MYIA_RESPECT_GITIGNORE` = "true"/"false"
       - Clés moteurs web (si configurées)
     - Handshake MCP (`mcp/initialize`, `mcp/ping`).
   - **Policy engine** avant tout appel tool :
     - Vérifier scope + denylist
     - Vérifier allowlist & `needsConfirm` → QuickPick “Allow once / Always / Deny”
     - Persister `Always allow` dans `globalState`
   - Implémenter les commandes “Lire un fichier (MCP)” et “Chercher sur le Web (MCP)”.
   - Au `deactivate()` : SIGTERM puis kill si besoin.
4) **Conformité** :
   - `docs/PRIVACY.md` + `docs/SECURITY.md` (modèle de menace, surface d’attaque).
   - `.vscodeignore` : exclure `server-mcp/src/**`, tests, configs, maps, node_modules ; **inclure** `server-mcp/dist/**` seulement.
   - Télémétrie : off par défaut, respect des réglages VS Code.
5) **Qualité** :
   - ESLint strict, Prettier, EditorConfig, Husky pre-commit (`lint && test && typecheck && build`).
   - Tests Vitest (serveur) + Mocha/@vscode/test-electron (extension). Couverture ≥ 80 %.
   - CI GitHub Actions : build/test/package, artefact `.vsix`.

───────────────────────────────────────────────────────────────────────────────
# 🧪 TESTS MANUELS (ACCEPTATION)
1) Workspace non fiable → MCP OFF + toast explicatif.
2) `allowFileAccess=false` → commandes refusées + prompt consentement.
3) Après consentement → “Ajouter un dossier…” puis `MyIA: Lire un fichier (MCP)` : affiche les 200 premiers caractères.
4) Tentative `../../etc/hosts` → **OUT_OF_SCOPE** (message clair).
5) `fs.write` sans permission persistante → QuickPick de confirmation.
6) `respectGitignore=true` → `fs.glob` n’inclut pas les ignorés.
7) `MyIA: Chercher sur le Web (MCP)` → résultats normalisés (title/url/snippet/source).
8) Crash serveur simulé → extension détecte et propose redémarrage.
9) `vsce package` → `.vsix` n’embarque que `server-mcp/dist/**`.

───────────────────────────────────────────────────────────────────────────────
# 📄 SQUELETTES MINIMAUX (utilise-les si aucun fichier n’existe encore)

=== FILE: server-mcp/src/index.ts ===
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { tools } from "./tools/registry.js";
import { logger } from "./observability/logger.js";

type Json = any;
type Req = { jsonrpc:"2.0"; id:number|string; method:string; params?:Json };
const rl = createInterface({ input: stdin });
function send(obj: Json) { stdout.write(JSON.stringify(obj)+"\n"); }

send({ jsonrpc:"2.0", method:"mcp/initialize", params:{
  name:"myia-mcp-server", version:"0.1.0",
  tools: Object.values(tools).map(t => ({ name:t.name, title:t.title }))
}});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req: Req; try { req = JSON.parse(line); } catch { return; }
  if (req.method === "mcp/ping") return send({ jsonrpc:"2.0", id:req.id, result:{ ok:true }});
  if (req.method === "mcp/listTools") return send({ jsonrpc:"2.0", id:req.id, result: Object.values(tools).map(t => ({ name:t.name, title:t.title })) });
  if (req.method === "mcp/callTool") {
    const { name, args } = req.params ?? {};
    const tool = tools[name as keyof typeof tools];
    if (!tool) return send({ jsonrpc:"2.0", id:req.id, error:{ code:-32601, message:"Unknown tool" }});
    try { const out = await tool.run(args ?? {}); return send({ jsonrpc:"2.0", id:req.id, result: out }); }
    catch (err:any) { logger.warn({ err }, "tool_error"); return send({ jsonrpc:"2.0", id:req.id, error:{ code:-32000, message:String(err.message||err) }}); }
  }
  return send({ jsonrpc:"2.0", id:req.id, error:{ code:-32601, message:"Unknown method" }});
});

=== FILE: server-mcp/src/tools/registry.ts ===
import { fsTools } from "./fs.js";
import { WebSearchTool } from "./websearch.js";
export const tools = {
  [fsTools.read.name]: fsTools.read,
  [fsTools.write.name]: fsTools.write,
  [fsTools.glob.name]: fsTools.glob,
  [fsTools.search.name]: fsTools.search,
  [fsTools.index.name]: fsTools.index,
  [WebSearchTool.name]: WebSearchTool
};

=== FILE: server-mcp/src/observability/logger.ts ===
export const logger = { info: console.log, warn: console.warn, error: console.error };

=== FILE: server-mcp/src/security/validatePath.ts ===
import * as path from "node:path";
const DENY = [/(\b|[\\/])node_modules(\b|[\\/])/, /(\b|[\\/])\.git(\b|[\\/])/i];
function scopes(): string[] {
  const { delimiter } = path;
  const raw = process.env.MYIA_SCOPE_DIRS ?? "";
  return raw.split(delimiter).filter(Boolean).map(p => path.resolve(p));
}
export function validatePathInScope(p: string): string {
  const abs = path.resolve(p);
  if (DENY.some(rx => rx.test(abs))) throw new Error("DENYLISTED_PATH");
  if ((process.env.MYIA_SCOPE_TO_WS ?? "true") === "true") {
    const ok = scopes().some(s => abs === s || abs.startsWith(s + path.sep));
    if (!ok) throw new Error("OUT_OF_SCOPE");
  }
  return abs;
}

=== FILE: server-mcp/src/security/allowlist.ts ===
import * as fs from "node:fs/promises";
import * as path from "node:path";
export async function readGitignorePatterns(root: string): Promise<string[]> {
  const file = path.join(root, ".gitignore");
  try { const txt = await fs.readFile(file, "utf8"); return txt.split(/\r?\n/).filter(Boolean); }
  catch { return []; }
}

=== FILE: server-mcp/src/schema/io.ts ===
export type ReadIn = { path:string; maxBytes?:number };
export type ReadOut = { content:string; bytes:number };
export type WriteIn = { path:string; content:string; createIfMissing?:boolean };
export type WriteOut = { ok:true };
export type GlobIn = { root:string; pattern:string; respectGitignore?:boolean };
export type GlobOut = { files:string[] };
export type SearchIn = { root:string; query:string; maxResults?:number };
export type SearchOut = { matches:Array<{ path:string; line:number; preview:string }> };
export type IndexIn = { root:string };
export type IndexOut = { summary:{ files:number; size:number; langStats:Record<string,number> } };
export type WebIn = { query:string; topK?:number; engine?:"bing"|"google_cse"|"brave"|"serpapi"|"searxng"|"ddg"; site?:string; lang?:string; timeRange?:"any"|"d"|"w"|"m"|"y" };
export type WebOut = { results:Array<{ title:string; url:string; snippet?:string; source?:string }> };

=== FILE: server-mcp/src/tools/fs.ts ===
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { validatePathInScope } from "../security/validatePath.js";
import { readGitignorePatterns } from "../security/allowlist.js";
function toLang(ext:string){ return (ext||"").toLowerCase(); }
async function listFiles(root:string, respect:boolean, pattern:string){
  const absRoot = validatePathInScope(root);
  const patterns = respect ? await readGitignorePatterns(absRoot) : [];
  const deny = patterns.map(p => new RegExp(p.replace(/\./g,"\\.").replace(/\*/g,".*")));
  const out:string[] = [];
  async function walk(dir:string){
    for (const d of await fs.readdir(dir,{withFileTypes:true})) {
      const p = path.join(dir, d.name); const rel = path.relative(absRoot, p);
      if (deny.some(rx => rx.test(rel))) continue;
      if (d.isDirectory()) await walk(p);
      else if (new RegExp(pattern).test(rel)) out.push(p);
    }
  }
  await walk(absRoot);
  return out;
}
export const fsTools = {
  read: { name:"fs.read", title:"Read file", async run({ path:p, maxBytes=2*1024*1024 }:{path:string;maxBytes?:number}) {
    const abs = validatePathInScope(p); const buf = await fs.readFile(abs);
    if (buf.byteLength > maxBytes) throw new Error("TOO_LARGE");
    return { content: buf.toString("utf8"), bytes: buf.byteLength };
  }},
  write: { name:"fs.write", title:"Write file", async run({ path:p, content, createIfMissing }:{path:string;content:string;createIfMissing?:boolean}) {
    const abs = validatePathInScope(p); try { await fs.stat(abs); } catch { if(!createIfMissing) throw new Error("NOT_FOUND"); }
    await fs.writeFile(abs, content, "utf8"); return { ok:true };
  }},
  glob: { name:"fs.glob", title:"Glob files", async run({ root, pattern, respectGitignore=true }:{root:string;pattern:string;respectGitignore?:boolean}) {
    const files = await listFiles(root, respectGitignore, pattern); return { files };
  }},
  search: { name:"fs.search", title:"Search in files", async run({ root, query, maxResults=50 }:{root:string;query:string;maxResults?:number}) {
    const files = await listFiles(root, true, "."); const matches:any[]=[];
    for (const f of files) {
      const abs = validatePathInScope(f); const txt = await fs.readFile(abs,"utf8"); const lines = txt.split(/\r?\n/);
      for (let i=0;i<lines.length;i++){ if (lines[i].includes(query) && matches.length<maxResults) matches.push({ path:abs, line:i+1, preview:lines[i].slice(0,240) }); }
      if (matches.length>=maxResults) break;
    }
    return { matches };
  }},
  index: { name:"project.index", title:"Index project", async run({ root }:{root:string}) {
    const files = await listFiles(root, true, "."); const langStats:Record<string,number>={}; let size=0;
    for (const f of files){ const ext = toLang(f.split(".").pop()||""); langStats[ext]=(langStats[ext]??0)+1; }
    return { summary:{ files: files.length, size, langStats } };
  }},
};

=== FILE: server-mcp/src/tools/websearch.ts ===
import { request } from "undici";
type R = { title:string; url:string; snippet?:string; source?:string };
async function bing(q:string, k:number, lang?:string, site?:string){ const key=process.env.MYIA_BING_KEY; if(!key) throw new Error("BING_KEY_MISSING");
  const url=new URL("https://api.bing.microsoft.com/v7.0/search"); url.searchParams.set("q",[q,site?`site:${site}`:""].filter(Boolean).join(" ")); url.searchParams.set("count",String(k)); if(lang) url.searchParams.set("setLang",lang);
  const {body}=await request(url,{headers:{ "Ocp-Apim-Subscription-Key":key }}); const j:any=await body.json(); return (j.webPages?.value??[]).map((it:any)=>({title:it.name,url:it.url,snippet:it.snippet,source:"bing"})); }
async function googleCSE(q:string,k:number,lang?:string,site?:string){ const key=process.env.MYIA_GOOGLE_KEY, cx=process.env.MYIA_GOOGLE_CX; if(!key||!cx) throw new Error("GOOGLE_KEY_OR_CX_MISSING");
  const url=new URL("https://www.googleapis.com/customsearch/v1"); url.searchParams.set("key",key); url.searchParams.set("cx",cx); url.searchParams.set("q",[q,site?`site:${site}`:""].filter(Boolean).join(" ")); url.searchParams.set("num",String(Math.min(k,10))); if(lang) url.searchParams.set("lr",`lang_${lang}`);
  const {body}=await request(url); const j:any=await body.json(); return (j.items??[]).map((it:any)=>({title:it.title,url:it.link,snippet:it.snippet,source:"google_cse"})); }
async function brave(q:string,k:number,lang?:string,site?:string){ const key=process.env.MYIA_BRAVE_KEY; if(!key) throw new Error("BRAVE_KEY_MISSING");
  const url=new URL("https://api.search.brave.com/res/v1/web/search"); url.searchParams.set("q",[q,site?`site:${site}`:""].filter(Boolean).join(" ")); url.searchParams.set("count",String(k)); if(lang) url.searchParams.set("lr",lang);
  const {body}=await request(url,{headers:{ "X-Subscription-Token":key }}); const j:any=await body.json(); return (j.web?.results??[]).map((it:any)=>({title:it.title,url:it.url,snippet:it.description,source:"brave"})); }
async function serpapi(q:string,k:number,lang?:string,site?:string){ const key=process.env.MYIA_SERPAPI_KEY; if(!key) throw new Error("SERPAPI_KEY_MISSING");
  const url=new URL("https://serpapi.com/search.json"); url.searchParams.set("engine","google"); url.searchParams.set("q",[q,site?`site:${site}`:""].filter(Boolean).join(" ")); url.searchParams.set("num",String(Math.min(k,10))); url.searchParams.set("api_key",key); if(lang) url.searchParams.set("hl",lang);
  const {body}=await request(url); const j:any=await body.json(); return (j.organic_results??[]).slice(0,k).map((it:any)=>({title:it.title,url:it.link,snippet:it.snippet,source:"serpapi"})); }
async function searx(q:string,k:number,_lang?:string,site?:string){ const base=process.env.MYIA_SEARXNG_URL; if(!base) throw new Error("SEARXNG_URL_MISSING");
  const url=new URL("/search",base); url.searchParams.set("q",[q,site?`site:${site}`:""].filter(Boolean).join(" ")); url.searchParams.set("format","json");
  const {body}=await request(url); const j:any=await body.json(); return (j.results??[]).slice(0,k).map((it:any)=>({title:it.title,url:it.url,snippet:it.content,source:"searxng"})); }
async function ddg(q:string,k:number,_lang?:string,site?:string){ const url=new URL("https://api.duckduckgo.com/"); url.searchParams.set("q",[q,site?`site:${site}`:""].filter(Boolean).join(" ")); url.searchParams.set("format","json"); url.searchParams.set("no_redirect","1");
  const {body}=await request(url); const j:any=await body.json(); const out:R[]=[]; if(j.AbstractURL) out.push({title:j.Heading??"Result",url:j.AbstractURL,snippet:j.AbstractText,source:"ddg"}); return out.slice(0,k); }
export const WebSearchTool = { name:"web.search", title:"Web Search", async run({ query, topK=5, engine="ddg", site, lang, timeRange }:{ query:string; topK?:number; engine?:"bing"|"google_cse"|"brave"|"serpapi"|"searxng"|"ddg"; site?:string; lang?:string; timeRange?:"any"|"d"|"w"|"m"|"y" }) {
  switch(engine){ case "bing": return { results: await bing(query, topK, lang, site) };
    case "google_cse": return { results: await googleCSE(query, topK, lang, site) };
    case "brave": return { results: await brave(query, topK, lang, site) };
    case "serpapi": return { results: await serpapi(query, topK, lang, site) };
    case "searxng": return { results: await searx(query, topK, lang, site) };
    default: return { results: await ddg(query, topK, lang, site) }; } } };

=== FILE: src/mcpClient.ts ===
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import * as readline from "node:readline";
export class McpClient {
  private proc!: ChildProcessWithoutNullStreams; private nextId=1; private pending=new Map<number,(v:any)=>void>();
  start(serverJsAbsPath:string, env:Record<string,string>){ this.proc = spawn(process.execPath,[serverJsAbsPath],{ stdio:["pipe","pipe","pipe"], env:{...process.env,...env} });
    const rl = readline.createInterface({ input: this.proc.stdout }); rl.on("line",(line)=>{ try{ const msg=JSON.parse(line); if(msg.id && this.pending.has(msg.id)){ this.pending.get(msg.id)!(msg); this.pending.delete(msg.id);} } catch{} }); }
  request(method:string, params?:any){ const id=this.nextId++; const p=new Promise<any>(res=>this.pending.set(id,res)); this.proc.stdin.write(JSON.stringify({jsonrpc:"2.0",id,method,params})+"\n"); return p; }
  callTool(name:string,args:any){ return this.request("mcp/callTool",{name,args}); }
  dispose(){ this.proc.kill("SIGTERM"); }
}

=== FILE: src/policies/permissions.ts ===
import * as vscode from "vscode";
type Decision = "allow_once"|"always_allow"|"deny"; const KEY="myia.permissions.v1";
export async function ensurePermission(tool:string, needsConfirm:boolean, ctx:vscode.ExtensionContext){
  const store = ctx.globalState.get<Record<string,Decision>>(KEY) ?? {}; const existing = store[tool];
  if (existing==="always_allow") return true; if (!needsConfirm) return true;
  const pick = await vscode.window.showQuickPick(["Allow once","Always allow","Deny"],{placeHolder:`Permission for ${tool}`});
  if (!pick) return false; if (pick==="Always allow"){ store[tool]="always_allow"; await ctx.globalState.update(KEY,store); return true; }
  if (pick==="Allow once") return true; return false;
}

=== FILE: src/policies/scope.ts ===
import * as vscode from "vscode";
import * as path from "node:path";
export function getEffectiveScope(){ const ws=(vscode.workspace.workspaceFolders??[]).map(f=>f.uri.fsPath); const extra=vscode.workspace.getConfiguration("myIa").get<string[]>("additionalDirectories")??[]; return [...ws,...extra].map(p=>path.resolve(p)); }

=== FILE: src/extension.ts ===
import * as vscode from "vscode";
import * as path from "node:path";
import { McpClient } from "./mcpClient";
import { ensurePermission } from "./policies/permissions";
import { getEffectiveScope } from "./policies/scope";
let client: McpClient|undefined;
export async function activate(ctx:vscode.ExtensionContext){
  const cfg = vscode.workspace.getConfiguration("myIa");
  if (!vscode.workspace.isTrusted) { vscode.window.showWarningMessage("Workspace non fiable : fonctionnalités MCP désactivées."); return; }
  if (!(cfg.get<boolean>("allowFileAccess")??false)) {
    const ok = await vscode.window.showInformationMessage("Autoriser l’accès fichiers & Web (MCP) ?", "Autoriser","Refuser");
    if (ok==="Autoriser") await cfg.update("allowFileAccess", true, vscode.ConfigurationTarget.Global); else return;
  }
  client = new McpClient();
  const serverPath = ctx.asAbsolutePath(path.join("server-mcp","dist","index.js"));
  const scopeDirs = getEffectiveScope().join(path.delimiter);
  client.start(serverPath, {
    MYIA_SCOPE_DIRS: scopeDirs,
    MYIA_SCOPE_TO_WS: (cfg.get<boolean>("scopeToWorkspace")??true) ? "true":"false",
    MYIA_RESPECT_GITIGNORE: (cfg.get<boolean>("respectGitignore")??true) ? "true":"false",
    // Clés moteurs web si présentes dans l'env de l'utilisateur :
    // MYIA_BING_KEY, MYIA_GOOGLE_KEY, MYIA_GOOGLE_CX, MYIA_BRAVE_KEY, MYIA_SERPAPI_KEY, MYIA_SEARXNG_URL
  });
  ctx.subscriptions.push(vscode.commands.registerCommand("myIa.readFileViaMcp", async ()=>{
    const uri = await vscode.window.showOpenDialog({ canSelectMany:false }); if (!uri?.[0]) return;
    const ok = await ensurePermission("fs.read", false, ctx); if (!ok) return;
    const { result, error } = await client!.callTool("fs.read", { path: uri[0].fsPath });
    if (error) return vscode.window.showErrorMessage(error.message);
    vscode.window.showInformationMessage(String(result.content).slice(0,200));
  }));
  ctx.subscriptions.push(vscode.commands.registerCommand("myIa.webSearch", async ()=>{
    const q = await vscode.window.showInputBox({ prompt:"Recherche Web", placeHolder:"mots-clés…" }); if (!q) return;
    const ok = await ensurePermission("web.search", false, ctx); if (!ok) return;
    const engine = (cfg.get<string>("webSearch.engine") ?? "ddg");
    const { result, error } = await client!.callTool("web.search", { query:q, engine, topK:5 });
    if (error) return vscode.window.showErrorMessage(error.message);
    const items = (result.results as any[]).map(r=>({ label:r.title, description:r.url, detail:r.snippet }));
    vscode.window.showQuickPick(items, { placeHolder:"Résultats Web" });
  }));
}
export function deactivate(){ client?.dispose(); }

=== FILE: .vscodeignore (ajouts) ===
**/*.map
**/node_modules/**
server-mcp/src/**
server-mcp/test/**
server-mcp/tsconfig.json
server-mcp/tsup.config.ts
server-mcp/pnpm-lock.yaml

=== FILE: server-mcp/package.json ===
{
  "name": "myia-mcp-server",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "vitest run"
  },
  "dependencies": {
    "undici": "^6.19.8"
  },
  "devDependencies": {
    "tsup": "^8.0.2",
    "typescript": "^5.6.2",
    "vitest": "^2.0.5",
    "@types/node": "^20.14.12"
  }
}

=== FILE: server-mcp/tsconfig.json ===
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}

=== FILE: server-mcp/tsup.config.ts ===
import { defineConfig } from "tsup";
export default defineConfig({
  entry: { "index": "src/index.ts" },
  format: ["esm"],
  target: "node20",
  sourcemap: true,
  clean: true,
  outDir: "dist"
});

=== FILE: package.json (root, extraits) ===
{
  "name": "my-ia-ext-monorepo",
  "private": true,
  "workspaces": [".", "server-mcp"],
  "scripts": {
    "build": "npm -w server-mcp run build && npm -w . run build",
    "test": "npm -w server-mcp run test && npm -w . run test",
    "package": "npm -w server-mcp run build && vsce package"
  }
}

=== FILE: docs/PRIVACY.md (extrait) ===
Cette extension ne lit le système de fichiers local qu’après consentement explicite. Le périmètre est limité au dossier du workspace et aux dossiers supplémentaires ajoutés par l’utilisateur. Aucun contenu (code, prompts, réponses) n’est envoyé en télémétrie. Les recherches Web passent par le moteur choisi par l’utilisateur ; les requêtes et résultats ne sont pas conservés par l’extension.

=== FILE: docs/SECURITY.md (extrait) ===
- Workspace Trust obligatoire ; en mode restreint, MCP désactivé.
- Policies : allowlist de tools, confirmation pour écritures, scope strict.
- Normalisation chemins, anti-traversée, denylist par défaut, respect `.gitignore`.
- Pas de secrets en dur ; variables d’environnement pour moteurs Web.

───────────────────────────────────────────────────────────────────────────────
# 🧪 CHECKLIST DE FIN
- [ ] `npm i` (ou `pnpm i`)
- [ ] `npm run build` (build `server-mcp` puis extension)
- [ ] `npm run test` (couverture ≥ 80 %)
- [ ] F5 “Run Extension” → “Autoriser l’accès fichiers & Web”
- [ ] “Ajouter un dossier…” → `MyIA: Lire un fichier (MCP)`
- [ ] `MyIA: Chercher sur le Web (MCP)` (configurer un moteur & sa clé si besoin)
- [ ] `vsce package` → vérifier que seules les sorties `server-mcp/dist/**` sont packagées

# 📌 REMARQUES
- Les schémas Zod sont simplifiés dans ce squelette minimal (JSON Schema omis pour éviter dépendances). Tu peux enrichir ensuite.
- Ajoute des tests Vitest/Mocha couvrant les cas : OUT_OF_SCOPE, TOO_LARGE, traversée `..`, rate-limit, `.gitignore`, moteurs Web mockés.
- Télémétrie : garde **OFF** par défaut, respecte les réglages utilisateur si tu l’ajoutes plus tard.

→ RENDS les fichiers COMPLETS (ou patchs unifiés) conformément à cette spécification, sans pseudo-code, prêts à compiler.
