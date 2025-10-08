/**
 * Mockup Events Manager - Exact Version
 * Gère les événements de l'interface mockup exacte
 */

class MockupEventsManagerExact {
    constructor() {
        this.currentSession = 's1';
        this.modelsByProvider = {
            OpenAI: ['gpt-4o', 'gpt-4o-mini'],
            Anthropic: ['claude-3.5', 'claude-3-opus'],
            DeepSeek: ['coder', 'reasoner'],
            Moonshot: ['m1', 'm1-mini'],
            Ollama: ['llama3', 'mistral', 'phi3']
        };
    }

    /**
     * Initialize mockup events
     * Initialiser les événements mockup
     */
    initialize() {
        this.setupSessionTabs();
        this.setupProviderSelection();
        this.setupSendButton();
        this.setupTextarea();
        this.setupDragAndDrop();
    }

    /**
     * Setup session tabs
     * Configurer les onglets de session
     */
    setupSessionTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchToSession(tab.dataset.session);
            });
        });
    }

    /**
     * Setup provider selection
     * Configurer la sélection de fournisseur
     */
    setupProviderSelection() {
        const providerSelect = document.getElementById('provider');
        const modelSelect = document.getElementById('model');

        if (providerSelect && modelSelect) {
            providerSelect.addEventListener('change', () => {
                this.updateModels();
            });

            // Initialize models
            this.updateModels();
        }
    }

    /**
     * Update models based on selected provider
     * Mettre à jour les modèles selon le fournisseur sélectionné
     */
    updateModels() {
        const providerSelect = document.getElementById('provider');
        const modelSelect = document.getElementById('model');

        if (providerSelect && modelSelect) {
            const provider = providerSelect.value;
            const models = this.modelsByProvider[provider] || [];
            
            modelSelect.innerHTML = models.map(model => 
                `<option value="${model}">${model}</option>`
            ).join('');

            // Select first model by default
            if (models.length > 0) {
                modelSelect.value = models[0];
            }
        }
    }

    /**
     * Setup send button
     * Configurer le bouton d'envoi
     */
    setupSendButton() {
        const sendBtn = document.getElementById('send-btn');
        const textarea = document.getElementById('prompt-input');

        if (sendBtn && textarea) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });

            // Send on Ctrl+Enter
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    /**
     * Setup textarea
     * Configurer la zone de texte
     */
    setupTextarea() {
        const textarea = document.getElementById('prompt-input');

        if (textarea) {
            // Auto-resize textarea
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
            });

            // Focus on load
            textarea.focus();
        }
    }

    /**
     * Setup drag and drop for tabs
     * Configurer le drag & drop pour les onglets
     */
    setupDragAndDrop() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('dragstart', (e) => {
                tab.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', tab.outerHTML);
            });

            tab.addEventListener('dragend', () => {
                tab.classList.remove('dragging');
            });

            tab.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            tab.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedTab = document.querySelector('.tab.dragging');
                if (draggedTab && draggedTab !== tab) {
                    const parent = tab.parentNode;
                    const nextSibling = tab.nextSibling;
                    parent.insertBefore(draggedTab, nextSibling);
                }
            });
        });
    }

    /**
     * Switch to session
     * Basculer vers une session
     */
    switchToSession(sessionId) {
        this.currentSession = sessionId;

        // Update tab states
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-session="${sessionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Switch session in MockupMessageManager
        if (window.MockupMessageManager) {
            window.MockupMessageManager.switchToSession(sessionId);
        }
    }

    /**
     * Send message
     * Envoyer un message
     */
    sendMessage() {
        const textarea = document.getElementById('prompt-input');
        const providerSelect = document.getElementById('provider');
        const modelSelect = document.getElementById('model');

        if (!textarea || !textarea.value.trim()) {
            return;
        }

        const message = textarea.value.trim();
        const provider = providerSelect?.value || 'DeepSeek';
        const model = modelSelect?.value || 'coder';

        // Add user message
        if (window.MockupMessageManager) {
            window.MockupMessageManager.addUserMessage(message);
        }

        // Clear input
        textarea.value = '';
        textarea.style.height = 'auto';

        // Send to VS Code extension
        if (window.vscode) {
            window.vscode.postMessage({
                type: 'executePrompt',
                prompt: message,
                routingMode: 'auto',
                provider: provider,
                conversationContext: []
            });
        }
    }

    /**
     * Handle streaming chunk
     * Gérer un chunk de streaming
     */
    handleStreamingChunk(chunk) {
        if (window.MockupMessageManager) {
            if (!window.MockupMessageManager.streamingMessage) {
                window.MockupMessageManager.startAIResponse();
            }
            window.MockupMessageManager.addStreamingChunk(chunk);
        }
    }

    /**
     * Handle streaming complete
     * Gérer la fin du streaming
     */
    handleStreamingComplete() {
        if (window.MockupMessageManager) {
            window.MockupMessageManager.completeAIResponse();
        }
    }

    /**
     * Update metrics
     * Mettre à jour les métriques
     */
    updateMetrics(metrics) {
        const contextTokens = document.getElementById('context-tokens');
        const costInfo = document.getElementById('cost-info');
        const tokensInfo = document.getElementById('tokens-info');
        const latencyInfo = document.getElementById('latency-info');

        if (contextTokens) contextTokens.textContent = `${metrics.tokens || 0} tokens`;
        if (costInfo) costInfo.textContent = `$${metrics.cost || '0.00'}`;
        if (tokensInfo) tokensInfo.textContent = `${metrics.tokens || 0}`;
        if (latencyInfo) latencyInfo.textContent = `${metrics.latency || 0}s`;
    }
}

// Export as singleton
export default new MockupEventsManagerExact();