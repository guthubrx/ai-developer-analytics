/**
 * Message Manager Module
 * Gère l'affichage et la gestion des messages de conversation
 */

import StateManager from './state-manager.js';

class MessageManager {
    constructor() {
        this.stateManager = StateManager;
    }

    addUserMessage(content, provider = null) {
        this.addMessageToConversation('user', content, provider);
    }

    addAIMessage(content, provider = null, model = null) {
        this.addMessageToConversation('ai', content, provider, model);
    }

    addMessageToConversation(type, content, provider = null, model = null) {
        const conversationContent = this.stateManager.getDomElement('conversationContent');
        if (!conversationContent) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const messageId = Date.now();
        const timestamp = new Date().toLocaleTimeString();

        // Convert markdown to HTML for AI responses
        const formattedContent = type === 'ai' ? this.markdownToHtml(content) : this.escapeHtml(content);

        let messageHTML = `
            <div class="message-header">
                <div class="message-avatar">${type === 'user' ? 'U' : this.getProviderIcon(provider)}</div>
                <div class="message-content">
                    ${type === 'ai' && (model || provider) ? `<div class="model-name">${model || this.getModelDisplayName(provider)}</div>` : ''}
                    <div class="message-text">${formattedContent}</div>
                </div>
            </div>
            <div class="message-meta">
                <span class="timestamp">${timestamp}</span>
                ${type === 'ai' && (model || provider) ? `<span class="model-display">${model || this.getModelDisplayName(provider)}</span>` : ''}
            </div>
        `;

        messageDiv.innerHTML = messageHTML;
        conversationContent.appendChild(messageDiv);

        // Store message in conversation history
        this.stateManager.addConversationMessage({
            id: messageId,
            type,
            content,
            provider,
            model,
            timestamp
        });

        // Auto-scroll to bottom
        this.scrollToBottom();
    }

