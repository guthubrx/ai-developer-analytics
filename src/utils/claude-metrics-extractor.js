/**
 * Claude Metrics Extractor
 * Extracteur de métriques depuis l'interface Claude
 *
 * Ce fichier contient les utilitaires pour extraire les métriques
 * depuis l'interface Claude et les intégrer dans notre système de logging
 * Supporte le format unifié compatible avec Cursor et Claude Code
 *
 * @license AGPL-3.0-only
 */

/**
 * Extract metrics from Claude interface
 * Extraire les métriques depuis l'interface Claude
 */
export class ClaudeMetricsExtractor {
    constructor() {
        this.metrics = {
            tokens: {
                prompt: 0,
                completion: 0,
                total: 0
            },
            cost: 0,
            latency: 0,
            model: '',
            provider: 'claude',
            cacheHit: false,
            temperature: 0.7,
            maxTokens: 4096
        };

        // Configuration pour le format unifié
        this.unifiedConfig = {
            platform: 'claude-code',
            version: '1.0'
        };
    }

    /**
     * Extract metrics from Claude conversation
     * Extraire les métriques depuis une conversation Claude
     */
    extractFromConversation(conversationElement) {
        try {
            // Extract token information
            this.extractTokenMetrics(conversationElement);

            // Extract cost information
            this.extractCostMetrics(conversationElement);

            // Extract model information
            this.extractModelInfo(conversationElement);

            // Extract timing information
            this.extractTimingMetrics(conversationElement);

            return this.metrics;
        } catch (error) {
            console.error('Error extracting Claude metrics:', error);
            return this.metrics;
        }
    }

    /**
     * Extract token metrics from Claude interface
     * Extraire les métriques de tokens depuis l'interface Claude
     */
    extractTokenMetrics(conversationElement) {
        // Look for token count elements in Claude interface
        const tokenElements = conversationElement.querySelectorAll('[data-tokens], .token-count, .usage-info');

        tokenElements.forEach(element => {
            const text = element.textContent || '';

            // Extract prompt tokens
            const promptMatch = text.match(/(\d+)\s*(prompt|input)/i);
            if (promptMatch) {
                this.metrics.tokens.prompt = parseInt(promptMatch[1]);
            }

            // Extract completion tokens
            const completionMatch = text.match(/(\d+)\s*(completion|output)/i);
            if (completionMatch) {
                this.metrics.tokens.completion = parseInt(completionMatch[1]);
            }

            // Extract total tokens
            const totalMatch = text.match(/(\d+)\s*(total|tokens)/i);
            if (totalMatch) {
                this.metrics.tokens.total = parseInt(totalMatch[1]);
            }
        });

        // Calculate total if not explicitly provided
        if (this.metrics.tokens.total === 0 && (this.metrics.tokens.prompt > 0 || this.metrics.tokens.completion > 0)) {
            this.metrics.tokens.total = this.metrics.tokens.prompt + this.metrics.tokens.completion;
        }
    }

    /**
     * Extract cost metrics from Claude interface
     * Extraire les métriques de coût depuis l'interface Claude
     */
    extractCostMetrics(conversationElement) {
        // Look for cost elements in Claude interface
        const costElements = conversationElement.querySelectorAll('[data-cost], .cost-info, .pricing-info');

        costElements.forEach(element => {
            const text = element.textContent || '';

            // Extract cost in dollars
            const costMatch = text.match(/\$([\d.]+)/);
            if (costMatch) {
                this.metrics.cost = parseFloat(costMatch[1]);
            }

            // Extract cost in cents
            const centsMatch = text.match(/([\d.]+)\s*(cents|¢)/i);
            if (centsMatch) {
                this.metrics.cost = parseFloat(centsMatch[1]) / 100;
            }
        });

        // Estimate cost based on tokens if not explicitly provided
        if (this.metrics.cost === 0 && this.metrics.tokens.total > 0) {
            this.metrics.cost = this.estimateCostFromTokens(this.metrics.tokens.total, this.metrics.model);
        }
    }

