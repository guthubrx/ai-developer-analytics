# ⚙️ Plan d’Implémentation — Système de Suivi des Coûts IA  
**Projet : AI Developer Analytics (Extension Visual Studio Code)**  
**Version : 2.2 — Architecture VS Code native + Comparaison & Export**  
**Auteur : toi (Lead Developer)**  
**Date : 2025-10-11**

---

## 🧭 1. Vue d’ensemble

Ce document définit la conception et le plan d’exécution du **système intégré de suivi des coûts IA** au sein de l’extension **AI Developer Analytics** pour **Visual Studio Code**.  
L’objectif est de **mesurer, comparer et visualiser** les coûts d’usage IA (OpenAI, Anthropic, DeepSeek, Ollama, etc.) **localement dans l’IDE**, sans dépendance cloud.

**Philosophie :**
- 100 % local, rapide, sans fuite de données  
- Respect total du sandboxing VS Code  
- Interface fluide (Webview React + Tailwind)  
- Architecture modulaire et extensible

---

## 🎯 2. Objectifs fonctionnels

1. **Traçabilité complète** de chaque requête IA dans VS Code  
2. **Analyse temporelle** des coûts et usages (modèle, provider, session, tâche)  
3. **Visualisation intégrée** dans un panneau “Cost Dashboard”  
4. **Recommandations d’optimisation** (modèle, cache, mode d’exécution)  
5. **Comparaison coût / modèle / workspace** (nouveauté v2.2)  
6. **Export CSV / JSON** des métriques (nouveauté v2.2)  
7. **Graphiques d’efficacité “coût vs productivité”** (nouveauté v2.2)  
8. **Icône dynamique dans le AI Dashboard** affichant le **coût du jour** (nouveauté v2.2)  
9. **Respect des contraintes d’extension VS Code :**
   - stockage local (`globalStoragePath`)  
   - sandbox Node.js + Webview sécurisé  
   - taille bundle < 50 MB  

---

## 🧩 3. Architecture globale

ai-developer-analytics/
├── src/
│ ├── core/
│ │ ├── cost-tracker.ts
│ │ ├── pricing-manager.ts
│ │ ├── token-estimator.ts
│ │ ├── cost-aggregator.ts
│ │ └── retention-manager.ts
│ ├── capture/
│ │ ├── metrics-extractor.ts
│ │ ├── parsers/
│ │ └── mapper.ts
│ ├── ui/
│ │ ├── panels/cost-dashboard.tsx
│ │ ├── charts/cost-charts.tsx
│ │ ├── charts/efficiency-graphs.tsx # Nouveau : coût vs productivité
│ │ └── components/dashboard-status-icon.tsx # Nouveau : icône dynamique
│ ├── commands/
│ │ ├── showCostDashboard.ts
│ │ ├── resetAnalyticsData.ts
│ │ ├── exportMetrics.ts # Nouveau : export CSV / JSON
│ │ └── compareWorkspaces.ts # Nouveau : comparaison inter-workspaces
│ └── extension.ts
└── package.json


---

## 🏗️ 4. Architecture technique (complétée)

### 4.1 Base de données — Better-SQLite3
> Ajout des colonnes `workspaceId` et `productivityScore` pour les nouvelles fonctionnalités.

