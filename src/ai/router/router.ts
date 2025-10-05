/**
 * AI Router with dual-level routing system
 * Routeur IA avec système de routage double-niveau
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AIClientManager } from '../clients/manager';
import { AnalyticsManager } from '../../analytics/manager';
import { AIRoutingMode, AIProvider, AIResponse, TaskComplexity } from '../types';

/**
 * Main AI Router class
 * Classe principale du routeur IA
 */
export class AIRouter {
    private readonly clientManager: AIClientManager;
    private readonly analyticsManager: AnalyticsManager;

    constructor(
        clientManager: AIClientManager,
        analyticsManager: AnalyticsManager
    ) {
        this.clientManager = clientManager;
        this.analyticsManager = analyticsManager;
    }

    /**
     * Execute AI request with dual-level routing
     * Exécuter une requête IA avec routage double-niveau
     */
    async execute(
        prompt: string,
        routingMode: AIRoutingMode,
        selectedProvider?: AIProvider | 'auto'
    ): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            let response: AIResponse;

            // Level 1: Direct execution (manual selection) - PRIORITAIRE
            // Niveau 1 : Exécution directe (sélection manuelle) - PRIORITAIRE
            if (selectedProvider && selectedProvider !== 'auto') {
                response = await this.executeDirect(prompt, selectedProvider as AIProvider);
            }
            // Level 2: Intelligent routing (automatic/delegated)
            // Niveau 2 : Routage intelligent (automatique/délégué)
            else {
                response = await this.executeIntelligentRouting(prompt, routingMode);
            }

            const latency = Date.now() - startTime;

            // Record analytics
            // Enregistrer les analyses
            await this.analyticsManager.recordRequest({
                prompt,
                response: response.content,
                provider: response.provider,
                routingMode,
                latency,
                tokens: response.tokens,
                cost: response.cost,
                success: true,
                cacheHit: response.cacheHit
            });

            return response;
        } catch (error) {
            const latency = Date.now() - startTime;

            // Record error analytics
            // Enregistrer les analyses d'erreur
            await this.analyticsManager.recordRequest({
                prompt,
                response: '',
                provider: (selectedProvider === 'auto' ? 'openai' : selectedProvider) || 'openai',
                routingMode,
                latency,
                tokens: 0,
                cost: 0,
                success: false,
                cacheHit: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw error;
        }
    }

    /**
     * Direct execution - Level 1 routing
     * Exécution directe - Routage niveau 1
     */
    private async executeDirect(
        prompt: string,
        provider: AIProvider
    ): Promise<AIResponse> {
        switch (provider) {
            case 'openai':
                return await this.clientManager.openAIClient.execute(prompt);
            case 'anthropic':
                return await this.clientManager.anthropicClient.execute(prompt);
            case 'deepseek':
                return await this.clientManager.deepseekClient.execute(prompt);
            case 'ollama':
                return await this.clientManager.ollamaClient.execute(prompt);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * Intelligent routing - Level 2 routing
     * Routage intelligent - Routage niveau 2
     */
    private async executeIntelligentRouting(
        prompt: string,
        routingMode: AIRoutingMode
    ): Promise<AIResponse> {
        const complexity = this.analyzeTaskComplexity(prompt);
        let selectedProvider: AIProvider;

        switch (routingMode) {
            case 'auto-local':
                selectedProvider = this.localRouter(prompt, complexity);
                break;
            case 'auto-ollama':
                selectedProvider = await this.ollamaRouter(prompt);
                break;
            case 'auto-gpt5':
                selectedProvider = await this.gpt5Router(prompt);
                break;
            case 'auto-claude':
                selectedProvider = await this.claudeRouter(prompt);
                break;
            case 'auto-deepseek':
                selectedProvider = await this.deepseekRouter(prompt);
                break;
            default:
                selectedProvider = this.localRouter(prompt, complexity);
        }

        return await this.executeDirect(prompt, selectedProvider);
    }

    /**
     * Local router decision logic
     * Logique de décision du routeur local
     */
    private localRouter(prompt: string, complexity: TaskComplexity): AIProvider {
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const ollamaEnabled = config.get('ollamaEnabled') as boolean;

        // Simple heuristic-based routing
        // Routage basé sur des heuristiques simples
        if (ollamaEnabled && complexity === 'low') {
            return 'ollama';
        }

        if (complexity === 'high' || prompt.includes('complex') || prompt.length > 500) {
            return 'openai'; // Use most capable model for complex tasks
        }

        if (prompt.includes('creative') || prompt.includes('story')) {
            return 'anthropic'; // Claude excels at creative tasks
        }

        if (prompt.includes('code') || prompt.includes('programming')) {
            return 'deepseek'; // DeepSeek excels at coding
        }

        // Default to most cost-effective option
        // Par défaut, option la plus rentable
        return ollamaEnabled ? 'ollama' : 'deepseek';
    }

    /**
     * Ollama router (delegated routing)
     * Routeur Ollama (routage délégué)
     */
    private async ollamaRouter(prompt: string): Promise<AIProvider> {
        try {
            const routingPrompt = `Analyze this task and recommend the best AI provider:
            ${prompt}

            Available providers: openai, anthropic, deepseek, ollama
            Consider: cost, latency, quality, task complexity

            Respond with only the provider name.`;

            const response = await this.clientManager.ollamaClient.execute(routingPrompt);
            const provider = response.content.trim().toLowerCase() as AIProvider;

            if (['openai', 'anthropic', 'deepseek', 'ollama'].includes(provider)) {
                return provider;
            }
        } catch (error) {
            console.warn('Ollama routing failed, falling back to local router');
        }

        // Fallback to local router
        // Retour au routeur local
        return this.localRouter(prompt, this.analyzeTaskComplexity(prompt));
    }

    /**
     * GPT-5 router (delegated routing)
     * Routeur GPT-5 (routage délégué)
     */
    private async gpt5Router(prompt: string): Promise<AIProvider> {
        // Similar implementation to ollamaRouter but using GPT-5
        // Implémentation similaire à ollamaRouter mais utilisant GPT-5
        return this.localRouter(prompt, this.analyzeTaskComplexity(prompt));
    }

    /**
     * Claude router (delegated routing)
     * Routeur Claude (routage délégué)
     */
    private async claudeRouter(prompt: string): Promise<AIProvider> {
        // Similar implementation to ollamaRouter but using Claude
        // Implémentation similaire à ollamaRouter mais utilisant Claude
        return this.localRouter(prompt, this.analyzeTaskComplexity(prompt));
    }

    /**
     * DeepSeek router (delegated routing)
     * Routeur DeepSeek (routage délégué)
     */
    private async deepseekRouter(prompt: string): Promise<AIProvider> {
        // Similar implementation to ollamaRouter but using DeepSeek
        // Implémentation similaire à ollamaRouter mais utilisant DeepSeek
        return this.localRouter(prompt, this.analyzeTaskComplexity(prompt));
    }

    /**
     * Analyze task complexity
     * Analyser la complexité de la tâche
     */
    private analyzeTaskComplexity(prompt: string): TaskComplexity {
        const length = prompt.length;
        const wordCount = prompt.split(/\s+/).length;

        if (length < 100 || wordCount < 20) {
            return 'low';
        } else if (length > 1000 || wordCount > 200) {
            return 'high';
        } else {
            return 'medium';
        }
    }
}