    /**
     * Extract model information from Claude interface
     * Extraire les informations du modèle depuis l'interface Claude
     */
    extractModelInfo(conversationElement) {
        // Look for model elements in Claude interface
        const modelElements = conversationElement.querySelectorAll('[data-model], .model-info, .model-name');

        modelElements.forEach(element => {
            const text = element.textContent || '';

            // Extract Claude model names
            const modelMatch = text.match(/(claude-\d+(?:-\w+)*|claude-instant)/i);
            if (modelMatch) {
                this.metrics.model = modelMatch[1].toLowerCase();
            }
        });

        // Default to Claude-3 if no model detected
        if (!this.metrics.model) {
            this.metrics.model = 'claude-3-sonnet';
        }
    }

    /**
     * Extract timing metrics from Claude interface
     * Extraire les métriques de timing depuis l'interface Claude
     */
    extractTimingMetrics(conversationElement) {
        // Look for timing elements in Claude interface
        const timingElements = conversationElement.querySelectorAll('[data-latency], .latency-info, .response-time');

        timingElements.forEach(element => {
            const text = element.textContent || '';

            // Extract latency in seconds
            const secondsMatch = text.match(/([\d.]+)\s*s(?:ec(?:onds?)?)?/i);
            if (secondsMatch) {
                this.metrics.latency = parseFloat(secondsMatch[1]) * 1000; // Convert to milliseconds
            }

            // Extract latency in milliseconds
            const msMatch = text.match(/([\d.]+)\s*ms/);
            if (msMatch) {
                this.metrics.latency = parseFloat(msMatch[1]);
            }
        });
    }

    /**
     * Estimate cost based on tokens and model
     * Estimer le coût basé sur les tokens et le modèle
     */
    estimateCostFromTokens(totalTokens, model) {
        const pricing = {
            'claude-3-opus': 0.000015, // $15 per 1M tokens
            'claude-3-sonnet': 0.000003, // $3 per 1M tokens
            'claude-3-haiku': 0.00000025, // $0.25 per 1M tokens
            'claude-2': 0.000008, // $8 per 1M tokens
            'claude-instant': 0.0000008 // $0.80 per 1M tokens
        };

        const costPerToken = pricing[model] || pricing['claude-3-sonnet'];
        return totalTokens * costPerToken;
    }

    /**
     * Extract conversation context
     * Extraire le contexte de la conversation
     */
    extractConversationContext(conversationElement) {
        const context = {
            messageCount: 0,
            userMessages: [],
            aiMessages: [],
            conversationLength: 0
        };

        // Count messages
        const userMessages = conversationElement.querySelectorAll('.user-message, [data-role="user"]');
        const aiMessages = conversationElement.querySelectorAll('.ai-message, [data-role="assistant"], .claude-response');

        context.messageCount = userMessages.length + aiMessages.length;
        context.userMessages = Array.from(userMessages).map(msg => ({
            text: msg.textContent?.substring(0, 200) || '',
            length: msg.textContent?.length || 0
        }));
        context.aiMessages = Array.from(aiMessages).map(msg => ({
            text: msg.textContent?.substring(0, 200) || '',
            length: msg.textContent?.length || 0
        }));

        // Calculate total conversation length
        context.conversationLength = context.userMessages.reduce((sum, msg) => sum + msg.length, 0) +
                                   context.aiMessages.reduce((sum, msg) => sum + msg.length, 0);

        return context;
    }

