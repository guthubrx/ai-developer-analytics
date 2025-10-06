/**
 * AI Client Manager
 * Gestionnaire de clients IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AIClient } from '../types';
import { OpenAIClient } from './openai-client';
import { AnthropicClient } from './anthropic-client';
import { DeepSeekClient } from './deepseek-client';
import { OllamaClient } from './ollama-client';
import { MoonshotClient } from './moonshot-client';

/**
 * Manages all AI clients
 * Gère tous les clients IA
 */
export class AIClientManager {
    public readonly openAIClient: OpenAIClient;
    public readonly anthropicClient: AnthropicClient;
    public readonly deepseekClient: DeepSeekClient;
    public readonly ollamaClient: OllamaClient;
    public readonly moonshotClient: MoonshotClient;

    constructor(context: vscode.ExtensionContext) {
        this.openAIClient = new OpenAIClient(context);
        this.anthropicClient = new AnthropicClient(context);
        this.deepseekClient = new DeepSeekClient(context);
        this.ollamaClient = new OllamaClient(context);
        this.moonshotClient = new MoonshotClient(context);
    }

    /**
     * Initialize all clients
     * Initialiser tous les clients
     */
    async initialize(): Promise<void> {
        await Promise.all([
            this.openAIClient.initialize(),
            this.anthropicClient.initialize(),
            this.deepseekClient.initialize(),
            this.ollamaClient.initialize(),
            this.moonshotClient.initialize()
        ]);
    }

    /**
     * Get all available clients
     * Obtenir tous les clients disponibles
     */
    async getAvailableClients(): Promise<AIClient[]> {
        const clients: AIClient[] = [];

        if (await this.openAIClient.isAvailable()) {
            clients.push(this.openAIClient);
        }

        if (await this.anthropicClient.isAvailable()) {
            clients.push(this.anthropicClient);
        }

        if (await this.deepseekClient.isAvailable()) {
            clients.push(this.deepseekClient);
        }

        if (await this.ollamaClient.isAvailable()) {
            clients.push(this.ollamaClient);
        }

        if (await this.moonshotClient.isAvailable()) {
            clients.push(this.moonshotClient);
        }

        return clients;
    }
}