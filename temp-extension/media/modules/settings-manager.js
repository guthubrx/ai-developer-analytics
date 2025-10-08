/**
 * Settings Manager Module
 * Gère la configuration et les paramètres de l'application
 */

import StateManager from './state-manager.js';
import ModelManager from './model-manager.js';

class SettingsManager {
    constructor() {
        this.stateManager = StateManager;
        this.modelManager = ModelManager;
    }

    loadSettings() {
        this.sendMessageToExtension({
            type: 'getSettings'
        });
    }

    saveMoonshotModel(modelName) {
        if (!modelName) return;
        this.sendMessageToExtension({
            type: 'updateSettings',
            settings: { moonshotDefaultModel: modelName }
        });
        window.moonshotDefaultModel = modelName;
    }


    async handleEngineChange(engineValue) {
        // Toggle model selection visibility based on provider
        const row = document.getElementById('model-selection-row');
        const modelSuggestions = document.getElementById('model-suggestions');

        if (row && modelSuggestions) {
            const showModelSelection = ['moonshot', 'openai', 'anthropic', 'deepseek', 'ollama'].includes(engineValue);
            row.style.display = showModelSelection ? 'flex' : 'none';

            if (showModelSelection) {
                await this.updateModelSuggestions(engineValue);

                // Load saved model for this provider
                const savedModel = this.getSavedModel(engineValue);
                if (savedModel) {
                    modelSuggestions.value = savedModel;
                }

                // Détecte automatiquement les modèles Ollama
                if (engineValue === 'ollama') {
                    await this.modelManager.detectOllamaModels();
                }
            }
        }
    }

