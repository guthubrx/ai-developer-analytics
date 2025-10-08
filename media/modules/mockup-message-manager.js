/**
 * Mockup Message Manager Module
 * Gère l'affichage des messages selon le style exact du mockup
 */

class MockupMessageManager {
    constructor() {
        this.currentSession = 's1';
        this.sessions = {
            s1: [],
            s2: []
        };
        this.streamingMessage = null;
        this.streamingContent = '';
    }

    /**
     * Add a user message
     * Ajouter un message utilisateur
     */
    addUserMessage(content) {
        const conversationContent = document.getElementById('conversation-content');
        if (!conversationContent) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message user ${this.currentSession}`;
        messageDiv.textContent = content;

        conversationContent.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in session
        this.sessions[this.currentSession].push({
            type: 'user',
            content: content,
            timestamp: new Date()
        });
    }

    /**
     * Start AI response streaming
     * Commencer le streaming de la réponse IA
     */
    startAIResponse() {
        const conversationContent = document.getElementById('conversation-content');
        if (!conversationContent) return;

        // Create streaming message container
        this.streamingMessage = document.createElement('div');
        this.streamingMessage.className = `message ai ${this.currentSession}`;
        this.streamingMessage.innerHTML = '<div class="streaming-content"></div>';

        conversationContent.appendChild(this.streamingMessage);
        this.scrollToBottom();

        this.streamingContent = '';
    }

    /**
     * Add chunk to streaming response
     * Ajouter un chunk à la réponse en streaming
     */
    addStreamingChunk(chunk) {
        if (!this.streamingMessage) return;

        this.streamingContent += chunk;
        const streamingDiv = this.streamingMessage.querySelector('.streaming-content');
        if (streamingDiv) {
            streamingDiv.innerHTML = this.formatStreamingContent(this.streamingContent);
        }
        this.scrollToBottom();
    }

    /**
     * Complete AI response
     * Finaliser la réponse IA
     */
    completeAIResponse() {
        if (!this.streamingMessage) return;

        // Process final content for blocks
        const finalContent = this.processContentForBlocks(this.streamingContent);
        this.streamingMessage.innerHTML = finalContent;

        // Store in session
        this.sessions[this.currentSession].push({
            type: 'ai',
            content: this.streamingContent,
            timestamp: new Date()
        });

        this.streamingMessage = null;
        this.streamingContent = '';
    }

    /**
     * Format streaming content with live parsing
     * Formater le contenu en streaming avec parsing en live
     */
    formatStreamingContent(content) {
        // Basic formatting for streaming
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Process content for blocks (diff, command, etc.)
     * Traiter le contenu pour les blocs
     */
    processContentForBlocks(content) {
        let processedContent = content;
        const blocks = [];

        // Detect diff blocks
        const diffMatches = content.match(/```diff\n([\s\S]*?)\n```/g);
        if (diffMatches) {
            diffMatches.forEach((match, index) => {
                const diffContent = match.replace(/```diff\n|\n```/g, '');
                const fileName = this.extractFileNameFromDiff(diffContent);
                const stats = this.calculateDiffStats(diffContent);
                
                blocks.push({
                    type: 'diff-box',
                    fileName: fileName || 'file.diff',
                    additions: stats.additions,
                    deletions: stats.deletions,
                    content: diffContent
                });

                processedContent = processedContent.replace(match, `{{DIFF_BLOCK_${index}}}`);
            });
        }

        // Detect command blocks
        const commandMatches = content.match(/```bash\n([\s\S]*?)\n```/g);
        if (commandMatches) {
            commandMatches.forEach((match, index) => {
                const commandContent = match.replace(/```bash\n|\n```/g, '');
                const title = this.extractCommandTitle(commandContent);
                
                blocks.push({
                    type: 'command-block',
                    title: title || 'Auto-Ran command',
                    command: commandContent,
                    output: commandContent
                });

                processedContent = processedContent.replace(match, `{{COMMAND_BLOCK_${index}}}`);
            });
        }

        // Detect file references
        const fileMatches = content.match(/`([^`]+\.(ts|js|tsx|jsx|py|java|cpp|c|h|css|html|json|yaml|yml|md))`/g);
        if (fileMatches) {
            fileMatches.forEach(match => {
                const fileName = match.replace(/`/g, '');
                const fileRef = this.createFileReference(fileName);
                processedContent = processedContent.replace(match, fileRef);
            });
        }

        // Format basic content
        processedContent = processedContent
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        // Replace block placeholders
        blocks.forEach((block, index) => {
            if (block.type === 'diff-box') {
                const blockHtml = this.createDiffBox(block);
                processedContent = processedContent.replace(`{{DIFF_BLOCK_${index}}}`, blockHtml);
            } else if (block.type === 'command-block') {
                const blockHtml = this.createCommandBlock(block);
                processedContent = processedContent.replace(`{{COMMAND_BLOCK_${index}}}`, blockHtml);
            }
        });

        return processedContent;
    }

    /**
     * Create file reference
     * Créer une référence de fichier
     */
    createFileReference(fileName) {
        return `<span class="file-ref">${fileName}</span>`;
    }

    /**
     * Create diff box
     * Créer une boîte diff
     */
    createDiffBox(block) {
        return `
            <div class="diff-box">
                <div class="diff-header">
                    <div class="diff-header-left">${block.fileName}</div>
                    <div class="diff-header-right">
                        <span class="plus">+${block.additions}</span>
                        <span class="minus">-${block.deletions}</span>
                        <span class="diff-icon">📋</span>
                        <span class="diff-icon">⋯</span>
                    </div>
                </div>
                <div class="diff-content">
                    <pre class="diff">${this.formatDiffContent(block.content)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * Create command block
     * Créer un bloc de commande
     */
    createCommandBlock(block) {
        return `
            <div class="command-block">
                <div class="command-header" onclick="toggleCommand(this)">
                    <span>${block.title}</span>
                    <span class="command-toggle collapsed">⌄</span>
                </div>
                <div class="command-body partial">
                    ${this.formatCommandOutput(block.command)}
                </div>
            </div>
        `;
    }

    /**
     * Format diff content
     * Formater le contenu diff
     */
    formatDiffContent(diffContent) {
        return diffContent
            .split('\n')
            .map(line => {
                if (line.startsWith('+')) {
                    return `<ins>${this.escapeHtml(line)}</ins>`;
                } else if (line.startsWith('-')) {
                    return `<del>${this.escapeHtml(line)}</del>`;
                } else {
                    return this.escapeHtml(line);
                }
            })
            .join('\n');
    }

    /**
     * Format command output
     * Formater la sortie de commande
     */
    formatCommandOutput(command) {
        return command
            .split('\n')
            .map(line => {
                if (line.startsWith('$')) {
                    return `<span class="cmd">${this.escapeHtml(line)}</span>`;
                } else if (line.startsWith('>')) {
                    return `<span class="cmd">${this.escapeHtml(line)}</span>`;
                } else if (line.startsWith('✓') || line.startsWith('✅')) {
                    return `<span style="color: #79c279;">${this.escapeHtml(line)}</span>`;
                } else if (line.startsWith('📦') || line.startsWith('CLI')) {
                    return `<span class="comment">${this.escapeHtml(line)}</span>`;
                } else {
                    return this.escapeHtml(line);
                }
            })
            .join('\n');
    }

    /**
     * Extract file name from diff
     * Extraire le nom de fichier du diff
     */
    extractFileNameFromDiff(diffContent) {
        const lines = diffContent.split('\n');
        for (const line of lines) {
            if (line.startsWith('+++') || line.startsWith('---')) {
                return line.replace(/^[+-]{3}\s*/, '').split('\t')[0];
            }
        }
        return 'file.diff';
    }

    /**
     * Calculate diff stats
     * Calculer les statistiques du diff
     */
    calculateDiffStats(diffContent) {
        const lines = diffContent.split('\n');
        let additions = 0;
        let deletions = 0;

        for (const line of lines) {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                additions++;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                deletions++;
            }
        }

        return { additions, deletions };
    }

    /**
     * Extract command title
     * Extraire le titre de la commande
     */
    extractCommandTitle(commandContent) {
        const lines = commandContent.split('\n');
        const firstLine = lines[0];
        if (firstLine.startsWith('$')) {
            const command = firstLine.replace('$', '').trim();
            const parts = command.split(' ');
            if (parts.length >= 2) {
                return `Auto-Ran command: ${parts[0]}, ${parts[1]}`;
            }
            return `Auto-Ran command: ${parts[0]}`;
        }
        return 'Auto-Ran command';
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

        // Update message visibility
        document.querySelectorAll('.message').forEach(message => {
            if (message.classList.contains(sessionId)) {
                message.style.display = '';
            } else {
                message.style.display = 'none';
            }
        });
    }

    /**
     * Clear conversation
     * Effacer la conversation
     */
    clearConversation() {
        const conversationContent = document.getElementById('conversation-content');
        if (conversationContent) {
            conversationContent.innerHTML = '';
        }
        this.sessions[this.currentSession] = [];
    }

    /**
     * Scroll to bottom
     * Faire défiler vers le bas
     */
    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    /**
     * Escape HTML
     * Échapper le HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global function for command toggle
window.toggleCommand = function(header) {
    const body = header.nextElementSibling;
    const arrow = header.querySelector('.command-toggle');
    const isPartial = body.classList.contains('partial');

    if (isPartial) {
        body.classList.remove('partial');
        body.classList.add('collapsed');
        arrow.classList.remove('collapsed');
    } else {
        body.classList.add('partial');
        body.classList.remove('collapsed');
        arrow.classList.add('collapsed');
    }
};

// Export as singleton
export default new MockupMessageManager();