    /**
     * Convert Claude metrics to unified format
     * Convertir les métriques Claude vers le format unifié
     */
    convertToUnifiedFormat(claudeMetrics, conversationContext) {
        const now = new Date();
        const startTime = new Date(now.getTime() - (claudeMetrics.latency || 0));

        return {
            id: `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            platform: 'claude-code',
            startTime: startTime.toISOString(),
            endTime: now.toISOString(),
            duration: claudeMetrics.latency || 0,
            messages: this.formatMessagesForUnified(claudeMetrics, conversationContext),
            usage: {
                totalTokens: claudeMetrics.tokens.total,
                inputTokens: claudeMetrics.tokens.prompt,
                outputTokens: claudeMetrics.tokens.completion,
                cost: claudeMetrics.cost,
                model: claudeMetrics.model,
                serviceTier: this.detectServiceTier(claudeMetrics.model)
            },
            tools: [], // Claude Code tools would be extracted separately
            metadata: {
                messageCount: conversationContext.messageCount,
                averageMessageLength: conversationContext.conversationLength / Math.max(conversationContext.messageCount, 1),
                toolsUsed: [],
                complexity: this.calculateComplexity(conversationContext),
                topic: this.extractTopic(conversationContext),
                language: this.extractLanguage(conversationContext),
                efficiency: this.calculateEfficiency(claudeMetrics)
            }
        };
    }

    /**
     * Format messages for unified structure
     * Formater les messages pour la structure unifiée
     */
    formatMessagesForUnified(claudeMetrics, conversationContext) {
        const messages = [];
        const now = new Date();

        // Add user messages
        conversationContext.userMessages.forEach((msg, index) => {
            messages.push({
                role: 'user',
                content: msg.text,
                timestamp: new Date(now.getTime() - (conversationContext.userMessages.length - index) * 1000).toISOString(),
                tokens: Math.floor(msg.length / 4) // Estimation approximative
            });
        });

        // Add AI messages
        conversationContext.aiMessages.forEach((msg, index) => {
            messages.push({
                role: 'assistant',
                content: msg.text,
                timestamp: new Date(now.getTime() - (conversationContext.aiMessages.length - index) * 1000).toISOString(),
                tokens: Math.floor(msg.length / 4) // Estimation approximative
            });
        });

        return messages;
    }

    /**
     * Detect service tier based on model
     * Détecter le niveau de service basé sur le modèle
     */
    detectServiceTier(model) {
        const proModels = ['claude-3-opus', 'claude-3-sonnet'];
        const standardModels = ['claude-3-haiku', 'claude-2', 'claude-instant'];

        if (proModels.includes(model)) return 'pro';
        if (standardModels.includes(model)) return 'standard';
        return 'basic';
    }

    /**
     * Calculate conversation complexity
     * Calculer la complexité de la conversation
     */
    calculateComplexity(context) {
        const avgLength = context.conversationLength / Math.max(context.messageCount, 1);

        if (avgLength > 500) return 'complex';
        if (avgLength > 200) return 'medium';
        return 'simple';
    }

    /**
     * Extract topic from conversation
     * Extraire le sujet de la conversation
     */
    extractTopic(context) {
        // Simple topic detection based on keywords
        const allText = [...context.userMessages, ...context.aiMessages]
            .map(msg => msg.text.toLowerCase())
            .join(' ');

        if (allText.includes('code') || allText.includes('programming') || allText.includes('function')) {
            return 'development';
        }
        if (allText.includes('documentation') || allText.includes('readme') || allText.includes('explain')) {
            return 'documentation';
        }
        if (allText.includes('debug') || allText.includes('error') || allText.includes('fix')) {
            return 'debugging';
        }

        return 'general';
    }

    /**
     * Extract language from conversation
     * Extraire le langage de la conversation
     */
    extractLanguage(context) {
        // Simple language detection based on keywords
        const allText = [...context.userMessages, ...context.aiMessages]
            .map(msg => msg.text.toLowerCase())
            .join(' ');

        const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust', 'go', 'php'];
        for (const lang of languages) {
            if (allText.includes(lang)) return lang;
        }

        return 'unknown';
    }

    /**
     * Calculate efficiency score
     * Calculer le score d'efficacité
     */
    calculateEfficiency(metrics) {
        if (!metrics.tokens.total || !metrics.cost) return 1.0;

        // Higher efficiency = more tokens per dollar
        const tokensPerDollar = metrics.tokens.total / Math.max(metrics.cost, 0.001);

        // Normalize to 1-5 scale
        const efficiency = Math.min(Math.max(tokensPerDollar / 100000, 1), 5);
        return parseFloat(efficiency.toFixed(2));
    }

    /**
     * Extract all available metrics from Claude interface
     * Extraire toutes les métriques disponibles depuis l'interface Claude
     */
    extractAllMetrics(conversationElement) {
        const metrics = this.extractFromConversation(conversationElement);
        const context = this.extractConversationContext(conversationElement);

        return {
            ...metrics,
            context
        };
    }

    /**
     * Extract metrics in unified format
     * Extraire les métriques en format unifié
     */
    extractUnifiedMetrics(conversationElement) {
        const claudeMetrics = this.extractFromConversation(conversationElement);
        const context = this.extractConversationContext(conversationElement);

        return this.convertToUnifiedFormat(claudeMetrics, context);
    }

    /**
     * Extract and convert Claude Code JSONL data to unified format
     * Extraire et convertir les données JSONL Claude Code vers le format unifié
     */
    convertClaudeCodeJsonlToUnified(jsonlData) {
        if (typeof jsonlData === 'string') {
            jsonlData = JSON.parse(jsonlData);
        }

        // Claude Code JSONL structure
        const claudeLine = jsonlData;
        const now = new Date();

        return {
            id: claudeLine.parentUuid || `claude_${Date.now()}`,
            platform: 'claude-code',
            startTime: claudeLine.timestamp || now.toISOString(),
            endTime: now.toISOString(),
            duration: 0, // Would need to calculate from conversation
            messages: [{
                role: claudeLine.type === 'user' ? 'user' : 'assistant',
                content: claudeLine.content || '',
                timestamp: claudeLine.timestamp || now.toISOString(),
                tokens: claudeLine.usage?.inputTokens + claudeLine.usage?.outputTokens || 0
            }],
            usage: {
                totalTokens: claudeLine.usage?.inputTokens + claudeLine.usage?.outputTokens || 0,
                inputTokens: claudeLine.usage?.inputTokens || 0,
                outputTokens: claudeLine.usage?.outputTokens || 0,
                cost: claudeLine.usage?.cost || 0,
                model: claudeLine.model || 'claude-3-sonnet',
                serviceTier: claudeLine.serviceTier || 'pro'
            },
            tools: claudeLine.tools || [],
            metadata: {
                messageCount: 1,
                averageMessageLength: claudeLine.content?.length || 0,
                toolsUsed: claudeLine.tools?.map(tool => tool.name) || [],
                complexity: 'medium',
                topic: 'general',
                language: 'unknown',
                efficiency: 2.5
            }
        };
    }

    /**
     * Monitor Claude interface for new metrics
     * Surveiller l'interface Claude pour de nouvelles métriques
     */
    startMonitoring() {
        // This would be implemented to watch for new Claude responses
        // and automatically extract metrics
        console.log('Claude metrics monitoring started');

        // Example implementation:
        // setInterval(() => {
        //     const conversation = document.querySelector('.claude-conversation, .conversation-container');
        //     if (conversation) {
        //         const metrics = this.extractAllMetrics(conversation);
        //         this.onMetricsExtracted(metrics);
        //     }
        // }, 1000);
    }

    /**
     * Callback when metrics are extracted
     * Callback lorsque les métriques sont extraites
     */
    onMetricsExtracted(metrics) {
        // This would be overridden by the consumer
        console.log('Metrics extracted:', metrics);
    }
}

/**
 * Utility functions for Claude metrics extraction
 * Fonctions utilitaires pour l'extraction de métriques Claude
 */
export const ClaudeMetricsUtils = {
    /**
     * Detect if current page is Claude interface
     * Détecter si la page actuelle est l'interface Claude
     */
    isClaudeInterface() {
        return document.title.includes('Claude') ||
               document.querySelector('[class*="claude"], [id*="claude"]') !== null;
    },

    /**
     * Get current conversation element
     * Obtenir l'élément de conversation actuel
     */
    getCurrentConversation() {
        return document.querySelector('.conversation, .chat-container, [role="log"]') ||
               document.querySelector('body');
    },

    /**
     * Format metrics for our session system
     * Formater les métriques pour notre système de sessions
     */
    formatForSessionSystem(metrics) {
        return {
            tokens: metrics.tokens,
            cost: metrics.cost,
            latency: metrics.latency,
            model: metrics.model,
            provider: metrics.provider,
            cacheHit: metrics.cacheHit,
            temperature: metrics.temperature,
            maxTokens: metrics.maxTokens
        };
    },

    /**
     * Convert unified metrics to session metrics
     * Convertir les métriques unifiées en métriques de session
     */
    unifiedToSessionMetrics(unifiedData) {
        return {
            totalCost: unifiedData.usage.cost,
            totalTokens: unifiedData.usage.totalTokens,
            totalRequests: 1,
            cacheHits: 0, // Would need to extract from Claude data
            averageLatency: unifiedData.duration,
            providerUsage: { [unifiedData.usage.model]: 1 },
            modelUsage: { [unifiedData.usage.model]: 1 },
            taskTypeUsage: { [unifiedData.metadata.topic]: 1 },
            startTime: new Date(unifiedData.startTime).getTime(),
            lastActivity: new Date(unifiedData.endTime).getTime(),
            duration: unifiedData.duration / 1000 // Convert to seconds
        };
    },

    /**
     * Convert unified metrics to session message
     * Convertir les métriques unifiées en message de session
     */
    unifiedToSessionMessage(unifiedData) {
        // Take the last message from the conversation
        const lastMessage = unifiedData.messages[unifiedData.messages.length - 1];

        return {
            id: `msg_${Date.now()}`,
            type: lastMessage.role === 'user' ? 'user' : 'ai',
            content: lastMessage.content,
            provider: unifiedData.usage.model,
            model: unifiedData.usage.model,
            timestamp: new Date(lastMessage.timestamp).getTime(),
            metrics: {
                tokens: {
                    prompt: unifiedData.usage.inputTokens,
                    completion: unifiedData.usage.outputTokens,
                    total: unifiedData.usage.totalTokens
                },
                cost: unifiedData.usage.cost,
                latency: unifiedData.duration,
                model: unifiedData.usage.model,
                provider: unifiedData.platform
            }
        };
    },

    /**
     * Validate unified data structure
     * Valider la structure de données unifiée
     */
    validateUnifiedData(data) {
        const required = ['id', 'platform', 'startTime', 'endTime', 'usage', 'metadata'];
        const missing = required.filter(field => !data[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (!data.usage.totalTokens || !data.usage.cost) {
            console.warn('Unified data missing token or cost information');
        }

        return true;
    }
};

/**
 * Example usage and integration patterns
 * Exemples d'utilisation et modèles d'intégration
 */
export const ClaudeMetricsExamples = {
    /**
     * Example: Complete Claude interface monitoring
     * Exemple: Surveillance complète de l'interface Claude
     */
    monitorClaudeInterface() {
        const extractor = new ClaudeMetricsExtractor();
        const utils = ClaudeMetricsUtils;

        if (utils.isClaudeInterface()) {
            const conversation = utils.getCurrentConversation();
            if (conversation) {
                // Extract unified metrics
                const unifiedMetrics = extractor.extractUnifiedMetrics(conversation);

                // Convert to session format
                const sessionMetrics = utils.unifiedToSessionMetrics(unifiedMetrics);
                const sessionMessage = utils.unifiedToSessionMessage(unifiedMetrics);

                console.log('Claude metrics extracted:', {
                    unified: unifiedMetrics,
                    sessionMetrics,
                    sessionMessage
                });

                return {
                    unifiedMetrics,
                    sessionMetrics,
                    sessionMessage
                };
            }
        }

        return null;
    },

    /**
     * Example: Process Claude Code JSONL data
     * Exemple: Traiter les données JSONL Claude Code
     */
    processClaudeCodeJsonl(jsonlData) {
        const extractor = new ClaudeMetricsExtractor();
        const utils = ClaudeMetricsUtils;

        try {
            // Convert JSONL to unified format
            const unifiedData = extractor.convertClaudeCodeJsonlToUnified(jsonlData);

            // Validate the data
            utils.validateUnifiedData(unifiedData);

            // Convert to session format
            const sessionMetrics = utils.unifiedToSessionMetrics(unifiedData);
            const sessionMessage = utils.unifiedToSessionMessage(unifiedData);

            return {
                unifiedData,
                sessionMetrics,
                sessionMessage
            };
        } catch (error) {
            console.error('Error processing Claude Code JSONL:', error);
            return null;
        }
    },

    /**
     * Example: Batch process multiple Claude conversations
     * Exemple: Traitement par lots de plusieurs conversations Claude
     */
    batchProcessClaudeConversations(conversationElements) {
        const extractor = new ClaudeMetricsExtractor();
        const utils = ClaudeMetricsUtils;

        const results = [];

        conversationElements.forEach((element, index) => {
            try {
                const unifiedMetrics = extractor.extractUnifiedMetrics(element);
                const sessionMetrics = utils.unifiedToSessionMetrics(unifiedMetrics);

                results.push({
                    id: unifiedMetrics.id,
                    platform: unifiedMetrics.platform,
                    tokens: unifiedMetrics.usage.totalTokens,
                    cost: unifiedMetrics.usage.cost,
                    efficiency: unifiedMetrics.metadata.efficiency,
                    sessionMetrics
                });
            } catch (error) {
                console.error(`Error processing conversation ${index}:`, error);
            }
        });

        return results;
    }
};