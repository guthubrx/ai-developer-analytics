/**
 * Model Checker - Version simplifiée
 * Vérificateur de modèles disponibles via les APIs des éditeurs
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { getModelsUrl, getProviderConfig } from './provider-config';

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
            return this.getDefaultModels();
        }
    }

    /**
     * Vérifier les modèles OpenAI
     */
    private async checkOpenAIModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('openaiApiKey');
        if (!apiKey) {            return this.getDefaultModels();
        }

        try {            const models = await this.fetchOpenAIModels(apiKey);            return models;
        } catch (error) {
            console.error('Error fetching OpenAI models from API:', error);            return this.getDefaultModels();
        }
    }

    /**
     * Récupérer les modèles OpenAI depuis l'API
     */
    private async fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = getModelsUrl('openai');
        const config = getProviderConfig('openai');        console.log('Headers:', {
            'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
            'Content-Type': 'application/json'
        });
        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            // Vérifier que les headers existent
            if (!config.headers) {
                throw new Error('Provider configuration missing headers');
            }

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    [config.headers.authHeader]: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {                req.destroy();
                reject(new Error('Request timeout - OpenAI models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);                            const models = this.parseOpenAIModels(response);                            resolve(models);
                        } catch (parseError) {
                            console.error('Failed to parse OpenAI response:', parseError);
                            reject(new Error(`Failed to parse OpenAI models response: ${parseError}`));
                        }
                    } else {
                        console.error('OpenAI API Error:', res.statusCode, data);
                        reject(new Error(`OpenAI models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);                console.error('Error type:', error.code);
                console.error('Error message:', error.message);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - OpenAI models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);                reject(new Error('Request timeout - OpenAI models API did not respond'));
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
            return this.getDefaultModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Utiliser les données de l'API directement
                models.push({
                    id: modelId,
                    name: modelId, // Utiliser l'ID comme nom
                    description: modelData.description || 'OpenAI model',
                    context: modelData.context_window || 4096, // Valeur par défaut si non fournie
                    maxTokens: modelData.max_tokens || 4096, // Valeur par défaut si non fournie
                    available: true
                });
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No OpenAI models found in API response, using defaults');
            return this.getDefaultModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }



    /**
     * Vérifier les modèles Anthropic
     */
    private async checkAnthropicModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('anthropicApiKey');
        if (!apiKey) {            return this.getDefaultModels();
        }

        try {            const models = await this.fetchAnthropicModels(apiKey);            return models;
        } catch (error) {
            console.error('Error fetching Anthropic models from API:', error);            return this.getDefaultModels();
        }
    }

    /**
     * Récupérer les modèles Anthropic depuis l'API
     */
    private async fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = getModelsUrl('anthropic');
        const config = getProviderConfig('anthropic');        console.log('Headers:', {
            'x-api-key': `${apiKey.substring(0, 10)}...`,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        });
        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            // Vérifier que les headers existent
            if (!config.headers) {
                throw new Error('Provider configuration missing headers');
            }

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    [config.headers.authHeader]: apiKey,
                    ...(config.headers.versionHeader && { [config.headers.versionHeader]: config.apiVersion }),
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {                req.destroy();
                reject(new Error('Request timeout - Anthropic models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);                            const models = this.parseAnthropicModels(response);                            resolve(models);
                        } catch (parseError) {
                            console.error('Failed to parse Anthropic response:', parseError);
                            reject(new Error(`Failed to parse Anthropic models response: ${parseError}`));
                        }
                    } else {
                        console.error('Anthropic API Error:', res.statusCode, data);
                        reject(new Error(`Anthropic models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);                console.error('Error type:', error.code);
                console.error('Error message:', error.message);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - Anthropic models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);                reject(new Error('Request timeout - Anthropic models API did not respond'));
            });

            req.end();
        });
    }

    /**
     * Parser la réponse des modèles Anthropic
     */
    private parseAnthropicModels(response: any): ModelInfo[] {
        if (!response.data || !Array.isArray(response.data)) {
            console.warn('Invalid Anthropic models response format:', response);
            return this.getDefaultModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                models.push({
                    id: modelId,
                    name: modelId, // Utiliser l'ID comme nom
                    description: modelData.description || 'Anthropic Claude model',
                    context: modelData.context_window || 100000, // Valeur par défaut si non fournie
                    maxTokens: modelData.max_tokens || 4096, // Valeur par défaut si non fournie
                    available: true
                });
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No Anthropic models found in API response, using defaults');
            return this.getDefaultModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }



    /**
     * Vérifier les modèles DeepSeek
     */
    private async checkDeepSeekModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('deepseekApiKey');
        if (!apiKey) {
            return this.getDefaultModels();
        }

        try {
            const models = await this.fetchDeepSeekModels(apiKey);
            return models;
        } catch (error) {
            console.error('❌ Error fetching DeepSeek models from API:', error);
            return this.getDefaultModels();
        }
    }

    /**
     * Récupérer les modèles DeepSeek depuis l'API
     */
    private async fetchDeepSeekModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = getModelsUrl('deepseek');
        const config = getProviderConfig('deepseek');        console.log('Headers:', {
            'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
            'Content-Type': 'application/json'
        });
        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            // Vérifier que les headers existent
            if (!config.headers) {
                throw new Error('Provider configuration missing headers');
            }

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    [config.headers.authHeader]: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {                req.destroy();
                reject(new Error('Request timeout - DeepSeek models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);                            const models = this.parseDeepSeekModels(response);                            resolve(models);
                        } catch (parseError) {
                            console.error('Failed to parse DeepSeek response:', parseError);
                            reject(new Error(`Failed to parse DeepSeek models response: ${parseError}`));
                        }
                    } else {
                        console.error('DeepSeek API Error:', res.statusCode, data);
                        reject(new Error(`DeepSeek models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);                console.error('Error type:', error.code);
                console.error('Error message:', error.message);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - DeepSeek models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);                reject(new Error('Request timeout - DeepSeek models API did not respond'));
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
            return this.getDefaultModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Utiliser les données de l'API directement
                models.push({
                    id: modelId,
                    name: modelId, // Utiliser l'ID comme nom
                    description: modelData.description || 'DeepSeek AI model',
                    context: modelData.context_window || 32768, // Valeur par défaut si non fournie
                    maxTokens: modelData.max_tokens || 4096, // Valeur par défaut si non fournie
                    available: true
                });
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No DeepSeek models found in API response, using defaults');
            return this.getDefaultModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }



    /**
     * Vérifier les modèles Moonshot
     */
    private async checkMoonshotModels(): Promise<ModelInfo[]> {
        const apiKey = await this.getApiKey('moonshotApiKey');
        if (!apiKey) {            return this.getDefaultModels();
        }

        try {            const models = await this.fetchMoonshotModels(apiKey);            return models;
        } catch (error) {
            console.error('Error fetching Moonshot models from API:', error);            return this.getDefaultModels();
        }
    }

    /**
     * Récupérer les modèles Moonshot depuis l'API
     */
    private async fetchMoonshotModels(apiKey: string): Promise<ModelInfo[]> {
        const apiUrl = getModelsUrl('moonshot');
        const config = getProviderConfig('moonshot');        console.log('Headers:', {
            'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
            'Content-Type': 'application/json'
        });
        return new Promise((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(apiUrl);

            // Vérifier que les headers existent
            if (!config.headers) {
                throw new Error('Provider configuration missing headers');
            }

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    [config.headers.authHeader]: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            };

            const timeoutId = setTimeout(() => {                req.destroy();
                reject(new Error('Request timeout - Moonshot models API did not respond'));
            }, 30000);

            const req = https.request(options, (res: any) => {
                let data = '';

                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });

                res.on('end', () => {
                    clearTimeout(timeoutId);                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const response = JSON.parse(data);                            const models = this.parseMoonshotModels(response);                            resolve(models);
                        } catch (parseError) {
                            console.error('Failed to parse Moonshot response:', parseError);
                            reject(new Error(`Failed to parse Moonshot models response: ${parseError}`));
                        }
                    } else {
                        console.error('Moonshot API Error:', res.statusCode, data);
                        reject(new Error(`Moonshot models API error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error: any) => {
                clearTimeout(timeoutId);                console.error('Error type:', error.code);
                console.error('Error message:', error.message);
                if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                    reject(new Error(`Connection timeout or reset - Moonshot models API may be unavailable: ${error.message}`));
                } else {
                    reject(new Error(`Network error: ${error.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                clearTimeout(timeoutId);                reject(new Error('Request timeout - Moonshot models API did not respond'));
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
            return this.getDefaultModels();
        }

        const models: ModelInfo[] = [];

        for (const modelData of response.data) {
            if (modelData.id && typeof modelData.id === 'string') {
                const modelId = modelData.id;

                // Utiliser les données de l'API directement
                models.push({
                    id: modelId,
                    name: modelId, // Utiliser l'ID comme nom
                    description: modelData.description || 'Moonshot AI model',
                    context: modelData.context_window || 8192, // Valeur par défaut si non fournie
                    maxTokens: modelData.max_tokens || 4096, // Valeur par défaut si non fournie
                    available: true
                });
            }
        }

        // Si aucun modèle n'est trouvé, retourner les modèles par défaut
        if (models.length === 0) {
            console.warn('No Moonshot models found in API response, using defaults');
            return this.getDefaultModels();
        }

        // Trier par nom
        models.sort((a, b) => a.name.localeCompare(b.name));

        return models;
    }



    /**
     * Vérifier les modèles Ollama (local)
     */
    private async checkOllamaModels(): Promise<ModelInfo[]> {
        // Pour l'instant, retourner une liste vide
        // L'implémentation complète nécessiterait une connexion HTTP locale
        return [];
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
     * Retourne une liste vide pour tous les providers
     */
    private getDefaultModels(): ModelInfo[] {
        return [];
    }

}