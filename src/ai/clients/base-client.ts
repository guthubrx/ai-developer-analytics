/**
 * Base AI Client class
 * Classe de base pour les clients IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AIClient, AIProvider, AIResponse, StreamingCallback } from '../types';

/**
 * Abstract base class for AI clients
 * Classe de base abstraite pour les clients IA
 */
export abstract class BaseAIClient implements AIClient {
    protected readonly context: vscode.ExtensionContext;
    protected isInitialized = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Initialize the client
     * Initialiser le client
     */
    abstract initialize(): Promise<void>;

    /**
     * Execute AI request
     * Exécuter une requête IA
     */
    abstract execute(prompt: string): Promise<AIResponse>;

    /**
     * Execute AI request with streaming
     * Exécuter une requête IA avec streaming
     */
    async executeWithStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<AIResponse> {
        // Default implementation: use normal execution and simulate streaming
        // Implémentation par défaut : utiliser l'exécution normale et simuler le streaming
        const response = await this.execute(prompt);

        // Simulate streaming by sending the response in chunks
        // Simuler le streaming en envoyant la réponse par morceaux
        const words = response.content.split(/\s+/);
        let currentContent = '';

        for (const word of words) {
            currentContent += word + ' ';
            streamingCallback.onChunk(currentContent.trim());

            // Small delay to simulate streaming
            // Petit délai pour simuler le streaming
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        await streamingCallback.onComplete(response);
        return response;
    }

    /**
     * Check if client is available
     * Vérifier si le client est disponible
     */
    abstract isAvailable(): Promise<boolean>;

    /**
     * Get provider name
     * Obtenir le nom du fournisseur
     */
    abstract getProvider(): AIProvider;

    /**
     * Get API key from VS Code SecretStorage
     * Obtenir la clé API depuis SecretStorage de VS Code
     */
    protected async getApiKey(secretKey: string): Promise<string | undefined> {
        try {
            return await this.context.secrets.get(secretKey);
        } catch (error) {
            console.error(`Failed to get API key for ${secretKey}:`, error);
            return undefined;
        }
    }

    /**
     * Store API key in VS Code SecretStorage
     * Stocker la clé API dans SecretStorage de VS Code
     */
    protected async storeApiKey(secretKey: string, apiKey: string): Promise<void> {
        try {
            await this.context.secrets.store(secretKey, apiKey);
        } catch (error) {
            console.error(`Failed to store API key for ${secretKey}:`, error);
            throw error;
        }
    }

    /**
     * Calculate token count (simple approximation)
     * Calculer le nombre de tokens (approximation simple)
     */
    protected calculateTokens(text: string): number {
        // Simple approximation: 1 token ≈ 4 characters
        // Approximation simple : 1 token ≈ 4 caractères
        return Math.ceil(text.length / 4);
    }

    /**
     * Calculate cost based on tokens and provider
     * Calculer le coût basé sur les tokens et le fournisseur
     */
    protected calculateCost(inputTokens: number, outputTokens: number): number {
        const provider = this.getProvider();

        // Cost per 1K tokens in USD
        // Coût par 1K tokens en USD
        const costs = {
            openai: { input: 0.01, output: 0.03 }, // GPT-4 approximate
            anthropic: { input: 0.015, output: 0.075 }, // Claude 3 approximate
            deepseek: { input: 0.00014, output: 0.00028 }, // DeepSeek Chat
            ollama: { input: 0, output: 0 } // Local, no cost
        };

        const cost = costs[provider];
        const inputCost = (inputTokens / 1000) * cost.input;
        const outputCost = (outputTokens / 1000) * cost.output;

        return inputCost + outputCost;
    }
}