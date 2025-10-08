/**
 * Model Checker - Version simplifiée
 * Vérificateur de modèles disponibles via les APIs des éditeurs
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';

/**
 * Interface pour les informations de modèle
 */
interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    context?: number;
    maxTokens?: number;
    available: boolean;
}

/**
 * Classe pour vérifier les modèles disponibles via les APIs
 */
export class ModelChecker {
    constructor() {
    }

    /**
     * Vérifier les modèles disponibles pour un fournisseur donné
     */
    async checkProviderModels(provider: string): Promise<ModelInfo[]> {
        try {
            switch (provider.toLowerCase()) {
                case 'openai':
                    return await this.checkOpenAIModels();
                case 'anthropic':
                    return await this.checkAnthropicModels();
                case 'deepseek':
                    return await this.checkDeepSeekModels();
                case 'moonshot':
                    return await this.checkMoonshotModels();
                case 'ollama':
                    return await this.checkOllamaModels();
                default:
                    console.warn(`Provider ${provider} not supported for model checking`);
                    return [];
            }
        } catch (error) {
            console.error(`Error checking models for ${provider}:`, error);
            return this.getDefaultModels(provider);
        }
    }

    /**
     * Vérifier les modèles OpenAI
     */
    private async checkOpenAIModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('openai-api-key');
        if (!apiKey) {
            console.log('No OpenAI API key found, returning default models');
            return this.getDefaultOpenAIModels();
        }