    async updateModelSuggestions(provider) {
        const modelSuggestions = document.getElementById('model-suggestions');
        if (!modelSuggestions) return;

        // Clear existing suggestions
        modelSuggestions.innerHTML = '<option value="">Modèles</option>';

        // Provider-specific model suggestions
        const suggestions = await this.getProviderModels(provider);
        suggestions.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            modelSuggestions.appendChild(option);
        });

        // Add event listener for suggestions
        modelSuggestions.onchange = () => {
            if (modelSuggestions.value) {
                this.saveModel(provider, modelSuggestions.value);
            }
        };
    }

    async getProviderModels(provider) {
        try {
            return await this.modelManager.getProviderModels(provider);
        } catch (error) {
            console.error('Error getting provider models:', error);
            return [];
        }
    }

    getSavedModel(provider) {
        // Get saved model from settings or use default
        const settings = this.stateManager.getState('settings') || {};
        const modelKey = `${provider}DefaultModel`;
        return settings[modelKey] || this.getDefaultModel(provider);
    }

    getDefaultModel(provider) {
        const defaults = {
            moonshot: 'moonshot-v1-8k',
            openai: 'gpt-4o',
            anthropic: 'claude-3-5-sonnet-20241022',
            deepseek: 'deepseek-chat',
            ollama: 'llama3.1:8b'
        };
        return defaults[provider] || '';
    }

    saveModel(provider, modelName) {
        if (!modelName) return;
        const modelKey = `${provider}DefaultModel`;

        this.sendMessageToExtension({
            type: 'updateSettings',
            settings: { [modelKey]: modelName }
        });

        // Store for current session
        window[`${provider}DefaultModel`] = modelName;
    }

    persistMoonshotModelIfNeeded(selectedProvider) {
        // If Moonshot is selected and there's a model selected, save it
        if (selectedProvider === 'moonshot') {
            const modelSuggestions = document.getElementById('model-suggestions');
            if (modelSuggestions && modelSuggestions.value) {
                this.saveMoonshotModel(modelSuggestions.value);
            }
        }
    }

    updateSettingsUI(settings) {
        // Update UI based on settings
        console.log('Updating UI with settings:', settings);

        // Apply font family to entire interface
        const baseFontFamily = settings.commandBarFontFamily || 'var(--vscode-editor-font-family)';

        // Get individual font sizes with fallbacks
        const chatFontSize = settings.chatFontSize || settings.commandBarFontSize || 13;
        const aiResponseFontSize = settings.aiResponseFontSize || settings.chatFontSize || settings.commandBarFontSize || 13;
        const codeBlockFontSize = settings.codeBlockFontSize || 12;
        const inlineCodeFontSize = settings.inlineCodeFontSize || 12;
        const inputFontSize = settings.inputFontSize || 14;
        const dropdownFontSize = settings.dropdownFontSize || 11;
        const coachFontSize = settings.coachFontSize || settings.commandBarFontSize || 13;
        const metricsFontSize = settings.metricsFontSize || 9;

        // Apply to main container
        const commandBar = document.querySelector('.ai-command-bar');
        if (commandBar) {
            commandBar.style.fontFamily = baseFontFamily;
        }

        // Apply font family to all text elements
        const allTextElements = document.querySelectorAll('*');
        allTextElements.forEach(element => {
            if (getComputedStyle(element).fontFamily !== 'monospace') {
                element.style.fontFamily = baseFontFamily;
            }
        });

        // Apply specific font sizes to different zones

        // Chat messages (user and AI)
        const userMessages = document.querySelectorAll('.message.user .message-content');
        const aiMessages = document.querySelectorAll('.message.ai .message-content');

        userMessages.forEach(content => {
            content.style.fontSize = chatFontSize + 'px';
        });

        aiMessages.forEach(content => {
            content.style.fontSize = aiResponseFontSize + 'px';
        });

        // Code blocks and quoted text
        const codeBlocks = document.querySelectorAll('.code-block pre, .code-block code');
        codeBlocks.forEach(code => {
            code.style.fontSize = codeBlockFontSize + 'px';
        });

        // Inline code
        const inlineCodes = document.querySelectorAll('.inline-code');
        inlineCodes.forEach(code => {
            code.style.fontSize = inlineCodeFontSize + 'px';
        });

        // Input textarea
        const textarea = document.getElementById('prompt-input');
        if (textarea) {
            textarea.style.fontSize = inputFontSize + 'px';
        }

        // Dropdown menus
        const dropdowns = document.querySelectorAll('.compact-select');
        dropdowns.forEach(dropdown => {
            dropdown.style.fontSize = dropdownFontSize + 'px';
        });

        // Coaching section
        const coachingContent = document.querySelector('.coaching-content');
        if (coachingContent) {
            coachingContent.style.fontSize = coachFontSize + 'px';
        }

        // Metrics
        const metrics = document.querySelectorAll('.metric-value, .metric-label');
        metrics.forEach(metric => {
            metric.style.fontSize = metricsFontSize + 'px';
        });

        // Session tabs
        const sessionTabs = document.querySelectorAll('.session-tab');
        sessionTabs.forEach(tab => {
            tab.style.fontSize = dropdownFontSize + 'px';
        });

        // Update default selections
        if (settings.defaultEngine) {
            const engineSelect = document.getElementById('engine-select');
            if (engineSelect) {
                engineSelect.value = settings.defaultEngine;
            }
        }

        // If Moonshot default model is provided, store it for requests
        window.moonshotDefaultModel = settings.moonshotDefaultModel || 'moonshot-v1-8k';

        if (settings.defaultTaskType) {
            const taskSelect = document.getElementById('task-select');
            if (taskSelect) {
                taskSelect.value = settings.defaultTaskType;
            }
        }

        if (settings.defaultMode) {
            const modeSelect = document.getElementById('mode-select');
            if (modeSelect) {
                modeSelect.value = settings.defaultMode;
            }
        }

        // Apply accent color
        if (settings.accentColor) {
            const accentColor = settings.accentColor;
            document.documentElement.style.setProperty('--accent-color', accentColor);

            // Convert hex to RGB for rgba usage
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            };

            const rgb = hexToRgb(accentColor);
            if (rgb) {
                document.documentElement.style.setProperty('--accent-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }

            // Update send button and active states
            const sendBtn = document.getElementById('send-btn');
            if (sendBtn) {
                sendBtn.style.backgroundColor = accentColor;
            }

            const activeTabs = document.querySelectorAll('.session-tab.active');
            activeTabs.forEach(tab => {
                tab.style.borderBottomColor = accentColor;
            });
        }

        // Toggle metrics visibility
        const metricsSection = document.querySelector('.metrics-section');
        if (metricsSection) {
            metricsSection.style.display = settings.showMetrics ? 'flex' : 'none';
        }

        // Toggle coach visibility
        const coachSection = document.getElementById('coaching-section');
        if (coachSection) {
            coachSection.style.display = settings.coachEnabled ? 'block' : 'none';

            // Set initial collapse state
            if (settings.coachCollapsedByDefault && !coachSection.classList.contains('collapsed')) {
                coachSection.classList.add('collapsed');
            } else if (!settings.coachCollapsedByDefault && coachSection.classList.contains('collapsed')) {
                coachSection.classList.remove('collapsed');
            }
        }

        // Toggle session tabs
        const sessionTabsContainer = document.querySelector('.session-tabs-container');
        if (sessionTabsContainer) {
            sessionTabsContainer.style.display = settings.sessionTabsEnabled ? 'flex' : 'none';
        }

        // Toggle auto-expand textarea
        const textareaWrapper = document.querySelector('.text-input-wrapper');
        if (textareaWrapper && settings.autoExpandTextarea === false) {
            const textarea = document.getElementById('prompt-input');
            if (textarea) {
                textarea.style.resize = 'none';
                textarea.style.overflow = 'hidden';
            }
        }

        // Store settings for later use
        window.aiCommandBarSettings = settings;

        // Update state
        this.stateManager.updateSettings(settings);
    }

    formatCoachingAdvice(advice) {
        if (!advice) return '';

        // Split advice by common separators and add line breaks
        let formatted = advice
            // Replace common separators with line breaks
            .replace(/\s*[•⚡🔄📊💡]\s*/g, '\n• ')
            // Ensure proper spacing
            .replace(/\s+/g, ' ')
            // Add line breaks between sentences that start with different emojis
            .replace(/([^\n])([⚡🔄📊💡])/g, '$1\n$2')
            // Clean up multiple line breaks
            .replace(/\n\s*\n/g, '\n');

        // Convert line breaks to HTML breaks
        return this.escapeHtml(formatted).replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sendMessageToExtension(message) {
        const vscode = this.stateManager.getVSCode();
        vscode.postMessage(message);
    }
}

// Export as singleton
export default new SettingsManager();