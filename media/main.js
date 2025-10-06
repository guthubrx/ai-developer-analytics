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

    // Streaming state
    let streamingMessageElement = null;
    let isStreaming = false;

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

    function startStreamingResponse() {
        // Create streaming message element
        streamingMessageElement = document.createElement('div');
        streamingMessageElement.className = 'message ai streaming';
        streamingMessageElement.id = 'streaming-message';

        const timestamp = new Date().toLocaleTimeString();

        streamingMessageElement.innerHTML = `
            <div class="message-content">
                <span class="streaming-text"></span>
                <span class="streaming-cursor">▌</span>
            </div>
            <div class="message-meta">
                <span>${timestamp}</span>
                <span>Streaming...</span>
            </div>
        `;

        conversationContent.appendChild(streamingMessageElement);
        scrollToBottom();
        isStreaming = true;
    }

    function updateStreamingResponse(content, provider) {
        if (!streamingMessageElement || !isStreaming) {
            return;
        }

        const contentElement = streamingMessageElement.querySelector('.streaming-text');
        const metaElement = streamingMessageElement.querySelector('.message-meta span:last-child');

        if (contentElement) {
            // Format content progressively as it streams
            const formattedContent = progressiveMarkdownToHtml(content);
            contentElement.innerHTML = formattedContent;
        }

        if (metaElement && provider) {
            metaElement.textContent = provider;
        }

        scrollToBottom();
    }

    function stopStreamingResponse() {
        if (streamingMessageElement) {
            // Remove the streaming cursor
            const cursorElement = streamingMessageElement.querySelector('.streaming-cursor');
            if (cursorElement) {
                cursorElement.remove();
            }
            streamingMessageElement = null;
        }
        isStreaming = false;
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

    function formatCoachingAdvice(advice) {
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
        return escapeHtml(formatted).replace(/\n/g, '<br>');
    }

    function markdownToHtml(markdown) {
        if (!markdown) return '';

        // Convert markdown to HTML with enhanced code formatting
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks with language detection and copy button
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
                const lang = language || 'text';
                const escapedCode = escapeHtml(code.trim());
                return `
                    <div class="code-block">
                        <div class="code-header">
                            <span class="code-language">${lang}</span>
                            <button class="copy-code-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                    <path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/>
                                    <path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/>
                                </svg>
                            </button>
                        </div>
                        <pre><code class="language-${lang}">${escapedCode}</code></pre>
                    </div>
                `;
            })
            // Inline code
            .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return html;
    }

    // Function to copy code to clipboard
    function copyCodeToClipboard(button) {
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
    }

    // Progressive markdown formatting for streaming
    function progressiveMarkdownToHtml(markdown) {
        if (!markdown) return '';

        // Simple progressive formatting that works with partial content
        let html = markdown
            // Headers (only if complete)
            .replace(/^### (.+)$/gm, (match, content) => {
                return content.endsWith(' ') ? match : `<h3>${content}</h3>`;
            })
            .replace(/^## (.+)$/gm, (match, content) => {
                return content.endsWith(' ') ? match : `<h2>${content}</h2>`;
            })
            .replace(/^# (.+)$/gm, (match, content) => {
                return content.endsWith(' ') ? match : `<h1>${content}</h1>`;
            })
            // Bold and italic (progressive)
            .replace(/\*\*([^*]*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]*?)\*/g, '<em>$1</em>')
            // Code blocks (only complete ones)
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
                // Only format complete code blocks
                if (code.includes('\n```') || !code.includes('```')) {
                    const lang = language || 'text';
                    const escapedCode = escapeHtml(code.trim());
                    return `
                        <div class="code-block">
                            <div class="code-header">
                                <span class="code-language">${lang}</span>
                                <button class="copy-code-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                        <path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/>
                                        <path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/>
                                    </svg>
                                </button>
                            </div>
                            <pre><code class="language-${lang}">${escapedCode}</code></pre>
                        </div>
                    `;
                }
                return match;
            })
            // Inline code (progressive)
            .replace(/`([^`]*?)`/g, '<code class="inline-code">$1</code>')
            // Links (only complete ones)
            .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                return url.endsWith(' ') ? match : `<a href="${url}" target="_blank">${text}</a>`;
            })
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

            case 'streamingStarted':
                // Stop thinking animation and start streaming
                stopThinkingAnimation();
                startStreamingResponse();
                break;

            case 'streamingChunk':
                // Update streaming response with new content
                updateStreamingResponse(message.content, message.provider);
                break;

            case 'executionCompleted':
                // Stop streaming and finalize the response
                stopStreamingResponse();

                // Add final AI response to conversation
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
                coachingContent.innerHTML = formatCoachingAdvice(message.advice);
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
        console.log('Updating UI with settings:', settings);

        // Apply font family and size to entire interface
        const baseFontFamily = settings.commandBarFontFamily || 'var(--vscode-editor-font-family)';
        const baseFontSize = settings.commandBarFontSize || 13;

        // Apply to main container
        const commandBar = document.querySelector('.ai-command-bar');
        if (commandBar) {
            commandBar.style.fontFamily = baseFontFamily;
            commandBar.style.fontSize = baseFontSize + 'px';
        }

        // Apply to specific elements
        const messageContents = document.querySelectorAll('.message-content');
        const coachingContent = document.querySelector('.coaching-content');
        const textarea = document.getElementById('prompt-input');
        const dropdowns = document.querySelectorAll('.compact-select');
        const sessionTabs = document.querySelectorAll('.session-tab');
        const metrics = document.querySelectorAll('.metric-value, .metric-label');

        // Apply to all message content
        messageContents.forEach(content => {
            content.style.fontFamily = baseFontFamily;
            content.style.fontSize = baseFontSize + 'px';
        });

        // Apply to coaching content
        if (coachingContent) {
            coachingContent.style.fontFamily = baseFontFamily;
            coachingContent.style.fontSize = baseFontSize + 'px';
        }

        // Apply to textarea
        if (textarea) {
            textarea.style.fontFamily = baseFontFamily;
            textarea.style.fontSize = baseFontSize + 'px';
        }

        // Apply to dropdowns
        dropdowns.forEach(dropdown => {
            dropdown.style.fontFamily = baseFontFamily;
            dropdown.style.fontSize = (baseFontSize - 2) + 'px'; // Slightly smaller for compactness
        });

        // Apply to session tabs
        sessionTabs.forEach(tab => {
            tab.style.fontFamily = baseFontFamily;
            tab.style.fontSize = (baseFontSize - 1) + 'px';
        });

        // Apply to metrics
        metrics.forEach(metric => {
            metric.style.fontFamily = baseFontFamily;
            metric.style.fontSize = (baseFontSize - 4) + 'px';
        });

        // Update default selections
        if (settings.defaultEngine) {
            const engineSelect = document.getElementById('engine-select');
            if (engineSelect) {
                engineSelect.value = settings.defaultEngine;
            }
        }

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
            textarea.style.resize = 'none';
            textarea.style.overflow = 'hidden';
        }

        // Store settings for later use
        window.aiCommandBarSettings = settings;
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