        try {
            console.log('Fetching OpenAI models from API...');
            const models = await this.fetchOpenAIModels(apiKey);
            console.log(`Retrieved ${models.length} OpenAI models from API`);
            return models;
        } catch (error) {
            console.error('Error fetching OpenAI models from API:', error);
            console.log('Falling back to default models');
            return this.getDefaultOpenAIModels();
        }
    }

    /**
     * Récupérer les modèles OpenAI depuis l'API
     */
    private async fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = 'https://api.openai.com/v1/models';

        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {
                req.destroy();
                reject(new Error('Request timeout - OpenAI models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);
                            const models = this.parseOpenAIModels(response);
                            resolve(models);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse OpenAI models response: ${parseError}`));
                        }
                    } else {
                        reject(new Error(`OpenAI models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - OpenAI models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);
                reject(new Error('Request timeout - OpenAI models API did not respond'));
            });

            req.end();
        });
    }

    /**
     * Parser la réponse des modèles OpenAI
     */
    private parseOpenAIModels(response: any): ModelInfo[] {
        if (!response.data || !Array.isArray(response.data)) {
            console.warn('Invalid OpenAI models response format:', response);
            return this.getDefaultOpenAIModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Filtrer les modèles pertinents (exclure les modèles obsolètes ou spéciaux)
                if (this.isRelevantOpenAIModel(modelId)) {
                    models.push({
                        id: modelId,
                        name: this.formatOpenAIModelName(modelId),
                        description: this.getOpenAIModelDescription(modelId),
                        context: this.getOpenAIModelContext(modelId),
                        maxTokens: this.getOpenAIModelMaxTokens(modelId),
                        available: true
                    });
                }
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No relevant OpenAI models found in API response, using defaults');
            return this.getDefaultOpenAIModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }

    /**
     * Vérifier si un modèle OpenAI est pertinent
     */
    private isRelevantOpenAIModel(modelId: string): boolean {
        // Inclure les modèles GPT-3.5, GPT-4, GPT-4o, exclure les modèles obsolètes
        const relevantPatterns = [
            /^gpt-3\.5-turbo/i,
            /^gpt-4/i,
            /^gpt-4o/i
        ];

        const excludedPatterns = [
            /-instruct$/i,
            /-base$/i,
            /-vision-preview$/i,
            /^davinci/i,
            /^curie/i,
            /^babbage/i,
            /^ada/i
        ];

        // Vérifier si le modèle correspond à un pattern pertinent
        const isRelevant = relevantPatterns.some(pattern => pattern.test(modelId));

        // Vérifier si le modèle n'est pas exclu
        const isExcluded = excludedPatterns.some(pattern => pattern.test(modelId));

        return isRelevant && !isExcluded;
    }

    /**
     * Formater le nom du modèle OpenAI
     */
    private formatOpenAIModelName(modelId: string): string {
        const nameMap: Record<string, string> = {
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-4': 'GPT-4',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo'
        };

        return nameMap[modelId] || modelId.replace(/gpt-/, 'GPT-').replace(/-/g, ' ');
    }

    /**
     * Obtenir la description du modèle OpenAI
     */
    private getOpenAIModelDescription(modelId: string): string {
        const descriptionMap: Record<string, string> = {
            'gpt-4o': 'Latest multimodal model with vision capabilities',
            'gpt-4o-mini': 'Efficient and cost-effective GPT-4o variant',
            'gpt-4-turbo': 'Enhanced GPT-4 with improved performance',
            'gpt-4': 'Standard GPT-4 model',
            'gpt-3.5-turbo': 'Fast and cost-effective model for simple tasks'
        };

        return descriptionMap[modelId] || 'OpenAI model';
    }

    /**
     * Obtenir le contexte du modèle OpenAI
     */
    private getOpenAIModelContext(modelId: string): number {
        const contextMap: Record<string, number> = {
            'gpt-4o': 128000,
            'gpt-4o-mini': 128000,
            'gpt-4-turbo': 128000,
            'gpt-4': 8192,
            'gpt-3.5-turbo': 16385
        };

        return contextMap[modelId] || 4096; // Valeur par défaut
    }

    /**
     * Obtenir les tokens maximum du modèle OpenAI
     */
    private getOpenAIModelMaxTokens(modelId: string): number {
        const maxTokensMap: Record<string, number> = {
            'gpt-4o': 4096,
            'gpt-4o-mini': 16384,
            'gpt-4-turbo': 4096,
            'gpt-4': 8192,
            'gpt-3.5-turbo': 4096
        };

        return maxTokensMap[modelId] || 4096; // Valeur par défaut
    }

    /**
     * Vérifier les modèles Anthropic
     */
    private async checkAnthropicModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('anthropic-api-key');
        if (!apiKey) {
            console.log('No Anthropic API key found, returning default models');
            return this.getDefaultAnthropicModels();
        }

        try {
            console.log('Fetching Anthropic models from API...');
            const models = await this.fetchAnthropicModels(apiKey);
            console.log(`Retrieved ${models.length} Anthropic models from API`);
            return models;
        } catch (error) {
            console.error('Error fetching Anthropic models from API:', error);
            console.log('Falling back to default models');
            return this.getDefaultAnthropicModels();
        }
    }

    /**
     * Récupérer les modèles Anthropic depuis l'API
     */
    private async fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = 'https://api.anthropic.com/v1/models';

        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {
                req.destroy();
                reject(new Error('Request timeout - Anthropic models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);
                            const models = this.parseAnthropicModels(response);
                            resolve(models);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse Anthropic models response: ${parseError}`));
                        }
                    } else {
                        reject(new Error(`Anthropic models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - Anthropic models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);
                reject(new Error('Request timeout - Anthropic models API did not respond'));
            });

            req.end();
        });
    }

    /**
     * Parser la réponse des modèles Anthropic
     */
    private parseAnthropicModels(response: any): ModelInfo[] {
        if (!response.models || !Array.isArray(response.models)) {
            console.warn('Invalid Anthropic models response format:', response);
            return this.getDefaultAnthropicModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.models) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Filtrer les modèles pertinents (Claude 3 et plus récents)
                if (this.isRelevantAnthropicModel(modelId)) {
                    models.push({
                        id: modelId,
                        name: this.formatAnthropicModelName(modelId),
                        description: this.getAnthropicModelDescription(modelId),
                        context: this.getAnthropicModelContext(modelId),
                        maxTokens: this.getAnthropicModelMaxTokens(modelId),
                        available: true
                    });
                }
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No relevant Anthropic models found in API response, using defaults');
            return this.getDefaultAnthropicModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }

    /**
     * Vérifier si un modèle Anthropic est pertinent
     */
    private isRelevantAnthropicModel(modelId: string): boolean {
        // Inclure les modèles Claude 3 et plus récents
        const relevantPatterns = [
            /^claude-3/i,
            /^claude-3\.5/i
        ];

        const excludedPatterns = [
            /-beta$/i,
            /-test$/i,
            /^claude-instant/i
        ];

        // Vérifier si le modèle correspond à un pattern pertinent
        const isRelevant = relevantPatterns.some(pattern => pattern.test(modelId));

        // Vérifier si le modèle n'est pas exclu
        const isExcluded = excludedPatterns.some(pattern => pattern.test(modelId));

        return isRelevant && !isExcluded;
    }

    /**
     * Formater le nom du modèle Anthropic
     */
    private formatAnthropicModelName(modelId: string): string {
        const nameMap: Record<string, string> = {
            'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
            'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
            'claude-3-opus-20240229': 'Claude 3 Opus',
            'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
            'claude-3-haiku-20240307': 'Claude 3 Haiku'
        };

        return nameMap[modelId] || modelId.replace(/claude-/, 'Claude ').replace(/-/g, ' ');
    }

    /**
     * Obtenir la description du modèle Anthropic
     */
    private getAnthropicModelDescription(modelId: string): string {
        const descriptionMap: Record<string, string> = {
            'claude-3-5-sonnet-20241022': 'Latest Claude model with enhanced reasoning',
            'claude-3-5-haiku-20241022': 'Fast and efficient Claude model',
            'claude-3-opus-20240229': 'Most capable Claude model for complex reasoning',
            'claude-3-sonnet-20240229': 'Balanced Claude model for general tasks',
            'claude-3-haiku-20240307': 'Fastest Claude model for simple tasks'
        };

        return descriptionMap[modelId] || 'Anthropic Claude model';
    }

    /**
     * Obtenir le contexte du modèle Anthropic
     */
    private getAnthropicModelContext(modelId: string): number {
        const contextMap: Record<string, number> = {
            'claude-3-5-sonnet-20241022': 200000,
            'claude-3-5-haiku-20241022': 200000,
            'claude-3-opus-20240229': 200000,
            'claude-3-sonnet-20240229': 200000,
            'claude-3-haiku-20240307': 200000
        };

        return contextMap[modelId] || 100000; // Valeur par défaut
    }

    /**
     * Obtenir les tokens maximum du modèle Anthropic
     */
    private getAnthropicModelMaxTokens(modelId: string): number {
        const maxTokensMap: Record<string, number> = {
            'claude-3-5-sonnet-20241022': 8192,
            'claude-3-5-haiku-20241022': 8192,
            'claude-3-opus-20240229': 4096,
            'claude-3-sonnet-20240229': 4096,
            'claude-3-haiku-20240307': 4096
        };

        return maxTokensMap[modelId] || 4096; // Valeur par défaut
    }

    /**
     * Vérifier les modèles DeepSeek
     */
    private async checkDeepSeekModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('deepseek-api-key');
        if (!apiKey) {
            console.log('No DeepSeek API key found, returning default models');
            return this.getDefaultDeepSeekModels();
        }

        try {
            console.log('Fetching DeepSeek models from API...');
            const models = await this.fetchDeepSeekModels(apiKey);
            console.log(`Retrieved ${models.length} DeepSeek models from API`);
            return models;
        } catch (error) {
            console.error('Error fetching DeepSeek models from API:', error);
            console.log('Falling back to default models');
            return this.getDefaultDeepSeekModels();
        }
    }

    /**
     * Récupérer les modèles DeepSeek depuis l'API
     */
    private async fetchDeepSeekModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = 'https://api.deepseek.com/v1/models';

        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {
                req.destroy();
                reject(new Error('Request timeout - DeepSeek models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);
                            const models = this.parseDeepSeekModels(response);
                            resolve(models);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse DeepSeek models response: ${parseError}`));
                        }
                    } else {
                        reject(new Error(`DeepSeek models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - DeepSeek models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);
                reject(new Error('Request timeout - DeepSeek models API did not respond'));
            });

            req.end();
        });
    }

    /**
     * Parser la réponse des modèles DeepSeek
     */
    private parseDeepSeekModels(response: any): ModelInfo[] {
        if (!response.data || !Array.isArray(response.data)) {
            console.warn('Invalid DeepSeek models response format:', response);
            return this.getDefaultDeepSeekModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Filtrer les modèles pertinents (exclure les modèles obsolètes ou spéciaux)
                if (this.isRelevantDeepSeekModel(modelId)) {
                    models.push({
                        id: modelId,
                        name: this.formatDeepSeekModelName(modelId),
                        description: this.getDeepSeekModelDescription(modelId),
                        context: this.getDeepSeekModelContext(modelId),
                        maxTokens: 4096, // Valeur par défaut
                        available: true
                    });
                }
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No relevant DeepSeek models found in API response, using defaults');
            return this.getDefaultDeepSeekModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }

    /**
     * Vérifier si un modèle DeepSeek est pertinent
     */
    private isRelevantDeepSeekModel(modelId: string): boolean {
        // Inclure les modèles de chat et de code, exclure les modèles obsolètes
        const relevantPatterns = [
            /^deepseek-chat/i,
            /^deepseek-coder/i,
            /^deepseek-reasoner/i,
            /^deepseek-v2/i
        ];

        const excludedPatterns = [
            /-lora$/i,
            /-instruct$/i,
            /-base$/i
        ];

        // Vérifier si le modèle correspond à un pattern pertinent
        const isRelevant = relevantPatterns.some(pattern => pattern.test(modelId));

        // Vérifier si le modèle n'est pas exclu
        const isExcluded = excludedPatterns.some(pattern => pattern.test(modelId));

        return isRelevant && !isExcluded;
    }

    /**
     * Formater le nom du modèle DeepSeek
     */
    private formatDeepSeekModelName(modelId: string): string {
        const nameMap: Record<string, string> = {
            'deepseek-chat': 'DeepSeek Chat',
            'deepseek-coder': 'DeepSeek Coder',
            'deepseek-reasoner': 'DeepSeek Reasoner',
            'deepseek-v2': 'DeepSeek V2',
            'deepseek-v2-chat': 'DeepSeek V2 Chat',
            'deepseek-v2-coder': 'DeepSeek V2 Coder'
        };

        return nameMap[modelId] || modelId.replace(/deepseek-/, 'DeepSeek ').replace(/-/g, ' ');
    }

    /**
     * Obtenir la description du modèle DeepSeek
     */
    private getDeepSeekModelDescription(modelId: string): string {
        const descriptionMap: Record<string, string> = {
            'deepseek-chat': 'General purpose chat model',
            'deepseek-coder': 'Specialized for coding tasks',
            'deepseek-reasoner': 'Enhanced reasoning capabilities',
            'deepseek-v2': 'Latest DeepSeek model version',
            'deepseek-v2-chat': 'Latest general purpose chat model',
            'deepseek-v2-coder': 'Latest coding specialized model'
        };

        return descriptionMap[modelId] || 'DeepSeek AI model';
    }

    /**
     * Obtenir le contexte du modèle DeepSeek
     */
    private getDeepSeekModelContext(modelId: string): number {
        const contextMap: Record<string, number> = {
            'deepseek-chat': 32768,
            'deepseek-coder': 32768,
            'deepseek-reasoner': 32768,
            'deepseek-v2': 131072,
            'deepseek-v2-chat': 131072,
            'deepseek-v2-coder': 131072
        };

        return contextMap[modelId] || 32768; // Valeur par défaut
    }

    /**
     * Vérifier les modèles Moonshot
     */
    private async checkMoonshotModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('moonshot-api-key');
        if (!apiKey) {
            console.log('No Moonshot API key found, returning default models');
            return this.getDefaultMoonshotModels();
        }

        try {
            console.log('Fetching Moonshot models from API...');
            const models = await this.fetchMoonshotModels(apiKey);
            console.log(`Retrieved ${models.length} Moonshot models from API`);
            return models;
        } catch (error) {
            console.error('Error fetching Moonshot models from API:', error);
            console.log('Falling back to default models');
            return this.getDefaultMoonshotModels();
        }
    }

    /**
     * Récupérer les modèles Moonshot depuis l'API
     */
    private async fetchMoonshotModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = 'https://api.moonshot.cn/v1/models';

        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {
                req.destroy();
                reject(new Error('Request timeout - Moonshot models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);
                            const models = this.parseMoonshotModels(response);
                            resolve(models);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse Moonshot models response: ${parseError}`));
                        }
                    } else {
                        reject(new Error(`Moonshot models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - Moonshot models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);
                reject(new Error('Request timeout - Moonshot models API did not respond'));
            });

            req.end();
        });
    }

    /**
     * Parser la réponse des modèles Moonshot
     */
    private parseMoonshotModels(response: any): ModelInfo[] {
        if (!response.data || !Array.isArray(response.data)) {
            console.warn('Invalid Moonshot models response format:', response);
            return this.getDefaultMoonshotModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Filtrer les modèles pertinents (Moonshot v1)
                if (this.isRelevantMoonshotModel(modelId)) {
                    models.push({
                        id: modelId,
                        name: this.formatMoonshotModelName(modelId),
                        description: this.getMoonshotModelDescription(modelId),
                        context: this.getMoonshotModelContext(modelId),
                        maxTokens: 4096, // Valeur par défaut
                        available: true
                    });
                }
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No relevant Moonshot models found in API response, using defaults');
            return this.getDefaultMoonshotModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }

    /**
     * Vérifier si un modèle Moonshot est pertinent
     */
    private isRelevantMoonshotModel(modelId: string): boolean {
        // Inclure les modèles Moonshot v1
        const relevantPatterns = [
            /^moonshot-v1/i,
            /^moonshot-chat/i
        ];

        const excludedPatterns = [
            /-beta$/i,
            /-test$/i
        ];

        // Vérifier si le modèle correspond à un pattern pertinent
        const isRelevant = relevantPatterns.some(pattern => pattern.test(modelId));

        // Vérifier si le modèle n'est pas exclu
        const isExcluded = excludedPatterns.some(pattern => pattern.test(modelId));

        return isRelevant && !isExcluded;
    }

    /**
     * Formater le nom du modèle Moonshot
     */
    private formatMoonshotModelName(modelId: string): string {
        const nameMap: Record<string, string> = {
            'moonshot-v1-8k': 'Moonshot v1 8k',
            'moonshot-v1-32k': 'Moonshot v1 32k',
            'moonshot-v1-128k': 'Moonshot v1 128k',
            'moonshot-chat': 'Moonshot Chat'
        };

        return nameMap[modelId] || modelId.replace(/moonshot-/, 'Moonshot ').replace(/-/g, ' ');
    }

    /**
     * Obtenir la description du modèle Moonshot
     */
    private getMoonshotModelDescription(modelId: string): string {
        const descriptionMap: Record<string, string> = {
            'moonshot-v1-8k': 'Standard Moonshot model with 8k context',
            'moonshot-v1-32k': 'Extended context Moonshot model',
            'moonshot-v1-128k': 'Large context Moonshot model',
            'moonshot-chat': 'Optimized for conversational tasks'
        };

        return descriptionMap[modelId] || 'Moonshot AI model';
    }

    /**
     * Obtenir le contexte du modèle Moonshot
     */
    private getMoonshotModelContext(modelId: string): number {
        const contextMap: Record<string, number> = {
            'moonshot-v1-8k': 8192,
            'moonshot-v1-32k': 32768,
            'moonshot-v1-128k': 131072,
            'moonshot-chat': 8192
        };

        return contextMap[modelId] || 8192; // Valeur par défaut
    }

    /**
     * Vérifier les modèles Ollama (local)
     */
    private async checkOllamaModels(): Promise<ModelInfo[]> {
        try {
            // Pour l'instant, retourner une liste vide
            // L'implémentation complète nécessiterait une connexion HTTP locale
            return [];
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            return [];
        }
    }

    /**
     * Obtenir la clé API pour un fournisseur
     */
    private async getApiKey(keyName: string): Promise<string | undefined> {
        // Use context to access configuration
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        return config.get<string>(keyName);
    }

    /**
     * Modèles par défaut pour chaque fournisseur
     */
    private getDefaultModels(provider: string): ModelInfo[] {
        switch (provider.toLowerCase()) {
            case 'openai':
                return this.getDefaultOpenAIModels();
            case 'anthropic':
                return this.getDefaultAnthropicModels();
            case 'deepseek':
                return this.getDefaultDeepSeekModels();
            case 'moonshot':
                return this.getDefaultMoonshotModels();
            case 'ollama':
                return [];
            default:
                return [];
        }
    }

    /**
     * Modèles par défaut OpenAI
     */
    private getDefaultOpenAIModels(): ModelInfo[] {
        return [
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest multimodal model', context: 128000, maxTokens: 4096, available: true },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Efficient GPT-4o variant', context: 128000, maxTokens: 16384, available: true },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Enhanced GPT-4', context: 128000, maxTokens: 4096, available: true },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective', context: 16385, maxTokens: 4096, available: true }
        ];
    }

    /**
     * Modèles par défaut Anthropic
     */
    private getDefaultAnthropicModels(): ModelInfo[] {
        return [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Latest Claude model', context: 200000, maxTokens: 8192, available: true },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast Claude model', context: 200000, maxTokens: 8192, available: true },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable Claude', context: 200000, maxTokens: 4096, available: true }
        ];
    }

    /**
     * Modèles par défaut DeepSeek
     */
    private getDefaultDeepSeekModels(): ModelInfo[] {
        return [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General purpose', context: 32768, maxTokens: 4096, available: true },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Coding specialized', context: 32768, maxTokens: 4096, available: true }
        ];
    }

    /**
     * Modèles par défaut Moonshot
     */
    private getDefaultMoonshotModels(): ModelInfo[] {
        return [
            { id: 'moonshot-v1-8k', name: 'Moonshot v1 8k', description: '8k context', context: 8192, maxTokens: 4096, available: true },
            { id: 'moonshot-v1-32k', name: 'Moonshot v1 32k', description: '32k context', context: 32768, maxTokens: 4096, available: true },
            { id: 'moonshot-v1-128k', name: 'Moonshot v1 128k', description: '128k context', context: 131072, maxTokens: 4096, available: true }
        ];
    }
}