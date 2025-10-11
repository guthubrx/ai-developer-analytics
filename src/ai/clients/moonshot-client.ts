/**
 * Moonshot (Kimi) Client
 * Client Moonshot (Kimi)
 */

import * as vscode from 'vscode';
import * as https from 'https';
import { BaseAIClient } from './base-client';
import { AIProvider, AIResponse, StreamingCallback } from '../types';
import { loadSystemPrompt } from '../system-prompt-loader';
import { ProviderError, ProviderStatus, ProviderStatusManager } from '../providers/provider-status';
import { getChatUrl, getProviderConfig } from '../provider-config';

export class MoonshotClient extends BaseAIClient {
    private apiKey: string = '';
    private timeout: number = 60000; // Default 60 seconds
    private statusManager: ProviderStatusManager;

    constructor(context: vscode.ExtensionContext) {
        super(context);
        this.statusManager = ProviderStatusManager.getInstance();
    }

    async initialize(): Promise<void> {
        // Read API key and timeout from extension configuration
        // Lire la clé API et le timeout depuis la configuration de l'extension
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configApiKey = config.get('moonshotApiKey') as string;
        this.timeout = config.get('apiTimeout') as number || 60000;

        if (configApiKey && configApiKey.trim() !== '') {
            this.apiKey = configApiKey;

            // Vérifier la connexion au démarrage
            await this.checkConnection();
        } else {
            const secretApiKey = await this.getApiKey('moonshot-api-key');
            if (secretApiKey && secretApiKey.trim() !== '') {
                this.apiKey = secretApiKey;
                await this.checkConnection();
            } else {
                // Aucune clé configurée
                this.statusManager.updateStatus({
                    providerId: 'moonshot',
                    providerName: 'Moonshot',
                    status: ProviderStatus.UNCONFIGURED,
                    lastChecked: new Date(),
                    suggestions: [
                        'Configurez votre clé API Moonshot dans les paramètres',
                        'Obtenez une clé sur https://platform.moonshot.cn'
                    ]
                });
            }
        }
        this.isInitialized = true;
    }

    /**
     * Vérifier la connexion à l'API Moonshot
     */
    private async checkConnection(): Promise<void> {
        try {
            const testPrompt = 'Test de connexion';
            const startTime = Date.now();

            // Faire une petite requête de test
            await this.kimiChat(testPrompt, false);
            const latency = Date.now() - startTime;

            this.statusManager.updateStatus({
                providerId: 'moonshot',
                providerName: 'Moonshot',
                status: ProviderStatus.CONNECTED,
                lastChecked: new Date(),
                lastLatency: latency
            });

        } catch (error) {
            // La gestion d'erreur se fait dans les méthodes de requête
        }
    }

    async execute(prompt: string): Promise<AIResponse> {
        if (!this.isInitialized) await this.initialize();
        if (!this.apiKey) throw new Error('Moonshot API key not configured');

        const startTime = Date.now();
        const apiResponse = await this.kimiChat(prompt, false);
        const latency = Date.now() - startTime;

        const inputTokens = apiResponse.usage?.prompt_tokens || this.calculateTokens(prompt);
        const outputTokens = apiResponse.usage?.completion_tokens || this.calculateTokens(apiResponse.content);
        const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

        // Get configured model for response
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configuredModel = config.get('moonshotDefaultModel') as string;

        return {
            content: apiResponse.content,
            provider: 'moonshot',
            tokens: totalTokens,
            cost: this.calculateCost(inputTokens, outputTokens),
            latency,
            cacheHit: false,
            model: apiResponse.model || configuredModel // Use model from API response or configured model
        };
    }

    override async executeWithStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<AIResponse> {
        if (!this.isInitialized) await this.initialize();
        if (!this.apiKey) throw new Error('Moonshot API key not configured');

        const startTime = Date.now();
        const apiResponse = await this.kimiChat(prompt, true, streamingCallback);
        const latency = Date.now() - startTime;

        const inputTokens = apiResponse.usage?.prompt_tokens || this.calculateTokens(prompt);
        const outputTokens = apiResponse.usage?.completion_tokens || this.calculateTokens(apiResponse.content);
        const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

        // Get configured model for response
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configuredModel = config.get('moonshotDefaultModel') as string;

        return {
            content: apiResponse.content,
            provider: 'moonshot',
            tokens: totalTokens,
            cost: this.calculateCost(inputTokens, outputTokens),
            latency,
            cacheHit: false,
            model: apiResponse.model || configuredModel
        };
    }

    async isAvailable(): Promise<boolean> {
        return this.apiKey !== undefined && this.apiKey.trim() !== '';
    }

    getProvider(): AIProvider {
        return 'moonshot';
    }

    async setApiKey(apiKey: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        await config.update('moonshotApiKey', apiKey, vscode.ConfigurationTarget.Global);
        await this.storeApiKey('moonshot-api-key', apiKey);
        this.apiKey = apiKey;
    }

