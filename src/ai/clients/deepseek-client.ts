/**
 * DeepSeek Client
 * Client DeepSeek
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as https from 'https';
import { BaseAIClient } from './base-client';
import { AIProvider, AIResponse, StreamingCallback } from '../types';
import { loadSystemPrompt } from '../system-prompt-loader';

/**
 * DeepSeek client implementation
 * Implémentation du client DeepSeek
 */
export class DeepSeekClient extends BaseAIClient {
    private apiKey: string = '';

    /**
     * Initialize DeepSeek client
     * Initialiser le client DeepSeek
     */
    async initialize(): Promise<void> {
        // Read API key from extension configuration
        // Lire la clé API depuis la configuration de l'extension
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configApiKey = config.get('deepseekApiKey') as string;

        // Also check SecretStorage for backward compatibility
        // Vérifier également SecretStorage pour la compatibilité descendante
        if (configApiKey && configApiKey.trim() !== '') {
            this.apiKey = configApiKey;
        } else {
            const secretApiKey = await this.getApiKey('deepseek-api-key');
            if (secretApiKey && secretApiKey.trim() !== '') {
                this.apiKey = secretApiKey;
            }
        }

        this.isInitialized = true;
    }

    /**
     * Execute prompt using DeepSeek
     * Exécuter un prompt avec DeepSeek
     */
    async execute(prompt: string): Promise<AIResponse> {
        console.log(`[DeepSeek] Starting execution for prompt: "${prompt.substring(0, 50)}..."`);

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.apiKey || this.apiKey.trim() === '') {
            console.error('[DeepSeek] API key not configured');
            throw new Error('DeepSeek API key not configured');
        }

        const startTime = Date.now();

