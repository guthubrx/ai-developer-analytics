/**
 * State Manager Module
 * Gère l'état global de l'application
 */

class StateManager {
    constructor() {
        this.vscode = acquireVsCodeApi();
        this.initializeState();
    }

    initializeState() {
        // DOM Elements
        this.domElements = {
            promptInput: null,
            sendBtn: null,
            fileAttachBtn: null,
            imageAttachBtn: null,
            fileAutocomplete: null,
            fileSearch: null,
            fileResults: null,
            conversationContent: null,
            conversationContainer: null,
            coachingSection: null,
            coachingContent: null,
            coachCollapseBtn: null,
            sessionTabs: null,
            newSessionBtn: null
        };

        // Application State
        this.state = {
            attachedFiles: [],
            isFileAutocompleteOpen: false,
            conversationHistory: [],
            thinkingAnimationInterval: null,
            thinkingMessageElement: null,
            streamingMessageElement: null,
            isStreaming: false,
            sessions: [],
            currentSessionId: null,
            sessionCounter: 1,
            sessionMetrics: {
                totalCost: 0,
                totalTokens: 0,
                latestLatency: 0,
                cacheHits: 0,
                totalRequests: 0
            },
            settings: {}
        };
    }

    // Getters
    getDomElement(name) {
        return this.domElements[name];
    }

    getState(key) {
        return this.state[key];
    }

    getVSCode() {
        return this.vscode;
    }

    // Setters
    setDomElement(name, element) {
        this.domElements[name] = element;
    }

    setState(key, value) {
        this.state[key] = value;
    }

    // State management methods
    addConversationMessage(message) {
        const currentSession = this.getCurrentSession();
        if (currentSession) {
            currentSession.conversation.push({
                ...message,
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString()
            });
        }
    }

    getConversationHistory() {
        const currentSession = this.getCurrentSession();
        return currentSession ? currentSession.conversation : [];
    }

    getConversationContext(maxMessages = 10) {
        const history = this.getConversationHistory();
        // Return the last N messages for context
        return history.slice(-maxMessages);
    }

    updateMetrics(metrics) {
        if (metrics.cost !== undefined) {
            this.state.sessionMetrics.totalCost += metrics.cost;
        }
        if (metrics.tokens !== undefined) {
            this.state.sessionMetrics.totalTokens += metrics.tokens;
        }
        if (metrics.latency !== undefined) {
            this.state.sessionMetrics.latestLatency = metrics.latency;
        }
        if (metrics.cacheHit !== undefined) {
            this.state.sessionMetrics.totalRequests++;
            if (metrics.cacheHit) {
                this.state.sessionMetrics.cacheHits++;
            }
        }
    }

    createSession(name = null) {
        const sessionId = 'session-' + Date.now();
        const sessionName = name || `Session ${this.state.sessionCounter++}`;

        const session = {
            id: sessionId,
            name: sessionName,
            conversation: [],
            metrics: {
                totalCost: 0,
                totalTokens: 0,
                latestLatency: 0,
                cacheHits: 0,
                totalRequests: 0
            },
            createdAt: new Date()
        };

        this.state.sessions.push(session);
        this.state.currentSessionId = sessionId;

        return session;
    }

    getCurrentSession() {
        return this.state.sessions.find(s => s.id === this.state.currentSessionId);
    }

    switchToSession(sessionId) {
        this.state.currentSessionId = sessionId;
    }

    closeSession(sessionId) {
        const sessionIndex = this.state.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            this.state.sessions.splice(sessionIndex, 1);

            if (this.state.currentSessionId === sessionId && this.state.sessions.length > 0) {
                this.state.currentSessionId = this.state.sessions[0].id;
            }
        }
    }

    // File autocomplete state
    openFileAutocomplete() {
        this.state.isFileAutocompleteOpen = true;
    }

    closeFileAutocomplete() {
        this.state.isFileAutocompleteOpen = false;
    }

    isFileAutocompleteOpen() {
        return this.state.isFileAutocompleteOpen;
    }

    // Settings management
    updateSettings(settings) {
        this.state.settings = { ...this.state.settings, ...settings };
    }

    getSettings() {
        return this.state.settings;
    }

    // Utility methods
    resetConversation() {
        this.state.conversationHistory = [];
    }

    clearThinkingAnimation() {
        if (this.state.thinkingAnimationInterval) {
            clearInterval(this.state.thinkingAnimationInterval);
            this.state.thinkingAnimationInterval = null;
        }
        this.state.thinkingMessageElement = null;
    }

    clearStreamingState() {
        this.state.streamingMessageElement = null;
        this.state.isStreaming = false;
    }
}

// Export as singleton
export default new StateManager();