/**
 * Ollama Client for local AI execution
 * Client Ollama pour l'exécution IA locale
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { BaseAIClient } from './base-client';
import { AIProvider, AIResponse, OllamaModel, OllamaResponse } from '../types';
import { loadSystemPrompt } from '../system-prompt-loader';

/**
 * Ollama client implementation
 * Implémentation du client Ollama
 */
export class OllamaClient extends BaseAIClient {
    private ollamaUrl: string = 'http://localhost:11434';
    private defaultModel: string = 'phi-4';
    private availableModels: OllamaModel[] = [];

    /**
     * Initialize Ollama client
     * Initialiser le client Ollama
     */
    async initialize(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        this.ollamaUrl = config.get('ollamaUrl') || this.ollamaUrl;
        this.defaultModel = config.get('defaultOllamaModel') || this.defaultModel;

        // Check if Ollama is available
        // Vérifier si Ollama est disponible
        await this.checkAvailability();

        // Load available models
        // Charger les modèles disponibles
        await this.loadAvailableModels();

        this.isInitialized = true;
    }

    /**
     * Execute prompt using Ollama
     * Exécuter un prompt avec Ollama
     */
    async execute(prompt: string): Promise<AIResponse> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const startTime = Date.now();

        try {
            const response = await this.ollamaChat(this.defaultModel, prompt);
            const latency = Date.now() - startTime;

            const inputTokens = this.calculateTokens(prompt);
            const outputTokens = this.calculateTokens(response.response);

            return {
                content: response.response,
                provider: 'ollama',
                tokens: inputTokens + outputTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: this.defaultModel
            };
        } catch (error) {
            throw new Error(`Ollama execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if Ollama is available
     * Vérifier si Ollama est disponible
     */
    async isAvailable(): Promise<boolean> {
        try {
            const config = vscode.workspace.getConfiguration('aiAnalytics');
            const ollamaEnabled = config.get('ollamaEnabled') as boolean;

            if (!ollamaEnabled) {
                return false;
            }

            await this.checkAvailability();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get provider name
     * Obtenir le nom du fournisseur
     */
    getProvider(): AIProvider {
        return 'ollama';
    }

    /**
     * Get available Ollama models
     * Obtenir les modèles Ollama disponibles
     */
    async getAvailableModels(): Promise<OllamaModel[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.availableModels;
    }

    /**
     * Chat with Ollama model
     * Discuter avec un modèle Ollama
     */
    private async ollamaChat(model: string, prompt: string): Promise<OllamaResponse> {
        const systemPrompt = loadSystemPrompt();
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;

        const response = await fetch(`${this.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt: fullPrompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        return await response.json() as OllamaResponse;
    }

    /**
     * Check Ollama availability
     * Vérifier la disponibilité d'Ollama
     */
    private async checkAvailability(): Promise<void> {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama not available: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Failed to connect to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Load available models from Ollama
     * Charger les modèles disponibles depuis Ollama
     */
    private async loadAvailableModels(): Promise<void> {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                this.availableModels = (data as any).models || [];
            }
        } catch (error) {
            console.warn('Failed to load Ollama models:', error);
            this.availableModels = [];
        }
    }
}