```sql
ALTER TABLE requests ADD COLUMN workspace_id TEXT;
ALTER TABLE daily_stats ADD COLUMN workspace_breakdown JSON;

4.2 Nouvelles structures de données

interface WorkspaceComparison {
  workspaceId: string;
  totalCost: number;
  totalTokens: number;
  dominantModel: string;
  costPerRequest: number;
}

interface ExportFormat {
  requests: RequestRecord[];
  dailyStats: DailyStats[];
  comparisons?: WorkspaceComparison[];
}

interface EfficiencyPoint {
  date: string;
  cost: number;
  productivityScore: number;
}

🔌 5. Intégration VS Code
5.1 Nouvelles commandes

"contributes": {
  "commands": [
    { "command": "aiAnalytics.showCostDashboard", "title": "Show AI Cost Dashboard" },
    { "command": "aiAnalytics.exportMetrics", "title": "Export Metrics (CSV/JSON)" },
    { "command": "aiAnalytics.compareWorkspaces", "title": "Compare Workspaces" },
    { "command": "aiAnalytics.resetAnalyticsData", "title": "Reset Analytics Data" }
  ]
}

5.2 Icône dynamique (AI Dashboard)

    Placée dans le header du Dashboard

    Affiche le coût cumulé du jour

    Couleur adaptative (vert = faible coût, orange = modéré, rouge = élevé)

export function DashboardStatusIcon({ todayCost }: { todayCost: number }) {
  const color =
    todayCost < 0.1 ? "text-green-500" :
    todayCost < 1 ? "text-yellow-500" : "text-red-500";
  return <div className={`font-semibold ${color}`}>💰 {todayCost.toFixed(2)} €</div>;
}

💾 6. Export CSV / JSON

Nouvelle commande :
aiAnalytics.exportMetrics → génère un export dans le dossier utilisateur (workspaceStorage ou Downloads).

export async function exportMetrics(format: "csv" | "json") {
  const data = await tracker.exportData();
  if (format === "json") saveJSON(data);
  else saveCSV(data);
}

Formats :

    metrics-export.json → complet, structuré, réimportable

    metrics-export.csv → lisible dans Excel / Sheets

📊 7. Comparaison inter-workspaces

Permet d’analyser le coût moyen par modèle et par workspace, sur une période donnée.
Utilise workspaceId pour agréger les données.

const comparison = await costAggregator.compareByWorkspace({
  start: "2025-09-01",
  end: "2025-10-11"
});

Affiché sous forme de bar chart dans la Webview :

    x-axis → workspace

    y-axis → coût total

    tooltip → modèle dominant, nombre de requêtes

📈 8. Graphiques d’efficacité “coût vs productivité”

Corrélation coût / efficacité via un indicateur productivityScore (basé sur nombre de commits, messages IA, ou code généré).
Affiché sous forme de scatter plot.

<EfficiencyGraph data={efficiencyPoints} />

Utilisation possible :

    Identifier les modèles les plus “rentables” (output / coût)

    Détecter les gaspillages IA

🚀 9. Plan de développement (mis à jour)
Phase	Période	Objectif	Livrable
1️⃣ Core + DB	Sem. 1–2	CostTracker + migrations	VSIX test local
2️⃣ Capture	Sem. 3	Extracteurs multi-provider	reliés à BaseAIClient
3️⃣ Dashboard UI	Sem. 4–5	Webview React	showCostDashboard
4️⃣ Agrégations	Sem. 6	CostAggregator + DailyStats	cohérence des données
5️⃣ Pricing & Optimisation	Sem. 7	PricingManager + reco	JSON local
6️⃣ Comparaison & Export	Sem. 8	CompareWorkspaces + ExportMetrics	commandes prêtes
7️⃣ Graphiques efficacité	Sem. 9	EfficiencyGraph + DashboardStatusIcon	intégration visuelle
8️⃣ Rétention & Tests	Sem. 10	compression, purge, tests UI	profil VSIX
9️⃣ Finalisation	Sem. 11	UX + doc dev	publication Marketplace

🧠 10. Extensions futures
Fonction	Description
Comparaison coût / modèle / workspace	Visualisation comparative multi-projet
Export CSV / JSON	Sauvegarde locale des métriques
Graphiques coût vs productivité	Analyse du ROI IA
Icône dynamique (AI Dashboard)	Coût du jour en temps réel
Sync Gist (opt-in)	Partage optionnel entre machines

📚 11. Documentation à livrer (complétée)
Fichier	Contenu
docs/architecture.md	Diagramme global + nouvelles tables
docs/api.md	Services CostTracker, PricingManager, ExportManager
docs/ui.md	Webview, EfficiencyGraph, DashboardStatusIcon
docs/security.md	RGPD, stockage local
docs/usage.md	Lecture du dashboard, export, comparaison
✅ 12. Checklist finale
Élément	Description	État
🧱 Base SQLite étendue	workspaceId, indexes	☐
📊 Comparaison workspace	agrégation + chart	☐
📁 Export CSV/JSON	command + file output	☐
💹 Graphiques efficacité	scatter plot / trends	☐
💰 Icône dynamique	coût du jour visible	☐
💾 Rétention & Vacuum	automatisés	☐
⚡ UX fluide	aucun blocage	☐