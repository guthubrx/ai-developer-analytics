/**
 * API Model Checker Module
 * Module de vérification des modèles via les APIs des éditeurs
 */

class APIModelChecker {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Vérifier les modèles disponibles pour un fournisseur
     */
    async checkProviderModels(provider) {
        const cacheKey = `models_${provider}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const models = await this.fetchProviderModels(provider);
            this.cache.set(cacheKey, {
                data: models,
                timestamp: Date.now()
            });
            return models;
        } catch (error) {
            console.error(`Error checking models for ${provider}:`, error);
            return this.getDefaultModels(provider);
        }
    }

    /**
     * Récupérer les modèles depuis l'API du fournisseur
     */
    async fetchProviderModels(provider) {
        const vscode = window.acquireVsCodeApi?.();
        if (!vscode) {
            throw new Error('VS Code API not available');
        }

        return new Promise((resolve, reject) => {
            const messageId = Date.now().toString();
            
            const handleMessage = (event) => {
                const message = event.data;
                if (message.type === 'apiModelsResponse' && message.messageId === messageId) {
                    window.removeEventListener('message', handleMessage);
                    if (message.success) {
                        resolve(message.models);
                    } else {
                        reject(new Error(message.error || 'Failed to fetch models'));
                    }
                }
            };

            window.addEventListener('message', handleMessage);
            
            vscode.postMessage({
                type: 'checkProviderModels',
                provider: provider,
                messageId: messageId
            });

            // Timeout après 10 secondes
            setTimeout(() => {
                window.removeEventListener('message', handleMessage);
                reject(new Error('Timeout while fetching models'));
            }, 10000);
        });
    }

    /**
     * Modèles par défaut pour chaque fournisseur (utilisés uniquement en cas d'échec de l'API)
     */
    getDefaultModels(provider) {
        const defaultModels = {
            openai: [
                { value: 'gpt-4o', label: 'GPT-4o', description: 'Latest multimodal model with vision capabilities', context: 128000, maxTokens: 4096 },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Efficient and cost-effective GPT-4o variant', context: 128000, maxTokens: 16384 },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Enhanced GPT-4 with improved performance', context: 128000, maxTokens: 4096 },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective model for simple tasks', context: 16385, maxTokens: 4096 }
            ],
            anthropic: [
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Latest Claude model with enhanced reasoning', context: 200000, maxTokens: 8192 },
                { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Fast and efficient Claude model', context: 200000, maxTokens: 8192 },
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: 'Most capable Claude model for complex reasoning', context: 200000, maxTokens: 4096 },
                { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: 'Balanced Claude model for general tasks', context: 200000, maxTokens: 4096 },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Fastest Claude model for simple tasks', context: 200000, maxTokens: 4096 }
            ],
            deepseek: [
                { value: 'deepseek-chat', label: 'DeepSeek Chat', description: 'General purpose chat model', context: 32768, maxTokens: 4096 },
                { value: 'deepseek-coder', label: 'DeepSeek Coder', description: 'Specialized for coding tasks', context: 32768, maxTokens: 4096 }
            ],
            moonshot: [
                { value: 'moonshot-v1-8k', label: 'Moonshot v1 8k', description: 'Standard Moonshot model with 8k context', context: 8192, maxTokens: 4096 },
                { value: 'moonshot-v1-32k', label: 'Moonshot v1 32k', description: 'Extended context Moonshot model', context: 32768, maxTokens: 4096 },
                { value: 'moonshot-v1-128k', label: 'Moonshot v1 128k', description: 'Large context Moonshot model', context: 131072, maxTokens: 4096 },
                { value: 'moonshot-chat', label: 'Moonshot Chat', description: 'Optimized for conversational tasks', context: 8192, maxTokens: 4096 }
            ],
            ollama: []
        };

        return defaultModels[provider] || [];
    }

    /**
     * Mettre à jour la liste des modèles dans l'interface
     */
    async updateModelDropdown(provider) {
        const modelSelect = document.getElementById('model');
        if (!modelSelect) return;

        // Afficher un indicateur de chargement
        modelSelect.innerHTML = '<option value="">Chargement des modèles...</option>';
        modelSelect.disabled = true;

        try {
            const models = await this.checkProviderModels(provider);
            
            // Vider la liste
            modelSelect.innerHTML = '';
            
            if (models.length === 0) {
                modelSelect.innerHTML = '<option value="">Aucun modèle disponible</option>';
            } else {
                // Ajouter les modèles
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.value;
                    option.textContent = model.label;
                    option.title = model.description || '';
                    modelSelect.appendChild(option);
                });

                // Sélectionner le premier modèle par défaut
                if (models.length > 0) {
                    modelSelect.value = models[0].value;
                }
            }
        } catch (error) {
            console.error('Error updating model dropdown:', error);
            modelSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        } finally {
            modelSelect.disabled = false;
        }
    }

    /**
     * Vérifier tous les fournisseurs et mettre à jour l'interface
     */
    async refreshAllModels() {
        const providers = ['openai', 'anthropic', 'deepseek', 'moonshot', 'ollama'];
        
        for (const provider of providers) {
            try {
                await this.checkProviderModels(provider);
                console.log(`Models for ${provider} refreshed`);
            } catch (error) {
                console.error(`Failed to refresh models for ${provider}:`, error);
            }
        }
    }

    /**
     * Obtenir les informations détaillées d'un modèle
     */
    async getModelInfo(provider, modelId) {
        try {
            const models = await this.checkProviderModels(provider);
            return models.find(model => model.value === modelId);
        } catch (error) {
            console.error('Error getting model info:', error);
            return null;
        }
    }

    /**
     * Vider le cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Vider le cache pour un fournisseur spécifique
     */
    clearProviderCache(provider) {
        this.cache.delete(`models_${provider}`);
    }
}

// Export as singleton
export default new APIModelChecker();