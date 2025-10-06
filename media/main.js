// Main JavaScript for AI Command Bar - WhatsApp Style
// JavaScript principal pour la barre de commande IA - Style WhatsApp

(function() {
    const vscode = acquireVsCodeApi();

    // DOM Elements
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const fileAttachBtn = document.getElementById('file-attach-btn');
    const imageAttachBtn = document.getElementById('image-attach-btn');
    const fileAutocomplete = document.getElementById('file-autocomplete');
    const fileSearch = document.getElementById('file-search');
    const fileResults = document.getElementById('file-results');
    const conversationContent = document.getElementById('conversation-content');
    const conversationContainer = document.getElementById('conversation-container');
    const coachingSection = document.getElementById('coaching-section');
    const coachingContent = document.getElementById('coaching-content');
    const coachCollapseBtn = document.getElementById('coach-collapse-btn');
    const sessionTabs = document.getElementById('session-tabs');
    const newSessionBtn = document.getElementById('new-session-btn');

    // State
    let attachedFiles = [];
    let isFileAutocompleteOpen = false;
    let conversationHistory = [];
    let thinkingAnimationInterval = null;
    let thinkingMessageElement = null;

    // Session management
    let sessions = [];
    let currentSessionId = null;
    let sessionCounter = 1;

    // Session metrics
    let sessionMetrics = {
        totalCost: 0,
        totalTokens: 0,
        latestLatency: 0,
        cacheHits: 0,
        totalRequests: 0
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        initializeEventListeners();
        initializeAutoExpandTextarea();
        loadSettings();
        loadMetricsFromStorage();
    });

    function initializeEventListeners() {
        // Send button
        sendBtn.addEventListener('click', handleSendMessage);

        // Enter key to send, Shift+Enter for new line
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
            // Shift+Enter allows new line (default behavior)
        });

        // Detect @ character to show file autocomplete
        promptInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const lastChar = value.slice(-1);

            if (lastChar === '@' && !isFileAutocompleteOpen) {
                openFileAutocomplete();
            }
        });

        // File attach button
        fileAttachBtn.addEventListener('click', toggleFileAutocomplete);

        // Image attach button
        imageAttachBtn.addEventListener('click', handleImageAttach);

        // File search input
        fileSearch.addEventListener('input', handleFileSearch);

        // Close file autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!fileAutocomplete.contains(e.target) && e.target !== fileAttachBtn) {
                closeFileAutocomplete();
            }
        });

        // Provider buttons
        const providerButtons = document.querySelectorAll('.provider-btn');
        providerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                providerButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Coach collapse button
        if (coachCollapseBtn) {
            coachCollapseBtn.addEventListener('click', toggleCoachCollapse);
        }

        // New session button
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', createNewSession);
        }

        // Initialize with first session
        createNewSession();
    }

    function initializeAutoExpandTextarea() {
        // Auto-expand textarea based on content
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });

        // Initialize height
        promptInput.style.height = '40px';
    }

    function handleSendMessage() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            return;
        }

        const task = document.getElementById('task-select').value;
        const routingMode = document.getElementById('mode-select').value;
        const selectedProvider = getSelectedProvider();

        // Add user message to conversation
        addMessageToConversation('user', prompt, selectedProvider);

        // Clear input
        promptInput.value = '';
        promptInput.style.height = '40px';

        // Show thinking animation
        showThinkingAnimation(selectedProvider);

        vscode.postMessage({
            type: 'executePrompt',
            prompt,
            routingMode,
            provider: selectedProvider
        });

        // Collapse coaching section
        coachingSection.classList.add('collapsed');
    }

    function showThinkingAnimation(provider) {
        // Create thinking message element
        thinkingMessageElement = document.createElement('div');
        thinkingMessageElement.className = 'message ai thinking';
        thinkingMessageElement.id = 'thinking-message';

        const timestamp = new Date().toLocaleTimeString();

        thinkingMessageElement.innerHTML = `
            <div class="message-content">
                <span class="thinking-text">Thinking</span>
                <span class="thinking-dots">.</span>
            </div>
            <div class="message-meta">
                <span>${timestamp}</span>
                <span>${provider}</span>
            </div>
        `;

        conversationContent.appendChild(thinkingMessageElement);
        scrollToBottom();

        // Start animation
        startThinkingAnimation();
    }

    function startThinkingAnimation() {
        const dotsElement = thinkingMessageElement.querySelector('.thinking-dots');
        let dotCount = 0;

        thinkingAnimationInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            dotsElement.textContent = '.'.repeat(dotCount);
        }, 500); // Change dots every 500ms
    }

    function stopThinkingAnimation() {
        if (thinkingAnimationInterval) {
            clearInterval(thinkingAnimationInterval);
            thinkingAnimationInterval = null;
        }

        if (thinkingMessageElement) {
            thinkingMessageElement.remove();
            thinkingMessageElement = null;
        }
    }

    function addMessageToConversation(type, content, provider = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const messageId = Date.now();
        const timestamp = new Date().toLocaleTimeString();

        // Convert markdown to HTML for AI responses
        const formattedContent = type === 'ai' ? markdownToHtml(content) : escapeHtml(content);

        let messageHTML = `
            <div class="message-content">${formattedContent}</div>
            <div class="message-meta">
                <span>${timestamp}</span>
        `;

        if (type === 'ai' && provider) {
            messageHTML += `<span>${provider}</span>`;
        }

        messageHTML += `</div>`;

        messageDiv.innerHTML = messageHTML;
        conversationContent.appendChild(messageDiv);

        // Store in history
        conversationHistory.push({
            id: messageId,
            type,
            content,
            provider,
            timestamp
        });

        // Auto-scroll to bottom
        scrollToBottom();
    }

    function scrollToBottom() {
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }

    function toggleFileAutocomplete() {
        if (isFileAutocompleteOpen) {
            closeFileAutocomplete();
        } else {
            openFileAutocomplete();
        }
    }

    function openFileAutocomplete() {
        fileAutocomplete.style.display = 'block';
        fileSearch.value = '';
        fileResults.innerHTML = '';
        fileSearch.focus();
        isFileAutocompleteOpen = true;

        // Position the autocomplete based on context
        positionFileAutocomplete();

        // Load initial file list
        vscode.postMessage({
            type: 'getProjectFiles'
        });
    }

    function positionFileAutocomplete() {
        // Get cursor position in textarea
        const cursorPosition = promptInput.selectionStart;
        const textBeforeCursor = promptInput.value.substring(0, cursorPosition);

        // Check if we're positioning relative to @ character in text
        const lastAtPos = textBeforeCursor.lastIndexOf('@');

        if (lastAtPos !== -1 && lastAtPos === cursorPosition - 1) {
            // Position relative to @ character in text
            positionAutocompleteAtCharacter(lastAtPos);
        } else {
            // Position relative to @ button
            positionAutocompleteAtButton();
        }
    }

    function positionAutocompleteAtCharacter(atPosition) {
        // Try to position near the @ character in text
        // This is a simplified approach - in a real implementation
        // we'd need to calculate exact text cursor coordinates

        // For now, position above the text input area
        const textInputRect = promptInput.getBoundingClientRect();
        const commandInputRect = document.querySelector('.command-input-wrapper').getBoundingClientRect();

        fileAutocomplete.style.bottom = '100%';
        fileAutocomplete.style.top = 'auto';
        fileAutocomplete.style.left = '0';
        fileAutocomplete.style.right = 'auto';
        fileAutocomplete.style.width = '300px';
    }

    function positionAutocompleteAtButton() {
        // Position above the @ button
        fileAutocomplete.style.bottom = '100%';
        fileAutocomplete.style.top = 'auto';
        fileAutocomplete.style.left = '0';
        fileAutocomplete.style.right = 'auto';
    }

    function closeFileAutocomplete() {
        fileAutocomplete.style.display = 'none';
        isFileAutocompleteOpen = false;
    }

    function handleFileSearch(e) {
        const query = e.target.value.toLowerCase();

        vscode.postMessage({
            type: 'searchFiles',
            query: query
        });
    }

    function handleImageAttach() {
        // For now, just show a message
        vscode.postMessage({
            type: 'showInformationMessage',
            message: 'Image attachment feature coming soon!'
        });
    }

    function toggleCoachCollapse() {
        coachingSection.classList.toggle('collapsed');
    }

    function getSelectedProvider() {
        const engineSelect = document.getElementById('engine-select');
        return engineSelect ? engineSelect.value : 'deepseek';
    }

    function loadSettings() {
        vscode.postMessage({
            type: 'getSettings'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function markdownToHtml(markdown) {
        if (!markdown) return '';

        // Convert markdown to HTML
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return html;
    }

    function displayFileResults(files) {
        fileResults.innerHTML = '';

        if (files.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'file-result-item';
            noResults.textContent = 'No files found';
            fileResults.appendChild(noResults);
            return;
        }

        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-result-item';
            item.textContent = file;
            item.addEventListener('click', () => {
                attachFile(file);
                closeFileAutocomplete();
            });
            fileResults.appendChild(item);
        });
    }

    function attachFile(filePath) {
        attachedFiles.push(filePath);

        // Add file reference to prompt
        const currentPrompt = promptInput.value;
        const fileReference = `@${filePath}`;

        if (currentPrompt.includes(fileReference)) {
            return; // Already attached
        }

        promptInput.value = currentPrompt + (currentPrompt ? '\n' : '') + fileReference;

        // Trigger auto-expand
        const event = new Event('input', { bubbles: true });
        promptInput.dispatchEvent(event);
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.type) {
            case 'executionStarted':
                // Show loading state
                sendBtn.disabled = true;
                break;

            case 'executionCompleted':
                // Stop thinking animation
                stopThinkingAnimation();

                // Add AI response to conversation
                addMessageToConversation('ai', message.response, message.provider);

                updateMetrics({
                    cost: message.cost,
                    tokens: message.tokens,
                    latency: message.latency,
                    model: message.provider,
                    cacheHit: message.cacheHit
                });
                sendBtn.disabled = false;
                break;

            case 'executionError':
                // Stop thinking animation
                stopThinkingAnimation();

                // Add error message to conversation
                addMessageToConversation('ai', `Error: ${message.error}`, 'error');
                sendBtn.disabled = false;
                break;

            case 'coachingAdvice':
                coachingSection.classList.remove('collapsed');
                coachingContent.innerHTML = escapeHtml(message.advice);
                break;

            case 'settingsUpdated':
                updateSettingsUI(message.settings);
                break;

            case 'projectFiles':
                displayFileResults(message.files);
                break;

            case 'fileSearchResults':
                displayFileResults(message.files);
                break;

            case 'metricsLoaded':
                if (message.metrics) {
                    sessionMetrics = { ...sessionMetrics, ...message.metrics };
                    // Update UI with loaded metrics
                    document.getElementById('cost-info').textContent = `$${sessionMetrics.totalCost.toFixed(6)}`;
                    document.getElementById('tokens-info').textContent = sessionMetrics.totalTokens;
                    document.getElementById('latency-info').textContent = `${(sessionMetrics.latestLatency / 1000).toFixed(2)}s`;

                    const cacheHitRate = sessionMetrics.totalRequests > 0
                        ? (sessionMetrics.cacheHits / sessionMetrics.totalRequests) * 100
                        : 0;
                    document.getElementById('cache-info').textContent = `${cacheHitRate.toFixed(0)}%`;
                }
                break;
        }
    });

    function updateMetrics(metrics) {
        // Update session metrics
        if (metrics.cost !== undefined) {
            sessionMetrics.totalCost += metrics.cost;
        }
        if (metrics.tokens !== undefined) {
            sessionMetrics.totalTokens += metrics.tokens;
        }
        if (metrics.latency !== undefined) {
            sessionMetrics.latestLatency = metrics.latency;
        }
        if (metrics.cacheHit !== undefined) {
            sessionMetrics.totalRequests++;
            if (metrics.cacheHit) {
                sessionMetrics.cacheHits++;
            }
        }

        // Update UI with session-wide metrics
        document.getElementById('cost-info').textContent = `$${sessionMetrics.totalCost.toFixed(6)}`;
        document.getElementById('tokens-info').textContent = sessionMetrics.totalTokens;
        document.getElementById('latency-info').textContent = `${(sessionMetrics.latestLatency / 1000).toFixed(2)}s`;

        // Calculate average cache hit rate
        const cacheHitRate = sessionMetrics.totalRequests > 0
            ? (sessionMetrics.cacheHits / sessionMetrics.totalRequests) * 100
            : 0;
        document.getElementById('cache-info').textContent = `${cacheHitRate.toFixed(0)}%`;

        // Save metrics to persistent storage
        saveMetricsToStorage();
    }

    function saveMetricsToStorage() {
        vscode.postMessage({
            type: 'saveMetrics',
            metrics: sessionMetrics
        });
    }

    function loadMetricsFromStorage() {
        vscode.postMessage({
            type: 'loadMetrics'
        });
    }

    function updateSettingsUI(settings) {
        // Update UI based on settings
        // This would update routing mode, provider selection, etc.

        // Update font size if specified
        if (settings.fontSize) {
            const messageContents = document.querySelectorAll('.message-content');
            const coachingContent = document.querySelector('.coaching-content');
            const textarea = document.getElementById('prompt-input');

            messageContents.forEach(content => {
                content.style.fontSize = settings.fontSize + 'px';
            });

            if (coachingContent) {
                coachingContent.style.fontSize = settings.fontSize + 'px';
            }

            if (textarea) {
                textarea.style.fontSize = settings.fontSize + 'px';
            }
        }
    }

    // Session Management Functions
    function createNewSession() {
        const sessionId = 'session-' + Date.now();
        const sessionName = `Session ${sessionCounter++}`;

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

        sessions.push(session);
        currentSessionId = sessionId;

        createSessionTab(session);
        switchToSession(sessionId);

        return session;
    }

    function createSessionTab(session) {
        const tabElement = document.createElement('div');
        tabElement.className = 'session-tab';
        tabElement.dataset.sessionId = session.id;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = session.name;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'session-tab-close';
        closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        closeBtn.title = 'Close session';

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSession(session.id);
        });

        tabElement.appendChild(nameSpan);
        tabElement.appendChild(closeBtn);

        tabElement.addEventListener('click', () => {
            switchToSession(session.id);
        });

        sessionTabs.appendChild(tabElement);

        // Set as active if it's the first session
        if (sessions.length === 1) {
            tabElement.classList.add('active');
        }
    }

    function switchToSession(sessionId) {
        // Update tab states
        document.querySelectorAll('.session-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update current session
        currentSessionId = sessionId;

        // Clear current conversation
        conversationContent.innerHTML = '';
        conversationHistory = [];

        // Load session conversation
        const session = sessions.find(s => s.id === sessionId);
        if (session && session.conversation.length > 0) {
            session.conversation.forEach(msg => {
                addMessageToConversation(msg.type, msg.content, msg.provider);
            });
        }

        // Reset metrics display for this session
        updateMetricsDisplay(session ? session.metrics : {
            totalCost: 0,
            totalTokens: 0,
            latestLatency: 0,
            cacheHits: 0,
            totalRequests: 0
        });
    }

    function closeSession(sessionId) {
        if (sessions.length <= 1) {
            // Don't allow closing the last session
            vscode.postMessage({
                type: 'showInformationMessage',
                message: 'Cannot close the last session'
            });
            return;
        }

        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            sessions.splice(sessionIndex, 1);

            // Remove tab
            const tab = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (tab) {
                tab.remove();
            }

            // If we closed the current session, switch to another one
            if (currentSessionId === sessionId) {
                const nextSession = sessions[0];
                if (nextSession) {
                    switchToSession(nextSession.id);
                }
            }
        }
    }

    function updateMetricsDisplay(metrics) {
        document.getElementById('cost-info').textContent = `$${metrics.totalCost.toFixed(6)}`;
        document.getElementById('tokens-info').textContent = metrics.totalTokens;
        document.getElementById('latency-info').textContent = `${(metrics.latestLatency / 1000).toFixed(2)}s`;

        const cacheHitRate = metrics.totalRequests > 0
            ? (metrics.cacheHits / metrics.totalRequests) * 100
            : 0;
        document.getElementById('cache-info').textContent = `${cacheHitRate.toFixed(0)}%`;
    }

    // Override the existing updateMetrics function to work with sessions
    const originalUpdateMetrics = updateMetrics;
    updateMetrics = function(metrics) {
        // Update current session metrics
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (currentSession) {
            if (metrics.cost !== undefined) {
                currentSession.metrics.totalCost += metrics.cost;
            }
            if (metrics.tokens !== undefined) {
                currentSession.metrics.totalTokens += metrics.tokens;
            }
            if (metrics.latency !== undefined) {
                currentSession.metrics.latestLatency = metrics.latency;
            }
            if (metrics.cacheHit !== undefined) {
                currentSession.metrics.totalRequests++;
                if (metrics.cacheHit) {
                    currentSession.metrics.cacheHits++;
                }
            }

            // Update display with session metrics
            updateMetricsDisplay(currentSession.metrics);
        }

        // Also update global session metrics for backward compatibility
        originalUpdateMetrics(metrics);
    };

    // Override addMessageToConversation to store in current session
    const originalAddMessageToConversation = addMessageToConversation;
    addMessageToConversation = function(type, content, provider = null) {
        const messageId = Date.now();
        const timestamp = new Date().toLocaleTimeString();

        // Store in current session
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (currentSession) {
            currentSession.conversation.push({
                id: messageId,
                type,
                content,
                provider,
                timestamp
            });
        }

        // Call original function
        originalAddMessageToConversation(type, content, provider);
    };

})();