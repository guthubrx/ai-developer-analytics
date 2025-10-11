/**
 * Anthropic Client
 * Client Anthropic
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as https from 'https';
import { BaseAIClient } from './base-client';
import { AIProvider, AIResponse, StreamingCallback } from '../types';
import { loadSystemPrompt } from '../system-prompt-loader';
import { ProviderError, ProviderStatus, ProviderStatusManager } from '../providers/provider-status';
import { getChatUrl, getProviderConfig } from '../provider-config';

/**
 * Anthropic client implementation
 * Implémentation du client Anthropic
 */
export class AnthropicClient extends BaseAIClient {
    private apiKey: string = '';
    private timeout: number = 60000; // Default 60 seconds
    private statusManager: ProviderStatusManager;

    constructor(context: vscode.ExtensionContext) {
        super(context);
        this.statusManager = ProviderStatusManager.getInstance();
    }

    /**
     * Initialize Anthropic client
     * Initialiser le client Anthropic
     */
    async initialize(): Promise<void> {
        // Read API key and timeout from extension configuration
        // Lire la clé API et le timeout depuis la configuration de l'extension
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configApiKey = config.get('anthropicApiKey') as string;
        this.timeout = config.get('apiTimeout') as number || 60000;

        // Also check SecretStorage for backward compatibility
        // Vérifier également SecretStorage pour la compatibilité descendante
        if (configApiKey && configApiKey.trim() !== '') {
            this.apiKey = configApiKey;
            // Vérifier la connexion au démarrage
            await this.checkConnection();
        } else {
            const secretApiKey = await this.getApiKey('anthropic-api-key');
            if (secretApiKey && secretApiKey.trim() !== '') {
                this.apiKey = secretApiKey;
                await this.checkConnection();
            } else {
                // Aucune clé configurée
                this.statusManager.updateStatus({
                    providerId: 'anthropic',
                    providerName: 'Anthropic',
                    status: ProviderStatus.UNCONFIGURED,
                    lastChecked: new Date(),
                    suggestions: [
                        'Configurez votre clé API Anthropic dans les paramètres',
                        'Obtenez une clé sur https://console.anthropic.com'
                    ]
                });
            }
        }

        this.isInitialized = true;
    }

    /**
     * Vérifier la connexion à l'API Anthropic
     */
    private async checkConnection(): Promise<void> {
        try {
            const testPrompt = 'Test de connexion';
            const startTime = Date.now();

            // Faire une petite requête de test
            await this.anthropicChat(testPrompt, false);
            const latency = Date.now() - startTime;

            this.statusManager.updateStatus({
                providerId: 'anthropic',
                providerName: 'Anthropic',
                status: ProviderStatus.CONNECTED,
                lastChecked: new Date(),
                lastLatency: latency
            });

        } catch (error) {
            // La gestion d'erreur se fait dans les méthodes de requête
        }
    }

    /**
     * Execute prompt using Anthropic
     * Exécuter un prompt avec Anthropic
     */
    async execute(prompt: string): Promise<AIResponse> {
        console.log(`[Anthropic] Starting execution for prompt: "${prompt.substring(0, 50)}..."`);

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.apiKey || this.apiKey.trim() === '') {
            console.error('[Anthropic] API key not configured');
            throw new Error('Anthropic API key not configured');
        }

        const startTime = Date.now();

