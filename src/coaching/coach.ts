/**
 * AI Coach for developer guidance and analytics
 * Coach IA pour le guidage des développeurs et les analyses
 *
 * @license AGPL-3.0-only
 */

import { AnalyticsManager } from '../analytics/manager';
import { AIRouter } from '../ai/router/router';
import { AIResponse } from '../ai/types';

/**
 * AI Coach providing personalized guidance
 * Coach IA fournissant un guidage personnalisé
 */
export class AICoach {
    private readonly analyticsManager: AnalyticsManager;

    constructor(analyticsManager: AnalyticsManager, _aiRouter: AIRouter) {
        this.analyticsManager = analyticsManager;
    }

    /**
     * Get coaching advice for a prompt and response
     * Obtenir des conseils de coaching pour un prompt et une réponse
     */
    async getAdvice(prompt: string, response: AIResponse): Promise<string | null> {
        // Simple coaching logic based on usage patterns
        // Logique de coaching simple basée sur les modèles d'utilisation
        const summary = await this.analyticsManager.getSummary();

        let advice = '';

        // Cost optimization advice
        // Conseil d'optimisation des coûts
        if (response.cost > 0.1) {
            advice += `💡 Consider using Ollama for similar prompts to save costs.\n`;
        }

        // Latency advice
        // Conseil sur la latence
        if (response.latency > 5000) {
            advice += `⚡ High latency detected. Try using local routing for faster responses.\n`;
        }

        // Provider usage advice
        // Conseil sur l'utilisation des fournisseurs
        const providerCount = summary.providerDistribution[response.provider] || 0;
        const totalRequests = summary.totalRequests;
        const providerPercentage = (providerCount / totalRequests) * 100;

        if (providerPercentage > 80) {
            advice += `🔄 You're heavily using ${response.provider}. Consider diversifying providers for better results.\n`;
        }

        // Prompt complexity advice
        // Conseil sur la complexité du prompt
        if (prompt.length > 1000) {
            advice += `📝 Long prompt detected. Consider breaking complex tasks into smaller requests.\n`;
        }

        return advice || null;
    }

    /**
     * Generate weekly report
     * Générer un rapport hebdomadaire
     */
    async generateWeeklyReport(): Promise<{
        totalRequests: number;
        totalCost: number;
        averageLatency: number;
        topProvider: string;
        recommendations: string[];
    }> {
        const summary = await this.analyticsManager.getSummary();

        const recommendations: string[] = [];

        // Cost optimization
        // Optimisation des coûts
        if (summary.totalCost > 10) {
            recommendations.push("Consider using more cost-effective providers like Ollama or DeepSeek for routine tasks");
        }

        // Latency optimization
        // Optimisation de la latence
        if (summary.averageLatency > 3000) {
            recommendations.push("Try using local routing for faster response times on simple queries");
        }

        // Provider diversity
        // Diversité des fournisseurs
        const providers = Object.keys(summary.providerDistribution);
        if (providers.length === 1) {
            recommendations.push("Diversify your AI provider usage to leverage different model strengths");
        }

        // Find top provider
        // Trouver le fournisseur principal
        let topProvider = 'none';
        let maxCount = 0;
        for (const [provider, count] of Object.entries(summary.providerDistribution)) {
            if (count > maxCount) {
                maxCount = count;
                topProvider = provider;
            }
        }

        return {
            totalRequests: summary.totalRequests,
            totalCost: summary.totalCost,
            averageLatency: summary.averageLatency,
            topProvider,
            recommendations
        };
    }

    /**
     * Calculate Code Health Index
     * Calculer l'indice de santé du code
     */
    async calculateCodeHealthIndex(): Promise<number> {
        // This would integrate with architecture scanner
        // In a real implementation, this would analyze code quality metrics
        // Ceci intégrerait le scanner d'architecture
        // Dans une implémentation réelle, cela analyserait les métriques de qualité du code

        // Placeholder implementation
        // Implémentation placeholder
        return 75; // 0-100 scale
    }
}