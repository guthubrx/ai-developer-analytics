// Main JavaScript for AI Command Bar - WhatsApp Style
// Version refactorée avec architecture modulaire

import StateManager from './modules/state-manager.js';
import EventManager from './modules/event-manager.js';
import MessageManager from './modules/message-manager.js';
import SettingsManager from './modules/settings-manager.js';
import FileAutocompleteManager from './modules/file-autocomplete-manager.js';
import MockupMessageManager from './modules/mockup-message-manager.js';
import MockupEventsManagerExact from './modules/mockup-events-exact.js';
import APIModelChecker from './modules/api-model-checker.js';

(function() {
    // Initialize all managers
    const stateManager = StateManager;
    const eventManager = EventManager;
    const messageManager = MessageManager;
    const settingsManager = SettingsManager;
    const fileAutocompleteManager = FileAutocompleteManager;
    const mockupMessageManager = MockupMessageManager;
    const mockupEventsManagerExact = MockupEventsManagerExact;
    const apiModelChecker = APIModelChecker;

    // Initialize application
    document.addEventListener('DOMContentLoaded', () => {
        initializeDOMElements();
        initializeEventListeners();
        initializeAutoExpandTextarea();
        initializeApplication();
        
        // Initialize mockup interface if elements exist
        if (document.querySelector('.chat-bar')) {
            console.log('Initializing mockup interface...');
            mockupEventsManagerExact.initialize();
            
            // Make managers available globally
            window.MockupMessageManager = mockupMessageManager;
            window.MockupEventsManagerExact = mockupEventsManagerExact;
        }
    });

    function initializeDOMElements() {
        console.log('Initializing DOM elements...');

        // Define all DOM elements
        const elements = {
            promptInput: document.getElementById('prompt-input'),
            sendBtn: document.getElementById('send-btn'),
            fileAttachBtn: document.getElementById('file-attach-btn'),
            imageAttachBtn: document.getElementById('image-attach-btn'),
            fileAutocomplete: document.getElementById('file-autocomplete'),
            fileSearch: document.getElementById('file-search'),
            fileResults: document.getElementById('file-results'),
            conversationContent: document.getElementById('conversation-content'),
            conversationContainer: document.getElementById('conversation-container'),
            coachingSection: document.getElementById('coaching-section'),
            coachingContent: document.getElementById('coaching-content'),
            coachCollapseBtn: document.getElementById('coach-collapse-btn'),
            sessionTabs: document.getElementById('session-tabs'),
            newSessionBtn: document.getElementById('new-session-btn')
        };

        // Store all elements in state manager
        Object.entries(elements).forEach(([name, element]) => {
            stateManager.setDomElement(name, element);
        });

        console.log('DOM elements initialized:');
        console.log('- promptInput:', elements.promptInput);
        console.log('- sendBtn:', elements.sendBtn);
        console.log('- fileAutocomplete:', elements.fileAutocomplete);
        console.log('- fileSearch:', elements.fileSearch);
        console.log('- fileResults:', elements.fileResults);
        console.log('- fileAttachBtn:', elements.fileAttachBtn);
    }

    function initializeEventListeners() {
        eventManager.initializeEventListeners();
        
        // New session button
        const newSessionBtn = stateManager.getDomElement('newSessionBtn');
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', createNewSession);
        }
        
        // Mode selection handler
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', handleModeChange);
        }
        
        // Provider selection handler
        const providerSelect = document.getElementById('provider');
        if (providerSelect) {
            providerSelect.addEventListener('change', handleProviderChange);
        }
        
        // Save config button handler
        const saveConfigBtn = document.getElementById('save-config-btn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', handleSaveConfig);
        }
    }

    function initializeAutoExpandTextarea() {
        const promptInput = stateManager.getDomElement('promptInput');
        if (!promptInput) return;

        // Auto-expand textarea based on content
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });

        // Initialize height
        promptInput.style.height = '40px';
    }

    function initializeApplication() {
        settingsManager.loadSettings();
        loadMetricsFromStorage();
        createInitialSession();
        
        // Load saved configuration
        loadSavedConfig();
        
        // Initialize models for the default provider
        const providerSelect = document.getElementById('provider');
        if (providerSelect) {
            const defaultProvider = providerSelect.value.toLowerCase();
            apiModelChecker.updateModelDropdown(defaultProvider);
        }
    }

    function createInitialSession() {
        const sessions = stateManager.getState('sessions');
        if (!sessions || sessions.length === 0) {
            const session = stateManager.createSession();
            messageManager.createSessionTab(session);
            messageManager.switchToSession(session.id);
        }
    }

    function loadMetricsFromStorage() {
        const vscode = stateManager.getVSCode();
        vscode.postMessage({
            type: 'loadMetrics'
        });
    }

    // Global functions that need to be accessible from HTML
    window.copyCodeToClipboard = function(button) {
        const codeBlock = button.closest('.code-block');
        const codeElement = codeBlock.querySelector('code');
        const codeText = codeElement.textContent;

        navigator.clipboard.writeText(codeText).then(() => {
            // Show copied feedback
            const originalTitle = button.title;
            button.title = 'Copied!';
            button.style.color = '#4CAF50';

            setTimeout(() => {
                button.title = originalTitle;
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    };

    window.postCodeAction = function(button, action, file) {
        const codeBlock = button.closest('.code-block');
        const codeElement = codeBlock.querySelector('code');
        const header = codeBlock.querySelector('.code-filename');
        const languageClass = (codeElement && codeElement.className) || '';
        const languageMatch = languageClass.match(/language-([\w-]+)/);
        const language = languageMatch ? languageMatch[1] : 'text';
        const contentText = codeElement ? codeElement.textContent : '';
        const isDiff = language === 'diff' || /^\s*[+-]/m.test(contentText);

        const vscode = stateManager.getVSCode();
        vscode.postMessage({
            type: 'codeAction',
            action,
            file,
            content: contentText,
            language,
            isDiff
        });
    };

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.type) {
            case 'executionStarted':
                // Show loading state
                const sendBtn = stateManager.getDomElement('sendBtn');
                if (sendBtn) {
                    sendBtn.disabled = true;
                }
                break;

            case 'streamingStarted':
                // Stop thinking animation and start streaming
                messageManager.stopThinkingAnimation();
                messageManager.startStreamingResponse();
                break;

            case 'streamingChunk':
                // Update streaming response with new content
                messageManager.updateStreamingResponse(message.content, message.provider);
                
                // Handle streaming chunks for mockup interface
                if (window.MockupEventsManagerExact) {
                    window.MockupEventsManagerExact.handleStreamingChunk(message.content);
                }
                break;

            case 'executionCompleted':
                // Stop streaming and finalize the response
                messageManager.stopStreamingResponse();

                // Add final AI response to conversation with provider and model
                const modelName = message.model || message.provider;
                messageManager.addAIMessage(message.response, message.provider, modelName);

                // Update metrics
                updateMetrics({
                    cost: message.cost,
                    tokens: message.tokens,
                    latency: message.latency,
                    model: modelName,
                    cacheHit: message.cacheHit
                });

                // Handle completion for mockup interface
                if (window.MockupEventsManagerExact) {
                    window.MockupEventsManagerExact.handleStreamingComplete();
                    window.MockupEventsManagerExact.updateMetrics({
                        cost: message.cost,
                        tokens: message.tokens,
                        latency: message.latency
                    });
                }

                // Re-enable send button
                const sendBtn2 = stateManager.getDomElement('sendBtn');
                if (sendBtn2) {
                    sendBtn2.disabled = false;
                }
                break;

            case 'executionError':
                // Stop thinking animation
                messageManager.stopThinkingAnimation();

                // Add error message to conversation
                messageManager.addAIMessage(`Error: ${message.error}`, 'error');

                // Re-enable send button
                const sendBtnError = stateManager.getDomElement('sendBtn');
                if (sendBtnError) {
                    sendBtnError.disabled = false;
                }
                break;

            case 'coachingAdvice':
                const coachingSection = stateManager.getDomElement('coachingSection');
                const coachingContent = stateManager.getDomElement('coachingContent');
                if (coachingSection && coachingContent) {
                    coachingSection.classList.remove('collapsed');
                    coachingContent.innerHTML = settingsManager.formatCoachingAdvice(message.advice);
                }
                break;

            case 'settingsUpdated':
                settingsManager.updateSettingsUI(message.settings);
                break;

            case 'projectFiles':
                fileAutocompleteManager.displayFileResults(message.files);
                break;

            case 'fileSearchResults':
                fileAutocompleteManager.displayFileResults(message.files);
                break;

            case 'metricsLoaded':
                if (message.metrics) {
                    const sessionMetrics = stateManager.getState('sessionMetrics');
                    const updatedMetrics = { ...sessionMetrics, ...message.metrics };
                    stateManager.setState('sessionMetrics', updatedMetrics);

                    // Update UI with loaded metrics
                    updateMetricsDisplay(updatedMetrics);
                }
                break;

            case 'updateSelectedModel':
                // Update the selected model in the UI
                const modelSelect = document.getElementById('model-suggestions');
                if (modelSelect) {
                    // Clear existing options
                    modelSelect.innerHTML = '';

                    // Add the selected model as an option
                    const option = document.createElement('option');
                    option.value = message.model;
                    option.textContent = message.model;
                    option.selected = true;
                    modelSelect.appendChild(option);
                }
                break;

        }
    });

    function updateMetrics(metrics) {
        // Update session metrics
        stateManager.updateMetrics(metrics);

        // Update UI with session-wide metrics
        const sessionMetrics = stateManager.getState('sessionMetrics');
        updateMetricsDisplay(sessionMetrics);

        // Save metrics to persistent storage
        saveMetricsToStorage();
    }

    function updateMetricsDisplay(metrics) {
        const costInfo = document.getElementById('cost-info');
        const tokensInfo = document.getElementById('tokens-info');
        const latencyInfo = document.getElementById('latency-info');
        const cacheInfo = document.getElementById('cache-info');

        if (costInfo) costInfo.textContent = `$${metrics.totalCost.toFixed(6)}`;
        if (tokensInfo) tokensInfo.textContent = metrics.totalTokens;
        if (latencyInfo) latencyInfo.textContent = `${(metrics.latestLatency / 1000).toFixed(2)}s`;

        const cacheHitRate = metrics.totalRequests > 0
            ? (metrics.cacheHits / metrics.totalRequests) * 100
            : 0;
        if (cacheInfo) cacheInfo.textContent = `${cacheHitRate.toFixed(0)}%`;
    }

    function saveMetricsToStorage() {
        const vscode = stateManager.getVSCode();
        const sessionMetrics = stateManager.getState('sessionMetrics');

        vscode.postMessage({
            type: 'saveMetrics',
            metrics: sessionMetrics
        });
    }

    function createNewSession() {
        const sessions = stateManager.getState('sessions') || [];
        const sessionCounter = sessions.length + 1;
        const sessionId = 'session-' + Date.now();
        const sessionName = `Session ${sessionCounter}`;
        
        const newSession = {
            id: sessionId,
            name: sessionName,
            messages: [],
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Deactivate current sessions
        sessions.forEach(session => {
            session.isActive = false;
        });
        
        // Add new session
        sessions.push(newSession);
        
        // Update state
        stateManager.setState('sessions', sessions);
        stateManager.setState('currentSessionId', sessionId);
        
        // Create session tab
        messageManager.createSessionTab(newSession);
        
        // Clear conversation content
        const conversationContent = stateManager.getDomElement('conversationContent');
        if (conversationContent) {
            conversationContent.innerHTML = '';
        }
        
        console.log('New session created:', sessionName);
    }

    function handleModeChange() {
        const modeSelect = document.getElementById('mode-select');
        const manualModeDropdowns = document.getElementById('manual-mode-dropdowns');
        const autoModeDropdowns = document.getElementById('auto-mode-dropdowns');
        
        if (!modeSelect || !manualModeDropdowns || !autoModeDropdowns) return;
        
        const selectedMode = modeSelect.value;
        
        if (selectedMode === 'manual') {
            // Afficher les dropdowns Manual Mode
            manualModeDropdowns.style.display = 'flex';
            manualModeDropdowns.classList.remove('hidden');
            
            // Masquer les dropdowns Auto Mode
            autoModeDropdowns.style.display = 'none';
            autoModeDropdowns.classList.add('hidden');
            
            console.log('Mode switched to Manual');
        } else if (selectedMode === 'auto') {
            // Masquer les dropdowns Manual Mode
            manualModeDropdowns.style.display = 'none';
            manualModeDropdowns.classList.add('hidden');
            
            // Afficher les dropdowns Auto Mode
            autoModeDropdowns.style.display = 'flex';
            autoModeDropdowns.classList.remove('hidden');
            
            console.log('Mode switched to Auto');
        }
    }

    function handleProviderChange() {
        const providerSelect = document.getElementById('provider');
        if (!providerSelect) return;
        
        const selectedProvider = providerSelect.value.toLowerCase();
        console.log('Provider changed to:', selectedProvider);
        
        // Mettre à jour la liste des modèles via l'API
        apiModelChecker.updateModelDropdown(selectedProvider);
    }

    function handleSaveConfig() {
        const modeSelect = document.getElementById('mode-select');
        const saveBtn = document.getElementById('save-config-btn');
        
        if (!modeSelect || !saveBtn) return;
        
        const currentMode = modeSelect.value;
        let config = {};
        
        if (currentMode === 'manual') {
            // Sauvegarder la configuration manuelle
            const providerSelect = document.getElementById('provider');
            const modelSelect = document.getElementById('model');
            
            config = {
                provider: providerSelect ? providerSelect.value : '',
                model: modelSelect ? modelSelect.value : ''
            };
            
            localStorage.setItem('ai-command-bar-config-manual', JSON.stringify(config));
        } else if (currentMode === 'auto') {
            // Sauvegarder la configuration auto
            const taskSelect = document.getElementById('task-select');
            const routingSelect = document.getElementById('routing-mode');
            
            config = {
                task: taskSelect ? taskSelect.value : '',
                routing: routingSelect ? routingSelect.value : ''
            };
            
            localStorage.setItem('ai-command-bar-config-auto', JSON.stringify(config));
        }
        
        // Sauvegarder le mode actuel comme dernier mode utilisé
        localStorage.setItem('ai-command-bar-last-mode', currentMode);
        
        // Afficher le feedback visuel
        try {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '✓';
            
            // Remettre l'icône normale après 2 secondes
            setTimeout(() => {
                saveBtn.classList.remove('saved');
                saveBtn.innerHTML = '●';
            }, 2000);
            
            console.log(`Configuration ${currentMode} sauvegardée:`, config);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    }

    function loadSavedConfig() {
        try {
            // Charger le dernier mode utilisé
            const lastMode = localStorage.getItem('ai-command-bar-last-mode') || 'auto';
            const modeSelect = document.getElementById('mode-select');
            
            if (modeSelect) {
                modeSelect.value = lastMode;
                handleModeChange(); // Déclencher le changement de mode
            }
            
            // Charger la configuration correspondante
            if (lastMode === 'manual') {
                const manualConfig = localStorage.getItem('ai-command-bar-config-manual');
                if (manualConfig) {
                    const config = JSON.parse(manualConfig);
                    console.log('Configuration manuelle chargée:', config);
                    
                    if (config.provider) {
                        const providerSelect = document.getElementById('provider');
                        if (providerSelect) {
                            providerSelect.value = config.provider;
                            handleProviderChange(); // Déclencher le changement de fournisseur
                        }
                    }
                    if (config.model) {
                        const modelSelect = document.getElementById('model');
                        if (modelSelect) {
                            modelSelect.value = config.model;
                        }
                    }
                }
            } else if (lastMode === 'auto') {
                const autoConfig = localStorage.getItem('ai-command-bar-config-auto');
                if (autoConfig) {
                    const config = JSON.parse(autoConfig);
                    console.log('Configuration auto chargée:', config);
                    
                    if (config.task) {
                        const taskSelect = document.getElementById('task-select');
                        if (taskSelect) {
                            taskSelect.value = config.task;
                        }
                    }
                    if (config.routing) {
                        const routingSelect = document.getElementById('routing-mode');
                        if (routingSelect) {
                            routingSelect.value = config.routing;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
        }
    }
})();