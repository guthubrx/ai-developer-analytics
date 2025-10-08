/**
 * Event Manager Module
 * Gère tous les écouteurs d'événements de manière centralisée
 */

import StateManager from './state-manager.js';
import FileAutocompleteManager from './file-autocomplete-manager.js';
import MessageManager from './message-manager.js';
import SettingsManager from './settings-manager.js';

class EventManager {
    constructor() {
        this.stateManager = StateManager;
        this.fileAutocompleteManager = FileAutocompleteManager;
        this.messageManager = MessageManager;
        this.settingsManager = SettingsManager;
    }

    initializeEventListeners() {
        this.initializeSendButton();
        this.initializeInputEvents();
        this.initializeFileAutocompleteEvents();
        this.initializeSettingsEvents();
        this.initializeSessionEvents();
        this.initializeGlobalEvents();
        this.initializeModelSelectionEvents();
    }

    initializeSendButton() {
        const sendBtn = this.stateManager.getDomElement('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
        }
    }

    initializeInputEvents() {
        const promptInput = this.stateManager.getDomElement('promptInput');
        console.log('Initializing input events, promptInput found:', !!promptInput);
        if (!promptInput) {
            console.error('promptInput element not found!');
            return;
        }

        // Enter key to send, Shift+Enter for new line
        promptInput.addEventListener('keydown', (e) => {
            console.log('Keydown event:', e.key, 'shiftKey:', e.shiftKey);
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('Enter key detected (without Shift), sending message...');
                e.preventDefault();
                this.handleSendMessage();
            } else if (e.key === 'Enter' && e.shiftKey) {
                console.log('Shift+Enter detected, allowing new line...');
                // Allow default behavior for Shift+Enter (new line)
            }
        });

        // Detect @ character to show file autocomplete
        promptInput.addEventListener('input', (e) => {
            this.handleInputDetection(e);
        });
    }

    initializeFileAutocompleteEvents() {
        const fileAttachBtn = this.stateManager.getDomElement('fileAttachBtn');
        const fileSearch = this.stateManager.getDomElement('fileSearch');

        if (fileAttachBtn) {
            fileAttachBtn.addEventListener('click', () => {
                this.fileAutocompleteManager.toggleFileAutocomplete();
            });
        }

        if (fileSearch) {
            fileSearch.addEventListener('input', (e) => {
                this.fileAutocompleteManager.handleFileSearch(e.target.value);
            });

            fileSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.fileAutocompleteManager.closeFileAutocomplete();
                }
            });
        }

        // Image attach button
        const imageAttachBtn = this.stateManager.getDomElement('imageAttachBtn');
        if (imageAttachBtn) {
            imageAttachBtn.addEventListener('click', this.handleImageAttach.bind(this));
        }
    }

    initializeSettingsEvents() {
        // Engine selection
        const engineSelect = document.getElementById('engine-select');
        if (engineSelect) {
            engineSelect.addEventListener('change', async () => {
                await this.settingsManager.handleEngineChange(engineSelect.value);
            });
        }


        // Coach collapse button
        const coachCollapseBtn = this.stateManager.getDomElement('coachCollapseBtn');
        if (coachCollapseBtn) {
            coachCollapseBtn.addEventListener('click', () => {
                this.toggleCoachCollapse();
            });
        }
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.sendMessageToExtension({
                    type: 'openSettings'
                });
            });
        }
    }

    initializeSessionEvents() {
        const newSessionBtn = this.stateManager.getDomElement('newSessionBtn');
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', () => {
                this.handleNewSession();
            });
        }
    }

    initializeGlobalEvents() {
        // Escape key to close file autocomplete
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.stateManager.isFileAutocompleteOpen()) {
                e.preventDefault();
                this.fileAutocompleteManager.closeFileAutocomplete();
            }
        });

        // Close file autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            const fileAutocomplete = this.stateManager.getDomElement('fileAutocomplete');
            const fileAttachBtn = this.stateManager.getDomElement('fileAttachBtn');
            const promptInput = this.stateManager.getDomElement('promptInput');

            if (fileAutocomplete &&
                !fileAutocomplete.contains(e.target) &&
                e.target !== fileAttachBtn &&
                e.target !== promptInput) {
                this.fileAutocompleteManager.closeFileAutocomplete();
            }
        });
    }

    // Event handlers
    handleSendMessage() {
        const promptInput = this.stateManager.getDomElement('promptInput');
        const prompt = promptInput.value.trim();

        if (!prompt) return;

        const task = document.getElementById('task-select').value;
        const routingMode = document.getElementById('mode-select').value;
        const selectedProvider = this.getSelectedProvider();

        // Persist moonshot model if changed
        this.settingsManager.persistMoonshotModelIfNeeded(selectedProvider);

        // Add user message to conversation
        this.messageManager.addUserMessage(prompt, selectedProvider);

        // Clear input
        promptInput.value = '';
        promptInput.style.height = '40px';

        // Show thinking animation
        this.messageManager.showThinkingAnimation(selectedProvider);

        // Get conversation context
        const conversationContext = this.stateManager.getConversationContext();

        // Send message to extension with conversation context
        this.sendMessageToExtension({
            type: 'executePrompt',
            prompt,
            routingMode,
            provider: selectedProvider,
            conversationContext
        });

        // Collapse coaching section
        const coachingSection = this.stateManager.getDomElement('coachingSection');
        if (coachingSection) {
            coachingSection.classList.add('collapsed');
        }
    }

    handleInputDetection(e) {
        const value = e.target.value;
        const lastChar = value.slice(-1);

        console.log('Input detected, last char:', lastChar, 'autocomplete open:', this.stateManager.isFileAutocompleteOpen());

        if (lastChar === '@' && !this.stateManager.isFileAutocompleteOpen()) {
            console.log('@ character detected, opening file autocomplete');
            this.fileAutocompleteManager.openFileAutocomplete();
        } else if (lastChar !== '@' && this.stateManager.isFileAutocompleteOpen()) {
            console.log('Non-@ character detected, closing file autocomplete');
            this.fileAutocompleteManager.closeFileAutocomplete();
        }
    }

    handleImageAttach() {
        this.sendMessageToExtension({
            type: 'showInformationMessage',
            message: 'Image attachment feature coming soon!'
        });
    }

    handleNewSession() {
        const session = this.stateManager.createSession();
        this.messageManager.createSessionTab(session);
        this.messageManager.switchToSession(session.id);
    }

    // Utility methods
    getSelectedProvider() {
        const engineSelect = document.getElementById('engine-select');
        return engineSelect ? engineSelect.value : 'deepseek';
    }

    toggleCoachCollapse() {
        const coachingSection = this.stateManager.getDomElement('coachingSection');
        if (coachingSection) {
            coachingSection.classList.toggle('collapsed');
        }
    }

    sendMessageToExtension(message) {
        const vscode = this.stateManager.getVSCode();
        vscode.postMessage(message);
    }

    initializeModelSelectionEvents() {
        const selectModelBtn = document.getElementById('select-model-btn');
        if (selectModelBtn) {
            selectModelBtn.addEventListener('click', () => {
                this.sendMessageToExtension({
                    type: 'selectModel'
                });
            });
        }
    }
}

export default new EventManager();