// Main JavaScript for AI Command Bar - WhatsApp Style
// JavaScript principal pour la barre de commande IA - Style WhatsApp

(function() {
    const vscode = acquireVsCodeApi();

    // DOM Elements (will be initialized after DOM is loaded)
    let promptInput, sendBtn, fileAttachBtn, imageAttachBtn, fileAutocomplete, fileSearch, fileResults;
    let conversationContent, conversationContainer, coachingSection, coachingContent, coachCollapseBtn;
    let sessionTabs, newSessionBtn;

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
        initializeDOMElements();
        initializeEventListeners();
        initializeAutoExpandTextarea();
        loadSettings();
        loadMetricsFromStorage();
    });

    function initializeDOMElements() {
        console.log('Initializing DOM elements...');

        promptInput = document.getElementById('prompt-input');
        sendBtn = document.getElementById('send-btn');
        fileAttachBtn = document.getElementById('file-attach-btn');
        imageAttachBtn = document.getElementById('image-attach-btn');
        fileAutocomplete = document.getElementById('file-autocomplete');
        fileSearch = document.getElementById('file-search');
        fileResults = document.getElementById('file-results');
        conversationContent = document.getElementById('conversation-content');
        conversationContainer = document.getElementById('conversation-container');
        coachingSection = document.getElementById('coaching-section');
        coachingContent = document.getElementById('coaching-content');
        coachCollapseBtn = document.getElementById('coach-collapse-btn');
        sessionTabs = document.getElementById('session-tabs');
        newSessionBtn = document.getElementById('new-session-btn');

        console.log('DOM elements initialized:');
        console.log('- fileAutocomplete:', fileAutocomplete);
        console.log('- fileSearch:', fileSearch);
        console.log('- fileResults:', fileResults);
        console.log('- fileAttachBtn:', fileAttachBtn);
    }

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

        // Escape key to close file autocomplete
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isFileAutocompleteOpen) {
                e.preventDefault();
                closeFileAutocomplete();
            }
        });

        // Detect @ character to show file autocomplete
        promptInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const lastChar = value.slice(-1);

            console.log('Input detected, last char:', lastChar, 'autocomplete open:', isFileAutocompleteOpen);

            if (lastChar === '@' && !isFileAutocompleteOpen) {
                console.log('@ character detected, opening file autocomplete');
                openFileAutocomplete();
            } else if (lastChar !== '@' && isFileAutocompleteOpen) {
                // Close autocomplete when typing anything other than @
                console.log('Non-@ character detected, closing file autocomplete');
                closeFileAutocomplete();
            }
        });

        // File attach button
        fileAttachBtn.addEventListener('click', toggleFileAutocomplete);

        // Image attach button
        imageAttachBtn.addEventListener('click', handleImageAttach);

        // File search input
        fileSearch.addEventListener('input', handleFileSearch);

        // Escape key in file search to close autocomplete
        fileSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeFileAutocomplete();
            }
        });

        // Close file autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!fileAutocomplete.contains(e.target) && e.target !== fileAttachBtn && e.target !== promptInput) {
                closeFileAutocomplete();
            }
        });

        // Provider buttons
        const providerButtons = document.querySelectorAll('.provider-btn');
        // Engine change -> toggle moonshot model input visibility
        const engineSelect = document.getElementById('engine-select');
        if (engineSelect) {
            engineSelect.addEventListener('change', () => {
                const row = document.getElementById('moonshot-model-row');
                if (row) row.style.display = engineSelect.value === 'moonshot' ? 'flex' : 'none';
            });
            // initialize visible state
            const initRow = document.getElementById('moonshot-model-row');
            if (initRow) initRow.style.display = engineSelect.value === 'moonshot' ? 'flex' : 'none';
        }

        // Suggestions select -> fill input
        const modelSuggestions = document.getElementById('moonshot-model-suggestions');
        const modelInput = document.getElementById('moonshot-model-input');
        if (modelSuggestions && modelInput) {
            modelSuggestions.addEventListener('change', () => {
                if (modelSuggestions.value) {
                    modelInput.value = modelSuggestions.value;
                    saveMoonshotModel(modelInput.value);
                }
            });
            modelInput.addEventListener('change', () => saveMoonshotModel(modelInput.value));
        }
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
        // Persist moonshot model in case user changed it
        const msInput = document.getElementById('moonshot-model-input');
        if (msInput && selectedProvider === 'moonshot') {
            saveMoonshotModel(msInput.value);
        }

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
            <div class="message-header">
                <div class="message-avatar">${type === 'user' ? 'U' : 'AI'}</div>
                <div class="message-content">${formattedContent}</div>
            </div>
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
        console.log('Toggle file autocomplete clicked, current state:', isFileAutocompleteOpen);
        if (isFileAutocompleteOpen) {
            closeFileAutocomplete();
        } else {
            openFileAutocomplete();
        }
    }

    function openFileAutocomplete() {
        console.log('Opening file autocomplete...');

        // Check if element exists
        if (!fileAutocomplete) {
            console.error('fileAutocomplete element is null!');
            console.log('Trying to find it again...');
            fileAutocomplete = document.getElementById('file-autocomplete');
            console.log('Found element:', fileAutocomplete);

            if (!fileAutocomplete) {
                console.error('fileAutocomplete element still not found in DOM!');
                return;
            }
        }

        // Force visibility for debugging
        fileAutocomplete.style.display = 'block';
        fileAutocomplete.style.visibility = 'visible';
        fileAutocomplete.style.opacity = '1';
        fileAutocomplete.style.backgroundColor = 'var(--bg-card)';
        fileAutocomplete.style.border = '1px solid var(--border-primary)';
        fileAutocomplete.style.minHeight = '100px';

        fileSearch.value = '';
        fileResults.innerHTML = '<div class="file-result-item">Loading files...</div>';
        fileSearch.focus();
        isFileAutocompleteOpen = true;

        // Position the autocomplete based on context
        positionFileAutocomplete();

        // Load initial file list
        vscode.postMessage({
            type: 'getProjectFiles'
        });

        console.log('File autocomplete opened and positioned');
        console.log('Autocomplete element exists:', !!fileAutocomplete);
        console.log('Autocomplete parent element:', fileAutocomplete.parentElement);
        console.log('Autocomplete computed styles:', {
            display: getComputedStyle(fileAutocomplete).display,
            position: getComputedStyle(fileAutocomplete).position,
            bottom: getComputedStyle(fileAutocomplete).bottom,
            zIndex: getComputedStyle(fileAutocomplete).zIndex,
            width: getComputedStyle(fileAutocomplete).width,
            height: getComputedStyle(fileAutocomplete).height
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

        // Ensure the autocomplete is visible and properly positioned
        fileAutocomplete.style.zIndex = '1000';
        fileAutocomplete.style.display = 'block';
    }

    function positionAutocompleteAtCharacter(atPosition) {
        // Position above the text input area with better visibility
        const commandInputRect = document.querySelector('.command-input-wrapper').getBoundingClientRect();
        const parentContainer = document.querySelector('.command-input-container');

        // Use fixed positioning relative to viewport for precise placement
        fileAutocomplete.style.position = 'fixed';
        fileAutocomplete.style.top = (commandInputRect.top - 180) + 'px';
        fileAutocomplete.style.left = commandInputRect.left + 'px';
        fileAutocomplete.style.width = commandInputRect.width + 'px';
        fileAutocomplete.style.maxHeight = '180px';
        fileAutocomplete.style.overflowY = 'auto';
        fileAutocomplete.style.zIndex = '1000';
    }

    function positionAutocompleteAtButton() {
        // Position aligned with the @ button
        const fileAttachBtn = document.getElementById('file-attach-btn');
        const fileAttachBtnRect = fileAttachBtn.getBoundingClientRect();

        // Position the autocomplete so its bottom aligns with the button's bottom
        fileAutocomplete.style.position = 'fixed';
        fileAutocomplete.style.top = (fileAttachBtnRect.bottom - 180) + 'px';
        fileAutocomplete.style.left = fileAttachBtnRect.left + 'px';
        fileAutocomplete.style.width = '300px';
        fileAutocomplete.style.maxHeight = '180px';
        fileAutocomplete.style.overflowY = 'auto';
        fileAutocomplete.style.zIndex = '1000';
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

    function saveMoonshotModel(modelName) {
        if (!modelName) return;
        vscode.postMessage({
            type: 'updateSettings',
            settings: { moonshotDefaultModel: modelName }
        });
        window.moonshotDefaultModel = modelName;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Lightweight syntax highlighting to mimic Cursor style
    function highlightCode(lang, code) {
        let html = escapeHtml(code);

        const stringPattern = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g;
        const numberPattern = /\b\d+(?:\.\d+)?\b/g;
        const booleanPattern = /\b(true|false|null|undefined)\b/g;
        const lineCommentPattern = /(^|\n)\s*(\/\/.*?)(?=\n|$)/g;
        const blockCommentPattern = /\/\*[\s\S]*?\*\//g;
        const functionPattern = /\b([a-zA-Z_][\w]*)\s*(?=\()/g;

        const jsKeywords = [
            'await','break','case','catch','class','const','continue','debugger','default','delete','do','else','enum','export','extends','finally','for','function','if','import','in','instanceof','let','new','return','super','switch','this','throw','try','typeof','var','void','while','with','yield'
        ];
        const keywordPattern = new RegExp('\\b(' + jsKeywords.join('|') + ')\\b', 'g');

        if (lang === 'json') {
            // Highlight property keys first (strings before colon)
            html = html.replace(/\"([^\"\\]|\\.)*\"(?=\s*:)/g, m => `<span class="token property">${m}</span>`);
            html = html.replace(stringPattern, m => `<span class="token string">${m}</span>`);
            html = html.replace(numberPattern, m => `<span class="token number">${m}</span>`);
            html = html.replace(/\b(true|false|null)\b/g, m => `<span class="token boolean">${m}</span>`);
            return html;
        }

        // Generic JS/TS/Python-ish minimal highlight
        html = html.replace(blockCommentPattern, m => `<span class="token comment">${m}</span>`);
        html = html.replace(lineCommentPattern, (m, p1, p2) => `${p1}<span class="token comment">${p2}</span>`);
        html = html.replace(stringPattern, m => `<span class="token string">${m}</span>`);
        html = html.replace(numberPattern, m => `<span class="token number">${m}</span>`);
        if (lang === 'js' || lang === 'ts' || lang === 'javascript' || lang === 'typescript') {
            html = html.replace(keywordPattern, m => `<span class="token keyword">${m}</span>`);
            html = html.replace(functionPattern, m => `<span class="token function">${m}</span>`);
        } else if (lang === 'py' || lang === 'python') {
            const pyKeywords = ['def','class','return','if','elif','else','for','while','try','except','finally','with','as','lambda','yield','import','from','pass','break','continue','True','False','None'];
            const pyPattern = new RegExp('\\b(' + pyKeywords.join('|') + ')\\b','g');
            html = html.replace(pyPattern, m => `<span class="token keyword">${m}</span>`);
            html = html.replace(functionPattern, m => `<span class="token function">${m}</span>`);
        }
        html = html.replace(booleanPattern, m => `<span class="token boolean">${m}</span>`);
        return html;
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
            .replace(/```(\w+)?(?:\s+([^\n`]+))?\n([\s\S]*?)```/g, (match, language, filename, code) => {
                const lang = language || 'text';
                const raw = code.trim();
                const highlightedBase = highlightCode(lang, raw);
                const highlighted = (lang === 'diff' || /(^|\n)[+-]/.test(raw))
                    ? wrapDiffLines(highlightedBase, raw)
                    : highlightedBase;
                const file = filename ? filename.trim() : '';
                const isDiff = lang === 'diff' || /(^|\n)[+-]/.test(code);
                const added = (code.match(/^\+.+$/gm) || []).length;
                const deleted = (code.match(/^-.+$/gm) || []).length;
                const fileIcon = getFileIconSvg(file || lang);
                return `
                    <div class="code-block">
                        <div class="code-header">
                            <div class="code-title">
                                <span class="code-file-icon">${fileIcon}</span>
                                <span class="code-filename">${escapeHtml(file) || lang}</span>
                                <span class="code-badges">${isDiff ? `<span class="badge-add">+${added}</span><span class="badge-del">-${deleted}</span>` : ''}</span>
                            </div>
                            <div class="code-actions">
                                <button class="icon-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/><path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/></svg>
                                </button>
                                ${isDiff ? `
                                <button class="icon-btn" onclick="postCodeAction(this, 'accept', '${escapeHtml(file)}')" title="Accept changes">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 10.2L3.8 8l-1 1L6 12l7-7-1-1z"/></svg>
                                </button>
                                <button class="icon-btn" onclick="postCodeAction(this, 'reject', '${escapeHtml(file)}')" title="Reject changes">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 4l9 9m0-9L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                </button>` : ''}
                            </div>
                        </div>
                        <pre><code class="language-${lang}">${highlighted}</code></pre>
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

    // Post accept/reject actions for code changes back to extension
    function postCodeAction(button, action, file) {
        const codeBlock = button.closest('.code-block');
        const codeElement = codeBlock.querySelector('code');
        const header = codeBlock.querySelector('.code-filename');
        const languageClass = (codeElement && codeElement.className) || '';
        const languageMatch = languageClass.match(/language-([\w-]+)/);
        const language = languageMatch ? languageMatch[1] : 'text';
        const contentText = codeElement ? codeElement.textContent : '';
        const isDiff = language === 'diff' || /^\s*[+-]/m.test(contentText);
        vscode.postMessage({
            type: 'codeAction',
            action,
            file,
            content: contentText,
            language,
            isDiff
        });
    }

    // Provide small file icon SVGs based on extension
    function getFileIconSvg(name) {
        const lower = (name || '').toLowerCase();
        const svg = (path) => `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">${path}</svg>`;
        if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">TS</text>');
        if (lower.endsWith('.js') || lower.endsWith('.jsx')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">JS</text>');
        if (lower.endsWith('.json')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="3" y="12" font-size="6" fill="currentColor">JSON</text>');
        if (lower.endsWith('.md')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="4" y="12" font-size="6" fill="currentColor">MD</text>');
        if (lower.endsWith('.py')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">PY</text>');
        return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/>');
    }

    // Wrap + and - lines with diff classes; preserve existing highlighting by wrapping per raw lines
    function wrapDiffLines(highlightedHtml, rawText) {
        const rawLines = rawText.split(/\r?\n/);
        const highlightedLines = highlightedHtml.split(/\r?\n/);
        const out = [];
        for (let i = 0; i < highlightedLines.length; i++) {
            const raw = rawLines[i] || '';
            const line = highlightedLines[i] || '';
            if (raw.startsWith('+')) out.push(`<span class="diff-line diff-add">${line}</span>`);
            else if (raw.startsWith('-')) out.push(`<span class="diff-line diff-del">${line}</span>`);
            else out.push(`<span class="diff-line">${line}</span>`);
        }
        return out.join('\n');
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
            .replace(/```(\w+)?(?:\s+([^\n`]+))?\n([\s\S]*?)```/g, (match, language, filename, code) => {
                // Only format complete code blocks
                if (code.includes('\n```') || !code.includes('```')) {
                    const lang = language || 'text';
                    const raw = code.trim();
                    const highlighted = (lang === 'diff' || /(^|\n)[+-]/.test(raw))
                        ? wrapDiffLines(highlightCode(lang, raw), raw)
                        : highlightCode(lang, raw);
                    const file = filename ? filename.trim() : '';
                    const isDiff = lang === 'diff' || /(^|\n)[+-]/.test(code);
                    const added = (code.match(/^\+.+$/gm) || []).length;
                    const deleted = (code.match(/^-.+$/gm) || []).length;
                    const fileIcon = getFileIconSvg(file || lang);
                    return `
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-title">
                                    <span class="code-file-icon">${fileIcon}</span>
                                    <span class="code-filename">${escapeHtml(file) || lang}</span>
                                    <span class="code-badges">${isDiff ? `<span class="badge-add">+${added}</span><span class="badge-del">-${deleted}</span>` : ''}</span>
                                </div>
                                <div class="code-actions">
                                    <button class="icon-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/><path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/></svg>
                                    </button>
                                    ${isDiff ? `
                                    <button class="icon-btn" onclick="postCodeAction(this, 'accept', '${escapeHtml(file)}')" title="Accept changes">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 10.2L3.8 8l-1 1L6 12l7-7-1-1z"/></svg>
                                    </button>
                                    <button class="icon-btn" onclick="postCodeAction(this, 'reject', '${escapeHtml(file)}')" title="Reject changes">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 4l9 9m0-9L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                    </button>` : ''}
                                </div>
                            </div>
                            <pre><code class="language-${lang}">${highlighted}</code></pre>
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