        try {
            // Use real Anthropic API
            // Utiliser l'API Anthropic réelle
            const config = vscode.workspace.getConfiguration('aiAnalytics');
            const configuredModel = config.get('anthropicModel') as string;

            const apiResponse = await this.anthropicChat(prompt, false);
            const latency = Date.now() - startTime;

            // Extract real metrics from API response
            // Extraire les vraies métriques de la réponse API
            const inputTokens = apiResponse.usage?.input_tokens || this.calculateTokens(prompt);
            const outputTokens = apiResponse.usage?.output_tokens || this.calculateTokens(apiResponse.content);
            const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

            console.log(`[Anthropic] Execution completed in ${latency}ms, tokens: ${totalTokens} (in: ${inputTokens}, out: ${outputTokens})`);

            return {
                content: apiResponse.content,
                provider: 'anthropic',
                tokens: totalTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: apiResponse.model || configuredModel // Use model from API response or configured model
            };
        } catch (error) {
            console.error(`[Anthropic] Execution failed: ${error}`);
            if (error instanceof ProviderError) {
                throw error;
            }
            throw new Error(`Anthropic execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Execute prompt with streaming
     * Exécuter un prompt avec streaming
     */
    override async executeWithStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<AIResponse> {
        console.log(`[Anthropic] Starting streaming execution for prompt: "${prompt.substring(0, 50)}..."`);

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.apiKey || this.apiKey.trim() === '') {
            console.error('[Anthropic] API key not configured');
            throw new Error('Anthropic API key not configured');
        }

        const startTime = Date.now();

        try {
            const config = vscode.workspace.getConfiguration('aiAnalytics');
            const configuredModel = config.get('anthropicModel') as string;

            const apiResponse = await this.anthropicChat(prompt, true, streamingCallback);
            const latency = Date.now() - startTime;

            const inputTokens = apiResponse.usage?.input_tokens || this.calculateTokens(prompt);
            const outputTokens = apiResponse.usage?.output_tokens || this.calculateTokens(apiResponse.content);
            const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

            console.log(`[Anthropic] Streaming execution completed in ${latency}ms, tokens: ${totalTokens} (in: ${inputTokens}, out: ${outputTokens})`);

            return {
                content: apiResponse.content,
                provider: 'anthropic',
                tokens: totalTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: apiResponse.model || configuredModel
            };
        } catch (error) {
            console.error(`[Anthropic] Streaming execution failed: ${error}`);
            if (error instanceof ProviderError) {
                throw error;
            }
            throw new Error(`Anthropic streaming execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if Anthropic is available
     * Vérifier si Anthropic est disponible
     */
    async isAvailable(): Promise<boolean> {
        return this.apiKey !== undefined && this.apiKey.trim() !== '';
    }

    /**
     * Get provider name
     * Obtenir le nom du fournisseur
     */
    getProvider(): AIProvider {
        return 'anthropic';
    }

    /**
     * Set Anthropic API key
     * Définir la clé API Anthropic
     */
    async setApiKey(apiKey: string): Promise<void> {
        // Store in both extension configuration and SecretStorage
        // Stocker dans la configuration de l'extension et SecretStorage
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        await config.update('anthropicApiKey', apiKey, vscode.ConfigurationTarget.Global);

        // Also store in SecretStorage for backward compatibility
        // Stocker également dans SecretStorage pour la compatibilité descendante
        await this.storeApiKey('anthropic-api-key', apiKey);

        this.apiKey = apiKey;
    }

    /**
     * Chat with Anthropic using real API
     * Discuter avec Anthropic en utilisant l'API réelle
     */
    private async anthropicChat(prompt: string, stream = false, streamingCallback?: StreamingCallback): Promise<{ content: string; usage?: any; model?: string }> {
        const apiUrl = getChatUrl('anthropic');
        const systemPrompt = loadSystemPrompt();

        // Get configured model from settings
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configuredModel = config.get('anthropicModel') as string;

        if (!configuredModel || configuredModel.trim() === '') {
            // Si aucun modèle n'est configuré mais qu'une clé API existe, demander à configurer un modèle
            if (this.apiKey && this.apiKey.trim() !== '') {
                throw new Error('Anthropic model not configured - please select a model in settings');
            }
            // Si aucune clé API n'est configurée, le provider n'est pas disponible
            throw new Error('Anthropic API key not configured');
        }

        const requestBody = {
            model: configuredModel,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: stream
        };

        try {
            console.log(`[Anthropic] Sending request to API: ${apiUrl}`);

            if (stream && streamingCallback) {
                const response = await this.makeStreamingApiRequest(apiUrl, requestBody, streamingCallback);
                console.log(`[Anthropic] Streaming API response completed`);
                return response;
            } else {
                const response = await this.makeApiRequest(apiUrl, requestBody);
                console.log(`[Anthropic] API response received`);

                if (!response.content || !response.content[0] || !response.content[0].text) {
                    console.error('[Anthropic] Invalid API response format:', response);
                    throw new Error('Invalid response format from Anthropic API');
                }

                const content = response.content[0].text;

                if (!content) {
                    console.error('[Anthropic] Empty content in response:', response);
                    throw new Error('Empty response from Anthropic API');
                }

                return {
                    content,
                    usage: response.usage,
                    model: response.model
                };
            }

        } catch (error) {
            console.error('[Anthropic] API call failed:', error);

            // Fallback to placeholder if API is not available
            // Retour à l'implémentation placeholder si l'API n'est pas disponible
            if (error instanceof Error && error.message.includes('Network')) {
                console.log('[Anthropic] Network error, using fallback response');
                return this.getFallbackResponse(prompt);
            }

            throw error;
        }
    }

    /**
     * Make HTTP request using Node.js https module
     * Faire une requête HTTP avec le module https de Node.js
     */
    private async makeApiRequest(url: string, body: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const urlObj = new URL(url);
            const config = getProviderConfig('anthropic');

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
                    [config.headers.authHeader]: this.apiKey,
                    ...(config.headers.versionHeader && { [config.headers.versionHeader]: config.apiVersion }),
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: this.timeout
            };

            // Set up timeout
            const timeoutId = setTimeout(() => {
                req.destroy();
                const error = ProviderError.fromNetworkError(
                    'anthropic',
                    'Anthropic',
                    new Error(`Request timeout after ${this.timeout}ms - Anthropic API did not respond`)
                );
                this.handleApiError(error);
                reject(error);
            }, this.timeout);

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } catch (parseError) {
                            const error = new ProviderError(
                                'anthropic',
                                'Anthropic',
                                ProviderStatus.API_ERROR,
                                `Failed to parse API response: ${parseError}`
                            );
                            this.handleApiError(error);
                            reject(error);
                        }
                    } else {
                        const error = ProviderError.fromHttpError(
                            'anthropic',
                            'Anthropic',
                            res.statusCode || 0,
                            data
                        );
                        this.handleApiError(error);
                        reject(error);
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);
                const providerError = ProviderError.fromNetworkError(
                    'anthropic',
                    'Anthropic',
                    error
                );
                this.handleApiError(providerError);
                reject(providerError);
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${this.timeout}ms - Anthropic API did not respond`));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Make streaming HTTP request using Node.js https module
     * Faire une requête HTTP streaming avec le module https de Node.js
     */
    private async makeStreamingApiRequest(url: string, body: any, streamingCallback: StreamingCallback): Promise<{ content: string; usage?: any }> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const urlObj = new URL(url);
            const config = getProviderConfig('anthropic');

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
                    [config.headers.authHeader]: this.apiKey,
                    ...(config.headers.versionHeader && { [config.headers.versionHeader]: config.apiVersion }),
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: this.timeout
            };

            // Set up timeout
            const timeoutId = setTimeout(() => {
                req.destroy();
                reject(new Error(`Streaming request timeout after ${this.timeout}ms - Anthropic API did not respond`));
            }, this.timeout);

            let fullContent = '';
            let usage: any = null;

            const req = https.request(options, (res) => {
                let buffer = '';

                res.on('data', (chunk) => {
                    buffer += chunk;

                    // Process complete lines for streaming
                    // Traiter les lignes complètes pour le streaming
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        if (line.startsWith('data: ')) {
                            const dataStr = line.substring(6); // Remove 'data: ' prefix

                            if (dataStr === '[DONE]') {
                                // Streaming complete
                                // Streaming terminé
                                clearTimeout(timeoutId);
                                resolve({
                                    content: fullContent,
                                    usage
                                });
                                return;
                            }

                            try {
                                const data = JSON.parse(dataStr);

                                if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
                                    fullContent += data.delta.text;
                                    // Send only the delta content, not the accumulated content
                                    streamingCallback.onChunk(data.delta.text);
                                }

                                if (data.type === 'message_delta' && data.usage) {
                                    usage = data.usage;
                                }
                            } catch (parseError) {
                                console.warn('[Anthropic] Failed to parse streaming data:', parseError);
                            }
                        }
                    }
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        // If we didn't get [DONE], resolve with what we have
                        // Si nous n'avons pas reçu [DONE], résoudre avec ce que nous avons
                        resolve({
                            content: fullContent,
                            usage
                        });
                    } else {
                        const error = ProviderError.fromHttpError(
                            'anthropic',
                            'Anthropic',
                            res.statusCode || 0,
                            'Streaming request failed'
                        );
                        this.handleApiError(error);
                        reject(error);
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);
                const providerError = ProviderError.fromNetworkError(
                    'anthropic',
                    'Anthropic',
                    error
                );
                this.handleApiError(providerError);
                reject(providerError);
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);
                reject(new Error(`Streaming request timeout after ${this.timeout}ms - Anthropic API did not respond`));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Fallback response when API is not available
     * Réponse de secours quand l'API n'est pas disponible
     */
    private getFallbackResponse(prompt: string): { content: string; usage?: any } {
        const responses = [
            `Je suis Claude, votre assistant IA Anthropic. Pour votre question "${prompt}", je vous réponds : C'est une excellente question ! En tant qu'assistant IA, je peux vous aider avec une grande variété de sujets.`,
            `Merci pour votre message ! Concernant "${prompt}", voici ce que je peux vous dire : Je suis là pour vous assister dans vos besoins d'information et de résolution de problèmes.`,
            `Bonjour ! En réponse à "${prompt}", je vous informe que je suis Claude, un modèle de langage conçu pour vous aider avec précision et efficacité.`,
            `Je prends note de votre requête "${prompt}". En tant qu'assistant Claude, mon objectif est de vous fournir des réponses utiles et pertinentes.`
        ];

        const randomIndex = Math.floor(Math.random() * responses.length);
        const randomResponse = responses[randomIndex];
        if (!randomResponse) {
            return {
                content: `Réponse Anthropic à: ${prompt}`,
                usage: null
            };
        }
        return {
            content: randomResponse,
            usage: null
        };
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
}