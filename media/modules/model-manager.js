/**
 * Model Manager Module
 * Gère le chargement et la gestion des modèles depuis le fichier JSON
 */

class ModelManager {
    constructor() {
        this.models = null;
        this.loaded = false;
    }

    async loadModels() {
        if (this.loaded) {
            return this.models;
        }

        try {
            // Dans un environnement VS Code WebView, nous devons charger via message
            // Pour l'instant, nous allons utiliser les données en dur
            // Une implémentation complète nécessiterait une communication avec l'extension
            this.models = await this.getDefaultModels();
            this.loaded = true;
            return this.models;
        } catch (error) {
            console.error('Error loading models:', error);
            this.models = await this.getDefaultModels();
            this.loaded = true;
            return this.models;
        }
    }

    async getDefaultModels() {
        // Retourne les modèles par défaut en attendant l'intégration complète du fichier JSON
        return {
            providers: {
                openai: {
                    name: "OpenAI",
                    models: [
                        { value: "gpt-4o", label: "GPT-4o", description: "Latest multimodal model with vision capabilities" },
                        { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Efficient and cost-effective GPT-4o variant" },
                        { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Enhanced GPT-4 with improved performance" },
                        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Fast and cost-effective model for simple tasks" },
                        { value: "o1-preview", label: "o1 Preview", description: "Experimental reasoning model with enhanced capabilities" },
                        { value: "o1-mini", label: "o1 Mini", description: "Efficient reasoning model for everyday tasks" }
                    ]
                },
                anthropic: {
                    name: "Anthropic",
                    models: [
                        { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Latest Claude model with enhanced reasoning" },
                        { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Fast and efficient Claude model" },
                        { value: "claude-3-opus-20240229", label: "Claude 3 Opus", description: "Most capable Claude model for complex reasoning" },
                        { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet", description: "Balanced Claude model for general tasks" },
                        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku", description: "Fastest Claude model for simple tasks" }
                    ]
                },
                deepseek: {
                    name: "DeepSeek",
                    models: [
                        { value: "deepseek-chat", label: "DeepSeek Chat", description: "General purpose chat model" },
                        { value: "deepseek-coder", label: "DeepSeek Coder", description: "Specialized for coding tasks" },
                        { value: "deepseek-reasoner", label: "DeepSeek Reasoner", description: "Enhanced reasoning capabilities" }
                    ]
                },
                moonshot: {
                    name: "Moonshot AI",
                    models: [
                        { value: "moonshot-v1-8k", label: "Moonshot v1 8k", description: "Standard Moonshot model with 8k context" },
                        { value: "moonshot-v1-32k", label: "Moonshot v1 32k", description: "Extended context Moonshot model" },
                        { value: "moonshot-v1-128k", label: "Moonshot v1 128k", description: "Large context Moonshot model" },
                        { value: "moonshot-chat", label: "Moonshot Chat", description: "Optimized for conversational tasks" }
                    ]
                },
                ollama: {
                    name: "Ollama",
                    models: [] // Sera rempli dynamiquement
                }
            },
            defaultModels: {
                openai: "gpt-4o",
                anthropic: "claude-3-5-sonnet-20241022",
                deepseek: "deepseek-chat",
                moonshot: "moonshot-v1-8k",
                ollama: "llama3.1:8b"
            }
        };
    }

    async getProviderModels(provider) {
        await this.loadModels();
        return this.models.providers[provider]?.models || [];
    }

    async getDefaultModel(provider) {
        await this.loadModels();
        return this.models.defaultModels[provider] || '';
    }

    async getAllProviders() {
        await this.loadModels();
        return Object.keys(this.models.providers);
    }

    async updateOllamaModels(ollamaModels) {
        await this.loadModels();
        if (this.models.providers.ollama) {
            this.models.providers.ollama.models = ollamaModels.map(model => ({
                value: model.name,
                label: model.name,
                description: `Ollama model: ${model.name}`
            }));
        }
    }

    async detectOllamaModels() {
        try {
            // Envoie un message à l'extension pour détecter les modèles Ollama
            const vscode = window.acquireVsCodeApi?.();
            if (vscode) {
                vscode.postMessage({
                    type: 'detectOllamaModels'
                });
            }
        } catch (error) {
            console.error('Error detecting Ollama models:', error);
        }
    }

    async handleOllamaModelsDetected(models) {
        await this.updateOllamaModels(models);

        // Met à jour l'interface si Ollama est sélectionné
        const engineSelect = document.getElementById('engine-select');
        if (engineSelect && engineSelect.value === 'ollama') {
            const settingsManager = window.settingsManager;
            if (settingsManager) {
                await settingsManager.updateModelSuggestions('ollama');
            }
        }
    }
}

// Export as singleton
export default new ModelManager();