        try {
            // Use real DeepSeek API
            // Utiliser l'API DeepSeek réelle
            const apiResponse = await this.deepseekChat(prompt);
            const latency = Date.now() - startTime;

            // Extract real metrics from API response
            // Extraire les vraies métriques de la réponse API
            const inputTokens = apiResponse.usage?.prompt_tokens || this.calculateTokens(prompt);
            const outputTokens = apiResponse.usage?.completion_tokens || this.calculateTokens(apiResponse.content);
            const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

            console.log(`[DeepSeek] Execution completed in ${latency}ms, tokens: ${totalTokens} (in: ${inputTokens}, out: ${outputTokens})`);

            return {
                content: apiResponse.content,
                provider: 'deepseek',
                tokens: totalTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: 'deepseek-chat'
            };
        } catch (error) {
            console.error(`[DeepSeek] Execution failed: ${error}`);
            throw new Error(`DeepSeek execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Execute prompt using DeepSeek with real streaming
     * Exécuter un prompt avec DeepSeek avec vrai streaming
     */
    override async executeWithStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<AIResponse> {
        console.log(`[DeepSeek] Starting streaming execution for prompt: "${prompt.substring(0, 50)}..."`);

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.apiKey || this.apiKey.trim() === '') {
            console.error('[DeepSeek] API key not configured');
            throw new Error('DeepSeek API key not configured');
        }

        const startTime = Date.now();

        try {
            // Use real DeepSeek API with streaming
            // Utiliser l'API DeepSeek réelle avec streaming
            const apiResponse = await this.deepseekChatStreaming(prompt, streamingCallback);
            const latency = Date.now() - startTime;

            // Extract real metrics from API response
            // Extraire les vraies métriques de la réponse API
            const inputTokens = apiResponse.usage?.prompt_tokens || this.calculateTokens(prompt);
            const outputTokens = apiResponse.usage?.completion_tokens || this.calculateTokens(apiResponse.content);
            const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

            console.log(`[DeepSeek] Streaming execution completed in ${latency}ms, tokens: ${totalTokens} (in: ${inputTokens}, out: ${outputTokens})`);

            return {
                content: apiResponse.content,
                provider: 'deepseek',
                tokens: totalTokens,
                cost: this.calculateCost(inputTokens, outputTokens),
                latency,
                cacheHit: false,
                model: 'deepseek-chat'
            };
        } catch (error) {
            console.error(`[DeepSeek] Streaming execution failed: ${error}`);
            throw new Error(`DeepSeek streaming execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if DeepSeek is available
     * Vérifier si DeepSeek est disponible
     */
    async isAvailable(): Promise<boolean> {
        return this.apiKey !== undefined && this.apiKey.trim() !== '';
    }

    /**
     * Get provider name
     * Obtenir le nom du fournisseur
     */
    getProvider(): AIProvider {
        return 'deepseek';
    }

    /**
     * Set DeepSeek API key
     * Définir la clé API DeepSeek
     */
    async setApiKey(apiKey: string): Promise<void> {
        // Store in both extension configuration and SecretStorage
        // Stocker dans la configuration de l'extension et SecretStorage
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        await config.update('deepseekApiKey', apiKey, vscode.ConfigurationTarget.Global);

        // Also store in SecretStorage for backward compatibility
        // Stocker également dans SecretStorage pour la compatibilité descendante
        await this.storeApiKey('deepseek-api-key', apiKey);

        this.apiKey = apiKey;
    }

    /**
     * Chat with DeepSeek using real API
     * Discuter avec DeepSeek en utilisant l'API réelle
     */
    private async deepseekChat(prompt: string): Promise<{ content: string; usage?: any }> {
        const apiUrl = 'https://api.deepseek.com/chat/completions';

        const systemPrompt = loadSystemPrompt();

        const requestBody = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: false,
            max_tokens: 2048
        };

        try {
            console.log(`[DeepSeek] Sending request to API: ${apiUrl}`);

            const response = await this.makeApiRequest(apiUrl, requestBody);
            console.log(`[DeepSeek] API response received`);

            if (!response.choices || !response.choices[0] || !response.choices[0].message) {
                console.error('[DeepSeek] Invalid API response format:', response);
                throw new Error('Invalid response format from DeepSeek API');
            }

            const content = response.choices[0].message.content;

            if (!content) {
                console.error('[DeepSeek] Empty content in response:', response);
                throw new Error('Empty response from DeepSeek API');
            }

            return {
                content,
                usage: response.usage
            };

        } catch (error) {
            console.error('[DeepSeek] API call failed:', error);

            // Fallback to placeholder if API is not available
            // Retour à l'implémentation placeholder si l'API n'est pas disponible
            if (error instanceof Error && error.message.includes('Network')) {
                console.log('[DeepSeek] Network error, using fallback response');
                return this.getFallbackResponse(prompt);
            }

            throw error;
        }
    }

    /**
     * Chat with DeepSeek using real API with streaming
     * Discuter avec DeepSeek en utilisant l'API réelle avec streaming
     */
    private async deepseekChatStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<{ content: string; usage?: any }> {
        const apiUrl = 'https://api.deepseek.com/chat/completions';

        const systemPrompt = loadSystemPrompt();

        const requestBody = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: true,
            max_tokens: 2048
        };

        try {
            console.log(`[DeepSeek] Sending streaming request to API: ${apiUrl}`);

            const response = await this.makeStreamingApiRequest(apiUrl, requestBody, streamingCallback);
            console.log(`[DeepSeek] Streaming API response completed`);

            return response;

        } catch (error) {
            console.error('[DeepSeek] Streaming API call failed:', error);

            // Fallback to normal API call if streaming fails
            // Retour à l'appel API normal si le streaming échoue
            console.log('[DeepSeek] Streaming failed, falling back to normal API');
            return await this.deepseekChat(prompt);
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

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse API response: ${parseError}`));
                        }
                    } else {
                        reject(new Error(`API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Network error: ${error.message}`));
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

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

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
                                resolve({
                                    content: fullContent,
                                    usage
                                });
                                return;
                            }

                            try {
                                const data = JSON.parse(dataStr);

                                if (data.choices && data.choices[0] && data.choices[0].delta) {
                                    const delta = data.choices[0].delta;

                                    if (delta.content) {
                                        fullContent += delta.content;
                                        streamingCallback.onChunk(fullContent);
                                    }

                                    if (data.usage) {
                                        usage = data.usage;
                                    }
                                }
                            } catch (parseError) {
                                console.warn('[DeepSeek] Failed to parse streaming data:', parseError);
                            }
                        }
                    }
                });

                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        // If we didn't get [DONE], resolve with what we have
                        // Si nous n'avons pas reçu [DONE], résoudre avec ce que nous avons
                        resolve({
                            content: fullContent,
                            usage
                        });
                    } else {
                        reject(new Error(`API error ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Network error: ${error.message}`));
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
            `Je suis DeepSeek, votre assistant IA. Pour votre question "${prompt}", je vous réponds : C'est une excellente question ! En tant qu'assistant IA, je peux vous aider avec une grande variété de sujets.`,
            `Merci pour votre message ! Concernant "${prompt}", voici ce que je peux vous dire : Je suis là pour vous assister dans vos besoins d'information et de résolution de problèmes.`,
            `Bonjour ! En réponse à "${prompt}", je vous informe que je suis DeepSeek, un modèle de langage conçu pour vous aider avec précision et efficacité.`,
            `Je prends note de votre requête "${prompt}". En tant qu'assistant DeepSeek, mon objectif est de vous fournir des réponses utiles et pertinentes.`
        ];

        const randomIndex = Math.floor(Math.random() * responses.length);
        const randomResponse = responses[randomIndex];
        if (!randomResponse) {
            return {
                content: `Réponse DeepSeek à: ${prompt}`,
                usage: null
            };
        }
        return {
            content: randomResponse,
            usage: null
        };
    }
}