    showThinkingAnimation(provider) {
        this.stopThinkingAnimation();

        const conversationContent = this.stateManager.getDomElement('conversationContent');
        if (!conversationContent) return;

        // Create thinking message element
        const thinkingMessageElement = document.createElement('div');
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
                <span>Thinking...</span>
            </div>
        `;

        conversationContent.appendChild(thinkingMessageElement);
        this.scrollToBottom();

        // Store reference and start animation
        this.stateManager.setState('thinkingMessageElement', thinkingMessageElement);
        this.startThinkingAnimation();
    }

    startThinkingAnimation() {
        const thinkingMessageElement = this.stateManager.getState('thinkingMessageElement');
        if (!thinkingMessageElement) return;

        const dotsElement = thinkingMessageElement.querySelector('.thinking-dots');
        if (!dotsElement) return;

        let dotCount = 0;

        const interval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            dotsElement.textContent = '.'.repeat(dotCount);
        }, 500);

        this.stateManager.setState('thinkingAnimationInterval', interval);
    }

    stopThinkingAnimation() {
        this.stateManager.clearThinkingAnimation();
    }

    startStreamingResponse() {
        this.stopThinkingAnimation();

        const conversationContent = this.stateManager.getDomElement('conversationContent');
        if (!conversationContent) return;

        // Create streaming message element
        const streamingMessageElement = document.createElement('div');
        streamingMessageElement.className = 'message ai streaming';
        streamingMessageElement.id = 'streaming-message';

        const timestamp = new Date().toLocaleTimeString();

        streamingMessageElement.innerHTML = `
            <div class="message-header">
                <div class="message-avatar">${this.getProviderIcon()}</div>
                <div class="message-content">
                    <div class="model-name">AI Assistant</div>
                    <div class="message-text">
                        <span class="streaming-text"></span>
                        <span class="streaming-cursor">▌</span>
                    </div>
                </div>
            </div>
            <div class="message-meta">
                <span>${timestamp}</span>
            </div>
        `;

        conversationContent.appendChild(streamingMessageElement);
        this.scrollToBottom();

        this.stateManager.setState('streamingMessageElement', streamingMessageElement);
        this.stateManager.setState('isStreaming', true);
    }

    updateStreamingResponse(content, provider) {
        const streamingMessageElement = this.stateManager.getState('streamingMessageElement');
        const isStreaming = this.stateManager.getState('isStreaming');

        if (!streamingMessageElement || !isStreaming) {
            return;
        }

        const contentElement = streamingMessageElement.querySelector('.streaming-text');
        const modelNameElement = streamingMessageElement.querySelector('.model-name');

        if (contentElement) {
            // Format content progressively as it streams
            const formattedContent = this.progressiveMarkdownToHtml(content);
            contentElement.innerHTML = formattedContent;
        }

        if (modelNameElement && provider) {
            modelNameElement.textContent = this.getModelDisplayName(provider);
        }

        this.scrollToBottom();
    }

    stopStreamingResponse() {
        const streamingMessageElement = this.stateManager.getState('streamingMessageElement');
        if (streamingMessageElement) {
            // Remove the streaming cursor
            const cursorElement = streamingMessageElement.querySelector('.streaming-cursor');
            if (cursorElement) {
                cursorElement.remove();
            }
        }

        this.stateManager.clearStreamingState();
    }

    scrollToBottom() {
        const conversationContainer = this.stateManager.getDomElement('conversationContainer');
        if (conversationContainer) {
            conversationContainer.scrollTop = conversationContainer.scrollHeight;
        }
    }

    // Session management
    createSessionTab(session) {
        const sessionTabs = this.stateManager.getDomElement('sessionTabs');
        if (!sessionTabs) return;

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
            this.closeSession(session.id);
        });

        tabElement.appendChild(nameSpan);
        tabElement.appendChild(closeBtn);

        tabElement.addEventListener('click', () => {
            this.switchToSession(session.id);
        });

        sessionTabs.appendChild(tabElement);

        // Set as active if it's the first session
        const sessions = this.stateManager.getState('sessions');
        if (sessions && sessions.length === 1) {
            tabElement.classList.add('active');
        }
    }

    switchToSession(sessionId) {
        // Update tab states
        document.querySelectorAll('.session-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update current session
        this.stateManager.switchToSession(sessionId);

        // Clear current conversation
        const conversationContent = this.stateManager.getDomElement('conversationContent');
        if (conversationContent) {
            conversationContent.innerHTML = '';
        }

        // Load session conversation
        const sessions = this.stateManager.getState('sessions');
        const session = sessions.find(s => s.id === sessionId);
        if (session && session.conversation.length > 0) {
            session.conversation.forEach(msg => {
                this.addMessageToConversation(msg.type, msg.content, msg.provider);
            });
        }
    }

    closeSession(sessionId) {
        const sessions = this.stateManager.getState('sessions');
        if (sessions.length <= 1) {
            // Don't allow closing the last session
            this.sendMessageToExtension({
                type: 'showInformationMessage',
                message: 'Cannot close the last session'
            });
            return;
        }

        this.stateManager.closeSession(sessionId);

        // Remove tab
        const tab = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (tab) {
            tab.remove();
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    markdownToHtml(markdown) {
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
                const highlighted = this.highlightCode(lang, raw);
                const file = filename ? filename.trim() : '';
                const isDiff = lang === 'diff' || /(^|\n)[+-]/.test(code);
                const added = (code.match(/^\+.+$/gm) || []).length;
                const deleted = (code.match(/^-.+$/gm) || []).length;
                const fileIcon = this.getFileIconSvg(file || lang);
                return `
                    <div class="code-block">
                        <div class="code-header">
                            <div class="code-title">
                                <span class="code-file-icon">${fileIcon}</span>
                                <span class="code-filename">${this.escapeHtml(file) || lang}</span>
                                <span class="code-badges">${isDiff ? `<span class="badge-add">+${added}</span><span class="badge-del">-${deleted}</span>` : ''}</span>
                            </div>
                            <div class="code-actions">
                                <button class="icon-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/><path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/></svg>
                                </button>
                                ${isDiff ? `
                                <button class="icon-btn" onclick="postCodeAction(this, 'accept', '${this.escapeHtml(file)}')" title="Accept changes">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 10.2L3.8 8l-1 1L6 12l7-7-1-1z"/></svg>
                                </button>
                                <button class="icon-btn" onclick="postCodeAction(this, 'reject', '${this.escapeHtml(file)}')" title="Reject changes">
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

    progressiveMarkdownToHtml(markdown) {
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
                    const highlighted = this.highlightCode(lang, raw);
                    const file = filename ? filename.trim() : '';
                    const isDiff = lang === 'diff' || /(^|\n)[+-]/.test(code);
                    const added = (code.match(/^\+.+$/gm) || []).length;
                    const deleted = (code.match(/^-.+$/gm) || []).length;
                    const fileIcon = this.getFileIconSvg(file || lang);
                    return `
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-title">
                                    <span class="code-file-icon">${fileIcon}</span>
                                    <span class="code-filename">${this.escapeHtml(file) || lang}</span>
                                    <span class="code-badges">${isDiff ? `<span class="badge-add">+${added}</span><span class="badge-del">-${deleted}</span>` : ''}</span>
                                </div>
                                <div class="code-actions">
                                    <button class="icon-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/><path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/></svg>
                                    </button>
                                    ${isDiff ? `
                                    <button class="icon-btn" onclick="postCodeAction(this, 'accept', '${this.escapeHtml(file)}')" title="Accept changes">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 10.2L3.8 8l-1 1L6 12l7-7-1-1z"/></svg>
                                    </button>
                                    <button class="icon-btn" onclick="postCodeAction(this, 'reject', '${this.escapeHtml(file)}')" title="Reject changes">
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

    highlightCode(lang, code) {
        let html = this.escapeHtml(code);

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

    getFileIconSvg(name) {
        const lower = (name || '').toLowerCase();
        const svg = (path) => `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">${path}</svg>`;
        if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">TS</text>');
        if (lower.endsWith('.js') || lower.endsWith('.jsx')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">JS</text>');
        if (lower.endsWith('.json')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="3" y="12" font-size="6" fill="currentColor">JSON</text>');
        if (lower.endsWith('.md')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="4" y="12" font-size="6" fill="currentColor">MD</text>');
        if (lower.endsWith('.py')) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">PY</text>');
        return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/>');
    }

    getProviderIcon(provider) {
        // Return the actual provider logo
        return this.getProviderLogo(provider);
    }

    getProviderLogo(provider) {
        // Map provider names to their logo files
        const logoMap = {
            'openai': 'openai-logo.png',
            'anthropic': 'anthropic-logo.png',
            'deepseek': 'deepseek-logo.png',
            'moonshot': 'moonshot-logo.png',
            'ollama': 'ollama-logo.png'
        };

        const logoFile = logoMap[provider?.toLowerCase()] || 'openai-logo.png';
        const logoKey = provider?.toLowerCase() || 'openai';

        // Try to use pre-generated URIs first
        const logoUri = window.logoUris?.[logoKey];

        if (logoUri) {
            return `<img src="${logoUri}" alt="${provider || 'AI'}" class="provider-logo">`;
        } else {
            // Fallback: try relative path (shouldn't happen if URIs are properly injected)
            console.warn(`[MessageManager] Logo URI not found for ${provider}, using fallback`);
            return `<span class="provider-logo-fallback">${provider?.charAt(0)?.toUpperCase() || 'AI'}</span>`;
        }
    }

    getVSCodeResourceUri(path) {
        // Get the webview resource URI for the logo
        const vscode = this.stateManager.getVSCode();
        if (vscode && vscode.workspace) {
            // Try to get the extension URI from the webview
            const webview = vscode.workspace.getConfiguration('aiAnalytics');
            // For now, use a relative path that should work
            return `./media/logos/${path.split('/').pop()}`;
        }
        return `./media/logos/${path.split('/').pop()}`;
    }

    getModelDisplayName(provider) {
        // Map provider names to model names
        const modelMap = {
            'openai': 'GPT-4o',
            'anthropic': 'Claude 3.5',
            'deepseek': 'DeepSeek R1',
            'moonshot': 'Moonshot',
            'ollama': 'Ollama'
        };

        return modelMap[provider?.toLowerCase()] || provider || 'AI';
    }

    sendMessageToExtension(message) {
        const vscode = this.stateManager.getVSCode();
        vscode.postMessage(message);
    }
}

// Export as singleton
export default new MessageManager();