    private async kimiChat(prompt: string, stream = false, streamingCallback?: StreamingCallback): Promise<{ content: string; usage?: any; model?: string }> {
        // Endpoint and payload based on Moonshot docs
        // https://platform.moonshot.ai/docs/guide/start-using-kimi-api
        const apiUrl = getChatUrl('moonshot');
        const systemPrompt = loadSystemPrompt();
        const vscodeConfig = vscode.workspace.getConfiguration('aiAnalytics');
        const defaultModel = vscodeConfig.get('moonshotDefaultModel') as string;

        if (!defaultModel || defaultModel.trim() === '') {
            // Si aucun modèle n'est configuré mais qu'une clé API existe, demander à configurer un modèle
            if (this.apiKey && this.apiKey.trim() !== '') {
                throw new Error('Moonshot model not configured - please select a model in settings');
            }
            // Si aucune clé API n'est configurée, le provider n'est pas disponible
            throw new Error('Moonshot API key not configured');
        }
        const requestBody = {
            model: defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            stream,
            temperature: 0.6
        };

        if (stream && streamingCallback) {
            return await this.makeStreamingApiRequest(apiUrl, requestBody, streamingCallback);
        }
        const data = await this.makeApiRequest(apiUrl, requestBody);
        const content = data.choices?.[0]?.message?.content || '';
        return { content, usage: data.usage, model: data.model };
    }

    private async makeApiRequest(url: string, body: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const urlObj = new URL(url);
            const config = getProviderConfig('moonshot');
            // Vérifier que les headers existent
            if (!config.headers) {
                throw new Error('Provider configuration missing headers');
            }

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [config.headers.authHeader]: `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: this.timeout
            };

            const timeoutId = setTimeout(() => {
                req.destroy();
                const error = ProviderError.fromNetworkError(
                    'moonshot',
                    'Moonshot',
                    new Error('Request timeout after 30 seconds')
                );
                this.handleApiError(error);
                reject(error);
            }, this.timeout);

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);
                            resolve(response);
                        } catch (e) {
                            const error = new ProviderError(
                                'moonshot',
                                'Moonshot',
                                ProviderStatus.API_ERROR,
                                `Failed to parse API response: ${e}`
                            );
                            this.handleApiError(error);
                            reject(error);
                        }
                    } else {
                        const error = ProviderError.fromHttpError(
                            'moonshot',
                            'Moonshot',
                            res.statusCode || 0,
                            data
                        );
                        this.handleApiError(error);
                        reject(error);
                    }
                });
            });

            req.on('error', err => {
                clearTimeout(timeoutId);
                const error = ProviderError.fromNetworkError(
                    'moonshot',
                    'Moonshot',
                    err
                );
                this.handleApiError(error);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Gérer les erreurs d'API et afficher les messages utilisateur
     */
    private async handleApiError(error: ProviderError): Promise<void> {
        // Mettre à jour le statut
        this.statusManager.updateStatus({
            providerId: error.providerId,
            providerName: error.providerName,
            status: error.status,
            errorMessage: error.message,
            errorCode: error.errorCode,
            lastChecked: new Date(),
            suggestions: error.suggestions
        });

        // Afficher l'erreur à l'utilisateur
        await error.showToUser();
    }

    private async makeStreamingApiRequest(url: string, body: any, streamingCallback: StreamingCallback): Promise<{ content: string; usage?: any }> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const urlObj = new URL(url);
            const config = getProviderConfig('moonshot');
            // Vérifier que les headers existent
            if (!config.headers) {
                throw new Error('Provider configuration missing headers');
            }

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [config.headers.authHeader]: `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: this.timeout
            };

            const timeoutId = setTimeout(() => {
                req.destroy();
                const error = ProviderError.fromNetworkError(
                    'moonshot',
                    'Moonshot',
                    new Error('Streaming request timeout after 30 seconds')
                );
                this.handleApiError(error);
                reject(error);
            }, this.timeout);

            let fullContent = '';
            let usage: any = null;
            const req = https.request(options, (res) => {
                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        if (line.startsWith('data: ')) {
                            const dataStr = line.substring(6);
                            if (dataStr === '[DONE]') {
                                clearTimeout(timeoutId);
                                resolve({ content: fullContent, usage });
                                return;
                            }
                            try {
                                const data = JSON.parse(dataStr);
                                const delta = data.choices?.[0]?.delta;
                                if (delta?.content) {
                                    fullContent += delta.content;
                                    // Send only the delta content, not the accumulated content
                                    streamingCallback.onChunk(delta.content);
                                }
                                if (data.usage) usage = data.usage;
                            } catch (e) {
                                // ignore parse errors in stream chunks
                            }
                        }
                    }
                });
                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ content: fullContent, usage });
                    } else {
                        const error = ProviderError.fromHttpError(
                            'moonshot',
                            'Moonshot',
                            res.statusCode || 0,
                            'Streaming request failed'
                        );
                        this.handleApiError(error);
                        reject(error);
                    }
                });
            });

            req.on('error', err => {
                clearTimeout(timeoutId);
                const error = ProviderError.fromNetworkError(
                    'moonshot',
                    'Moonshot',
                    err
                );
                this.handleApiError(error);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }
}


