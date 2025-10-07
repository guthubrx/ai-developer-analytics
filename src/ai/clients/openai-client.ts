/**
 * OpenAI Client
 * Client OpenAI
 *
 * @license AGPL-3.0-only
 */

import { BaseAIClient } from './base-client';
import { AIProvider, AIResponse, StreamingCallback } from '../types';
import { loadSystemPrompt } from '../system-prompt-loader';
import * as vscode from 'vscode';

/**
 * OpenAI client implementation
 * Implémentation du client OpenAI
 */
export class OpenAIClient extends BaseAIClient {
    private apiKey: string | undefined;

    /**
     * Initialize OpenAI client
     * Initialiser le client OpenAI
     */
    async initialize(): Promise<void> {
        this.apiKey = await this.getApiKey('openai-api-key');
        this.isInitialized = true;
    }

    /**
     * Execute prompt using OpenAI
     * Exécuter un prompt avec OpenAI
     */
    async execute(prompt: string): Promise<AIResponse> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const startTime = Date.now();

        try {
            // In a real implementation, this would use the OpenAI SDK
            // Dans une implémentation réelle, cela utiliserait le SDK OpenAI
            const response = await this.openAIChat(prompt, false);
            const latency = Date.now() - startTime;

            const inputTokens = this.calculateTokens(prompt);
            const outputTokens = this.calculateTokens(response.content);

            return {
                content: response.content,
                provider: 'openai',
                tokens: inputTokens + outputTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: 'gpt-4o'
            };
        } catch (error) {
            throw new Error(`OpenAI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Execute prompt with streaming
     * Exécuter un prompt avec streaming
     */
    override async executeWithStreaming(prompt: string, streamingCallback?: StreamingCallback): Promise<AIResponse> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const startTime = Date.now();

        try {
            const response = await this.openAIChat(prompt, true, streamingCallback);
            const latency = Date.now() - startTime;

            const inputTokens = this.calculateTokens(prompt);
            const outputTokens = this.calculateTokens(response.content);

            return {
                content: response.content,
                provider: 'openai',
                tokens: inputTokens + outputTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: 'gpt-4o'
            };
        } catch (error) {
            throw new Error(`OpenAI streaming execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if OpenAI is available
     * Vérifier si OpenAI est disponible
     */
    async isAvailable(): Promise<boolean> {
        return this.apiKey !== undefined;
    }

    /**
     * Get provider name
     * Obtenir le nom du fournisseur
     */
    getProvider(): AIProvider {
        return 'openai';
    }

    /**
     * Set OpenAI API key
     * Définir la clé API OpenAI
     */
    async setApiKey(apiKey: string): Promise<void> {
        await this.storeApiKey('openai-api-key', apiKey);
        this.apiKey = apiKey;
    }

    /**
     * Chat with OpenAI
     * Discuter avec OpenAI
     */
    private async openAIChat(prompt: string, stream = false, streamingCallback?: StreamingCallback): Promise<{ content: string; usage?: any }> {
        const systemPrompt = loadSystemPrompt();
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const defaultModel = (config.get('openaiDefaultModel') as string) || 'gpt-4o';

        // System prompt is loaded but not yet integrated in placeholder implementation
        // In real implementation, systemPrompt would be used in the API call

        // This is a placeholder implementation
        // In a real implementation, you would use the OpenAI SDK
        // Ceci est une implémentation placeholder
        // Dans une implémentation réelle, vous utiliseriez le SDK OpenAI

        // Simulate API call with system prompt
        // Simuler un appel API avec prompt système
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate response with system prompt context
        const response = `OpenAI (${defaultModel}) response with system prompt (${systemPrompt.length} chars): ${prompt.substring(0, 50)}...`;

        // Simulate streaming if requested
        if (stream && streamingCallback) {
            const words = response.split(' ');
            for (const word of words) {
                await new Promise(resolve => setTimeout(resolve, 50));
                streamingCallback.onChunk(word + ' ');
            }
            streamingCallback.onComplete({
                content: response,
                provider: 'openai',
                tokens: this.calculateTokens(response),
                cost: this.calculateCost(0, this.calculateTokens(response)),
                latency: 1000,
                cacheHit: false,
                model: defaultModel
            });
        }

        return { content: response };
    }
}