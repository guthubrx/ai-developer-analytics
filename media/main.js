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

    // State
    let attachedFiles = [];
    let isFileAutocompleteOpen = false;
    let conversationHistory = [];

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
    });

    function initializeEventListeners() {
        // Send button
        sendBtn.addEventListener('click', handleSendMessage);

        // Enter key to send (Ctrl+Enter or Cmd+Enter)
        promptInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSendMessage();
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

        vscode.postMessage({
            type: 'executePrompt',
            prompt,
            routingMode,
            provider: selectedProvider
        });

        // Hide coaching section
        coachingSection.style.display = 'none';
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

        // Load initial file list
        vscode.postMessage({
            type: 'getProjectFiles'
        });
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
        const activeBtn = document.querySelector('.provider-btn.active');
        return activeBtn ? activeBtn.dataset.provider : 'auto';
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
                // Add error message to conversation
                addMessageToConversation('ai', `Error: ${message.error}`, 'error');
                sendBtn.disabled = false;
                break;

            case 'coachingAdvice':
                coachingSection.style.display = 'block';
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

})();